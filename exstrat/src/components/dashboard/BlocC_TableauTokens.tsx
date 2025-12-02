'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { ArrowUpIcon, ArrowDownIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage, formatQuantity } from '@/lib/format';
import { useTheme } from '@/contexts/ThemeContext';
import { Holding } from '@/types/portfolio';
import * as configurationApi from '@/lib/configuration-api';
import { getTheoreticalStrategies } from '@/lib/portfolios-api';
import { AlertConfiguration } from '@/types/configuration';
import { TheoreticalStrategyResponse } from '@/types/strategies';

interface BlocCProps {
  holdings: Holding[];
  portfolioId?: string; // ID du portfolio pour charger les alertes
  onTokenClick?: (holding: Holding) => void;
}

interface TokenAlertInfo {
  strategyName: string | null;
  tpProgress: string; // Format "2/4"
}

type SortField = 'symbol' | 'quantity' | 'investedAmount' | 'currentValue' | 'pnl' | 'pnlPercentage' | 'strategy' | 'tpProgress';
type SortDirection = 'asc' | 'desc';

export const BlocC_TableauTokens: React.FC<BlocCProps> = ({ holdings, portfolioId, onTokenClick }) => {
  const { isDarkMode, language } = useTheme();
  const [sortField, setSortField] = useState<SortField>('currentValue');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [alertConfigurations, setAlertConfigurations] = useState<AlertConfiguration[]>([]);
  const [strategiesMap, setStrategiesMap] = useState<Map<string, TheoreticalStrategyResponse>>(new Map());
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // Charger les configurations d'alertes actives et les stratégies
  useEffect(() => {
    const loadAlertData = async () => {
      if (!portfolioId) return;

      try {
        setLoadingAlerts(true);
        
        // Charger toutes les configurations d'alertes
        const allConfigs = await configurationApi.getAlertConfigurations();
        // Filtrer pour ne garder que les configurations actives
        const activeConfigs = allConfigs.filter(config => config.isActive);
        setAlertConfigurations(activeConfigs);

        // Charger toutes les stratégies théoriques
        const allStrategies = await getTheoreticalStrategies();
        const strategiesById = new Map<string, TheoreticalStrategyResponse>();
        allStrategies.forEach(strategy => {
          strategiesById.set(strategy.id, strategy);
        });
        setStrategiesMap(strategiesById);
      } catch (error) {
        console.error('Erreur lors du chargement des alertes:', error);
      } finally {
        setLoadingAlerts(false);
      }
    };

    loadAlertData();
  }, [portfolioId]);

  // Fonction pour obtenir les informations d'alerte pour un holding
  const getTokenAlertInfo = (holding: Holding): TokenAlertInfo => {
    // Chercher une configuration active qui contient une alerte pour ce token
    for (const config of alertConfigurations) {
      const tokenAlert = config.tokenAlerts?.find(ta => ta.holdingId === holding.id);
      
      if (tokenAlert && tokenAlert.isActive) {
        // Trouver le nom de la stratégie
        let strategyName: string | null = null;
        if (tokenAlert.strategyId) {
          const strategy = strategiesMap.get(tokenAlert.strategyId);
          strategyName = strategy?.name || null;
        }

        // Compter les TP atteints (on considère qu'un TP est atteint si le prix actuel >= targetPrice)
        const currentPrice = holding.currentPrice || holding.averagePrice || 0;
        const tpReached = tokenAlert.tpAlerts?.filter(tp => 
          tp.isActive && currentPrice >= tp.targetPrice
        ).length || 0;
        const totalTP = tokenAlert.numberOfTargets || tokenAlert.tpAlerts?.length || 0;

        return {
          strategyName,
          tpProgress: `${tpReached}/${totalTP}`,
        };
      }
    }

    return {
      strategyName: null,
      tpProgress: '-',
    };
  };

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
        case 'strategy':
          aValue = getTokenAlertInfo(a).strategyName || '';
          bValue = getTokenAlertInfo(b).strategyName || '';
          break;
        case 'tpProgress':
          aValue = getTokenAlertInfo(a).tpProgress;
          bValue = getTokenAlertInfo(b).tpProgress;
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
      return <ChevronUpIcon className={`h-3.5 w-3.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`} />;
    }
    return sortDirection === 'asc' 
      ? <ChevronUpIcon className={`h-3.5 w-3.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
      : <ChevronDownIcon className={`h-3.5 w-3.5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />;
  };

  const getTokenLogo = (symbol: string) => {
    // Pour l'instant, on affiche juste les initiales
    // Plus tard, on pourra charger les logos depuis les assets
    const colors = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-green-500 to-emerald-500',
      'from-orange-500 to-red-500',
      'from-indigo-500 to-blue-500',
      'from-pink-500 to-rose-500',
      'from-yellow-500 to-orange-500',
      'from-teal-500 to-cyan-500',
    ];
    const colorIndex = symbol.charCodeAt(0) % colors.length;
    return (
      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colors[colorIndex]} flex items-center justify-center text-white font-bold text-xs shadow-sm flex-shrink-0`}>
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
    <div className={`rounded-b-lg p-4 md:p-6 ${
      isDarkMode 
        ? 'bg-gray-800/95 backdrop-blur-sm border border-t-0 border-gray-700/50' 
        : 'bg-white border border-t-0 border-gray-200/80 shadow-sm'
    }`}>
      {/* Header amélioré */}
      <div className="mb-4">
        <h2 className={`text-base md:text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {language === 'fr' ? 'Tableau des tokens' : 'Tokens Table'}
        </h2>
        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {language === 'fr' 
            ? `${holdings.length} ${holdings.length > 1 ? 'tokens' : 'token'} dans votre portefeuille`
            : `${holdings.length} ${holdings.length > 1 ? 'tokens' : 'token'} in your portfolio`
          }
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full table-auto">
          <thead>
            <tr className={`${
              isDarkMode 
                ? 'bg-gray-700/30 border-b border-gray-700/50' 
                : 'bg-gray-50/80 border-b border-gray-200'
            }`}>
              <th
                className="text-left py-2 px-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors hover:opacity-80"
                onClick={() => handleSort('symbol')}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {language === 'fr' ? 'Token' : 'Token'}
                  </span>
                  <SortIcon field="symbol" />
                </div>
              </th>
              <th
                className="text-right py-2 px-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors hover:opacity-80"
                onClick={() => handleSort('quantity')}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {language === 'fr' ? 'Qté' : 'Qty'}
                  </span>
                  <SortIcon field="quantity" />
                </div>
              </th>
              <th
                className="text-right py-2 px-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors hover:opacity-80"
                onClick={() => handleSort('investedAmount')}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {language === 'fr' ? 'Investi' : 'Invested'}
                  </span>
                  <SortIcon field="investedAmount" />
                </div>
              </th>
              <th
                className="text-right py-2 px-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors hover:opacity-80"
                onClick={() => handleSort('currentValue')}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {language === 'fr' ? 'Actuel' : 'Current'}
                  </span>
                  <SortIcon field="currentValue" />
                </div>
              </th>
              <th
                className="text-right py-2 px-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors hover:opacity-80"
                onClick={() => handleSort('pnl')}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {language === 'fr' ? 'G/P' : 'P/L'}
                  </span>
                  <SortIcon field="pnl" />
                </div>
              </th>
              <th
                className="text-right py-2 px-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors hover:opacity-80"
                onClick={() => handleSort('pnlPercentage')}
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {language === 'fr' ? '%' : '%'}
                  </span>
                  <SortIcon field="pnlPercentage" />
                </div>
              </th>
              <th
                className="text-left py-2 px-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors hover:opacity-80"
                onClick={() => handleSort('strategy')}
              >
                <div className="flex items-center gap-1.5">
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {language === 'fr' ? 'Strat' : 'Strat'}
                  </span>
                  <SortIcon field="strategy" />
                </div>
              </th>
              <th
                className="text-center py-2 px-2 text-xs font-bold uppercase tracking-wider cursor-pointer transition-colors hover:opacity-80"
                onClick={() => handleSort('tpProgress')}
              >
                <div className="flex items-center justify-center gap-1.5">
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {language === 'fr' ? 'TP' : 'TP'}
                  </span>
                  <SortIcon field="tpProgress" />
                </div>
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${
            isDarkMode ? 'divide-gray-700/30' : 'divide-gray-200/50'
          }`}>
            {sortedHoldings.map((holding, index) => {
              const isPositive = (holding.pnl || 0) >= 0;
              const alertInfo = getTokenAlertInfo(holding);
              return (
                <tr
                  key={holding.id}
                  onClick={() => onTokenClick?.(holding)}
                  className={`cursor-pointer transition-all duration-200 ${
                    isDarkMode 
                      ? 'hover:bg-gray-700/40 hover:shadow-lg' 
                      : 'hover:bg-gray-50/90 hover:shadow-md'
                  } ${index % 2 === 0 
                    ? (isDarkMode ? 'bg-gray-800/30' : 'bg-white') 
                    : (isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/30')
                  }`}
                >
                  <td className="py-2.5 px-2 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0">
                        {getTokenLogo(holding.token.symbol)}
                      </div>
                      <div className="min-w-0">
                        <div className={`font-bold text-xs ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {holding.token.symbol}
                        </div>
                        <div className={`text-xs mt-0.5 truncate max-w-[80px] ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {holding.token.name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 whitespace-nowrap text-right">
                    <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {formatQuantity(holding.quantity)}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 whitespace-nowrap text-right">
                    <span className={`text-xs font-semibold ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                      {formatCurrency(holding.investedAmount, '€', 0)}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 whitespace-nowrap text-right">
                    <span className={`text-xs font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(holding.currentValue || 0, '€', 0)}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 whitespace-nowrap text-right">
                    <div className={`flex items-center justify-end gap-1 ${
                      isPositive ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {isPositive ? (
                        <ArrowUpIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      ) : (
                        <ArrowDownIcon className="h-3.5 w-3.5 flex-shrink-0" />
                      )}
                      <span className="font-bold text-xs">
                        {isPositive ? '+' : ''}{formatCurrency(holding.pnl || 0, '€', 0)}
                      </span>
                    </div>
                  </td>
                  <td className="py-2.5 px-2 whitespace-nowrap text-right">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-bold ${
                      isPositive
                        ? isDarkMode
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-green-50 text-green-600'
                        : isDarkMode
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {isPositive ? '+' : ''}{formatPercentage(holding.pnlPercentage || 0)}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 whitespace-nowrap text-left">
                    {alertInfo.strategyName ? (
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold truncate max-w-[100px] ${
                        isDarkMode
                          ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                          : 'bg-blue-50 text-blue-700 border border-blue-200'
                      }`} title={alertInfo.strategyName}>
                        {alertInfo.strategyName}
                      </span>
                    ) : (
                      <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        -
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-2 whitespace-nowrap text-center">
                    {alertInfo.tpProgress !== '-' ? (
                      <span className={`inline-flex items-center justify-center px-1.5 py-0.5 rounded text-xs font-bold ${
                        isDarkMode
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-purple-50 text-purple-700 border border-purple-200'
                      }`}>
                        {alertInfo.tpProgress}
                      </span>
                    ) : (
                      <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        -
                      </span>
                    )}
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

