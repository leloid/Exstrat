'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDownIcon, ChevronUpIcon, CheckCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/format';
import { useTheme } from '@/contexts/ThemeContext';
import { Holding } from '@/types/portfolio';
import * as portfoliosApi from '@/lib/portfolios-api';
import type { ForecastResponse } from '@/lib/portfolios-api';
import type { TheoreticalStrategyResponse } from '@/types/strategies';

interface BlocEProps {
  portfolioId: string;
  holdings: Holding[];
  onClose?: () => void;
}

interface TokenWithStrategy extends Holding {
  strategy?: TheoreticalStrategyResponse;
  tpCount?: number;
  completedTpCount?: number;
  completionPercentage?: number;
  projectedValue?: number;
}

export const BlocE_StrategiesPrevisions: React.FC<BlocEProps> = ({
  portfolioId,
  holdings,
  onClose,
}) => {
  const { isDarkMode, language } = useTheme();
  const [forecasts, setForecasts] = useState<ForecastResponse[]>([]);
  const [selectedForecastId, setSelectedForecastId] = useState<string | null>(null);
  const [selectedToken, setSelectedToken] = useState<TokenWithStrategy | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(true);

  // Charger les prévisions
  useEffect(() => {
    const loadForecasts = async () => {
      try {
        setLoading(true);
        const data = await portfoliosApi.getForecasts();
        const portfolioForecasts = data.filter(f => f.portfolioId === portfolioId);
        setForecasts(portfolioForecasts);
        
        // Sélectionner la première prévision par défaut si disponible
        if (portfolioForecasts.length > 0 && !selectedForecastId) {
          setSelectedForecastId(portfolioForecasts[0].id);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des prévisions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadForecasts();
  }, [portfolioId]);

  // Charger les stratégies théoriques et les associer aux holdings
  const tokensWithStrategies = useMemo(() => {
    return holdings.map(holding => {
      // Pour l'instant, on simule la récupération de la stratégie
      // Dans une vraie implémentation, on utiliserait appliedStrategies de la prévision
      return {
        ...holding,
        strategy: undefined, // À implémenter avec les vraies données
        tpCount: 0,
        completedTpCount: 0,
        completionPercentage: 0,
        projectedValue: holding.currentValue || 0,
      };
    });
  }, [holdings]);

  const selectedForecast = forecasts.find(f => f.id === selectedForecastId);

  if (loading) {
    return (
      <div className={`rounded-2xl p-6 shadow-lg ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-sm border border-gray-700/50' : 'bg-white border border-gray-200/80 shadow-sm'}`}>
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {language === 'fr' ? 'Chargement...' : 'Loading...'}
        </div>
      </div>
    );
  }

  if (forecasts.length === 0) {
    return null; // Ne pas afficher le bloc si aucune prévision
  }

  return (
    <div className={`rounded-b-lg rounded-t-none ${isDarkMode ? 'bg-gray-800 border border-t-0 border-gray-700' : 'bg-white border border-t-0 border-gray-200'}`}>
      {/* Délimiteur visuel entre Tableau et Stratégies */}
      <div className={`h-[1px] ${isDarkMode ? 'bg-gray-600' : 'bg-gray-300'}`}></div>
      
      <div className="p-3">
        {/* E1 - Sélecteur de prévision active */}
        <div className="flex items-center justify-between mb-3">
          <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fr' ? 'Stratégies & Prévisions' : 'Strategies & Forecasts'}
          </h2>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1.5 rounded transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title={isExpanded ? (language === 'fr' ? 'Réduire' : 'Collapse') : (language === 'fr' ? 'Dérouler' : 'Expand')}
          >
            {isExpanded ? (
              <ChevronUpIcon className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            ) : (
              <ChevronDownIcon className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
            )}
          </button>
        </div>

        {isExpanded && (
          <>
            <div className="mb-3">
              <label className={`block text-xs font-medium mb-1.5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {language === 'fr' ? 'Prévision active' : 'Active Forecast'}
              </label>
              <select
                value={selectedForecastId || ''}
                onChange={(e) => setSelectedForecastId(e.target.value)}
                className={`w-full px-4 py-2.5 rounded-lg border transition-all duration-200 ${
                  isDarkMode
                    ? 'bg-gray-700/50 border-gray-600/50 text-white hover:border-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                    : 'bg-gray-50 border-gray-300/60 text-gray-900 hover:border-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                }`}
              >
                {forecasts.map((forecast) => (
                  <option key={forecast.id} value={forecast.id}>
                    {forecast.name}
                    {forecast.portfolioName && ` - ${forecast.portfolioName}`}
                  </option>
                ))}
              </select>
            </div>

            {selectedForecast && (
              <>
                {/* E2 - Résultats globaux projetés */}
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 p-3 rounded-lg ${
                  isDarkMode ? 'bg-gray-700/30 border border-gray-600/30' : 'bg-gray-50 border border-gray-200/50'
                }`}>
                  <div>
                    <div className={`text-xs font-medium uppercase tracking-wide mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {language === 'fr' ? 'Valeur actuelle du wallet' : 'Current Wallet Value'}
                    </div>
                    <div className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(selectedForecast.summary.totalInvested + selectedForecast.summary.remainingTokensValue)}
                    </div>
                  </div>
                  <div>
                    <div className={`text-xs font-medium uppercase tracking-wide mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {language === 'fr' ? 'Valeur projetée si tous les TP sont atteints' : 'Projected Value if All TP Reached'}
                    </div>
                    <div className={`text-2xl font-bold tracking-tight text-green-600 dark:text-green-400`}>
                      {formatCurrency(
                        selectedForecast.summary.totalCollected + selectedForecast.summary.remainingTokensValue
                      )}
                    </div>
                  </div>
                </div>

                {/* E3 - Tableau avec colonnes supplémentaires */}
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b-2 ${isDarkMode ? 'border-gray-700/50' : 'border-gray-200'}`}>
                        <th className="text-left py-3 px-4">
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {language === 'fr' ? 'Token' : 'Token'}
                          </span>
                        </th>
                        <th className="text-center py-3 px-4">
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {language === 'fr' ? 'TP' : 'TP'}
                          </span>
                        </th>
                        <th className="text-center py-3 px-4">
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {language === 'fr' ? 'Complétude' : 'Completion'}
                          </span>
                        </th>
                        <th className="text-right py-3 px-4">
                          <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {language === 'fr' ? 'Valeur projetée' : 'Projected Value'}
                          </span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {tokensWithStrategies.map((token) => {
                        const hasStrategy = token.strategy && token.strategy.profitTargets.length > 0;
                        return (
                          <tr
                            key={token.id}
                            onClick={() => setSelectedToken(token)}
                            className={`border-b cursor-pointer transition-all duration-150 ${
                              isDarkMode
                                ? 'border-gray-700/30 hover:bg-gray-700/50 hover:shadow-sm'
                                : 'border-gray-200/50 hover:bg-gray-50/80 hover:shadow-sm'
                            }`}
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                                  {token.token.symbol.charAt(0)}
                                </div>
                                <div>
                                  <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {token.token.symbol}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="text-center py-4 px-4">
                              {hasStrategy ? (
                                <div className="flex items-center justify-center gap-1">
                                  {token.strategy!.profitTargets.map((tp, index) => {
                                    // Simuler l'état du TP (à implémenter avec les vraies données)
                                    const isCompleted = false; // À calculer selon le prix actuel
                                    const distance = 0; // Distance au TP en %
                                    
                                    return (
                                      <div
                                        key={index}
                                        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm ${
                                          isCompleted
                                            ? 'bg-gradient-to-br from-green-500 to-emerald-500 shadow-green-500/30'
                                            : distance < 10
                                            ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-orange-500/30'
                                            : isDarkMode
                                            ? 'bg-gray-600/50 border border-gray-500/50'
                                            : 'bg-gray-300/50 border border-gray-400/50'
                                        }`}
                                        title={`TP${tp.order}: ${formatPercentage(tp.targetValue)}`}
                                      >
                                        {isCompleted ? (
                                          <CheckCircleIcon className="h-4 w-4 text-white" />
                                        ) : (
                                          <div className="w-3 h-3 rounded-full border-2 border-white" />
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                  -
                                </span>
                              )}
                            </td>
                            <td className="text-center py-4 px-4">
                              {hasStrategy ? (
                                <div className="flex items-center justify-center">
                                  <div className={`w-24 rounded-full h-2.5 ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-200'}`}>
                                    <div
                                      className="bg-gradient-to-r from-green-500 to-emerald-500 h-2.5 rounded-full transition-all duration-300 shadow-sm"
                                      style={{ width: `${token.completionPercentage || 0}%` }}
                                    />
                                  </div>
                                  <span className={`ml-2 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {token.completionPercentage?.toFixed(0) || 0}%
                                  </span>
                                </div>
                              ) : (
                                <span className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                  -
                                </span>
                              )}
                            </td>
                            <td className="text-right py-4 px-4">
                              <span className={`${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {formatCurrency(token.projectedValue || 0)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* E4 - Encart détaillé lors du clic sur un token */}
                {selectedToken && (
                  <div className={`mt-4 p-4 rounded-xl shadow-md ${isDarkMode ? 'bg-gradient-to-br from-gray-700/50 to-gray-800/50 border border-gray-600/30' : 'bg-gradient-to-br from-gray-50 to-white border border-gray-200/60 shadow-sm'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {selectedToken.token.symbol} - {language === 'fr' ? 'Détails de la stratégie' : 'Strategy Details'}
                      </h3>
                      <button
                        onClick={() => setSelectedToken(null)}
                        className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>

                    {selectedToken.strategy && selectedToken.strategy.profitTargets.length > 0 ? (
                      <div className="space-y-4">
                        {/* Liste des TP */}
                        <div>
                          <h4 className={`text-sm font-bold uppercase tracking-wide mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {language === 'fr' ? 'Paliers de prise de profit' : 'Profit Taking Targets'}
                          </h4>
                          <div className="space-y-2">
                            {selectedToken.strategy.profitTargets.map((tp, index) => {
                              const currentPrice = selectedToken.currentPrice || selectedToken.averagePrice;
                              const targetPrice = tp.targetType === 'percentage'
                                ? selectedToken.averagePrice * (1 + tp.targetValue / 100)
                                : tp.targetValue;
                              const distance = currentPrice > 0 ? ((targetPrice - currentPrice) / currentPrice) * 100 : 0;
                              
                              return (
                                <div
                                  key={index}
                                  className={`p-4 rounded-lg transition-all duration-150 ${
                                    isDarkMode ? 'bg-gray-600/50 border border-gray-500/30 hover:bg-gray-600/70' : 'bg-white border border-gray-200/60 hover:shadow-sm'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        TP{tp.order}
                                      </span>
                                      <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {formatCurrency(targetPrice)} ({formatPercentage(tp.sellPercentage)} {language === 'fr' ? 'vendu' : 'sold'})
                                      </span>
                                    </div>
                                    <div className={`text-sm font-medium ${
                                      distance < 0 ? 'text-green-600 dark:text-green-400' : distance < 10 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-500'
                                    }`}>
                                      {distance < 0
                                        ? language === 'fr' ? 'Atteint' : 'Reached'
                                        : `${formatPercentage(Math.abs(distance))} ${language === 'fr' ? 'restant' : 'remaining'}`}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Mini-graphique du cours */}
                        <div>
                          <h4 className={`text-sm font-bold uppercase tracking-wide mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {language === 'fr' ? 'Position des TP' : 'TP Positions'}
                          </h4>
                          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-600/50 border border-gray-500/30' : 'bg-white border border-gray-200/60 shadow-sm'}`}>
                            <div className="relative h-32">
                              {/* Barre horizontale représentant le prix */}
                              <div className="absolute inset-0 flex items-center">
                                <div className="w-full h-2 bg-gray-300 rounded-full" />
                              </div>
                              
                              {/* Prix actuel */}
                              <div className="absolute left-0 top-0 bottom-0 flex items-center">
                                <div className="w-1 h-full bg-blue-500" />
                                <div className="ml-2 text-xs font-medium text-blue-500">
                                  {formatCurrency(selectedToken.currentPrice || selectedToken.averagePrice)}
                                </div>
                              </div>

                              {/* TP */}
                              {selectedToken.strategy.profitTargets.map((tp, index) => {
                                const currentPrice = selectedToken.currentPrice || selectedToken.averagePrice;
                                const targetPrice = tp.targetType === 'percentage'
                                  ? selectedToken.averagePrice * (1 + tp.targetValue / 100)
                                  : tp.targetValue;
                                const maxPrice = Math.max(
                                  ...selectedToken.strategy!.profitTargets.map(t => 
                                    t.targetType === 'percentage'
                                      ? selectedToken.averagePrice * (1 + t.targetValue / 100)
                                      : t.targetValue
                                  )
                                );
                                const position = ((targetPrice - currentPrice) / (maxPrice - currentPrice)) * 100;
                                
                                return (
                                  <div
                                    key={index}
                                    className="absolute top-0 bottom-0 flex items-center"
                                    style={{ left: `${Math.max(0, Math.min(100, position))}%` }}
                                  >
                                    <div className="w-1 h-full bg-green-500" />
                                    <div className="ml-2 text-xs font-medium text-green-500">
                                      TP{tp.order}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {language === 'fr' ? 'Aucune stratégie configurée pour ce token' : 'No strategy configured for this token'}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
};

