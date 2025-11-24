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
import { ChartBarIcon, ChevronDownIcon, ChevronUpIcon, PencilIcon, TrashIcon, DocumentDuplicateIcon, EyeIcon } from '@heroicons/react/24/outline';
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

interface TokenResult {
  holdingId: string;
  token: string;
  quantity: number;
  invested: number;
  averagePrice: number;
  amountCollected: number;
  returnPercentage: number;
  remainingTokens: number;
  remainingTokensValue: number;
  profitTargetsDetails: Array<{
    order: number;
    targetPrice: number;
    tokensSold: number;
    amountCollected: number;
  }>;
}

interface GlobalSummary {
  totalInvested: number;
  totalCollected: number;
  totalProfit: number;
  returnPercentage: number;
  remainingTokensValue: number;
}

interface SavedForecast {
  id: string;
  name: string;
  portfolioId: string;
  portfolioName: string;
  createdAt: string;
  tokenCount: number;
  totalInvested: number;
  totalCollected: number;
  totalProfit: number;
  returnPercentage: number;
  appliedStrategies: Record<string, string>;
}

type TabType = 'create' | 'list';

export default function PrevisionPage() {
  const { portfolios, isLoading, refreshPortfolios } = usePortfolio();
  const { isDarkMode, language } = useTheme();
  
  const [activeTab, setActiveTab] = useState('config');
  const [currentTab, setCurrentTab] = useState<TabType>('create');
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [forecastName, setForecastName] = useState('');
  const [theoreticalStrategies, setTheoreticalStrategies] = useState<TheoreticalStrategy[]>([]);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [appliedStrategies, setAppliedStrategies] = useState<Record<string, string>>({});
  const [expandedTokens, setExpandedTokens] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [savedForecasts, setSavedForecasts] = useState<SavedForecast[]>([]);
  const [expandedForecastId, setExpandedForecastId] = useState<string | null>(null);

  useEffect(() => {
    refreshPortfolios();
    loadTheoreticalStrategies();
    loadSavedForecasts();
  }, []);

  useEffect(() => {
    if (selectedPortfolioId && selectedPortfolioId !== 'virtual') {
      loadHoldings();
    } else {
      setHoldings([]);
      setAppliedStrategies({});
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

  const loadSavedForecasts = async () => {
    try {
      const forecasts = await portfoliosApi.getForecasts();
      setSavedForecasts(forecasts.map(f => ({
        id: f.id,
        name: f.name,
        portfolioId: f.portfolioId,
        portfolioName: f.portfolioName || '',
        createdAt: f.createdAt,
        tokenCount: f.summary?.tokenCount || 0,
        totalInvested: f.summary?.totalInvested || 0,
        totalCollected: f.summary?.totalCollected || 0,
        totalProfit: f.summary?.totalProfit || 0,
        returnPercentage: f.summary?.returnPercentage || 0,
        appliedStrategies: f.appliedStrategies,
      })));
    } catch (error) {
      console.error('Erreur lors du chargement des prévisions:', error);
      setSavedForecasts([]);
    }
  };

  const calculateTokenResult = (holding: Holding): TokenResult | null => {
      const strategyId = appliedStrategies[holding.id];
      if (!strategyId || strategyId === 'none') {
      return null;
      }

      const strategy = theoreticalStrategies.find(s => s.id === strategyId);
    if (!strategy) return null;

      const quantity = holding.quantity;
      const averagePrice = holding.averagePrice;
      const currentPrice = holding.currentPrice || averagePrice;
      
      let remainingTokens = quantity;
    let totalCollected = 0;
    const profitTargetsDetails: Array<{
      order: number;
      targetPrice: number;
      tokensSold: number;
      amountCollected: number;
    }> = [];

      strategy.profitTargets.forEach(target => {
      // Calculer les tokens à vendre (basé sur le total initial)
        const tokensToSell = (quantity * target.sellPercentage) / 100;
        
        let targetPrice = 0;
        if (target.targetType === 'percentage') {
          targetPrice = averagePrice * (1 + target.targetValue / 100);
        } else {
          targetPrice = target.targetValue;
        }
        
      const amountCollected = tokensToSell * targetPrice;
      totalCollected += amountCollected;
        remainingTokens -= tokensToSell;

      profitTargetsDetails.push({
        order: target.order,
        targetPrice,
        tokensSold: tokensToSell,
        amountCollected,
      });
    });

    const totalInvested = quantity * averagePrice;
    const totalProfit = totalCollected - totalInvested;
    const returnPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
    const remainingTokensValue = remainingTokens * currentPrice;

    return {
        holdingId: holding.id,
        token: holding.token.symbol,
        quantity,
      invested: totalInvested,
        averagePrice,
      amountCollected: totalCollected,
        returnPercentage,
        remainingTokens: Math.max(0, remainingTokens),
      remainingTokensValue,
      profitTargetsDetails,
    };
  };

  const calculateGlobalSummary = (): GlobalSummary => {
    let totalInvested = 0;
    let totalCollected = 0;
    let totalRemainingTokensValue = 0;

    holdings.forEach(holding => {
      const result = calculateTokenResult(holding);
      if (result) {
        totalInvested += result.invested;
        totalCollected += result.amountCollected;
        totalRemainingTokensValue += result.remainingTokensValue;
      } else {
        // Sans stratégie, on compte juste l'investissement
        totalInvested += holding.investedAmount;
        totalRemainingTokensValue += holding.investedAmount; // Valeur actuelle
      }
    });

    const totalProfit = totalCollected + totalRemainingTokensValue - totalInvested;
    const returnPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

    return {
      totalInvested,
      totalCollected,
      totalProfit,
      returnPercentage,
      remainingTokensValue: totalRemainingTokensValue,
    };
  };

  const handleStrategyChange = (holdingId: string, strategyId: string) => {
    setAppliedStrategies(prev => ({
      ...prev,
      [holdingId]: strategyId,
    }));
  };

  const toggleTokenExpansion = (holdingId: string) => {
    setExpandedTokens(prev => {
      const newSet = new Set(prev);
      if (newSet.has(holdingId)) {
        newSet.delete(holdingId);
      } else {
        newSet.add(holdingId);
      }
      return newSet;
    });
  };

  const getCompatibleStrategies = (tokenSymbol: string) => {
    return theoreticalStrategies.filter(s => s.tokenSymbol === tokenSymbol);
  };

  const handleSaveForecast = async () => {
    if (!forecastName.trim() || !selectedPortfolioId) {
      alert(language === 'fr' 
        ? 'Veuillez entrer un nom pour la prévision et sélectionner un wallet' 
        : 'Please enter a forecast name and select a wallet');
      return;
    }

    try {
      const summary = calculateGlobalSummary();
      const newForecast = await portfoliosApi.createForecast({
        portfolioId: selectedPortfolioId,
        name: forecastName,
        appliedStrategies,
        summary: {
          totalInvested: summary.totalInvested,
          totalCollected: summary.totalCollected,
          totalProfit: summary.totalProfit,
          returnPercentage: summary.returnPercentage,
          remainingTokensValue: summary.remainingTokensValue,
          tokenCount: holdings.length,
        },
      });
      
      // Recharger la liste des prévisions
      await loadSavedForecasts();
      
      alert(language === 'fr' 
        ? 'Prévision sauvegardée avec succès !' 
        : 'Forecast saved successfully!');
      
      // Réinitialiser le formulaire
      setForecastName('');
      setAppliedStrategies({});
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      alert(language === 'fr' 
        ? 'Erreur lors de la sauvegarde de la prévision' 
        : 'Error saving forecast');
    }
  };

  const globalSummary = calculateGlobalSummary();

  if (isLoading && currentTab === 'create') {
    return (
      <ProtectedRoute>
        <div className={`min-h-screen flex overflow-x-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />
          <div className="flex-1 flex flex-col overflow-x-hidden w-full max-w-full">
            <TopBar currentPageName={language === 'fr' ? 'Prévisions' : 'Forecasts'} />
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
          <TopBar currentPageName={language === 'fr' ? 'Prévisions' : 'Forecasts'} />

          <div className={`flex-1 p-3 md:p-6 overflow-x-hidden max-w-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Onglets */}
            <div className="flex gap-1 md:gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setCurrentTab('create')}
                className={`px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-medium border-b-2 transition-colors ${
                  currentTab === 'create'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                } ${isDarkMode ? (currentTab === 'create' ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300') : ''}`}
              >
                {language === 'fr' ? 'Créer une prévision' : 'Create a forecast'}
              </button>
              <button
                onClick={() => setCurrentTab('list')}
                className={`px-4 md:px-6 py-2 md:py-3 text-sm md:text-base font-medium border-b-2 transition-colors ${
                  currentTab === 'list'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                } ${isDarkMode ? (currentTab === 'list' ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300') : ''}`}
              >
                {language === 'fr' ? 'Mes prévisions' : 'My forecasts'}
              </button>
            </div>

            {currentTab === 'create' ? (
              <div className="space-y-6">
                {/* Zone A - Configuration de la prévision */}
                <div className={`rounded-xl p-4 md:p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                  <h2 className={`text-lg md:text-xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fr' ? 'Stratégie globale de portfolio' : 'Global Portfolio Strategy'}
                  </h2>
                  <p className={`text-xs md:text-sm mb-4 md:mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fr' 
                      ? 'Choisissez un portfolio et renseignez un nom pour votre nouvelle stratégie globale.'
                      : 'Choose a portfolio and enter a name for your new global strategy.'}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <Label className={`text-xs md:text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {language === 'fr' ? 'Portfolio' : 'Portfolio'} *
                      </Label>
                      <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={language === 'fr' ? 'Sélectionner un portfolio' : 'Select a portfolio'} />
                        </SelectTrigger>
                        <SelectContent>
                          {portfolios.map(portfolio => (
                            <SelectItem key={portfolio.id} value={portfolio.id}>
                              {portfolio.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className={`text-xs md:text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {language === 'fr' ? 'Nom de la prévision de mon Wallet' : 'My Wallet forecast name'} *
                      </Label>
                      <Input
                        type="text"
                        placeholder={language === 'fr' ? 'Ex: Stratégie Bullrun 2025' : 'Ex: Bullrun 2025 Strategy'}
                        value={forecastName}
                        onChange={(e) => setForecastName(e.target.value)}
                        className={`w-full ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                      />
                    </div>
                  </div>
                </div>

                {/* Zone A - Tableau de configuration */}
                {selectedPortfolioId && holdings.length > 0 && (
                  <div className={`rounded-xl p-4 md:p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                    <h3 className={`text-base md:text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fr' ? 'Configuration' : 'Configuration'}
                    </h3>
                  <p className={`text-xs md:text-sm mb-4 md:mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fr' 
                        ? 'Pour chaque token de votre portfolio, choisissez une stratégie de prise de profit.'
                        : 'For each token in your portfolio, choose a profit-taking strategy.'}
                    </p>

                    {/* Tableau Desktop */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <th className={`text-left py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Token</th>
                            <th className={`text-right py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {language === 'fr' ? 'Quantité' : 'Quantity'}
                            </th>
                            <th className={`text-right py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {language === 'fr' ? 'Investi' : 'Invested'}
                            </th>
                            <th className={`text-left py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {language === 'fr' ? 'Stratégie' : 'Strategy'}
                            </th>
                            <th className={`text-left py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {language === 'fr' ? 'Détails' : 'Details'}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {holdings.map(holding => {
                            const compatibleStrategies = getCompatibleStrategies(holding.token.symbol);
                            const selectedStrategyId = appliedStrategies[holding.id] || 'none';
                            const isExpanded = expandedTokens.has(holding.id);
                            const result = calculateTokenResult(holding);

                            return (
                              <React.Fragment key={holding.id}>
                                <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                  <td className={`py-4 px-4 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {holding.token.symbol}
                                  </td>
                                  <td className={`text-right py-4 px-4 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {holding.quantity.toLocaleString()}
                                  </td>
                                  <td className={`text-right py-4 px-4 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(holding.investedAmount)}
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
                                        {compatibleStrategies.length === 0 ? (
                                          <div className="px-3 py-2 text-xs text-gray-500">
                      {language === 'fr' 
                                              ? 'Aucune stratégie disponible. Créez-en une dans le module Stratégies.'
                                              : 'No strategy available. Create one in the Strategies module.'}
                    </div>
                  ) : (
                                          compatibleStrategies.map(strategy => (
                                            <SelectItem key={strategy.id} value={strategy.id}>
                                              {strategy.name}
                                            </SelectItem>
                                          ))
                                        )}
                                      </SelectContent>
                                    </Select>
                                  </td>
                                  <td className="py-4 px-4">
                                    {selectedStrategyId !== 'none' && result ? (
                                      <button
                                        onClick={() => toggleTokenExpansion(holding.id)}
                                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                                      >
                                        {isExpanded ? (
                                          <>
                                            {language === 'fr' ? 'Masquer' : 'Hide'}
                                            <ChevronUpIcon className="w-4 h-4" />
                                          </>
                                        ) : (
                                          <>
                                            {language === 'fr' ? 'Afficher' : 'Show'}
                                            <ChevronDownIcon className="w-4 h-4" />
                                          </>
                                        )}
                                      </button>
                                    ) : (
                                      <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {language === 'fr' ? '-' : '-'}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                                {/* Détails des prises de profit */}
                                {isExpanded && result && (
                                  <tr>
                                    <td colSpan={5} className="py-4 px-4">
                                      <div className={`rounded-lg p-4 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                                        <h4 className={`text-sm font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                          {language === 'fr' 
                                            ? `Prises de profits pour stratégie ${theoreticalStrategies.find(s => s.id === selectedStrategyId)?.name} sur ${holding.token.symbol}`
                                            : `Profit takings for strategy ${theoreticalStrategies.find(s => s.id === selectedStrategyId)?.name} on ${holding.token.symbol}`}
                                        </h4>
                                        <div className="space-y-2">
                                          {result.profitTargetsDetails.map((detail, idx) => (
                                            <div key={idx} className="flex items-center gap-2">
                                              <input
                                                type="checkbox"
                                                checked={true}
                                                readOnly
                                                className="w-4 h-4"
                                              />
                                              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {language === 'fr' 
                                                  ? `TP ${detail.order}: ${holding.token.symbol} = ${formatCurrency(detail.targetPrice)} Vendre ${((detail.tokensSold / holding.quantity) * 100).toFixed(1)}%`
                                                  : `TP ${detail.order}: ${holding.token.symbol} = ${formatCurrency(detail.targetPrice)} Sell ${((detail.tokensSold / holding.quantity) * 100).toFixed(1)}%`}
                                              </span>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </React.Fragment>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Version Mobile */}
                      <div className="md:hidden space-y-4">
                        {holdings.map(holding => {
                          const compatibleStrategies = getCompatibleStrategies(holding.token.symbol);
                          const selectedStrategyId = appliedStrategies[holding.id] || 'none';
                        const isExpanded = expandedTokens.has(holding.id);
                        const result = calculateTokenResult(holding);

                          return (
                          <div key={holding.id} className={`rounded-lg border p-4 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className={`text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {holding.token.symbol}
                                </h3>
                              </div>
                            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
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
                                </div>
                            <div className="mb-3">
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
                            {selectedStrategyId !== 'none' && result && (
                              <>
                                <button
                                  onClick={() => toggleTokenExpansion(holding.id)}
                                  className="w-full flex items-center justify-between text-sm text-blue-600 hover:text-blue-700 mb-2"
                                >
                                  <span>{language === 'fr' ? 'Détails' : 'Details'}</span>
                                  {isExpanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                                </button>
                                {isExpanded && (
                                  <div className={`rounded-lg p-3 mt-2 ${isDarkMode ? 'bg-gray-600' : 'bg-white'}`}>
                                    <h4 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {language === 'fr' 
                                        ? `Prises de profits pour stratégie ${theoreticalStrategies.find(s => s.id === selectedStrategyId)?.name}`
                                        : `Profit takings for strategy ${theoreticalStrategies.find(s => s.id === selectedStrategyId)?.name}`}
                                    </h4>
                                    <div className="space-y-2">
                                      {result.profitTargetsDetails.map((detail, idx) => (
                                        <div key={idx} className="flex items-center gap-2">
                                          <input type="checkbox" checked={true} readOnly className="w-4 h-4" />
                                          <span className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            {language === 'fr' 
                                              ? `TP ${detail.order}: ${formatCurrency(detail.targetPrice)} Vendre ${((detail.tokensSold / holding.quantity) * 100).toFixed(1)}%`
                                              : `TP ${detail.order}: ${formatCurrency(detail.targetPrice)} Sell ${((detail.tokensSold / holding.quantity) * 100).toFixed(1)}%`}
                                    </span>
                                  </div>
                                      ))}
                                  </div>
                                </div>
                                )}
                              </>
                              )}
                            </div>
                          );
                        })}
                      </div>
                  </div>
                )}

                {/* Zone B - Résultats par token */}
                {selectedPortfolioId && holdings.length > 0 && (
                  <div className={`rounded-xl p-4 md:p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                    <h3 className={`text-base md:text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fr' ? 'Résultats par token' : 'Results by token'}
                    </h3>
                    
                    {/* Tableau Desktop */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <th className={`text-left py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Token</th>
                              <th className={`text-right py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {language === 'fr' ? 'Montant encaissé' : 'Amount collected'}
                              </th>
                              <th className={`text-right py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {language === 'fr' ? 'Rendement net' : 'Net return'}
                              </th>
                              <th className={`text-right py-3 px-4 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              {language === 'fr' ? 'Token restants' : 'Remaining tokens'}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {holdings.map(holding => {
                            const result = calculateTokenResult(holding);
                            if (!result) return null;

                              return (
                                <tr key={holding.id} className={`border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                  <td className={`py-4 px-4 text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {holding.token.symbol}
                                  </td>
                                <td className={`text-right py-4 px-4 text-sm font-medium text-green-600`}>
                                  {formatCurrency(result.amountCollected)}
                                  </td>
                                <td className={`text-right py-4 px-4 text-sm font-medium ${result.returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatPercentage(result.returnPercentage)}
                                  </td>
                                  <td className={`text-right py-4 px-4 text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {result.remainingTokens.toFixed(8)} ({formatCurrency(result.remainingTokensValue)})
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                    {/* Version Mobile */}
                    <div className="md:hidden space-y-4">
                      {holdings.map(holding => {
                        const result = calculateTokenResult(holding);
                        if (!result) return null;

                        return (
                          <div key={holding.id} className={`rounded-lg border p-4 ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                            <h3 className={`text-base font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {holding.token.symbol}
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {language === 'fr' ? 'Montant encaissé' : 'Amount collected'}
                                </span>
                                <p className="font-medium text-green-600">
                                  {formatCurrency(result.amountCollected)}
                                </p>
                              </div>
                              <div>
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {language === 'fr' ? 'Rendement net' : 'Net return'}
                                </span>
                                <p className={`font-medium ${result.returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatPercentage(result.returnPercentage)}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {language === 'fr' ? 'Token restants' : 'Remaining tokens'}
                                </span>
                                <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {result.remainingTokens.toFixed(8)} ({formatCurrency(result.remainingTokensValue)})
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Zone C - Résumé global */}
                {selectedPortfolioId && holdings.length > 0 && Object.keys(appliedStrategies).some(id => appliedStrategies[id] !== 'none') && (
                  <div className={`rounded-xl p-4 md:p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                    <h3 className={`text-base md:text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fr' ? 'Résumé global du wallet' : 'Global wallet summary'}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
                      <div>
                        <div className={`text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {language === 'fr' ? 'Total investi' : 'Total invested'}
                        </div>
                        <div className={`text-lg md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency(globalSummary.totalInvested)}
                        </div>
                      </div>
                      <div>
                        <div className={`text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {language === 'fr' ? 'Total encaissé' : 'Total collected'}
                        </div>
                        <div className={`text-lg md:text-2xl font-bold text-green-600`}>
                          {formatCurrency(globalSummary.totalCollected)}
                        </div>
                      </div>
                      <div>
                        <div className={`text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {language === 'fr' ? 'Profit net' : 'Net profit'}
                        </div>
                        <div className={`text-lg md:text-2xl font-bold text-green-600`}>
                          {formatCurrency(globalSummary.totalProfit)}
                        </div>
                      </div>
                      <div>
                        <div className={`text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {language === 'fr' ? 'Rendement net' : 'Net return'}
                        </div>
                        <div className={`text-lg md:text-2xl font-bold text-green-600`}>
                          {formatPercentage(globalSummary.returnPercentage)}
                        </div>
                      </div>
                      <div>
                        <div className={`text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                          {language === 'fr' ? 'Valeur tokens restants' : 'Remaining tokens value'}
                        </div>
                        <div className={`text-lg md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency(globalSummary.remainingTokensValue)}
                        </div>
                      </div>
                </div>

                    {/* Bouton Sauvegarder */}
                    <div className="mt-6 flex justify-end">
                    <Button 
                        onClick={handleSaveForecast}
                        disabled={!forecastName.trim() || !selectedPortfolioId}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        {language === 'fr' ? 'Sauvegarder la prévision' : 'Save forecast'}
                    </Button>
                    </div>
                  </div>
                )}

                {/* Message si aucun holding */}
                {selectedPortfolioId && holdings.length === 0 && !loading && (
                  <div className={`rounded-xl p-8 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                    <p className={`text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fr' 
                        ? 'Aucun holding disponible. Ajoutez des transactions d\'abord.'
                        : 'No holdings available. Add transactions first.'}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* Onglet "Mes prévisions" */
              <div className="space-y-6">
                <div>
                  <h2 className={`text-xl md:text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fr' ? 'Mes prévisions' : 'My forecasts'}
                  </h2>
                  <p className={`text-xs md:text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'fr' 
                      ? 'Consultez et gérez vos stratégies globales de portfolio'
                      : 'Consult and manage your global portfolio strategies'}
                  </p>
                </div>

                {/* Sélection du portfolio */}
                <div className={`rounded-xl p-4 md:p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                  <Label className={`text-xs md:text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {language === 'fr' ? 'Portfolio' : 'Portfolio'}
                  </Label>
                  <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
                    <SelectTrigger className="w-full md:w-64">
                      <SelectValue placeholder={language === 'fr' ? 'Tous les portfolios' : 'All portfolios'} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">
                        {language === 'fr' ? 'Tous les portfolios' : 'All portfolios'}
                      </SelectItem>
                      {portfolios.map(portfolio => (
                        <SelectItem key={portfolio.id} value={portfolio.id}>
                          {portfolio.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Liste des prévisions */}
                {savedForecasts.length === 0 ? (
                  <div className={`rounded-xl p-8 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                    <p className={`text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fr' 
                        ? 'Créez votre première prévision pour ce wallet.'
                        : 'Create your first forecast for this wallet.'}
                    </p>
                    <Button
                      onClick={() => setCurrentTab('create')}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {language === 'fr' ? 'Créer une prévision' : 'Create a forecast'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedForecasts
                      .filter(forecast => !selectedPortfolioId || forecast.portfolioId === selectedPortfolioId)
                      .map(forecast => {
                        const isExpanded = expandedForecastId === forecast.id;
                        return (
                          <div key={forecast.id} className={`rounded-xl p-4 md:p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 ${isDarkMode ? 'bg-blue-900 text-blue-200' : ''}`}>
                                    {forecast.name}
                                  </span>
                                </div>
                                <p className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {language === 'fr' 
                                    ? `Créé le ${new Date(forecast.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} - ${forecast.tokenCount} actifs configurés`
                                    : `Created on ${new Date(forecast.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} - ${forecast.tokenCount} assets configured`}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                  <button
                                  onClick={() => setExpandedForecastId(isExpanded ? null : forecast.id)}
                                  className={`p-2 rounded-lg hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700' : ''}`}
                                  title={language === 'fr' ? 'Détails' : 'Details'}
                                >
                                  {isExpanded ? (
                                    <ChevronUpIcon className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                                  ) : (
                                    <ChevronDownIcon className={`w-5 h-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`} />
                                  )}
                  </button>
                  <button
                                  onClick={async () => {
                                    if (confirm(language === 'fr' 
                                      ? 'Êtes-vous sûr de vouloir supprimer cette prévision ?' 
                                      : 'Are you sure you want to delete this forecast?')) {
                                      try {
                                        await portfoliosApi.deleteForecast(forecast.id);
                                        await loadSavedForecasts();
                                      } catch (error) {
                                        console.error('Erreur lors de la suppression:', error);
                                        alert(language === 'fr' 
                                          ? 'Erreur lors de la suppression de la prévision' 
                                          : 'Error deleting forecast');
                                      }
                                    }
                                  }}
                                  className={`p-2 rounded-lg hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700' : ''}`}
                                  title={language === 'fr' ? 'Supprimer' : 'Delete'}
                  >
                                  <TrashIcon className={`w-5 h-5 text-red-600`} />
                  </button>
                              </div>
                </div>

                            {/* Métriques */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className={`text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {language === 'fr' ? 'Total investi' : 'Total invested'}
                          </div>
                                <div className={`text-base md:text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {formatCurrency(forecast.totalInvested)}
                          </div>
                        </div>
                        <div>
                          <div className={`text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {language === 'fr' ? 'Total encaissé' : 'Total collected'}
                          </div>
                                <div className={`text-base md:text-lg font-bold text-green-600`}>
                                  {formatCurrency(forecast.totalCollected)}
                          </div>
                        </div>
                        <div>
                          <div className={`text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {language === 'fr' ? 'Profit net' : 'Net profit'}
                          </div>
                                <div className={`text-base md:text-lg font-bold text-green-600`}>
                                  {formatCurrency(forecast.totalProfit)}
                          </div>
                        </div>
                        <div>
                          <div className={`text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                  {language === 'fr' ? 'Rendement net' : 'Net return'}
                          </div>
                                <div className={`text-base md:text-lg font-bold text-green-600`}>
                                  {formatPercentage(forecast.returnPercentage)}
                        </div>
                      </div>
                    </div>

                            {/* Détails dépliables */}
                            {isExpanded && (
                              <div className={`mt-4 pt-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                <button className={`text-sm text-blue-600 hover:text-blue-700 mb-3 ${isDarkMode ? 'text-blue-400' : ''}`}>
                                  {language === 'fr' 
                                    ? 'Détails des stratégies de prise de profit pour chaque token du portefeuille'
                                    : 'Details of profit-taking strategies for each token in the portfolio'}
                                </button>
                                {/* TODO: Afficher les détails par token */}
                    </div>
                            )}

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2 mt-4">
                      <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                <EyeIcon className="w-4 h-4" />
                                {language === 'fr' ? 'Voir' : 'View'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                <PencilIcon className="w-4 h-4" />
                                {language === 'fr' ? 'Modifier' : 'Edit'}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                              >
                                <DocumentDuplicateIcon className="w-4 h-4" />
                                {language === 'fr' ? 'Dupliquer' : 'Duplicate'}
                      </Button>
                    </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
