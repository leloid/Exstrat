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
    <div className={`rounded-2xl p-6 shadow-lg ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-sm border border-gray-700/50' : 'bg-white border border-gray-200/80 shadow-sm'}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Capital Investi */}
        <div className={`rounded-xl p-5 transition-all duration-200 hover:scale-[1.02] ${isDarkMode ? 'bg-gradient-to-br from-gray-700/80 to-gray-800/80 border border-gray-600/50' : 'bg-gradient-to-br from-gray-50 to-white border border-gray-200/60 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {language === 'fr' ? 'Capital investi' : 'Invested Capital'}
            </span>
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-600/50' : 'bg-blue-50'}`}>
              <CurrencyDollarIcon className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : 'text-blue-600'}`} />
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(capitalInvesti)}
          </div>
        </div>

        {/* Valeur Actuelle */}
        <div className={`rounded-xl p-5 transition-all duration-200 hover:scale-[1.02] ${isDarkMode ? 'bg-gradient-to-br from-gray-700/80 to-gray-800/80 border border-gray-600/50' : 'bg-gradient-to-br from-gray-50 to-white border border-gray-200/60 shadow-sm'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {language === 'fr' ? 'Valeur actuelle' : 'Current Value'}
            </span>
            <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-600/50' : 'bg-purple-50'}`}>
              <ArrowTrendingUpIcon className={`h-4 w-4 ${isDarkMode ? 'text-gray-300' : 'text-purple-600'}`} />
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(valeurActuelle)}
          </div>
        </div>

        {/* PNL Absolu */}
        <div className={`rounded-xl p-5 transition-all duration-200 hover:scale-[1.02] ${isPositive 
          ? isDarkMode ? 'bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/30' 
          : 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/60'
          : isDarkMode ? 'bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-700/30'
          : 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/60'
        } shadow-sm`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {language === 'fr' ? 'Gains / Pertes' : 'Profit / Loss'}
            </span>
            <div className={`p-2 rounded-lg ${isPositive 
              ? isDarkMode ? 'bg-green-700/30' : 'bg-green-100'
              : isDarkMode ? 'bg-red-700/30' : 'bg-red-100'
            }`}>
              {isPositive ? (
                <ArrowTrendingUpIcon className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              ) : (
                <ArrowTrendingDownIcon className={`h-4 w-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
              )}
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatCurrency(pnlAbsolu)}
          </div>
        </div>

        {/* PNL Relatif */}
        <div className={`rounded-xl p-5 transition-all duration-200 hover:scale-[1.02] ${isPositive 
          ? isDarkMode ? 'bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700/30' 
          : 'bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/60'
          : isDarkMode ? 'bg-gradient-to-br from-red-900/30 to-red-800/20 border border-red-700/30'
          : 'bg-gradient-to-br from-red-50 to-rose-50 border border-red-200/60'
        } shadow-sm`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-medium uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {language === 'fr' ? 'Rendement' : 'Return'}
            </span>
            <div className={`p-2 rounded-lg ${isPositive 
              ? isDarkMode ? 'bg-green-700/30' : 'bg-green-100'
              : isDarkMode ? 'bg-red-700/30' : 'bg-red-100'
            }`}>
              {isPositive ? (
                <ArrowTrendingUpIcon className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              ) : (
                <ArrowTrendingDownIcon className={`h-4 w-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
              )}
            </div>
          </div>
          <div className={`text-2xl font-bold tracking-tight ${isPositive ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            {formatPercentage(pnlRelatif)}
          </div>
        </div>
      </div>
    </div>
  );
};

