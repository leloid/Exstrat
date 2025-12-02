'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { getForecasts, getForecastById, getPortfolioHoldings, getTheoreticalStrategies, ForecastResponse } from '@/lib/portfolios-api';
import * as configurationApi from '@/lib/configuration-api';
import { AlertConfiguration, CreateTokenAlertDto, CreateTPAlertDto } from '@/types/configuration';
import { Holding } from '@/types/portfolio';
import { TheoreticalStrategyResponse } from '@/types/strategies';
import { WalletSelector } from './WalletSelector';
import { ForecastSelector } from './ForecastSelector';
import { TokenAlertsList } from './TokenAlertsList';
import { NotificationChannelsConfig } from './NotificationChannelsConfig';
import { ConfirmModal } from './ConfirmModal';

export const ConfigurationAlertsTab: React.FC = () => {
  const { isDarkMode, language } = useTheme();
  const { portfolios } = usePortfolio();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [forecasts, setForecasts] = useState<ForecastResponse[]>([]);
  const [selectedForecastId, setSelectedForecastId] = useState<string | null>(null);
  const [alertConfiguration, setAlertConfiguration] = useState<AlertConfiguration | null>(null);
  const [allConfigurations, setAllConfigurations] = useState<AlertConfiguration[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingForecastId, setPendingForecastId] = useState<string | null>(null);

  // Charger les prévisions et configurations quand le portfolio change
  useEffect(() => {
    const loadData = async () => {
      if (!selectedPortfolioId) {
        setForecasts([]);
        setSelectedForecastId(null);
        setAlertConfiguration(null);
        setAllConfigurations([]);
        return;
      }

      try {
        setLoading(true);
        console.log('🔄 Chargement des prévisions pour le portfolio:', selectedPortfolioId);
        
        // Charger les prévisions
        const allForecasts = await getForecasts();
        const portfolioForecasts = allForecasts.filter(f => f.portfolioId === selectedPortfolioId);
        setForecasts(portfolioForecasts);
        
        // Charger toutes les configurations d'alertes pour trouver celle qui est active
        const allConfigs = await configurationApi.getAlertConfigurations();
        const portfolioConfigs = allConfigs.filter(config => {
          const forecast = portfolioForecasts.find(f => f.id === config.forecastId);
          return forecast !== undefined;
        });
        setAllConfigurations(portfolioConfigs);
        
        // Trouver la configuration active
        const activeConfig = portfolioConfigs.find(config => config.isActive);
        if (activeConfig) {
          setSelectedForecastId(activeConfig.forecastId);
          setAlertConfiguration(activeConfig);
        } else {
          setSelectedForecastId(null);
          setAlertConfiguration(null);
        }
      } catch (error) {
        console.error('❌ Erreur lors du chargement des données:', error);
        setForecasts([]);
        setAllConfigurations([]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedPortfolioId]);

  // Charger la configuration d'alertes quand une prévision est sélectionnée
  useEffect(() => {
    const loadAlertConfiguration = async () => {
      if (!selectedForecastId) {
        setAlertConfiguration(null);
        return;
      }

      try {
        setLoading(true);
        const config = await configurationApi.getAlertConfigurationByForecastId(selectedForecastId);
        setAlertConfiguration(config);
      } catch (error) {
        console.error('Erreur lors du chargement de la configuration:', error);
        setAlertConfiguration(null);
      } finally {
        setLoading(false);
      }
    };

    loadAlertConfiguration();
  }, [selectedForecastId]);

  const handleForecastSelect = (forecastId: string) => {
    setSelectedForecastId(forecastId);
  };

  const handleActivateForecast = async (forecastId: string) => {
    if (!forecastId) {
      console.error('❌ Aucune prévision sélectionnée');
      return;
    }

    console.log('🔄 handleActivateForecast appelé pour:', forecastId);
    console.log('📊 allConfigurations:', allConfigurations);
    
    // Toujours vérifier si une autre prévision est déjà active
    const activeConfig = allConfigurations.find(c => c.isActive);
    console.log('✅ Configuration active trouvée:', activeConfig);
    
    // Si une autre prévision est active ET que ce n'est pas celle qu'on veut activer
    if (activeConfig && activeConfig.forecastId !== forecastId) {
      console.log('⚠️ Une autre prévision est active, affichage de la popup');
      // Afficher la modal de confirmation
      setPendingForecastId(forecastId);
      setShowConfirmModal(true);
      return;
    }
    
    console.log('✅ Aucune autre prévision active, activation directe');
    // Si aucune autre prévision n'est active, ou si c'est la même, activer directement
    await doActivateForecast(forecastId);
  };

  // Créer automatiquement les alertes pour tous les tokens avec stratégies
  const createAlertsForAllTokens = async (config: AlertConfiguration, forecastId: string) => {
    try {
      // Charger la prévision pour obtenir les stratégies appliquées
      const forecastData = await getForecastById(forecastId);
      const appliedStrategies = forecastData.appliedStrategies || {};
      
      if (Object.keys(appliedStrategies).length === 0) {
        console.log('⚠️ Aucune stratégie appliquée à cette prévision');
        return;
      }

      // Charger les holdings du portfolio
      const holdings = await getPortfolioHoldings(selectedPortfolioId);
      
      // Charger toutes les stratégies théoriques
      const allStrategies = await getTheoreticalStrategies();
      const strategiesMap = new Map<string, TheoreticalStrategyResponse>();
      allStrategies.forEach(strategy => {
        strategiesMap.set(strategy.id, strategy);
      });

      // Pour chaque holding, vérifier s'il a une stratégie associée
      for (const holding of holdings) {
        // Chercher la stratégie associée (par holdingId, tokenId ou symbol)
        const strategyId = appliedStrategies[holding.id] || 
                          appliedStrategies[holding.token.id] || 
                          appliedStrategies[holding.token.symbol];
        
        if (!strategyId) continue;

        const strategy = strategiesMap.get(strategyId);
        if (!strategy) continue;

        // Vérifier si une alerte existe déjà pour ce token
        const existingTokenAlert = config.tokenAlerts?.find(ta => ta.holdingId === holding.id);
        if (existingTokenAlert) {
          console.log(`✅ Alerte déjà existante pour ${holding.token.symbol}`);
          continue;
        }

        // Créer les TP alerts à partir de la stratégie
        const tpAlerts: CreateTPAlertDto[] = strategy.profitTargets.map((tp) => {
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
            isActive: true, // Activer par défaut
          };
        });

        const tokenAlert: CreateTokenAlertDto = {
          holdingId: holding.id,
          tokenSymbol: holding.token.symbol,
          strategyId: strategy.id,
          numberOfTargets: strategy.profitTargets.length,
          tpAlerts,
          isActive: true, // Activer par défaut
        };

        try {
          console.log(`🔄 Création de l'alerte pour ${holding.token.symbol}...`);
          await configurationApi.createTokenAlert(config.id, tokenAlert);
          console.log(`✅ Alerte créée pour ${holding.token.symbol}`);
        } catch (error) {
          console.error(`❌ Erreur lors de la création de l'alerte pour ${holding.token.symbol}:`, error);
        }
      }

      // Recharger la configuration pour obtenir les nouvelles alertes
      const updatedConfig = await configurationApi.getAlertConfigurationById(config.id);
      setAlertConfiguration(updatedConfig);
    } catch (error) {
      console.error('Erreur lors de la création automatique des alertes:', error);
    }
  };

  const doActivateForecast = async (forecastId: string) => {
    try {
      setLoading(true);
      
      // Vérifier si une configuration existe déjà pour cette prévision
      let config = await configurationApi.getAlertConfigurationByForecastId(forecastId);
      
      if (!config) {
        // Créer une nouvelle configuration active (le backend désactivera automatiquement les autres)
        config = await configurationApi.createAlertConfiguration({
          forecastId,
          notificationChannels: {
            email: true,
            push: false,
          },
          isActive: true,
        });
      } else {
        // Activer cette configuration (le backend désactivera automatiquement les autres)
        config = await configurationApi.updateAlertConfiguration(config.id, {
          isActive: true,
        });
      }
      
      setAlertConfiguration(config);
      setSelectedForecastId(forecastId);
      
      // Créer automatiquement les alertes pour tous les tokens avec stratégies
      await createAlertsForAllTokens(config, forecastId);
      
      // Recharger toutes les configurations pour mettre à jour l'état actif
      const allConfigs = await configurationApi.getAlertConfigurations();
      const portfolioConfigs = allConfigs.filter(c => {
        const forecast = forecasts.find(f => f.id === c.forecastId);
        return forecast !== undefined;
      });
      setAllConfigurations(portfolioConfigs);
    } catch (error) {
      console.error('Erreur lors de l\'activation de la prévision:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivateForecast = async (configurationId: string) => {
    try {
      setLoading(true);
      
      // Désactiver la configuration
      const config = await configurationApi.updateAlertConfiguration(configurationId, {
        isActive: false,
      });
      
      setAlertConfiguration(config);
      
      // Recharger toutes les configurations
      const allConfigs = await configurationApi.getAlertConfigurations();
      const portfolioConfigs = allConfigs.filter(c => {
        const forecast = forecasts.find(f => f.id === c.forecastId);
        return forecast !== undefined;
      });
      setAllConfigurations(portfolioConfigs);
    } catch (error) {
      console.error('Erreur lors de la désactivation de la prévision:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfigurationUpdate = async (config: AlertConfiguration) => {
    setAlertConfiguration(config);
    
    // Recharger toutes les configurations pour mettre à jour l'état actif
    try {
      const allConfigs = await configurationApi.getAlertConfigurations();
      const portfolioConfigs = allConfigs.filter(c => {
        const forecast = forecasts.find(f => f.id === c.forecastId);
        return forecast !== undefined;
      });
      setAllConfigurations(portfolioConfigs);
    } catch (error) {
      console.error('Erreur lors du rechargement des configurations:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* A1 - Sélection du wallet */}
      <div className={`rounded-lg p-5 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {language === 'fr' ? 'Sélection du wallet' : 'Wallet Selection'}
        </h2>
        <WalletSelector
          portfolios={portfolios}
          selectedPortfolioId={selectedPortfolioId}
          onPortfolioChange={setSelectedPortfolioId}
        />
      </div>

      {/* A2 - Sélection de la prévision */}
      {selectedPortfolioId && (
        <div className={`rounded-lg p-5 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {language === 'fr' ? 'Sélection de la prévision' : 'Forecast Selection'}
            </h2>
            {allConfigurations.find(c => c.isActive) && (
              <span className={`px-3 py-1 text-xs rounded-full ${
                isDarkMode ? 'bg-blue-900/30 text-blue-400 border border-blue-700/30' : 'bg-blue-50 text-blue-700 border border-blue-200'
              }`}>
                {language === 'fr' ? '⚠️ Une seule prévision active par wallet' : '⚠️ Only one active forecast per wallet'}
              </span>
            )}
          </div>
          {loading ? (
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fr' ? 'Chargement...' : 'Loading...'}
            </div>
          ) : forecasts.length === 0 ? (
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fr'
                ? 'Aucune prévision disponible pour ce wallet'
                : 'No forecasts available for this wallet'}
            </div>
          ) : (
            <>
              <ForecastSelector
                forecasts={forecasts}
                selectedForecastId={selectedForecastId}
                activeForecastId={allConfigurations.find(c => c.isActive)?.forecastId || null}
                onForecastSelect={handleForecastSelect}
              />
              
              {/* Bouton pour activer/désactiver la prévision sélectionnée */}
              {selectedForecastId && (
                <div className="mt-4">
                  {allConfigurations.find(c => c.forecastId === selectedForecastId && c.isActive) ? (
                    <div className="space-y-2">
                      <div className={`p-3 rounded-lg flex items-center justify-between ${
                        isDarkMode ? 'bg-green-900/20 border border-green-700/30' : 'bg-green-50 border border-green-200'
                      }`}>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                            ✅ {language === 'fr' ? 'Cette prévision est active' : 'This forecast is active'}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            const config = allConfigurations.find(c => c.forecastId === selectedForecastId);
                            if (config) {
                              handleDeactivateForecast(config.id);
                            }
                          }}
                          disabled={loading}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isDarkMode
                              ? 'bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-700'
                              : 'bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300'
                          }`}
                        >
                          {language === 'fr' ? 'Désactiver les alertes' : 'Deactivate alerts'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={`p-4 rounded-lg border ${
                      isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-300'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className={`font-medium mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {language === 'fr' 
                              ? 'Activer les alertes pour cette prévision'
                              : 'Activate alerts for this forecast'}
                          </p>
                          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {allConfigurations.find(c => c.isActive) 
                              ? (language === 'fr'
                                  ? '⚠️ Une autre prévision est déjà active. L\'activer désactivera automatiquement l\'autre.'
                                  : '⚠️ Another forecast is already active. Activating this will automatically deactivate the other.')
                              : (language === 'fr'
                                  ? 'Activez cette prévision pour commencer à configurer les alertes.'
                                  : 'Activate this forecast to start configuring alerts.')}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            console.log('🔘 Bouton cliqué, selectedForecastId:', selectedForecastId);
                            if (selectedForecastId) {
                              handleActivateForecast(selectedForecastId);
                            } else {
                              console.error('❌ selectedForecastId est null');
                            }
                          }}
                          disabled={loading || !selectedForecastId}
                          className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                            isDarkMode
                              ? 'bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-700 disabled:cursor-not-allowed'
                              : 'bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300 disabled:cursor-not-allowed'
                          }`}
                        >
                          {loading 
                            ? (language === 'fr' ? 'Activation...' : 'Activating...')
                            : (language === 'fr' ? '✅ Activer les alertes' : '✅ Activate alerts')
                          }
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* A3 & A4 - Configuration des alertes par token et TP */}
      {selectedForecastId && allConfigurations.find(c => c.forecastId === selectedForecastId && c.isActive) && (
        <div className={`rounded-lg p-5 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fr' ? 'Configuration des alertes' : 'Alert Configuration'}
          </h2>
          <p className={`text-sm mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'fr'
              ? 'Configurez les alertes pour chaque token avec stratégie associée. Cliquez sur "Configurer alertes" pour chaque token, puis personnalisez les alertes par TP.'
              : 'Configure alerts for each token with associated strategy. Click "Configure alerts" for each token, then customize alerts by TP.'}
          </p>
          <TokenAlertsList
            forecastId={selectedForecastId}
            portfolioId={selectedPortfolioId}
            alertConfiguration={alertConfiguration}
            onConfigurationUpdate={handleConfigurationUpdate}
          />
        </div>
      )}

      {/* A5 - Choix des canaux de notification */}
      {selectedForecastId && alertConfiguration && alertConfiguration.isActive && (
        <div className={`rounded-lg p-5 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fr' ? 'Canaux de notification' : 'Notification Channels'}
          </h2>
          <NotificationChannelsConfig
            alertConfiguration={alertConfiguration}
            onConfigurationUpdate={handleConfigurationUpdate}
          />
        </div>
      )}

      {/* Modal de confirmation */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          console.log('❌ Modal fermée');
          setShowConfirmModal(false);
          setPendingForecastId(null);
        }}
        onConfirm={() => {
          console.log('✅ Confirmation, activation de la prévision:', pendingForecastId);
          if (pendingForecastId) {
            doActivateForecast(pendingForecastId);
          }
        }}
        title={language === 'fr' ? 'Confirmer l\'activation' : 'Confirm activation'}
        message={
          language === 'fr'
            ? `Une autre prévision est déjà active. Activer cette prévision désactivera automatiquement l'autre. Voulez-vous continuer ?`
            : `Another forecast is already active. Activating this forecast will automatically deactivate the other one. Do you want to continue?`
        }
        confirmText={language === 'fr' ? 'Confirmer' : 'Confirm'}
        cancelText={language === 'fr' ? 'Annuler' : 'Cancel'}
      />
    </div>
  );
};

