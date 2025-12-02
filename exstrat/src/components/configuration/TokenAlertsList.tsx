'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { getForecastById, getPortfolioHoldings, getTheoreticalStrategies, ForecastResponse } from '@/lib/portfolios-api';
import * as configurationApi from '@/lib/configuration-api';
import { AlertConfiguration, CreateTokenAlertDto, CreateTPAlertDto } from '@/types/configuration';
import { Holding } from '@/types/portfolio';
import { TheoreticalStrategyResponse } from '@/types/strategies';
import { TokenAlertItem } from './TokenAlertItem';

interface TokenAlertsListProps {
  forecastId: string;
  portfolioId: string;
  alertConfiguration: AlertConfiguration | null;
  onConfigurationUpdate: (config: AlertConfiguration) => void;
}

export const TokenAlertsList: React.FC<TokenAlertsListProps> = ({
  forecastId,
  portfolioId,
  alertConfiguration,
  onConfigurationUpdate,
}) => {
  const { isDarkMode, language } = useTheme();
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [strategiesMap, setStrategiesMap] = useState<Map<string, TheoreticalStrategyResponse>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedTokens, setExpandedTokens] = useState<Set<string>>(new Set());

  // Charger la prévision et les données associées
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Charger la prévision
        const forecastData = await getForecastById(forecastId);
        setForecast(forecastData);

        // Charger les holdings du portfolio
        const holdingsData = await getPortfolioHoldings(portfolioId);
        setHoldings(holdingsData);

        // Charger les stratégies théoriques
        const appliedStrategies = forecastData.appliedStrategies || {};
        const strategyIds = Object.values(appliedStrategies);
        
        if (strategyIds.length > 0) {
          const allStrategies = await getTheoreticalStrategies();
          const strategiesById = new Map<string, TheoreticalStrategyResponse>();
          
          strategyIds.forEach(strategyId => {
            const strategy = allStrategies.find(s => s.id === strategyId);
            if (strategy) {
              strategiesById.set(strategyId, strategy);
            }
          });

          setStrategiesMap(strategiesById);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoading(false);
      }
    };

    if (forecastId && portfolioId) {
      loadData();
    }
  }, [forecastId, portfolioId]);

  // Créer ou mettre à jour la configuration d'alertes
  const handleCreateOrUpdateConfiguration = async () => {
    try {
      setLoading(true);

      if (alertConfiguration) {
        // Activer cette configuration (le backend désactivera automatiquement les autres du même portfolio)
        const updated = await configurationApi.updateAlertConfiguration(alertConfiguration.id, {
          isActive: true,
        });
        onConfigurationUpdate(updated);
      } else {
        // Créer une nouvelle configuration (elle sera automatiquement activée et les autres désactivées par le backend)
        const newConfig = await configurationApi.createAlertConfiguration({
          forecastId,
          notificationChannels: {
            email: true,
            push: false,
          },
          isActive: true,
        });
        onConfigurationUpdate(newConfig);
      }
    } catch (error) {
      console.error('Erreur lors de la création/mise à jour de la configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  // Créer une alerte token avec ses TP
  const handleCreateTokenAlert = async (holding: Holding, strategy: TheoreticalStrategyResponse | null) => {
    // Vérifier que la prévision est active
    if (!alertConfiguration || !alertConfiguration.isActive) {
      console.warn('La prévision doit être active pour configurer les alertes');
      return;
    }

    try {
      setLoading(true);

      // Calculer les TP alerts à partir de la stratégie
      const tpAlerts: CreateTPAlertDto[] = strategy?.profitTargets.map((tp, index) => {
        const targetPrice = tp.targetType === 'percentage'
          ? holding.averagePrice * (1 + tp.targetValue / 100)
          : tp.targetValue;
        const sellQuantity = (holding.quantity * tp.sellPercentage) / 100;
        const projectedAmount = targetPrice * sellQuantity;
        const remainingValue = (holding.quantity - sellQuantity) * targetPrice;

        return {
          tpOrder: tp.order,
          targetPrice,
          sellQuantity,
          projectedAmount,
          remainingValue,
          beforeTP: {
            enabled: true,
            value: -10,
            type: 'percentage',
          },
          tpReached: {
            enabled: true,
          },
          isActive: true,
        };
      }) || [];

      const tokenAlert: CreateTokenAlertDto = {
        holdingId: holding.id,
        tokenSymbol: holding.token.symbol,
        strategyId: strategy?.id,
        numberOfTargets: strategy?.profitTargets.length || 0,
        tpAlerts,
        isActive: true,
      };

      const created = await configurationApi.createTokenAlert(alertConfiguration.id, tokenAlert);
      
      // Recharger la configuration
      const updated = await configurationApi.getAlertConfigurationById(alertConfiguration.id);
      onConfigurationUpdate(updated);
    } catch (error) {
      console.error('Erreur lors de la création de l\'alerte token:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !forecast) {
    return (
      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {language === 'fr' ? 'Chargement...' : 'Loading...'}
      </div>
    );
  }

  if (!forecast) {
    return (
      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {language === 'fr' ? 'Aucune prévision trouvée' : 'No forecast found'}
      </div>
    );
  }

  const appliedStrategies = forecast.appliedStrategies || {};
  console.log('📊 Applied strategies:', appliedStrategies);
  console.log('📊 Holdings:', holdings);
  console.log('📊 Strategies map:', strategiesMap);
  
  const tokensWithStrategies = holdings
    .filter(holding => {
      // Trouver la stratégie associée à ce holding
      // appliedStrategies utilise holding.id comme clé (pas token.id)
      const strategyId = appliedStrategies[holding.id] || appliedStrategies[holding.token.id] || appliedStrategies[holding.token.symbol];
      console.log(`🔍 Holding ${holding.token.symbol} (id: ${holding.id}): strategyId = ${strategyId}`);
      return strategyId && strategiesMap.has(strategyId);
    })
    .map(holding => {
      const strategyId = appliedStrategies[holding.id] || appliedStrategies[holding.token.id] || appliedStrategies[holding.token.symbol];
      const strategy = strategyId ? strategiesMap.get(strategyId) : null;
      return { holding, strategy };
    });
  
  console.log('📊 Tokens with strategies:', tokensWithStrategies);

  // Afficher toujours la liste des tokens, même sans configuration
  // La configuration sera créée automatiquement lors de la première configuration d'alerte
  if (tokensWithStrategies.length === 0) {
    return (
      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700/50 border border-gray-600' : 'bg-gray-50 border border-gray-300'}`}>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'fr'
              ? 'Aucun token avec stratégie associée dans cette prévision. Assurez-vous que des stratégies théoriques sont appliquées aux tokens de cette prévision.'
              : 'No tokens with associated strategy in this forecast. Make sure theoretical strategies are applied to tokens in this forecast.'}
          </p>
        </div>
      </div>
    );
  }

  // Vérifier si la prévision est active
  const isForecastActive = alertConfiguration?.isActive === true;

  return (
    <div className="space-y-4">
      {/* Message d'avertissement si la prévision n'est pas active */}
      {!isForecastActive && (
        <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-yellow-900/20 border-yellow-700/30' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <p className={`font-medium mb-1 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-700'}`}>
                {language === 'fr' ? 'Prévision non active' : 'Forecast not active'}
              </p>
              <p className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-600'}`}>
                {language === 'fr'
                  ? 'Vous devez d\'abord activer cette prévision en utilisant le bouton "Activer les alertes" ci-dessus avant de pouvoir configurer les alertes par token.'
                  : 'You must first activate this forecast using the "Activate alerts" button above before you can configure token alerts.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Message informatif si pas de configuration mais prévision active */}
      {isForecastActive && !alertConfiguration && (
        <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border border-blue-700/30' : 'bg-blue-50 border border-blue-200'}`}>
          <p className={`text-xs ${isDarkMode ? 'text-blue-400' : 'text-blue-700'}`}>
            {language === 'fr'
              ? '💡 La configuration d\'alertes sera créée automatiquement lorsque vous configurerez votre première alerte.'
              : '💡 The alert configuration will be created automatically when you configure your first alert.'}
          </p>
        </div>
      )}

      {/* Liste des tokens avec stratégies (A3) - seulement si la prévision est active */}
      {isForecastActive ? (
        <div className="space-y-3">
          {tokensWithStrategies.map(({ holding, strategy }) => {
            if (!strategy) return null;
            
            const tokenAlert = alertConfiguration?.tokenAlerts?.find(ta => ta.holdingId === holding.id);
            const isExpanded = expandedTokens.has(holding.id);

            return (
              <TokenAlertItem
                key={holding.id}
                holding={holding}
                strategy={strategy}
                tokenAlert={tokenAlert}
                alertConfigurationId={alertConfiguration?.id}
                isForecastActive={isForecastActive}
                isExpanded={isExpanded}
                onToggleExpand={() => {
                  const newExpanded = new Set(expandedTokens);
                  if (isExpanded) {
                    newExpanded.delete(holding.id);
                  } else {
                    newExpanded.add(holding.id);
                  }
                  setExpandedTokens(newExpanded);
                }}
                onCreateAlert={() => handleCreateTokenAlert(holding, strategy)}
                onConfigurationUpdate={onConfigurationUpdate}
              />
            );
          })}
        </div>
      ) : (
        <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-300'}`}>
          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'fr'
              ? 'Les tokens seront affichés ici une fois la prévision activée.'
              : 'Tokens will be displayed here once the forecast is activated.'}
          </p>
        </div>
      )}
    </div>
  );
};

