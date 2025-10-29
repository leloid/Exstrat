'use client';

import React, { useState, useEffect } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Cog6ToothIcon, ChartBarIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/format';
import * as portfoliosApi from '@/lib/portfolios-api';

interface AppliedStrategy {
  holdingId: string;
  strategyId: string | null;
  strategyName: string;
}

export default function ConfigPage() {
  const { portfolios, isLoading, refreshPortfolios } = usePortfolio();
  
  const [activeTab, setActiveTab] = useState('config');
  const [theoreticalStrategies, setTheoreticalStrategies] = useState<any[]>([]);
  const [allHoldings, setAllHoldings] = useState<any[]>([]);
  const [appliedStrategies, setAppliedStrategies] = useState<Record<string, AppliedStrategy>>({});
  const [simulations, setSimulations] = useState<Record<string, any>>({});
  const [loadingStrategies, setLoadingStrategies] = useState(true);
  const [loadingHoldings, setLoadingHoldings] = useState(true);
  
  // Utilisation du contexte global pour le thème
  const { isDarkMode, language } = useTheme();

  useEffect(() => {
    refreshPortfolios();
    loadTheoreticalStrategies();
  }, []);

  // Charger tous les holdings de tous les portfolios
  useEffect(() => {
    if (portfolios.length > 0) {
      loadAllHoldings();
    }
  }, [portfolios]);

  const loadTheoreticalStrategies = async () => {
    try {
      setLoadingStrategies(true);
      const data = await portfoliosApi.getTheoreticalStrategies();
      console.log('📥 Stratégies théoriques chargées:', data);
      setTheoreticalStrategies(data);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des stratégies:', error);
    } finally {
      setLoadingStrategies(false);
    }
  };

  const loadAllHoldings = async () => {
    try {
      setLoadingHoldings(true);
      console.log('📥 Chargement de tous les holdings...');
      
      const allHoldingsData: any[] = [];
      
      // Charger les holdings de chaque portfolio
      for (const portfolio of portfolios) {
        try {
          const holdings = await portfoliosApi.getPortfolioHoldings(portfolio.id);
          // Ajouter l'information du portfolio à chaque holding
          const holdingsWithPortfolio = holdings.map(holding => ({
            ...holding,
            portfolioName: portfolio.name,
            portfolioId: portfolio.id,
          }));
          allHoldingsData.push(...holdingsWithPortfolio);
        } catch (error) {
          console.error(`❌ Erreur lors du chargement des holdings du portfolio ${portfolio.name}:`, error);
        }
      }
      
      console.log('📊 Tous les holdings chargés:', allHoldingsData);
      setAllHoldings(allHoldingsData);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des holdings:', error);
    } finally {
      setLoadingHoldings(false);
    }
  };

  // Grouper les holdings par portfolio
  const holdingsByPortfolio = allHoldings.reduce((acc, holding) => {
    const portfolioId = holding.portfolioId;
    if (!acc[portfolioId]) {
      acc[portfolioId] = [];
    }
    acc[portfolioId].push(holding);
    return acc;
  }, {} as Record<string, typeof allHoldings>);

  // Calculer la simulation pour un holding avec une stratégie
  const calculateSimulation = (holding: any, strategy: any) => {
    if (!strategy) return null;

    const quantity = holding.quantity;
    const averagePrice = holding.averagePrice;
    const currentPrice = holding.currentPrice || averagePrice;
    
    let remainingTokens = quantity;
    let totalProfit = 0;
    const results: any[] = [];

    strategy.profitTargets.forEach((target: any) => {
      const tokensToSell = (quantity * target.sellPercentage) / 100;
      
      let targetPrice = 0;
      if (target.targetType === 'percentage') {
        targetPrice = averagePrice * (1 + target.targetValue / 100);
      } else {
        targetPrice = target.targetValue;
      }
      
      const profit = tokensToSell * (targetPrice - averagePrice);
      totalProfit += profit;
      remainingTokens -= tokensToSell;
      
      results.push({
        targetPrice,
        tokensToSell,
        profit,
        remainingTokens,
      });
    });

    const totalInvested = quantity * averagePrice;
    const returnPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
    const currentValue = quantity * currentPrice;
    const projectedValue = totalProfit + (remainingTokens * currentPrice);

    return {
      totalProfit,
      returnPercentage,
      currentValue,
      projectedValue,
      results,
      remainingTokens,
    };
  };

  // Gérer le changement de stratégie pour un holding
  const handleStrategyChange = (holdingId: string, strategyId: string) => {
    const strategy = theoreticalStrategies.find(s => s.id === strategyId);
    
    if (strategyId === 'none') {
      // Retirer la stratégie
      const newApplied = { ...appliedStrategies };
      delete newApplied[holdingId];
      setAppliedStrategies(newApplied);
      
      const newSims = { ...simulations };
      delete newSims[holdingId];
      setSimulations(newSims);
    } else if (strategy) {
      // Appliquer la stratégie
      setAppliedStrategies({
        ...appliedStrategies,
        [holdingId]: {
          holdingId,
          strategyId: strategy.id,
          strategyName: strategy.name,
        },
      });

      // Calculer la simulation
      const holding = allHoldings.find(h => h.id === holdingId);
      if (holding) {
        const simulation = calculateSimulation(holding, strategy);
        setSimulations({
          ...simulations,
          [holdingId]: simulation,
        });
      }
    }
  };

  // Filtrer les stratégies compatibles avec un token
  const getCompatibleStrategies = (tokenSymbol: string) => {
    return theoreticalStrategies.filter(s => s.tokenSymbol === tokenSymbol);
  };

  // Calculer les totaux globaux
  const globalStats = Object.entries(simulations).reduce((acc, [holdingId, sim]) => {
    const holding = allHoldings.find(h => h.id === holdingId);
    if (holding) {
      acc.totalInvested += holding.investedAmount;
      acc.totalCurrentValue += sim.currentValue;
      acc.totalProjectedValue += sim.projectedValue;
      acc.totalProfit += sim.totalProfit;
    }
    return acc;
  }, { totalInvested: 0, totalCurrentValue: 0, totalProjectedValue: 0, totalProfit: 0 });

  const globalReturnPercentage = globalStats.totalInvested > 0 
    ? (globalStats.totalProfit / globalStats.totalInvested) * 100 
    : 0;

  if (isLoading || loadingStrategies || loadingHoldings) {
    return (
      <ProtectedRoute>
        <div className={`min-h-screen flex ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />
          <div className="flex-1 flex flex-col">
            <TopBar currentPageName={language === 'fr' ? 'Configuration' : 'Configuration'} />
            <div className={`flex-1 p-6 flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <div className="text-center">
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
                  isDarkMode ? 'border-purple-600' : 'border-purple-600'
                } mx-auto`}></div>
                <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'fr' ? 'Chargement de la configuration...' : 'Loading configuration...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className={`min-h-screen flex ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />
        
        <div className="flex-1 flex flex-col">
          <TopBar currentPageName={language === 'fr' ? 'Configuration' : 'Configuration'} />

          <div className={`flex-1 p-6 overflow-visible ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Header */}
            <div className="mb-8">
              <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {language === 'fr' 
                  ? 'Pour chaque actif, sélectionnez une stratégie et les prises de profit à activer'
                  : 'For each asset, select a strategy and profit targets to activate'
                }
              </p>
            </div>

            {/* Résultats globaux */}
            {Object.keys(simulations).length > 0 && (
              <div className={`rounded-xl p-6 mb-8 ${
                isDarkMode ? 'bg-gradient-to-r from-purple-900/30 to-blue-900/30' : 'bg-gradient-to-r from-blue-50 to-purple-50'
              }`}>
                <div className={`flex items-center gap-2 mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  <ChartBarIcon className="h-5 w-5 text-purple-600" />
                  <h2 className="text-xl font-semibold">
                    {language === 'fr' ? 'Résultats Globaux' : 'Global Results'}
                  </h2>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className={`text-2xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {formatCurrency(globalStats.totalProjectedValue)}
                    </div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {language === 'fr' ? 'Valeur Projetée' : 'Projected Value'}
                    </div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold text-green-600`}>
                      {formatCurrency(globalStats.totalProfit)}
                    </div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {language === 'fr' ? 'Profit Attendu' : 'Expected Profit'}
                    </div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold text-purple-600`}>
                      {formatPercentage(globalReturnPercentage)}
                    </div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {language === 'fr' ? 'Rendement' : 'Return'}
                    </div>
                  </div>
                  <div>
                    <div className={`text-2xl font-bold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {Object.keys(appliedStrategies).length}
                    </div>
                    <div className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                      {language === 'fr' ? 'Stratégies Appliquées' : 'Applied Strategies'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Section Paramètres */}
            <div className={`rounded-xl p-6 mb-8 transition-all duration-300 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
            }`}>
              <div className="mb-6">
                <h2 className={`text-lg font-semibold ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {language === 'fr' ? 'Paramètres' : 'Settings'}
                </h2>
                <p className={`text-sm ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {language === 'fr' ? 'Configuration des stratégies par token' : 'Token strategy configuration'}
                </p>
              </div>
              
              {/* Design en cartes */}
              <div className="space-y-4">
                {allHoldings.length === 0 ? (
                  <div className={`text-center py-8 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {language === 'fr' 
                      ? 'Aucun holding disponible. Ajoutez des transactions d\'abord.'
                      : 'No holdings available. Add transactions first.'
                    }
                  </div>
                ) : (
                  allHoldings.map((holding) => {
                    const compatibleStrategies = getCompatibleStrategies(holding.token.symbol);
                    const appliedStrategy = appliedStrategies[holding.id];
                    const simulation = simulations[holding.id];

                    return (
                      <div 
                        key={holding.id} 
                        className={`rounded-lg p-4 border ${
                          isDarkMode 
                            ? 'border-gray-700 bg-gray-750/50' 
                            : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* Informations du token */}
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              isDarkMode ? 'bg-gray-700' : 'bg-purple-100'
                            }`}>
                              <span className={`text-sm font-bold ${
                                isDarkMode ? 'text-gray-300' : 'text-purple-600'
                              }`}>
                                {holding.token.symbol.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <div className={`font-semibold ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {holding.token.symbol}
                              </div>
                              <div className={`text-xs ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {holding.token.name}
                              </div>
                              <Badge 
                                variant="outline" 
                                className={`text-xs mt-1 ${
                                  isDarkMode ? 'border-gray-600 text-gray-300' : ''
                                }`}
                              >
                                {holding.portfolioName}
                              </Badge>
                            </div>
                          </div>

                          {/* Informations financières */}
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {language === 'fr' ? 'Quantité' : 'Quantity'}
                              </span>
                              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {holding.quantity}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {language === 'fr' ? 'Investi' : 'Invested'}
                              </span>
                              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {formatCurrency(holding.investedAmount)}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {language === 'fr' ? 'Prix moyen' : 'Avg Price'}
                              </span>
                              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {formatCurrency(holding.averagePrice)}
                              </span>
                            </div>
                          </div>

                          {/* Stratégie */}
                          <div className="space-y-2">
                            <div>
                              <label className={`text-sm font-medium mb-2 block ${
                                isDarkMode ? 'text-gray-300' : 'text-gray-700'
                              }`}>
                                {language === 'fr' ? 'Stratégie' : 'Strategy'}
                              </label>
                              <Select
                                value={appliedStrategy?.strategyId || 'none'}
                                onValueChange={(value) => handleStrategyChange(holding.id, value)}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder={language === 'fr' ? 'Choisir...' : 'Choose...'} />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">
                                    {language === 'fr' ? 'Sans TP (défaut)' : 'No PT (default)'}
                                  </SelectItem>
                                  {compatibleStrategies.map((strategy) => (
                                    <SelectItem key={strategy.id} value={strategy.id}>
                                      {strategy.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            {simulation && (
                              <div className="mt-2 space-y-1">
                                <div>
                                  <Badge 
                                    className={`${
                                      isDarkMode 
                                        ? 'bg-purple-900/30 text-purple-400' 
                                        : 'bg-purple-100 text-purple-700'
                                    }`}
                                  >
                                    {simulation.results.length} {language === 'fr' ? 'sorties' : 'exits'}
                                  </Badge>
                                </div>
                                <div className={`text-xs ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {language === 'fr' ? 'Profit' : 'Profit'}: <span className="font-medium text-green-600">
                                    {formatCurrency(simulation.totalProfit)}
                                  </span>
                                </div>
                                <div className={`text-xs ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>
                                  {language === 'fr' ? 'Rendement' : 'Return'}: <span className="font-medium">
                                    {formatPercentage(simulation.returnPercentage)}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Section Résultats détaillés */}
            {Object.keys(simulations).length > 0 && (
              <div className={`rounded-xl p-6 mb-8 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <div className="mb-4">
                  <h2 className={`text-lg font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                    {language === 'fr' ? 'Résultats' : 'Results'}
                  </h2>
                  <p className={`text-sm ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {language === 'fr' ? 'Détails des simulations par token' : 'Token simulation details'}
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className={`border-b ${
                        isDarkMode ? 'border-gray-700' : 'border-gray-200'
                      }`}>
                        <th className={`text-left py-3 px-4 font-medium ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {language === 'fr' ? 'Token' : 'Token'}
                        </th>
                        <th className={`text-right py-3 px-4 font-medium ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {language === 'fr' ? 'Valeur projetée' : 'Projected Value'}
                        </th>
                        <th className={`text-right py-3 px-4 font-medium ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {language === 'fr' ? 'Rendement' : 'Return'}
                        </th>
                        <th className={`text-right py-3 px-4 font-medium ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {language === 'fr' ? 'Tokens restants' : 'Remaining Tokens'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(simulations).map(([holdingId, simulation]) => {
                        const holding = allHoldings.find(h => h.id === holdingId);
                        if (!holding) return null;

                        return (
                          <tr key={holdingId} className={`border-b ${
                            isDarkMode ? 'border-gray-700' : 'border-gray-200'
                          }`}>
                            <td className={`py-4 px-4 font-medium ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {holding.token.symbol}
                            </td>
                            <td className={`text-right py-4 px-4 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {formatCurrency(simulation.projectedValue)}
                            </td>
                            <td className={`text-right py-4 px-4`}>
                              <span className={simulation.returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatPercentage(simulation.returnPercentage)}
                              </span>
                            </td>
                            <td className={`text-right py-4 px-4 ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {simulation.remainingTokens.toFixed(4)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Bouton de simulation finale */}
            {Object.keys(appliedStrategies).length > 0 && (
              <div className="mt-8 flex justify-end">
                <Button size="lg" className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5" />
                  {language === 'fr' ? 'Simuler les résultats' : 'Simulate Results'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
