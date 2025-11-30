'use client';

import React from 'react';
import { CurrencyDollarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/format';
import { useTheme } from '@/contexts/ThemeContext';

interface BlocAProps {
  capitalInvesti: number;
  valeurActuelle: number;
  pnlAbsolu: number;
  pnlRelatif: number;
}

export const BlocA_ResumeGlobal: React.FC<BlocAProps> = ({
  capitalInvesti,
  valeurActuelle,
  pnlAbsolu,
  pnlRelatif,
}) => {
  const { isDarkMode, language } = useTheme();
  const isPositive = pnlAbsolu >= 0;

  return (
    <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Capital Investi */}
        <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-700/50 border border-gray-600/30' : 'bg-gray-50 border border-gray-200/50'}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fr' ? 'Capital investi' : 'Invested Capital'}
            </span>
            <CurrencyDollarIcon className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(capitalInvesti)}
          </div>
        </div>

        {/* Valeur Actuelle */}
        <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-700/50 border border-gray-600/30' : 'bg-gray-50 border border-gray-200/50'}`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fr' ? 'Valeur actuelle' : 'Current Value'}
            </span>
            <ArrowTrendingUpIcon className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
          </div>
          <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(valeurActuelle)}
          </div>
        </div>

        {/* PNL Absolu */}
        <div className={`rounded-lg p-3 ${isPositive 
          ? isDarkMode ? 'bg-green-900/20 border border-green-700/30' 
          : 'bg-green-50/50 border border-green-200/50'
          : isDarkMode ? 'bg-red-900/20 border border-red-700/30'
          : 'bg-red-50/50 border border-red-200/50'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fr' ? 'Gains / Pertes' : 'Profit / Loss'}
            </span>
            {isPositive ? (
              <ArrowTrendingUpIcon className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            ) : (
              <ArrowTrendingDownIcon className={`h-4 w-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
            )}
          </div>
          <div className={`text-xl font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(pnlAbsolu)}
          </div>
        </div>

        {/* PNL Relatif */}
        <div className={`rounded-lg p-3 ${isPositive 
          ? isDarkMode ? 'bg-green-900/20 border border-green-700/30' 
          : 'bg-green-50/50 border border-green-200/50'
          : isDarkMode ? 'bg-red-900/20 border border-red-700/30'
          : 'bg-red-50/50 border border-red-200/50'
        }`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fr' ? 'Rendement' : 'Return'}
            </span>
            {isPositive ? (
              <ArrowTrendingUpIcon className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
            ) : (
              <ArrowTrendingDownIcon className={`h-4 w-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
            )}
          </div>
          <div className={`text-xl font-bold ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatPercentage(pnlRelatif)}
          </div>
        </div>
      </div>
    </div>
  );
};

