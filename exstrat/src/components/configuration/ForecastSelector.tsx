'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { ForecastResponse } from '@/lib/portfolios-api';
import { formatCurrency, formatPercentage } from '@/lib/format';
import { ChevronDownIcon, CheckIcon } from '@heroicons/react/24/outline';

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
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedForecast = forecasts.find(f => f.id === selectedForecastId);

  // Fermer le dropdown quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {language === 'fr' ? 'Sélectionner une prévision' : 'Select a forecast'}
      </label>
      
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-4 py-2.5 rounded-lg border transition-all text-left flex items-center justify-between ${
          isDarkMode
            ? 'bg-gray-700/50 border-gray-600 text-white hover:border-gray-500'
            : 'bg-gray-50 border-gray-300 text-gray-900 hover:border-gray-400'
        }`}
      >
        <div className="flex-1">
          {selectedForecast ? (
            <div>
              <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {selectedForecast.name}
              </div>
              <div className={`text-xs mt-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {formatCurrency(selectedForecast.summary?.totalInvested || 0)} • {formatPercentage(selectedForecast.summary?.returnPercentage || 0)}
              </div>
            </div>
          ) : (
            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
              {language === 'fr' ? '-- Sélectionner une prévision --' : '-- Select a forecast --'}
            </span>
          )}
        </div>
        <ChevronDownIcon
          className={`h-5 w-5 transition-transform ${isOpen ? 'transform rotate-180' : ''} ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute z-50 w-full mt-1 rounded-lg border shadow-lg max-h-96 overflow-auto ${
            isDarkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
          }`}
        >
          {forecasts.length === 0 ? (
            <div className={`px-4 py-3 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fr' ? 'Aucune prévision disponible' : 'No forecasts available'}
            </div>
          ) : (
            forecasts.map((forecast) => {
              const summary = forecast.summary || {};
              const isSelected = selectedForecastId === forecast.id;

              return (
                <button
                  key={forecast.id}
                  type="button"
                  onClick={() => {
                    onForecastSelect(forecast.id);
                    setIsOpen(false);
                  }}
                  className={`w-full px-4 py-3 text-left transition-colors border-b last:border-b-0 ${
                    isDarkMode
                      ? 'border-gray-700 hover:bg-gray-700'
                      : 'border-gray-200 hover:bg-gray-50'
                  } ${
                    isSelected
                      ? isDarkMode
                        ? 'bg-purple-900/30'
                        : 'bg-purple-50'
                      : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {forecast.name}
                        </span>
                        {isSelected && (
                          <CheckIcon className={`h-4 w-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                        <div>
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            {language === 'fr' ? 'Investi:' : 'Invested:'}
                          </span>
                          <span className={`ml-1 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(summary.totalInvested || 0)}
                          </span>
                        </div>
                        <div>
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            {language === 'fr' ? 'Encaissé:' : 'Collected:'}
                          </span>
                          <span className={`ml-1 font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(summary.totalCollected || 0)}
                          </span>
                        </div>
                        <div>
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            {language === 'fr' ? 'Profit:' : 'Profit:'}
                          </span>
                          <span className="ml-1 font-medium text-green-500">
                            {formatCurrency(summary.totalProfit || 0)}
                          </span>
                        </div>
                        <div>
                          <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                            {language === 'fr' ? 'Rendement:' : 'Return:'}
                          </span>
                          <span className={`ml-1 font-medium ${
                            summary.returnPercentage && summary.returnPercentage >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {formatPercentage(summary.returnPercentage || 0)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

