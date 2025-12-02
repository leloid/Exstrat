'use client';

import React from 'react';
import { CurrencyDollarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ChartBarIcon } from '@heroicons/react/24/outline';
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
    <div className={`rounded-lg p-4 md:p-5 ${
      isDarkMode 
        ? 'bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 shadow-lg' 
        : 'bg-white border border-gray-200/80 shadow-sm'
    }`}>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Capital Investi */}
        <div className={`rounded-xl p-4 border-2 transition-all duration-200 hover:shadow-md ${
          isDarkMode 
            ? 'bg-white/5 border-gray-600/50 hover:border-gray-500' 
            : 'bg-white border-gray-200 hover:border-gray-300'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold uppercase tracking-wide ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {language === 'fr' ? 'Capital investi' : 'Invested Capital'}
            </span>
            <div className={`p-1.5 rounded-lg ${
              isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'
            }`}>
              <CurrencyDollarIcon className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
          </div>
          <div className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(capitalInvesti, '€', 2)}
          </div>
        </div>

        {/* Valeur Actuelle */}
        <div className={`rounded-xl p-4 border-2 transition-all duration-200 hover:shadow-md ${
          isDarkMode 
            ? 'bg-white/5 border-gray-600/50 hover:border-gray-500' 
            : 'bg-white border-gray-200 hover:border-gray-300'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold uppercase tracking-wide ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {language === 'fr' ? 'Valeur actuelle' : 'Current Value'}
            </span>
            <div className={`p-1.5 rounded-lg ${
              isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'
            }`}>
              <ChartBarIcon className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            </div>
          </div>
          <div className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(valeurActuelle, '€', 2)}
          </div>
        </div>

        {/* PNL Absolu */}
        <div className={`rounded-xl p-4 border-2 transition-all duration-200 hover:shadow-md ${
          isPositive
            ? isDarkMode 
              ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50' 
              : 'bg-green-50 border-green-200 hover:border-green-300'
            : isDarkMode 
            ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'
            : 'bg-red-50 border-red-200 hover:border-red-300'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold uppercase tracking-wide ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {language === 'fr' ? 'Gains / Pertes' : 'Profit / Loss'}
            </span>
            <div className={`p-1.5 rounded-lg ${
              isPositive
                ? isDarkMode ? 'bg-green-500/20' : 'bg-green-100'
                : isDarkMode ? 'bg-red-500/20' : 'bg-red-100'
            }`}>
              {isPositive ? (
                <ArrowTrendingUpIcon className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              ) : (
                <ArrowTrendingDownIcon className={`h-4 w-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
              )}
            </div>
          </div>
          <div className={`text-2xl md:text-3xl font-bold ${
            isPositive 
              ? (isDarkMode ? 'text-green-400' : 'text-green-600') 
              : (isDarkMode ? 'text-red-400' : 'text-red-600')
          }`}>
            {isPositive ? '+' : ''}{formatCurrency(pnlAbsolu, '€', 2)}
          </div>
        </div>

        {/* PNL Relatif */}
        <div className={`rounded-xl p-4 border-2 transition-all duration-200 hover:shadow-md ${
          isPositive
            ? isDarkMode 
              ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50' 
              : 'bg-green-50 border-green-200 hover:border-green-300'
            : isDarkMode 
            ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'
            : 'bg-red-50 border-red-200 hover:border-red-300'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs font-semibold uppercase tracking-wide ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {language === 'fr' ? 'Rendement' : 'Return'}
            </span>
            <div className={`p-1.5 rounded-lg ${
              isPositive
                ? isDarkMode ? 'bg-green-500/20' : 'bg-green-100'
                : isDarkMode ? 'bg-red-500/20' : 'bg-red-100'
            }`}>
              {isPositive ? (
                <ArrowTrendingUpIcon className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
              ) : (
                <ArrowTrendingDownIcon className={`h-4 w-4 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
              )}
            </div>
          </div>
          <div className={`text-2xl md:text-3xl font-bold ${
            isPositive 
              ? (isDarkMode ? 'text-green-400' : 'text-green-600') 
              : (isDarkMode ? 'text-red-400' : 'text-red-600')
          }`}>
            {isPositive ? '+' : ''}{formatPercentage(pnlRelatif)}
          </div>
        </div>
      </div>
    </div>
  );
};

