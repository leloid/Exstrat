'use client';

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/format';
import { useTheme } from '@/contexts/ThemeContext';
import { Holding } from '@/types/portfolio';
import * as configurationApi from '@/lib/configuration-api';
import { getForecasts, getForecastById, getTheoreticalStrategies } from '@/lib/portfolios-api';
import { AlertConfiguration } from '@/types/configuration';
import { TheoreticalStrategyResponse } from '@/types/strategies';
import type { ForecastResponse } from '@/lib/portfolios-api';

interface TokenStrategyDetailsProps {
  holding: Holding | null;
  portfolioId?: string;
  onClose: () => void;
}

export const TokenStrategyDetails: React.FC<TokenStrategyDetailsProps> = ({
  holding,
  portfolioId,
  onClose,
}) => {
  const { isDarkMode, language } = useTheme();
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [strategy, setStrategy] = useState<TheoreticalStrategyResponse | null>(null);
  const [alertConfiguration, setAlertConfiguration] = useState<AlertConfiguration | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!holding || !portfolioId) {
        setForecast(null);
        setStrategy(null);
        setAlertConfiguration(null);
        return;
      }

      try {
        setLoading(true);

        // Charger toutes les configurations d'alertes actives
        const allConfigs = await configurationApi.getAlertConfigurations();
        const activeConfigs = allConfigs.filter(config => config.isActive);

        // Trouver la configuration qui contient une alerte pour ce token
        const configWithToken = activeConfigs.find(config => 
          config.tokenAlerts?.some(ta => ta.holdingId === holding.id && ta.isActive)
        );

        if (!configWithToken) {
          setForecast(null);
          setStrategy(null);
          setAlertConfiguration(null);
          return;
        }

        setAlertConfiguration(configWithToken);

        // Charger la prévision associée
        const allForecasts = await getForecasts();
        const forecastData = allForecasts.find(f => f.id === configWithToken.forecastId);
        
        if (!forecastData) {
          setForecast(null);
          setStrategy(null);
          return;
        }
        setForecast(forecastData);

        // Trouver la stratégie associée au token
        const tokenAlert = configWithToken.tokenAlerts?.find(ta => ta.holdingId === holding.id);
        if (tokenAlert?.strategyId) {
          const allStrategies = await getTheoreticalStrategies();
          const foundStrategy = allStrategies.find(s => s.id === tokenAlert.strategyId);
          setStrategy(foundStrategy || null);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setForecast(null);
        setStrategy(null);
        setAlertConfiguration(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [holding, portfolioId]);

  if (!holding) {
    return null;
  }

  if (loading) {
    return (
      <div className={`rounded-lg p-5 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {language === 'fr' ? 'Chargement...' : 'Loading...'}
        </div>
      </div>
    );
  }

  if (!forecast || !strategy || !alertConfiguration) {
    return (
      <div className={`rounded-lg p-5 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {holding.token.symbol} - {language === 'fr' ? 'Détails de la stratégie' : 'Strategy Details'}
          </h3>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {language === 'fr' 
            ? 'Aucune stratégie active trouvée pour ce token.'
            : 'No active strategy found for this token.'}
        </div>
      </div>
    );
  }

  const tokenAlert = alertConfiguration.tokenAlerts?.find(ta => ta.holdingId === holding.id);
  const currentPrice = holding.currentPrice || holding.averagePrice || 0;
  const tpAlerts = tokenAlert?.tpAlerts || [];

  // Calculer les statistiques
  const totalTP = strategy.profitTargets.length;
  const tpReached = tpAlerts.filter(tp => tp.isActive && currentPrice >= tp.targetPrice).length;
  const completionPercentage = totalTP > 0 ? (tpReached / totalTP) * 100 : 0;

  // Calculer la valeur projetée totale
  const projectedValue = tpAlerts.reduce((sum, tp) => sum + (tp.projectedAmount || 0), 0);

  return (
    <div className={`rounded-lg p-5 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
            {holding.token.symbol.charAt(0)}
          </div>
          <div>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {holding.token.symbol} - {language === 'fr' ? 'Détails de la stratégie' : 'Strategy Details'}
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {strategy.name}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode 
              ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Barre de progression */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            {Array.from({ length: totalTP }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${
                  i < tpReached
                    ? 'bg-green-500'
                    : isDarkMode
                    ? 'bg-gray-600'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {Math.round(completionPercentage)}%
            </span>
          </div>
          <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(projectedValue)}
          </span>
        </div>
      </div>

      {/* Section des paliers de prise de profit */}
      <div>
        <h4 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {language === 'fr' ? 'PALIERS DE PRISE DE PROFIT' : 'TAKE PROFIT LEVELS'}
        </h4>
        <div className="space-y-3">
          {strategy.profitTargets.map((tp, index) => {
            const tpAlert = tpAlerts.find(ta => ta.tpOrder === tp.order);
            const targetPrice = tp.targetType === 'percentage'
              ? holding.averagePrice * (1 + tp.targetValue / 100)
              : tp.targetValue;
            const isReached = currentPrice >= targetPrice;
            // Calculer la distance en pourcentage par rapport au prix d'achat
            const distanceFromAverage = ((targetPrice - currentPrice) / holding.averagePrice) * 100;

            return (
              <div
                key={tp.order}
                className={`p-4 rounded-lg border ${
                  isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        TP{tp.order}
                      </span>
                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formatCurrency(targetPrice)} ({formatPercentage(tp.sellPercentage)} {language === 'fr' ? 'vendu' : 'sold'})
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {isReached ? (
                      <span className="text-sm font-medium text-green-500">
                        {language === 'fr' ? 'Atteint' : 'Reached'}
                      </span>
                    ) : (
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {distanceFromAverage > 0
                          ? `+${formatPercentage(distanceFromAverage)} ${language === 'fr' ? 'restant' : 'remaining'}`
                          : language === 'fr' ? 'Atteint' : 'Reached'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

