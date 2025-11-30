'use client';

import React, { useState, useMemo } from 'react';
import { ArrowUpIcon, ArrowDownIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage, formatQuantity } from '@/lib/format';
import { useTheme } from '@/contexts/ThemeContext';
import { Holding } from '@/types/portfolio';

interface BlocCProps {
  holdings: Holding[];
  onTokenClick?: (holding: Holding) => void;
}

type SortField = 'symbol' | 'quantity' | 'investedAmount' | 'currentValue' | 'pnl' | 'pnlPercentage';
type SortDirection = 'asc' | 'desc';

export const BlocC_TableauTokens: React.FC<BlocCProps> = ({ holdings, onTokenClick }) => {
  const { isDarkMode, language } = useTheme();
  const [sortField, setSortField] = useState<SortField>('currentValue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Calculer les valeurs pour chaque holding
  const holdingsWithCalculations = useMemo(() => {
    return holdings.map(holding => {
      const currentValue = holding.currentValue || (holding.currentPrice || holding.averagePrice) * holding.quantity;
      const pnl = currentValue - holding.investedAmount;
      const pnlPercentage = holding.investedAmount > 0 ? (pnl / holding.investedAmount) * 100 : 0;
      
      return {
        ...holding,
        currentValue,
        pnl,
        pnlPercentage,
      };
    });
  }, [holdings]);

  // Trier les holdings
  const sortedHoldings = useMemo(() => {
    const sorted = [...holdingsWithCalculations];
    
    sorted.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortField) {
        case 'symbol':
          aValue = a.token.symbol.toUpperCase();
          bValue = b.token.symbol.toUpperCase();
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'investedAmount':
          aValue = a.investedAmount;
          bValue = b.investedAmount;
          break;
        case 'currentValue':
          aValue = a.currentValue || 0;
          bValue = b.currentValue || 0;
          break;
        case 'pnl':
          aValue = a.pnl || 0;
          bValue = b.pnl || 0;
          break;
        case 'pnlPercentage':
          aValue = a.pnlPercentage || 0;
          bValue = b.pnlPercentage || 0;
          break;
        default:
          return 0;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      const numA = Number(aValue);
      const numB = Number(bValue);
      
      return sortDirection === 'asc' ? numA - numB : numB - numA;
    });

    return sorted;
  }, [holdingsWithCalculations, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ChevronUpIcon className="h-4 w-4 opacity-30" />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className="h-4 w-4" />
      : <ChevronDownIcon className="h-4 w-4" />;
  };

  const getTokenLogo = (symbol: string) => {
    // Pour l'instant, on affiche juste les initiales
    // Plus tard, on pourra charger les logos depuis les assets
    return (
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
        {symbol.charAt(0)}
      </div>
    );
  };

  if (holdings.length === 0) {
    return (
      <div className={`rounded-2xl p-6 shadow-lg ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-sm border border-gray-700/50' : 'bg-white border border-gray-200/80 shadow-sm'}`}>
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {language === 'fr' ? 'Tableau des tokens' : 'Tokens Table'}
        </h2>
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {language === 'fr' ? 'Aucun token dans ce portfolio' : 'No tokens in this portfolio'}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-2xl p-6 shadow-lg ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-sm border border-gray-700/50' : 'bg-white border border-gray-200/80 shadow-sm'}`}>
      <h2 className={`text-xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        {language === 'fr' ? 'Tableau des tokens' : 'Tokens Table'}
      </h2>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={`border-b-2 ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
              <th
                className="text-left py-4 px-4 cursor-pointer transition-colors"
                onClick={() => handleSort('symbol')}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {language === 'fr' ? 'Token' : 'Token'}
                  </span>
                  <SortIcon field="symbol" />
                </div>
              </th>
              <th
                className="text-right py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('quantity')}
              >
                <div className="flex items-center justify-end gap-2">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {language === 'fr' ? 'Quantité' : 'Quantity'}
                  </span>
                  <SortIcon field="quantity" />
                </div>
              </th>
              <th
                className="text-right py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('investedAmount')}
              >
                <div className="flex items-center justify-end gap-2">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {language === 'fr' ? 'Montant investi' : 'Invested'}
                  </span>
                  <SortIcon field="investedAmount" />
                </div>
              </th>
              <th
                className="text-right py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('currentValue')}
              >
                <div className="flex items-center justify-end gap-2">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {language === 'fr' ? 'Valeur actuelle' : 'Current Value'}
                  </span>
                  <SortIcon field="currentValue" />
                </div>
              </th>
              <th
                className="text-right py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('pnl')}
              >
                <div className="flex items-center justify-end gap-2">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {language === 'fr' ? 'Gains / Pertes' : 'P/L'}
                  </span>
                  <SortIcon field="pnl" />
                </div>
              </th>
              <th
                className="text-right py-3 px-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleSort('pnlPercentage')}
              >
                <div className="flex items-center justify-end gap-2">
                  <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {language === 'fr' ? 'G/P %' : 'P/L %'}
                  </span>
                  <SortIcon field="pnlPercentage" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedHoldings.map((holding) => {
              const isPositive = (holding.pnl || 0) >= 0;
              return (
                <tr
                  key={holding.id}
                  onClick={() => onTokenClick?.(holding)}
                  className={`border-b cursor-pointer transition-all duration-150 ${
                    isDarkMode 
                      ? 'border-gray-700/30 hover:bg-gray-700/50 hover:shadow-sm' 
                      : 'border-gray-200/50 hover:bg-gray-50/80 hover:shadow-sm'
                  }`}
                >
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {getTokenLogo(holding.token.symbol)}
                      <div>
                        <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {holding.token.symbol}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {holding.token.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="text-right py-4 px-4">
                    <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatQuantity(holding.quantity)}
                    </span>
                  </td>
                  <td className="text-right py-4 px-4">
                    <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(holding.investedAmount)}
                    </span>
                  </td>
                  <td className="text-right py-4 px-4">
                    <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(holding.currentValue || 0)}
                    </span>
                  </td>
                  <td className="text-right py-4 px-4">
                    <div className={`flex items-center justify-end gap-1 ${
                      isPositive ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {isPositive ? (
                        <ArrowUpIcon className="h-4 w-4" />
                      ) : (
                        <ArrowDownIcon className="h-4 w-4" />
                      )}
                      <span className="font-medium">
                        {formatCurrency(holding.pnl || 0)}
                      </span>
                    </div>
                  </td>
                  <td className="text-right py-4 px-4">
                    <span className={`font-medium ${
                      isPositive ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {formatPercentage(holding.pnlPercentage || 0)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

