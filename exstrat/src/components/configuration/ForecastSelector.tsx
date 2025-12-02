'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { ForecastResponse } from '@/lib/portfolios-api';
import { formatCurrency, formatPercentage } from '@/lib/format';

interface ForecastSelectorProps {
  forecasts: ForecastResponse[];
  selectedForecastId: string | null;
  onForecastSelect: (forecastId: string) => void;
}

export const ForecastSelector: React.FC<ForecastSelectorProps> = ({
  forecasts,
  selectedForecastId,
  onForecastSelect,
}) => {
  const { isDarkMode, language } = useTheme();

  return (
    <div className="space-y-3">
      {forecasts.map((forecast) => {
        const summary = forecast.summary || {};
        const isSelected = selectedForecastId === forecast.id;

        return (
          <div
            key={forecast.id}
            onClick={() => onForecastSelect(forecast.id)}
            className={`p-4 rounded-lg border cursor-pointer transition-all ${
              isSelected
                ? isDarkMode
                  ? 'bg-purple-900/30 border-purple-600'
                  : 'bg-purple-50 border-purple-600'
                : isDarkMode
                  ? 'bg-gray-700/50 border-gray-600 hover:border-gray-500'
                  : 'bg-gray-50 border-gray-300 hover:border-gray-400'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {forecast.name}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                  <div>
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                      {language === 'fr' ? 'Total investi:' : 'Total invested:'}
                    </span>
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(summary.totalInvested || 0)}
                    </p>
                  </div>
                  <div>
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                      {language === 'fr' ? 'Encaissé projeté:' : 'Projected collected:'}
                    </span>
                    <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(summary.totalCollected || 0)}
                    </p>
                  </div>
                  <div>
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                      {language === 'fr' ? 'Profit projeté:' : 'Projected profit:'}
                    </span>
                    <p className={`font-medium text-green-500`}>
                      {formatCurrency(summary.totalProfit || 0)}
                    </p>
                  </div>
                  <div>
                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                      {language === 'fr' ? 'Rendement:' : 'Return:'}
                    </span>
                    <p className={`font-medium ${summary.returnPercentage && summary.returnPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatPercentage(summary.returnPercentage || 0)}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onForecastSelect(forecast.id);
                }}
                className={`ml-4 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isSelected
                    ? isDarkMode
                      ? 'bg-purple-600 text-white'
                      : 'bg-purple-600 text-white'
                    : isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600 text-white'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                }`}
              >
                {isSelected
                  ? language === 'fr' ? 'Configuré' : 'Configured'
                  : language === 'fr' ? 'Configurer les alertes' : 'Configure alerts'}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

