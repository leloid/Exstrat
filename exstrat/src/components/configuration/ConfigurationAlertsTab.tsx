'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { getForecasts, ForecastResponse } from '@/lib/portfolios-api';
import * as configurationApi from '@/lib/configuration-api';
import { AlertConfiguration } from '@/types/configuration';
import { WalletSelector } from './WalletSelector';
import { ForecastSelector } from './ForecastSelector';
import { TokenAlertsList } from './TokenAlertsList';
import { NotificationChannelsConfig } from './NotificationChannelsConfig';

export const ConfigurationAlertsTab: React.FC = () => {
  const { isDarkMode, language } = useTheme();
  const { portfolios } = usePortfolio();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [forecasts, setForecasts] = useState<ForecastResponse[]>([]);
  const [selectedForecastId, setSelectedForecastId] = useState<string | null>(null);
  const [alertConfiguration, setAlertConfiguration] = useState<AlertConfiguration | null>(null);
  const [loading, setLoading] = useState(false);

  // Charger les prévisions quand le portfolio change
  useEffect(() => {
    const loadForecasts = async () => {
      if (!selectedPortfolioId) {
        setForecasts([]);
        setSelectedForecastId(null);
        return;
      }

      try {
        setLoading(true);
        console.log('🔄 Chargement des prévisions pour le portfolio:', selectedPortfolioId);
        const allForecasts = await getForecasts();
        console.log('📊 Toutes les prévisions chargées:', allForecasts);
        const portfolioForecasts = allForecasts.filter(f => f.portfolioId === selectedPortfolioId);
        console.log('📊 Prévisions filtrées pour ce portfolio:', portfolioForecasts);
        setForecasts(portfolioForecasts);
        
        // Réinitialiser la sélection
        setSelectedForecastId(null);
        setAlertConfiguration(null);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des prévisions:', error);
        setForecasts([]);
      } finally {
        setLoading(false);
      }
    };

    loadForecasts();
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

  const handleConfigurationUpdate = (config: AlertConfiguration) => {
    setAlertConfiguration(config);
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
          <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fr' ? 'Sélection de la prévision' : 'Forecast Selection'}
          </h2>
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
            <ForecastSelector
              forecasts={forecasts}
              selectedForecastId={selectedForecastId}
              onForecastSelect={handleForecastSelect}
            />
          )}
        </div>
      )}

      {/* A3 & A4 - Configuration des alertes par token et TP */}
      {selectedForecastId && (
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
      {selectedForecastId && alertConfiguration && (
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
    </div>
  );
};

