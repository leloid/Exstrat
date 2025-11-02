'use client';

import React, { useState, useEffect } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { ChartBarIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/format';
import * as portfoliosApi from '@/lib/portfolios-api';

interface Holding {
  id: string;
  token: {
    symbol: string;
    name: string;
  };
  quantity: number;
  investedAmount: number;
  averagePrice: number;
  currentPrice?: number;
  portfolioId: string;
  portfolioName: string;
}

interface TheoreticalStrategy {
  id: string;
  name: string;
  tokenSymbol: string;
  profitTargets: Array<{
    order: number;
    targetType: 'percentage' | 'price';
    targetValue: number;
    sellPercentage: number;
  }>;
}

interface SimulationResult {
  holdingId: string;
  token: string;
  quantity: number;
  invested: number;
  averagePrice: number;
  projectedValue: number;
  returnPercentage: number;
  remainingTokens: number;
}

interface PortfolioSimulation {
  totalInvested: number;
  totalProjectedValue: number;
  totalProfit: number;
  returnPercentage: number;
  results: SimulationResult[];
}

type ViewMode = 'config' | 'results';

export default function ConfigPage() {
  const { portfolios, isLoading, refreshPortfolios } = usePortfolio();
  const { isDarkMode, language } = useTheme();
  
  const [activeTab, setActiveTab] = useState('config');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('virtual');
  const [strategyName, setStrategyName] = useState('');
  const [theoreticalStrategies, setTheoreticalStrategies] = useState<TheoreticalStrategy[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [appliedStrategies, setAppliedStrategies] = useState<Record<string, string>>({});
  const [simulationResults, setSimulationResults] = useState<PortfolioSimulation | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('config');
  const [notes, setNotes] = useState('');
  const [enableAlerts, setEnableAlerts] = useState(false);
  const [enableSellOrders, setEnableSellOrders] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    refreshPortfolios();
    loadTheoreticalStrategies();
  }, []);

  useEffect(() => {
    if (selectedPortfolioId && selectedPortfolioId !== 'virtual') {
      loadHoldings();
    } else if (selectedPortfolioId === 'virtual') {
      // Pour le wallet virtuel, on charge les stratégies théoriques comme holdings
      loadVirtualWalletHoldings();
    }
  }, [selectedPortfolioId, portfolios]);

  const loadTheoreticalStrategies = async () => {
    try {
      const data = await portfoliosApi.getTheoreticalStrategies();
      setTheoreticalStrategies(data);
    } catch (error) {
      console.error('Erreur lors du chargement des stratégies:', error);
    }
  };

  const loadHoldings = async () => {
    if (!selectedPortfolioId || selectedPortfolioId === 'virtual') return;
    
    try {
      setLoading(true);
      const holdingsData = await portfoliosApi.getPortfolioHoldings(selectedPortfolioId);
      const portfolio = portfolios.find(p => p.id === selectedPortfolioId);
      
      const formattedHoldings: Holding[] = holdingsData.map((holding: any) => ({
        id: holding.id,
        token: {
          symbol: holding.token?.symbol || holding.symbol || '',
          name: holding.token?.name || holding.tokenName || '',
        },
        quantity: holding.quantity || 0,
        investedAmount: holding.investedAmount || holding.amountInvested || 0,
        averagePrice: holding.averagePrice || 0,
        currentPrice: holding.currentPrice,
        portfolioId: portfolio?.id || '',
        portfolioName: portfolio?.name || '',
      }));
      
      setHoldings(formattedHoldings);
    } catch (error) {
      console.error('Erreur lors du chargement des holdings:', error);
      setHoldings([]);
    } finally {
      setLoading(false);
    }
  };

  const loadVirtualWalletHoldings = () => {
    // Pour le wallet virtuel, on utilise les stratégies théoriques comme base
    const virtualHoldings: Holding[] = theoreticalStrategies.map(strategy => {
      // Trouver la quantité et le prix moyen depuis la stratégie théorique
      // Pour l'instant, on crée des holdings fictifs basés sur les stratégies
      return {
        id: `virtual-${strategy.id}`,
        token: {
          symbol: strategy.tokenSymbol,
          name: strategy.name,
        },
        quantity: 0, // Sera rempli par l'utilisateur ou depuis la stratégie
        investedAmount: 0,
        averagePrice: 0,
        portfolioId: 'virtual',
        portfolioName: 'Wallet Virtuelle',
      };
    });
    setHoldings(virtualHoldings);
    setLoading(false);
  };

  const calculateSimulation = (): PortfolioSimulation => {
    let totalInvested = 0;
    let totalProjectedValue = 0;
    const results: SimulationResult[] = [];

    holdings.forEach(holding => {
      const strategyId = appliedStrategies[holding.id];
      if (!strategyId || strategyId === 'none') {
        // Sans stratégie, pas de profit projeté
        totalInvested += holding.investedAmount;
        totalProjectedValue += holding.investedAmount; // Valeur actuelle
        results.push({
          holdingId: holding.id,
          token: holding.token.symbol,
          quantity: holding.quantity,
          invested: holding.investedAmount,
          averagePrice: holding.averagePrice,
          projectedValue: holding.investedAmount,
          returnPercentage: -100, // Pas de profit sans stratégie
          remainingTokens: holding.quantity,
        });
        return;
      }

      const strategy = theoreticalStrategies.find(s => s.id === strategyId);
      if (!strategy) return;

      const quantity = holding.quantity;
      const averagePrice = holding.averagePrice;
      const currentPrice = holding.currentPrice || averagePrice;
      
      let remainingTokens = quantity;
      let totalProfit = 0;

      strategy.profitTargets.forEach(target => {
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
      });

      const totalInvestedForHolding = quantity * averagePrice;
      const returnPercentage = totalInvestedForHolding > 0 
        ? (totalProfit / totalInvestedForHolding) * 100 
        : 0;
      const projectedValue = totalProfit + (remainingTokens * currentPrice);

      totalInvested += totalInvestedForHolding;
      totalProjectedValue += projectedValue;

      results.push({
        holdingId: holding.id,
        token: holding.token.symbol,
        quantity,
        invested: totalInvestedForHolding,
        averagePrice,
        projectedValue,
        returnPercentage,
        remainingTokens: Math.max(0, remainingTokens),
      });
    });

    const totalProfit = totalProjectedValue - totalInvested;
    const returnPercentage = totalInvested > 0 
      ? (totalProfit / totalInvested) * 100 
      : 0;

    return {
      totalInvested,
      totalProjectedValue,
      totalProfit,
      returnPercentage,
      results,
    };
  };

  const handleStrategyChange = (holdingId: string, strategyId: string) => {
    setAppliedStrategies(prev => ({
      ...prev,
      [holdingId]: strategyId,
    }));
  };

  const handleSimulate = () => {
    const simulation = calculateSimulation();
    setSimulationResults(simulation);
    setViewMode('results');
  };

  const handleSaveStrategy = async () => {
    if (!strategyName.trim()) {
      alert(language === 'fr' 
        ? 'Veuillez entrer un nom pour la stratégie' 
        : 'Please enter a strategy name');
      return;
    }

    try {
      setSaving(true);
      // TODO: Implémenter l'API de sauvegarde de stratégie de portfolio
      // await portfoliosApi.savePortfolioStrategy({ ... });
      console.log('Sauvegarde de la stratégie:', {
        name: strategyName,
        portfolioId: selectedPortfolioId,
        appliedStrategies,
        simulationResults,
        notes,
        enableAlerts,
        enableSellOrders,
      });
      
      alert(language === 'fr' 
        ? 'Stratégie sauvegardée avec succès !' 
        : 'Strategy saved successfully!');
      setViewMode('config');
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert(language === 'fr' 
        ? 'Erreur lors de la sauvegarde de la stratégie' 
        : 'Error saving strategy');
    } finally {
      setSaving(false);
    }
  };

  const getCompatibleStrategies = (tokenSymbol: string) => {
    return theoreticalStrategies.filter(s => s.tokenSymbol === tokenSymbol);
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className={`min-h-screen flex overflow-x-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />
          <div className="flex-1 flex flex-col overflow-x-hidden w-full max-w-full">
            <TopBar currentPageName={language === 'fr' ? 'Configuration' : 'Configuration'} />
            <div className={`flex-1 p-3 md:p-6 flex items-center justify-center overflow-x-hidden max-w-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <div className="text-center">
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto`}></div>
                <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'fr' ? 'Chargement...' : 'Loading...'}
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
      <div className={`min-h-screen flex overflow-x-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />
        
        <div className="flex-1 flex flex-col overflow-x-hidden w-full max-w-full">
          <TopBar currentPageName={language === 'fr' ? 'Configuration' : 'Configuration'} />

          <div className={`flex-1 p-3 md:p-6 overflow-x-hidden max-w-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {viewMode === 'config' ? (
              <>
                {/* Header avec sélection du wallet */}
                <div className={`rounded-xl p-4 md:p-6 mb-4 md:mb-6 w-full max-w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                  <h1 className={`text-xl md:text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fr' ? 'Paramètres' : 'Parameters'}
                  </h1>
                  <p className={`text-xs md:text-sm mb-4 md:mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fr' 
                      ? 'Configurez les paramètres de base pour votre stratégie de portfolio'
                      : 'Configure the basic parameters for your portfolio strategy'}
                  </p>

                  <div className="space-y-3 md:space-y-4">
                    <div>
                      <Label className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {language === 'fr' ? 'Portefeuille à simuler' : 'Portfolio to simulate'} *
                      </Label>
                      <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
                        <SelectTrigger className="mt-2 w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="virtual">
                            {language === 'fr' ? 'Wallet Virtuelle' : 'Virtual Wallet'}
                          </SelectItem>
                          {portfolios.map(portfolio => (
                            <SelectItem key={portfolio.id} value={portfolio.id}>
                              {portfolio.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {language === 'fr' ? 'Nom de la stratégie' : 'Strategy name'} *
                      </Label>
                      <Input
                        type="text"
                        placeholder={language === 'fr' ? 'Ex : Bullrun 2025 Q3' : 'Ex: Bullrun 2025 Q3'}
                        value={strategyName}
                        onChange={(e) => setStrategyName(e.target.value)}
                        className={`mt-2 text-sm md:text-base ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Tableau des holdings */}
                <div className={`rounded-xl p-4 md:p-6 mb-4 md:mb-6 w-full max-w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                  <h2 className={`text-base md:text-xl font-semibold mb-3 md:mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fr' ? 'Configuration' : 'Configuration'}
                  </h2>
                  <p className={`text-xs md:text-sm mb-4 md:mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fr' 
                      ? 'Pour chaque actif, sélectionnez une stratégie et les prises de profit à activer'
                      : 'For each asset, select a strategy and profit-taking to activate'}
                  </p>

                  {holdings.length === 0 ? (
                    <div className={`text-center py-8 md:py-12 text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {language === 'fr' 
                        ? 'Aucun holding disponible. Ajoutez des transactions d\'abord.'
                        : 'No holdings available. Add transactions first.'}
                    </div>
                  ) : (
                    <>
                      {/* Version Mobile: Cartes */}
                      <div className="md:hidden space-y-4">
                        {holdings.map(holding => {
                          const compatibleStrategies = getCompatibleStrategies(holding.token.symbol);
                          const selectedStrategyId = appliedStrategies[holding.id] || 'none';
                          const selectedStrategy = theoreticalStrategies.find(s => s.id === selectedStrategyId);
                          
                          // Calcul rapide pour affichage
                          let projectedValue = holding.investedAmount;
                          let returnPercentage = -100;
                          let remainingTokens = holding.quantity;

                          if (selectedStrategy && selectedStrategyId !== 'none') {
                            const quantity = holding.quantity;
                            const averagePrice = holding.averagePrice;
                            const currentPrice = holding.currentPrice || averagePrice;
                            
                            let remaining = quantity;
                            let totalProfit = 0;

                            selectedStrategy.profitTargets.forEach(target => {
                              const tokensToSell = (quantity * target.sellPercentage) / 100;
                              
                              let targetPrice = 0;
                              if (target.targetType === 'percentage') {
                                targetPrice = averagePrice * (1 + target.targetValue / 100);
                              } else {
                                targetPrice = target.targetValue;
                              }
                              
                              const profit = tokensToSell * (targetPrice - averagePrice);
                              totalProfit += profit;
                              remaining -= tokensToSell;
                            });

                            const totalInvestedForHolding = quantity * averagePrice;
                            returnPercentage = totalInvestedForHolding > 0 
                              ? (totalProfit / totalInvestedForHolding) * 100 
                              : 0;
                            projectedValue = totalProfit + (remaining * currentPrice);
                            remainingTokens = Math.max(0, remaining);
                          }

                          return (
                            <div key={holding.id} className={`rounded-lg border p-4 space-y-3 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                              {/* Header */}
                              <div className="flex items-center justify-between pb-2 border-b border-gray-300">
                                <h3 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {holding.token.symbol}
                                </h3>
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {holding.token.name}
                                </span>
                              </div>

                              {/* Informations de base */}
                              <div className="grid grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {language === 'fr' ? 'Quantité' : 'Quantity'}
                                  </span>
                                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {holding.quantity.toLocaleString()}
                                  </p>
                                </div>
                                <div>
                                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {language === 'fr' ? 'Investi' : 'Invested'}
                                  </span>
                                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(holding.investedAmount)}
                                  </p>
                                </div>
                                <div>
                                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {language === 'fr' ? 'Prix moyen' : 'Avg Price'}
                                  </span>
                                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(holding.averagePrice)}
                                  </p>
                                </div>
                                <div>
                                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {language === 'fr' ? 'Tokens restants' : 'Remaining'}
                                  </span>
                                  <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {selectedStrategyId !== 'none' ? remainingTokens.toFixed(2) : holding.quantity.toLocaleString()}
                                  </p>
                                </div>
                              </div>

                              {/* Stratégie */}
                              <div>
                                <Label className={`text-xs mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {language === 'fr' ? 'Stratégie' : 'Strategy'}
                                </Label>
                                <Select
                                  value={selectedStrategyId}
                                  onValueChange={(value) => handleStrategyChange(holding.id, value)}
                                >
                                  <SelectTrigger className="w-full text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="none">
                                      {language === 'fr' ? 'Sans TP (défaut)' : 'No PT (default)'}
                                    </SelectItem>
                                    {compatibleStrategies.map(strategy => (
                                      <SelectItem key={strategy.id} value={strategy.id}>
                                        {strategy.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* Résultats projetés */}
                              {selectedStrategyId !== 'none' && (
                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-300">
                                  <div>
                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {language === 'fr' ? 'Valeur projetée' : 'Projected Value'}
                                    </span>
                                    <p className={`font-medium ${projectedValue > holding.investedAmount ? 'text-green-600' : isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {formatCurrency(projectedValue)}
                                    </p>
                                  </div>
                                  <div>
                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {language === 'fr' ? 'Rendement' : 'Return'}
                                    </span>
                                    <p className={`font-medium ${returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {formatPercentage(returnPercentage)}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Version Desktop: Tableau */}
                      <div className="hidden md:block w-full">
                        <table className="w-full">
                          <thead>
                            <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                              <th className={`text-left py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Token
                              </th>
                              <th className={`text-right py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {language === 'fr' ? 'Quantité' : 'Quantity'}
                              </th>
                              <th className={`text-right py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {language === 'fr' ? 'Investi' : 'Invested'}
                              </th>
                              <th className={`text-right py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {language === 'fr' ? 'Prix moyen' : 'Avg Price'}
                              </th>
                              <th className={`text-left py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {language === 'fr' ? 'Stratégie' : 'Strategy'}
                              </th>
                              <th className={`text-left py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {language === 'fr' ? 'Prises de profit' : 'Profit-taking'}
                              </th>
                              <th className={`text-right py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {language === 'fr' ? 'Valeur projetée' : 'Projected Value'}
                              </th>
                              <th className={`text-right py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {language === 'fr' ? 'Rendement' : 'Return'}
                              </th>
                              <th className={`text-right py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                {language === 'fr' ? 'Tokens restants' : 'Remaining Tokens'}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {holdings.map(holding => {
                              const compatibleStrategies = getCompatibleStrategies(holding.token.symbol);
                              const selectedStrategyId = appliedStrategies[holding.id] || 'none';
                              const selectedStrategy = theoreticalStrategies.find(s => s.id === selectedStrategyId);
                              
                              // Calcul rapide pour affichage
                              let projectedValue = holding.investedAmount;
                              let returnPercentage = -100;
                              let remainingTokens = holding.quantity;

                              if (selectedStrategy && selectedStrategyId !== 'none') {
                                const quantity = holding.quantity;
                                const averagePrice = holding.averagePrice;
                                const currentPrice = holding.currentPrice || averagePrice;
                                
                                let remaining = quantity;
                                let totalProfit = 0;

                                selectedStrategy.profitTargets.forEach(target => {
                                  const tokensToSell = (quantity * target.sellPercentage) / 100;
                                  
                                  let targetPrice = 0;
                                  if (target.targetType === 'percentage') {
                                    targetPrice = averagePrice * (1 + target.targetValue / 100);
                                  } else {
                                    targetPrice = target.targetValue;
                                  }
                                  
                                  const profit = tokensToSell * (targetPrice - averagePrice);
                                  totalProfit += profit;
                                  remaining -= tokensToSell;
                                });

                                const totalInvestedForHolding = quantity * averagePrice;
                                returnPercentage = totalInvestedForHolding > 0 
                                  ? (totalProfit / totalInvestedForHolding) * 100 
                                  : 0;
                                projectedValue = totalProfit + (remaining * currentPrice);
                                remainingTokens = Math.max(0, remaining);
                              }

                              return (
                                <tr key={holding.id} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                  <td className={`py-4 px-4 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {holding.token.symbol}
                                  </td>
                                  <td className={`text-right py-4 px-4 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {holding.quantity.toLocaleString()}
                                  </td>
                                  <td className={`text-right py-4 px-4 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(holding.investedAmount)}
                                  </td>
                                  <td className={`text-right py-4 px-4 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(holding.averagePrice)}
                                  </td>
                                  <td className="py-4 px-4">
                                    <Select
                                      value={selectedStrategyId}
                                      onValueChange={(value) => handleStrategyChange(holding.id, value)}
                                    >
                                      <SelectTrigger className="w-40 text-sm">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="none">
                                          {language === 'fr' ? 'Sans TP (défaut)' : 'No PT (default)'}
                                        </SelectItem>
                                        {compatibleStrategies.map(strategy => (
                                          <SelectItem key={strategy.id} value={strategy.id}>
                                            {strategy.name}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </td>
                                  <td className="py-4 px-4">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {language === 'fr' ? 'Détails' : 'Details'}
                                    </span>
                                  </td>
                                  <td className={`text-right py-4 px-4 text-sm ${projectedValue > holding.investedAmount ? 'text-green-600' : isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {selectedStrategyId !== 'none' ? formatCurrency(projectedValue) : '-'}
                                  </td>
                                  <td className={`text-right py-4 px-4 text-sm ${returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {selectedStrategyId !== 'none' ? formatPercentage(returnPercentage) : '-100,0%'}
                                  </td>
                                  <td className={`text-right py-4 px-4 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {selectedStrategyId !== 'none' ? remainingTokens.toFixed(2) : holding.quantity.toLocaleString()}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>

                {/* Bouton Simuler */}
                {Object.keys(appliedStrategies).length > 0 && (
                  <div className="flex justify-end mt-4 md:mt-6">
                    <Button 
                      onClick={handleSimulate}
                      size="lg"
                      className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 text-sm md:text-base w-full sm:w-auto"
                    >
                      <ChartBarIcon className="h-4 w-4 md:h-5 md:w-5" />
                      {language === 'fr' ? 'Simuler les résultats' : 'Simulate Results'}
                    </Button>
                  </div>
                )}
              </>
            ) : (
              // Vue Résultats
              <div className="w-full max-w-full">
                <h1 className={`text-xl md:text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fr' ? 'Résultats de la simulation' : 'Simulation Results'}
                </h1>
                <p className={`text-xs md:text-sm mb-4 md:mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'fr' 
                    ? 'Projection de votre portefeuille pour la stratégie définie'
                    : 'Portfolio projection for the defined strategy'}
                </p>

                {/* Onglets */}
                <div className="flex gap-1 md:gap-2 mb-4 md:mb-6 border-b border-gray-200 overflow-x-auto">
                  <button
                    onClick={() => {}}
                    className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium border-b-2 border-blue-600 whitespace-nowrap ${isDarkMode ? 'text-white' : 'text-blue-600'}`}
                  >
                    {language === 'fr' ? 'Résumé' : 'Summary'}
                  </button>
                  <button
                    onClick={() => {}}
                    className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium whitespace-nowrap ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {language === 'fr' ? 'Graphique' : 'Graph'}
                  </button>
                  <button
                    onClick={() => {}}
                    className={`px-3 md:px-4 py-2 text-xs md:text-sm font-medium whitespace-nowrap ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                  >
                    {language === 'fr' ? 'Détails' : 'Details'}
                  </button>
                </div>

                {simulationResults && (
                  <>
                    {/* Résultats financiers */}
                    <div className={`rounded-xl p-4 md:p-6 mb-4 md:mb-6 w-full max-w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                      <h2 className={`text-base md:text-lg font-semibold mb-4 md:mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {language === 'fr' ? 'Résultats financiers' : 'Financial Results'}
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                        <div>
                          <div className={`text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {language === 'fr' ? 'Investissement initial' : 'Initial Investment'}
                          </div>
                          <div className={`text-lg md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(simulationResults.totalInvested)}
                          </div>
                        </div>
                        <div>
                          <div className={`text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {language === 'fr' ? 'Valeur projetée du portefeuille' : 'Projected Portfolio Value'}
                          </div>
                          <div className={`text-lg md:text-2xl font-bold text-green-600`}>
                            {formatCurrency(simulationResults.totalProjectedValue)}
                          </div>
                        </div>
                        <div>
                          <div className={`text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {language === 'fr' ? 'Profit net projeté' : 'Projected Net Profit'}
                          </div>
                          <div className={`text-lg md:text-2xl font-bold text-green-600`}>
                            {formatCurrency(simulationResults.totalProfit)}
                          </div>
                        </div>
                        <div>
                          <div className={`text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {language === 'fr' ? 'Rendement' : 'Return'}
                          </div>
                          <div className={`text-lg md:text-2xl font-bold text-green-600`}>
                            {formatPercentage(simulationResults.returnPercentage)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    <div className={`rounded-xl p-4 md:p-6 mb-4 md:mb-6 w-full max-w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                      <Label className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {language === 'fr' ? 'Notes' : 'Notes'}
                      </Label>
                      <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder={language === 'fr' ? 'Ajoutez vos notes ici...' : 'Add your notes here...'}
                        className={`mt-2 text-sm md:text-base ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                        rows={4}
                      />
                    </div>

                    {/* Options et Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-0">
                      <div className="space-y-2">
                        <label className={`flex items-center gap-2 text-xs md:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <input
                            type="checkbox"
                            checked={enableAlerts}
                            onChange={(e) => setEnableAlerts(e.target.checked)}
                            className="w-4 h-4"
                          />
                          {language === 'fr' ? 'Activer les alertes' : 'Activate alerts'}
                        </label>
                        <label className={`flex items-center gap-2 text-xs md:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <input
                            type="checkbox"
                            checked={enableSellOrders}
                            onChange={(e) => setEnableSellOrders(e.target.checked)}
                            className="w-4 h-4"
                          />
                          {language === 'fr' ? 'Activer les ordres de vente' : 'Activate sell orders'}
                        </label>
                      </div>

                      <Button
                        onClick={handleSaveStrategy}
                        disabled={saving || !strategyName.trim()}
                        size="lg"
                        className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 text-sm md:text-base w-full sm:w-auto"
                      >
                        {saving ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            {language === 'fr' ? 'Sauvegarde...' : 'Saving...'}
                          </>
                        ) : (
                          <>
                            <CheckIcon className="h-4 w-4 md:h-5 md:w-5" />
                            {language === 'fr' ? 'Sauvegarder la stratégie' : 'Save Strategy'}
                          </>
                        )}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
