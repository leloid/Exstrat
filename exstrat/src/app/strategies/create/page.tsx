'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { 
  ArrowLeftIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/format';
import * as portfoliosApi from '@/lib/portfolios-api';
import { TokenSearch } from '@/components/transactions/TokenSearch';
import { TokenSearchResult } from '@/types/transactions';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { CreateTheoreticalStrategyDto, UpdateTheoreticalStrategyDto } from '@/types/strategies';
import { transactionsApi } from '@/lib/transactions-api';

// Interface pour les cibles de profit (identique à l'onboarding)
interface ProfitTarget {
  id: string;
  targetType: 'percentage' | 'price';
  targetValue: number;
  sellPercentage: number;
  sellQuantityType: 'percentage' | 'tokens';
  sellTokens: number;
}

export default function CreateStrategyPage() {
  const router = useRouter();
  const { isDarkMode, language } = useTheme();
  const { portfolios, refreshPortfolios } = usePortfolio();
  const [activeTab, setActiveTab] = useState('strategies');
  
  // États pour la stratégie (identique à l'onboarding)
  const [strategyStep, setStrategyStep] = useState<number>(1); // Étape actuelle (1-5)
  const [strategyName, setStrategyName] = useState<string>('');
  const [selectedStrategyToken, setSelectedStrategyToken] = useState<TokenSearchResult | null>(null);
  const [selectedStrategyPortfolioId, setSelectedStrategyPortfolioId] = useState<string>(''); // ID de portfolio (pas de wallet virtuel par défaut)
  const [availableStrategyQuantity, setAvailableStrategyQuantity] = useState<number>(0);
  const [strategyQuantity, setStrategyQuantity] = useState<string>('');
  const [strategyAveragePrice, setStrategyAveragePrice] = useState<string>('');
  const [numberOfTargets, setNumberOfTargets] = useState<number>(0);
  const [profitTargets, setProfitTargets] = useState<ProfitTarget[]>([]);
  const [investmentData, setInvestmentData] = useState<{
    numberOfTransactions: number;
    totalInvested: number;
    totalQuantity: number;
    averagePrice: number;
    currentPrice?: number;
    currentPNL?: number;
    currentPNLPercentage?: number;
  } | null>(null);
  const [availableTokens, setAvailableTokens] = useState<TokenSearchResult[]>([]);
  
  const isStrategyVirtualWallet = selectedStrategyPortfolioId === 'virtual';
  
  // États de chargement
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingStrategyId, setEditingStrategyId] = useState<string | null>(null);
  
  // Charger les portfolios au montage
  useEffect(() => {
    refreshPortfolios();
  }, [refreshPortfolios]);

  // Charger la stratégie à modifier si un ID est fourni
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const strategyId = urlParams.get('id');
    
    if (strategyId) {
      setIsEditMode(true);
      setEditingStrategyId(strategyId);
      loadStrategyForEdit(strategyId);
    }
  }, []);

  // Charger une stratégie existante pour l'édition
  const loadStrategyForEdit = async (strategyId: string) => {
    try {
      setLoading(true);
      const strategy = await portfoliosApi.getTheoreticalStrategyById(strategyId);
      
      // Pré-remplir le formulaire
      setStrategyName(strategy.name);
      setStrategyQuantity(strategy.quantity.toString());
      setStrategyAveragePrice(strategy.averagePrice.toString());
      setNumberOfTargets(strategy.numberOfTargets || strategy.profitTargets.length || 0);
      setStrategyStep(5); // Aller directement à l'étape 5 (nombre de sorties)
      
      // Pré-remplir le token
      setSelectedStrategyToken({
        id: 0,
        name: strategy.tokenName,
        symbol: strategy.tokenSymbol,
        slug: strategy.tokenSymbol.toLowerCase(),
        num_market_pairs: 0,
        date_added: '',
        tags: [],
        max_supply: 0,
        circulating_supply: 0,
        total_supply: 0,
        is_active: 1,
        infinite_supply: false,
        platform: null,
        cmc_rank: 0,
        is_fiat: 0,
        self_reported_circulating_supply: null,
        self_reported_market_cap: null,
        tvl_ratio: null,
        last_updated: '',
        quote: {
          USD: {
            price: null,
            volume_24h: null,
            volume_change_24h: null,
            percent_change_1h: null,
            percent_change_24h: null,
            percent_change_7d: null,
            percent_change_30d: null,
            percent_change_60d: null,
            percent_change_90d: null,
            market_cap: null,
            market_cap_dominance: null,
            fully_diluted_market_cap: null,
            tvl: null,
            last_updated: '',
          },
        },
      } as TokenSearchResult);
      
      // Pré-remplir les cibles de profit
      const targets: ProfitTarget[] = strategy.profitTargets.map((target, index: number) => ({
        id: `target-${index}`,
        targetType: target.targetType,
        targetValue: target.targetValue,
        sellPercentage: target.sellPercentage,
        sellQuantityType: 'percentage',
        sellTokens: 0,
      }));
      setProfitTargets(targets);
      
    } catch (error) {
      console.error('Erreur lors du chargement de la stratégie:', error);
      alert(language === 'fr' ? 'Erreur lors du chargement de la stratégie à modifier' : 'Error loading strategy to edit');
      router.push('/strategies');
    } finally {
      setLoading(false);
    }
  };

  // Initialiser les cibles de profit quand le nombre change
  useEffect(() => {
    if (numberOfTargets <= 0) {
      setProfitTargets([]);
      return;
    }
    const newTargets: ProfitTarget[] = [];
    for (let i = 0; i < numberOfTargets; i++) {
      newTargets.push({
        id: `target-${i}`,
        targetType: 'percentage',
        targetValue: (i + 1) * 50, // 50%, 100%, 150%, etc.
        sellPercentage: 100 / numberOfTargets, // Répartition égale
        sellQuantityType: 'percentage',
        sellTokens: 0,
      });
    }
    setProfitTargets(newTargets);
  }, [numberOfTargets]);

  // Charger la quantité disponible pour la stratégie quand le portfolio ou le token change
  useEffect(() => {
    const loadAvailableStrategyQuantity = async () => {
      if (isStrategyVirtualWallet || !selectedStrategyToken || !selectedStrategyPortfolioId || selectedStrategyPortfolioId === 'virtual') {
        setAvailableStrategyQuantity(0);
        return;
      }
      
      try {
        const holdings = await portfoliosApi.getPortfolioHoldings(selectedStrategyPortfolioId);
        const holding = holdings.find(h => 
          h.token.symbol.toUpperCase() === selectedStrategyToken.symbol.toUpperCase()
        );
        
        if (holding) {
          setAvailableStrategyQuantity(holding.quantity);
          if (holding.quantity > 0) {
            setStrategyQuantity(holding.quantity.toString());
          }
        } else {
          setAvailableStrategyQuantity(0);
          setStrategyQuantity('');
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la quantité disponible pour la stratégie:', error);
        setAvailableStrategyQuantity(0);
      }
    };
    
    loadAvailableStrategyQuantity();
  }, [selectedStrategyPortfolioId, selectedStrategyToken?.symbol, isStrategyVirtualWallet]);

  // Charger les tokens disponibles dans le wallet sélectionné
  useEffect(() => {
    const loadAvailableTokens = async () => {
      if (!selectedStrategyPortfolioId || selectedStrategyPortfolioId === 'virtual') {
        setAvailableTokens([]);
        return;
      }

      try {
        const portfolioHoldings = await portfoliosApi.getPortfolioHoldings(selectedStrategyPortfolioId);
        const tokens: TokenSearchResult[] = [];
        for (const holding of portfolioHoldings.filter(h => h.token && h.quantity > 0)) {
          try {
            const searchResults = await transactionsApi.searchTokens(holding.token?.symbol || '');
            const fullToken = searchResults.find(t => t.symbol.toUpperCase() === holding.token?.symbol?.toUpperCase());
            if (fullToken) {
              tokens.push(fullToken);
            }
          } catch (err) {
            console.error(`Erreur lors de la recherche du token ${holding.token?.symbol}:`, err);
          }
        }
        setAvailableTokens(tokens);
      } catch (error) {
        console.error('Erreur lors du chargement des tokens disponibles:', error);
        setAvailableTokens([]);
      }
    };
    
    loadAvailableTokens();
  }, [selectedStrategyPortfolioId]);

  // Calculer les données d'investissement
  useEffect(() => {
    const calculateInvestmentData = async () => {
      if (isStrategyVirtualWallet || !selectedStrategyToken || !selectedStrategyPortfolioId) {
        // Pour wallet virtuel, utiliser les valeurs saisies
        if (strategyQuantity && strategyAveragePrice) {
          const qty = parseFloat(strategyQuantity);
          const avgPrice = parseFloat(strategyAveragePrice);
          const currentPrice = selectedStrategyToken?.quote?.USD?.price || avgPrice;
          const currentValue = qty * currentPrice;
          const invested = qty * avgPrice;
          const pnl = currentValue - invested;
          const pnlPercentage = invested > 0 ? (pnl / invested) * 100 : 0;

          setInvestmentData({
            numberOfTransactions: 1,
            totalInvested: invested,
            totalQuantity: qty,
            averagePrice: avgPrice,
            currentPrice,
            currentPNL: pnl,
            currentPNLPercentage: pnlPercentage,
          });
        } else {
          setInvestmentData(null);
        }
        return;
      }

      try {
        const allTransactionsResponse = await transactionsApi.getTransactions();
        // TransactionSearchResponse a une propriété 'transactions' qui contient le tableau
        const transactionsArray = Array.isArray(allTransactionsResponse?.transactions) 
          ? allTransactionsResponse.transactions 
          : [];
        const portfolioTransactions = transactionsArray.filter(t => 
          t.portfolioId === selectedStrategyPortfolioId &&
          t.symbol?.toUpperCase() === selectedStrategyToken.symbol.toUpperCase()
        );

        const holdings = await portfoliosApi.getPortfolioHoldings(selectedStrategyPortfolioId);
        const holding = holdings.find(h => 
          h.token?.symbol?.toUpperCase() === selectedStrategyToken.symbol.toUpperCase()
        );

        const currentPrice = holding?.currentPrice || selectedStrategyToken.quote?.USD?.price;
        const totalInvested = portfolioTransactions.reduce((sum, t) => sum + (t.amountInvested || 0), 0);
        const totalQuantity = portfolioTransactions.reduce((sum, t) => sum + (t.quantity || 0), 0);
        const averagePrice = totalQuantity > 0 ? totalInvested / totalQuantity : 0;
        const currentValue = totalQuantity * (currentPrice || 0);
        const pnl = currentValue - totalInvested;
        const pnlPercentage = totalInvested > 0 ? (pnl / totalInvested) * 100 : 0;

        setInvestmentData({
          numberOfTransactions: portfolioTransactions.length,
          totalInvested,
          totalQuantity,
          averagePrice,
          currentPrice,
          currentPNL: pnl,
          currentPNLPercentage: pnlPercentage,
        });
      } catch (error) {
        console.error('Erreur lors du calcul des données d\'investissement:', error);
        setInvestmentData(null);
      }
    };

    calculateInvestmentData();
  }, [selectedStrategyPortfolioId, selectedStrategyToken, strategyQuantity, strategyAveragePrice, isStrategyVirtualWallet]);

  // Gérer les étapes
  const handleStrategyNextStep = () => {
    if (strategyStep < 5) {
      setStrategyStep(strategyStep + 1);
    }
  };

  const handleStrategyPreviousStep = () => {
    if (strategyStep > 1) {
      setStrategyStep(strategyStep - 1);
    }
  };

  // Auto-remplir le prix moyen avec le prix actuel du token
  const handleStrategyTokenSelect = (token: TokenSearchResult | null) => {
    setSelectedStrategyToken(token);
    if (token && token.quote?.USD?.price) {
      setStrategyAveragePrice(token.quote.USD.price.toFixed(2));
    }
  };

  // Gérer les modifications des cibles
  const handleTargetChange = (index: number, field: keyof ProfitTarget, value: any) => {
    const newTargets = [...profitTargets];
    newTargets[index] = { ...newTargets[index], [field]: value };
    
    if (field === 'sellPercentage') {
      const totalPercentage = newTargets.reduce((sum, target) => sum + target.sellPercentage, 0);
      if (totalPercentage > 100) {
        const otherTargetsTotal = newTargets.reduce((sum, target, idx) => 
          idx === index ? sum : sum + target.sellPercentage, 0
        );
        const maxValue = Math.max(0, 100 - otherTargetsTotal);
        newTargets[index] = { ...newTargets[index], sellPercentage: Math.min(value, maxValue) };
        setError(language === 'fr' 
          ? `La somme des quantités à vendre ne peut pas dépasser 100%. Maximum pour cette cible: ${maxValue.toFixed(1)}%`
          : `The sum of quantities to sell cannot exceed 100%. Maximum for this target: ${maxValue.toFixed(1)}%`);
      } else {
        setError('');
      }
    }
    
    setProfitTargets(newTargets);
  };

  // Fonction pour mettre à jour le pourcentage à partir du nombre de tokens
  const handleTokensChange = (index: number, tokensValue: number) => {
    const qty = parseFloat(strategyQuantity);
    if (isNaN(qty) || qty <= 0) {
      setError(language === 'fr' ? 'Veuillez d\'abord saisir une quantité de tokens' : 'Please enter a token quantity first');
      return;
    }
    
    const percentage = (tokensValue / qty) * 100;
    const otherTargetsTotal = profitTargets.reduce((sum, target, idx) => 
      idx === index ? sum : sum + target.sellPercentage, 0
    );
    const maxPercentage = Math.max(0, 100 - otherTargetsTotal);
    const finalPercentage = Math.min(percentage, maxPercentage);
    handleTargetChange(index, 'sellPercentage', finalPercentage);
    
    if (finalPercentage <= maxPercentage) {
      setError('');
    }
  };

  // Calculer les informations de stratégie pour chaque cible
  const calculateStrategyInfo = () => {
    const qty = parseFloat(strategyQuantity);
    const avgPrice = parseFloat(strategyAveragePrice);
    
    if (isNaN(qty) || isNaN(avgPrice) || qty <= 0 || avgPrice <= 0) {
      return [];
    }
    
    let remainingTokens = qty;
    const results: Array<{
      tokensSold: number;
      amountCollected: number;
      remainingTokens: number;
      remainingTokensValuation: number;
      remainingBagValue: number;
    }> = [];
    
    profitTargets.forEach((target) => {
      let targetPrice = 0;
      if (target.targetType === 'percentage') {
        targetPrice = avgPrice * (1 + target.targetValue / 100);
      } else {
        targetPrice = target.targetValue;
      }
      
      let tokensSold = 0;
      if (target.sellQuantityType === 'tokens' && target.sellTokens > 0) {
        tokensSold = Math.min(target.sellTokens, remainingTokens);
      } else {
        tokensSold = (qty * target.sellPercentage) / 100;
        tokensSold = Math.min(tokensSold, remainingTokens);
      }
      
      const amountCollected = tokensSold * targetPrice;
      remainingTokens = remainingTokens - tokensSold;
      const remainingTokensValuation = remainingTokens * targetPrice;
      const remainingBagValue = remainingTokens * avgPrice;
      
      results.push({
        tokensSold,
        amountCollected,
        remainingTokens,
        remainingTokensValuation,
        remainingBagValue,
      });
    });
    
    return results;
  };

  const strategyInfo = calculateStrategyInfo();

  // Sauvegarder la stratégie
  const handleCreateStrategy = async () => {
    // Validation
    if (!strategyName.trim()) {
      setError(language === 'fr' ? 'Veuillez entrer un nom pour la stratégie' : 'Please enter a strategy name');
      return;
    }
    if (!selectedStrategyToken) {
      setError(language === 'fr' ? 'Veuillez sélectionner un token' : 'Please select a token');
      return;
    }
    if (!strategyQuantity || parseFloat(strategyQuantity) <= 0) {
      setError(language === 'fr' ? 'Veuillez entrer une quantité valide' : 'Please enter a valid quantity');
      return;
    }
    if (!strategyAveragePrice || parseFloat(strategyAveragePrice) <= 0) {
      setError(language === 'fr' ? 'Veuillez entrer un prix moyen valide' : 'Please enter a valid average price');
      return;
    }
    
    // Validation de la quantité selon le type de wallet
    if (!isStrategyVirtualWallet && selectedStrategyPortfolioId) {
      const qty = parseFloat(strategyQuantity);
      if (qty > availableStrategyQuantity) {
        setError(
          language === 'fr' 
            ? `La quantité (${qty}) ne peut pas dépasser ce que vous possédez dans ce wallet (${availableStrategyQuantity})`
            : `Quantity (${qty}) cannot exceed what you own in this wallet (${availableStrategyQuantity})`
        );
        return;
      }
    }
    
    // Validation : la somme des quantités à vendre ne doit pas dépasser 100%
    const totalSellPercentage = profitTargets.reduce((sum, target) => sum + target.sellPercentage, 0);
    if (totalSellPercentage > 100) {
      setError(language === 'fr' 
        ? `La somme des quantités à vendre (${totalSellPercentage.toFixed(1)}%) ne peut pas dépasser 100%`
        : `The sum of quantities to sell (${totalSellPercentage.toFixed(1)}%) cannot exceed 100%`);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('💾 Création de la stratégie...');
      
      // Toujours créer une stratégie théorique (wallet virtuel)
      const strategyData: CreateTheoreticalStrategyDto = {
        name: strategyName,
        description: `${language === 'fr' ? 'Stratégie pour' : 'Strategy for'} ${selectedStrategyToken.symbol} - ${numberOfTargets} ${language === 'fr' ? 'cibles de profit' : 'profit targets'}`,
        tokenSymbol: selectedStrategyToken.symbol,
        tokenName: selectedStrategyToken.name,
        quantity: parseFloat(strategyQuantity),
        averagePrice: parseFloat(strategyAveragePrice),
        profitTargets: profitTargets.map((target, index) => ({
          order: index + 1,
          targetType: target.targetType,
          targetValue: target.targetValue,
          sellPercentage: target.sellPercentage,
        })),
        status: 'active' as const,
      };
      
      console.log('📤 Données de la stratégie théorique:', strategyData);
      
      if (isEditMode && editingStrategyId) {
        const updateData: UpdateTheoreticalStrategyDto = strategyData;
        const updatedStrategy = await portfoliosApi.updateTheoreticalStrategy(editingStrategyId, updateData);
        console.log('✅ Stratégie théorique modifiée:', updatedStrategy);
        alert(language === 'fr' ? 'Stratégie modifiée avec succès !' : 'Strategy updated successfully!');
      } else {
        const createdStrategy = await portfoliosApi.createTheoreticalStrategy(strategyData);
        console.log('✅ Stratégie théorique créée:', createdStrategy);
        alert(language === 'fr' ? 'Stratégie créée avec succès !' : 'Strategy created successfully!');
      }
      
      // Rediriger vers la liste des stratégies
      router.push('/strategies');
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      setError(error.response?.data?.message || error.message);
      alert(`Error: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ProtectedRoute>
      <div className={`min-h-screen flex overflow-x-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />
        
        <div className="flex-1 flex flex-col overflow-x-hidden w-full max-w-full">
          <TopBar 
            currentPageName={isEditMode 
              ? (language === 'fr' ? 'Modifier la Stratégie' : 'Edit Strategy') 
              : (language === 'fr' ? 'Créer une Stratégie' : 'Create Strategy')
            } 
          />

          <div className={`flex-1 p-3 md:p-6 overflow-x-hidden max-w-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto w-full">
              {/* Header */}
              <div className="mb-4 md:mb-8">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3 md:mb-4">
                  <div>
                    <h1 className={`text-xl md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fr' ? 'Créez votre première stratégie' : 'Create your first strategy'}
                    </h1>
                    <p className={`text-sm md:text-base mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fr' ? 'Définissez des cibles de profit théoriques pour optimiser vos gains' : 'Define theoretical profit targets to optimize your gains'}
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/strategies')} 
                    className="flex items-center gap-2 px-3 md:px-4 py-2 text-sm md:text-base w-full sm:w-auto"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    {language === 'fr' ? 'Retour' : 'Back'}
                  </Button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className={`mb-4 p-3 rounded-lg ${isDarkMode ? 'bg-red-900/20 border border-red-700/30' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
                </div>
              )}

              <div className="space-y-4 md:space-y-6">
                {/* Structure en deux colonnes */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                  {/* Colonne gauche : Zone A - Inputs */}
                  <div className="space-y-4 md:space-y-6">
                    <Card className={`border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                      <CardContent className="p-4 md:p-6 space-y-4">
                        <h4 className={`text-sm md:text-base font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {language === 'fr' ? 'Paramétrage de la stratégie' : 'Strategy Settings'}
                        </h4>
                        
                        {/* Étape 1 : Portfolio */}
                        {strategyStep >= 1 && (
                          <div className={strategyStep === 1 ? 'ring-2 ring-blue-200 rounded-lg p-2 -m-2' : ''}>
                            <Label htmlFor="portfolio" className={`text-xs md:text-sm flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              1. {language === 'fr' ? 'Choisissez votre wallet' : 'Choose your wallet'}
                              {strategyStep > 1 && (
                                <span className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                  ✓ {language === 'fr' ? 'Complété' : 'Completed'}
                                </span>
                              )}
                            </Label>
                            <Select
                              value={selectedStrategyPortfolioId}
                              onValueChange={(value) => {
                                setSelectedStrategyPortfolioId(value);
                                setSelectedStrategyToken(null);
                                setStrategyQuantity('');
                                setStrategyName('');
                                setNumberOfTargets(0);
                                setProfitTargets([]);
                                if (value !== 'virtual' && value) {
                                  setStrategyStep(2);
                                }
                              }}
                            >
                              <SelectTrigger className={`text-sm md:text-base ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
                                <SelectValue placeholder={language === 'fr' ? 'Sélectionner un wallet' : 'Select a wallet'} />
                              </SelectTrigger>
                              <SelectContent>
                                {portfolios.filter(p => p && p.id && p.name).map((portfolio) => (
                                  <SelectItem key={portfolio.id} value={portfolio.id}>
                                    {portfolio.name}
                                  </SelectItem>
                                ))}
                                <div className={`px-3 py-2 text-xs font-semibold ${isDarkMode ? 'text-gray-500 border-t border-gray-700' : 'text-gray-500 border-t border-gray-200'}`}>
                                  {language === 'fr' ? 'Simulation' : 'Simulation'}
                                </div>
                                <div className={`px-3 py-2 text-sm ${isDarkMode ? 'text-gray-500 cursor-not-allowed opacity-50' : 'text-gray-400 cursor-not-allowed opacity-50'}`}>
                                  {language === 'fr' ? 'Wallet Virtuelle' : 'Virtual Wallet'}
                                </div>
                              </SelectContent>
                            </Select>
                            {selectedStrategyPortfolioId && strategyStep === 1 && (
                              <div className="mt-4 flex gap-2">
                                <Button
                                  type="button"
                                  onClick={handleStrategyNextStep}
                                  className="flex-1"
                                >
                                  {language === 'fr' ? 'Suivant' : 'Next'}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Étape 2 : Token */}
                        {strategyStep >= 2 && selectedStrategyPortfolioId && (
                          <div className={strategyStep === 2 ? 'ring-2 ring-blue-200 rounded-lg p-2 -m-2' : ''}>
                            <Label htmlFor="token" className={`text-xs md:text-sm flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              2. {language === 'fr' ? 'Choisissez un token' : 'Choose a token'}
                              {strategyStep > 2 && (
                                <span className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                  ✓ {language === 'fr' ? 'Complété' : 'Completed'}
                                </span>
                              )}
                            </Label>
                            {availableTokens.length > 0 && !isStrategyVirtualWallet ? (
                              <Select
                                value={selectedStrategyToken?.symbol || ''}
                                onValueChange={(value) => {
                                  const token = availableTokens.find(t => t.symbol === value);
                                  handleStrategyTokenSelect(token || null);
                                }}
                              >
                                <SelectTrigger className={`text-sm md:text-base ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
                                  <SelectValue placeholder={language === 'fr' ? 'Sélectionner un token' : 'Select a token'} />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableTokens.map((token) => (
                                    <SelectItem key={token.symbol} value={token.symbol}>
                                      {token.symbol} - {token.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            ) : (
                              <TokenSearch
                                onTokenSelect={handleStrategyTokenSelect}
                                selectedToken={selectedStrategyToken}
                              />
                            )}
                            {selectedStrategyToken && strategyStep === 2 && (
                              <div className="mt-4 flex gap-2">
                                <Button
                                  type="button"
                                  onClick={handleStrategyPreviousStep}
                                  variant="outline"
                                  className="flex-1"
                                >
                                  {language === 'fr' ? 'Précédent' : 'Previous'}
                                </Button>
                                <Button
                                  type="button"
                                  onClick={handleStrategyNextStep}
                                  className="flex-1"
                                >
                                  {language === 'fr' ? 'Suivant' : 'Next'}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Étape 3 : Quantité */}
                        {strategyStep >= 3 && selectedStrategyToken && (
                          <div className={strategyStep === 3 ? 'ring-2 ring-blue-200 rounded-lg p-2 -m-2' : ''}>
                            <Label htmlFor="quantity" className={`text-xs md:text-sm flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              3. {language === 'fr' ? 'Quantité à appliquer à la stratégie' : 'Quantity to apply to strategy'}
                              {strategyStep > 3 && (
                                <span className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                  ✓ {language === 'fr' ? 'Complété' : 'Completed'}
                                </span>
                              )}
                            </Label>
                            <Input
                              id="quantity"
                              type="number"
                              value={strategyQuantity}
                              onChange={(e) => {
                                const value = e.target.value;
                                if (!isStrategyVirtualWallet && availableStrategyQuantity > 0 && value) {
                                  const numValue = parseFloat(value);
                                  if (numValue > availableStrategyQuantity) {
                                    setError(
                                      language === 'fr'
                                        ? `La quantité ne peut pas dépasser ${availableStrategyQuantity.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${selectedStrategyToken?.symbol || ''}`
                                        : `Quantity cannot exceed ${availableStrategyQuantity.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${selectedStrategyToken?.symbol || ''}`
                                    );
                                    return;
                                  }
                                  setError('');
                                }
                                setStrategyQuantity(value);
                              }}
                              placeholder="Ex: 1.5"
                              step="0.00000001"
                              max={!isStrategyVirtualWallet && availableStrategyQuantity > 0 ? availableStrategyQuantity : undefined}
                              required
                              className={`text-sm md:text-base ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                            />
                            {!isStrategyVirtualWallet && availableStrategyQuantity > 0 && (
                              <p className={`mt-1 text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                {language === 'fr' ? 'Maximum disponible:' : 'Maximum available:'} {availableStrategyQuantity.toLocaleString(undefined, { maximumFractionDigits: 8 })} {selectedStrategyToken?.symbol || ''}
                              </p>
                            )}
                            {!isStrategyVirtualWallet && parseFloat(strategyQuantity) > availableStrategyQuantity && (
                              <p className={`mt-1 text-xs md:text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                                {language === 'fr' 
                                  ? `Quantité supérieure à celle disponible (${availableStrategyQuantity.toLocaleString(undefined, { maximumFractionDigits: 8 })})`
                                  : `Quantity exceeds available (${availableStrategyQuantity.toLocaleString(undefined, { maximumFractionDigits: 8 })})`
                                }
                              </p>
                            )}
                            {strategyQuantity && strategyStep === 3 && (
                              <div className="mt-4 flex gap-2">
                                <Button
                                  type="button"
                                  onClick={handleStrategyPreviousStep}
                                  variant="outline"
                                  className="flex-1"
                                >
                                  {language === 'fr' ? 'Précédent' : 'Previous'}
                                </Button>
                                <Button
                                  type="button"
                                  onClick={handleStrategyNextStep}
                                  className="flex-1"
                                >
                                  {language === 'fr' ? 'Suivant' : 'Next'}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {/* Étape 4 : Nom de la stratégie */}
                        {strategyStep >= 4 && strategyQuantity && (
                          <div className={strategyStep === 4 ? 'ring-2 ring-blue-200 rounded-lg p-2 -m-2' : ''}>
                            <Label htmlFor="strategyName" className={`text-xs md:text-sm flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              4. {language === 'fr' ? 'Nom de la stratégie' : 'Strategy name'}
                              {strategyStep > 4 && (
                                <span className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                  ✓ {language === 'fr' ? 'Complété' : 'Completed'}
                                </span>
                              )}
                            </Label>
                            <Input
                              id="strategyName"
                              type="text"
                              value={strategyName}
                              onChange={(e) => setStrategyName(e.target.value)}
                              placeholder={language === 'fr' ? 'Nom de la stratégie' : 'Strategy name'}
                              className={`text-sm md:text-base ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                            />
                            {strategyName && strategyStep === 4 && (
                              <div className="mt-4 flex gap-2">
                                <Button
                                  type="button"
                                  onClick={handleStrategyPreviousStep}
                                  variant="outline"
                                  className="flex-1"
                                >
                                  {language === 'fr' ? 'Précédent' : 'Previous'}
                                </Button>
                                <Button
                                  type="button"
                                  onClick={handleStrategyNextStep}
                                  className="flex-1"
                                >
                                  {language === 'fr' ? 'Suivant' : 'Next'}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Étape 5 : Nombre de sorties */}
                        {strategyStep >= 5 && strategyName && (
                          <div className={strategyStep === 5 ? 'ring-2 ring-blue-200 rounded-lg p-2 -m-2' : ''}>
                            <Label htmlFor="numberOfTargets" className={`text-xs md:text-sm flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                              5. {language === 'fr' ? 'Nombre de sorties' : 'Number of exits'}
                              {strategyStep > 5 && (
                                <span className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                  ✓ {language === 'fr' ? 'Complété' : 'Completed'}
                                </span>
                              )}
                            </Label>
                            <Select
                              value={numberOfTargets > 0 ? numberOfTargets.toString() : ''}
                              onValueChange={(value) => {
                                if (value === '') {
                                  setNumberOfTargets(0);
                                  return;
                                }
                                const val = parseInt(value);
                                if (!isNaN(val) && val >= 1 && val <= 6) {
                                  setNumberOfTargets(val);
                                }
                              }}
                            >
                              <SelectTrigger className={`text-sm md:text-base ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
                                <SelectValue placeholder={language === 'fr' ? 'Sélectionner' : 'Select'} />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 {language === 'fr' ? 'sortie' : 'exit'}</SelectItem>
                                <SelectItem value="2">2 {language === 'fr' ? 'sorties' : 'exits'}</SelectItem>
                                <SelectItem value="3">3 {language === 'fr' ? 'sorties' : 'exits'}</SelectItem>
                                <SelectItem value="4">4 {language === 'fr' ? 'sorties' : 'exits'}</SelectItem>
                                <SelectItem value="5">5 {language === 'fr' ? 'sorties' : 'exits'}</SelectItem>
                                <SelectItem value="6">6 {language === 'fr' ? 'sorties' : 'exits'}</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Colonne droite : Zone B - Données d'investissement */}
                  <div className="space-y-4 md:space-y-6">
                    <h4 className={`text-sm md:text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fr' ? 'Vos données d\'investissement' : 'Your Investment Data'}
                    </h4>
                    
                    <Card className={`border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                      <CardContent className="p-4 md:p-6 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {language === 'fr' ? 'Nombre de saisies' : 'Number of entries'}
                          </span>
                          <span className={`text-sm md:text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {investmentData?.numberOfTransactions || (strategyQuantity && strategyAveragePrice ? 1 : 0)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {language === 'fr' ? 'Total investi' : 'Total invested'}
                          </span>
                          <span className={`text-sm md:text-base font-semibold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                            {investmentData 
                              ? formatCurrency(investmentData.totalInvested, '$', 2)
                              : (strategyQuantity && strategyAveragePrice 
                                ? formatCurrency(parseFloat(strategyQuantity) * parseFloat(strategyAveragePrice), '$', 2)
                                : '$0.00')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {language === 'fr' ? 'Tokens détenus' : 'Tokens held'}
                          </span>
                          <span className={`text-sm md:text-base font-semibold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                            {investmentData?.totalQuantity || (strategyQuantity ? parseFloat(strategyQuantity).toLocaleString(undefined, { maximumFractionDigits: 8 }) : '0')}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {language === 'fr' ? 'Prix moyen d\'achat' : 'Average purchase price'}
                          </span>
                          <span className={`text-sm md:text-base font-semibold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                            {investmentData?.averagePrice 
                              ? formatCurrency(investmentData.averagePrice, '$', 2)
                              : (strategyAveragePrice 
                                ? formatCurrency(parseFloat(strategyAveragePrice), '$', 2)
                                : '$0.00')}
                          </span>
                        </div>
                        {investmentData?.currentPNL !== undefined && (
                          <>
                            <div className={`flex justify-between items-center pt-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                              <span className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {language === 'fr' ? 'PNL actuel' : 'Current PNL'}
                              </span>
                              <span className={`text-sm md:text-base font-semibold ${investmentData.currentPNL >= 0 ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>
                                {formatCurrency(investmentData.currentPNL, '$', 2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {language === 'fr' ? 'PNL %' : 'PNL %'}
                              </span>
                              <span className={`text-sm md:text-base font-semibold ${(investmentData.currentPNLPercentage ?? 0) >= 0 ? (isDarkMode ? 'text-green-400' : 'text-green-600') : (isDarkMode ? 'text-red-400' : 'text-red-600')}`}>
                                {(investmentData.currentPNLPercentage ?? 0) >= 0 ? '+' : ''}{(investmentData.currentPNLPercentage ?? 0).toFixed(2)}%
                              </span>
                            </div>
                          </>
                        )}
                        {selectedStrategyToken?.quote?.USD?.price && (
                          <div className={`flex justify-between items-center pt-2 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <span className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {language === 'fr' ? 'Prix actuel' : 'Current price'}
                            </span>
                            <span className={`text-sm md:text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {formatCurrency(selectedStrategyToken.quote.USD.price, '$', 2)}
                            </span>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* En-têtes des colonnes pour les paliers - affichés seulement si des sorties sont définies */}
                {numberOfTargets > 0 && profitTargets.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 mb-4 md:mb-6 mt-6">
                      <div>
                        <h4 className={`text-sm md:text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {language === 'fr' ? 'Configuration des paliers' : 'Target Configuration'}
                        </h4>
                      </div>
                      <div>
                        <h4 className={`text-sm md:text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {language === 'fr' ? 'Projections' : 'Projections'}
                        </h4>
                      </div>
                    </div>

                    {/* Cartes alignées par paire : Cible #1 avec Cible #1, etc. */}
                    <div className="space-y-4 md:space-y-6">
                      {profitTargets.slice(0, numberOfTargets).map((target, index) => {
                        const info = strategyInfo[index];
                        const qty = parseFloat(strategyQuantity);
                        const avgPrice = parseFloat(strategyAveragePrice);
                        
                        // Calculer le prix cible
                        let targetPrice = 0;
                        if (target.targetType === 'percentage') {
                          targetPrice = avgPrice * (1 + target.targetValue / 100);
                        } else {
                          targetPrice = target.targetValue;
                        }
                        
                        return (
                          <div key={target.id} className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8 items-stretch">
                            {/* Carte de gauche : Paramètres */}
                            <div className={`border p-4 md:p-6 rounded-lg space-y-4 md:space-y-5 h-full flex flex-col ${
                              isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'
                            }`}>
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                  <div className={`w-8 h-8 rounded-full text-white flex items-center justify-center text-sm font-semibold ${
                                    isDarkMode ? 'bg-blue-500' : 'bg-blue-600'
                                  }`}>
                                    {index + 1}
                                  </div>
                                  <h3 className={`text-sm md:text-base font-semibold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                    {language === 'fr' ? 'Cible de sortie' : 'Exit Target'}
                                  </h3>
                                </div>
                                {/* Toggle Switch */}
                                <div className="relative inline-flex items-center">
                                  <button
                                    type="button"
                                    onClick={() => handleTargetChange(index, 'targetType', target.targetType === 'percentage' ? 'price' : 'percentage')}
                                    className={`
                                      relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                      ${target.targetType === 'price' ? 'bg-blue-600' : (isDarkMode ? 'bg-gray-600' : 'bg-gray-300')}
                                    `}
                                  >
                                    <span
                                      className={`
                                        inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                        ${target.targetType === 'price' ? 'translate-x-6' : 'translate-x-1'}
                                      `}
                                    />
                                  </button>
                                </div>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                <div>
                                  <Label htmlFor={`targetValue-${index}`} className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {target.targetType === 'percentage' 
                                      ? (language === 'fr' ? 'Pourcentage (%)' : 'Percentage (%)')
                                      : (language === 'fr' ? 'Prix (USD)' : 'Price (USD)')
                                    }
                                  </Label>
                                  {target.targetType === 'percentage' ? (
                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newValue = Math.max(0, target.targetValue - 10);
                                          handleTargetChange(index, 'targetValue', newValue);
                                        }}
                                        className={`flex-shrink-0 w-10 h-10 flex items-center justify-center border rounded-lg transition-colors ${
                                          isDarkMode 
                                            ? 'border-gray-600 bg-gray-700 hover:bg-gray-600 text-white' 
                                            : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-600'
                                        }`}
                                      >
                                        <span className="text-lg font-semibold">−</span>
                                      </button>
                                      <Input
                                        id={`targetValue-${index}`}
                                        type="number"
                                        value={target.targetValue}
                                        onChange={(e) => 
                                          handleTargetChange(index, 'targetValue', parseFloat(e.target.value) || 0)
                                        }
                                        step="0.01"
                                        className={`text-sm md:text-base flex-1 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const newValue = target.targetValue + 10;
                                          handleTargetChange(index, 'targetValue', newValue);
                                        }}
                                        className={`flex-shrink-0 w-10 h-10 flex items-center justify-center border rounded-lg transition-colors ${
                                          isDarkMode 
                                            ? 'border-gray-600 bg-gray-700 hover:bg-gray-600 text-white' 
                                            : 'border-gray-300 bg-white hover:bg-gray-50 text-gray-600'
                                        }`}
                                      >
                                        <span className="text-lg font-semibold">+</span>
                                      </button>
                                    </div>
                                  ) : (
                                    <Input
                                      id={`targetValue-${index}`}
                                      type="number"
                                      value={target.targetValue}
                                      onChange={(e) => 
                                        handleTargetChange(index, 'targetValue', parseFloat(e.target.value))
                                      }
                                      step="0.01"
                                      className={`text-sm md:text-base ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                                    />
                                  )}
                                  {target.targetType === 'percentage' && !isNaN(avgPrice) && avgPrice > 0 && (
                                    <div className="mt-2">
                                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} mb-1`}>
                                        {language === 'fr' ? 'Pourcentage du prix moyen d\'achat' : 'Percentage of average purchase price'}
                                      </p>
                                      <div className="flex items-center gap-3">
                                        <p className={`text-sm md:text-base font-semibold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'} underline`}>
                                          {target.targetValue > 0 ? `${100 + target.targetValue}%` : '100%'}
                                        </p>
                                        <p className={`text-sm md:text-base font-semibold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                                          {formatCurrency(targetPrice, '$', 6)}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                  {target.targetType === 'price' && (
                                    <div className="mt-2">
                                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {language === 'fr' ? 'Valeur exacte du token' : 'Exact token value'}
                                      </p>
                                    </div>
                                  )}
                                  {info && (
                                    <div className={`mt-3 pt-3 border-t ${isDarkMode ? 'border-gray-600' : 'border-gray-200'}`}>
                                      <div className="flex justify-between items-center">
                                        <span className={`text-xs md:text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                          {language === 'fr' ? 'Nombre de tokens restants:' : 'Number of remaining tokens:'}
                                        </span>
                                        <span className={`text-sm md:text-base font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                                          {info.remainingTokens.toFixed(8)}
                                        </span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Quantité à vendre - Pourcentage et Tokens */}
                              <div className="flex-grow flex flex-col justify-end">
                                <Label htmlFor={`sellPercentage-${index}`} className={`text-xs md:text-sm mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {language === 'fr' ? 'Quantité à vendre' : 'Quantity to sell'}
                                </Label>
                                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                                  <div className="flex-1 relative">
                                    {/* Barre de fond grise */}
                                    <div className="absolute inset-0 flex items-center">
                                      <div className={`w-full h-2 rounded-lg ${isDarkMode ? 'bg-gray-600' : 'bg-gray-200'}`} />
                                    </div>
                                    
                                    {/* Slider par-dessus avec fond transparent */}
                                    <div className="relative z-10">
                                      <Slider
                                        id={`sellPercentage-${index}`}
                                        min={0}
                                        max={100}
                                        step={0.1}
                                        value={[target.sellPercentage]}
                                        onValueChange={(value) => {
                                          const otherTargetsTotal = profitTargets.reduce((sum, t, idx) => 
                                            idx === index ? sum : sum + t.sellPercentage, 0
                                          );
                                          const maxValue = Math.max(0, 100 - otherTargetsTotal);
                                          handleTargetChange(index, 'sellPercentage', Math.min(value[0], maxValue));
                                        }}
                                        className="w-full slider-transparent"
                                        style={{
                                          background: 'transparent',
                                        }}
                                      />
                                    </div>
                                  </div>
                                  <div className="w-full sm:w-32 flex items-center gap-2">
                                    <Input
                                      type="number"
                                      min={0}
                                      max={(() => {
                                        const otherTargetsTotal = profitTargets.reduce((sum, t, idx) => 
                                          idx === index ? sum : sum + t.sellPercentage, 0
                                        );
                                        return 100 - otherTargetsTotal;
                                      })()}
                                      step={0.1}
                                      value={target.sellPercentage.toFixed(1)}
                                      onChange={(e) => {
                                        const value = parseFloat(e.target.value);
                                        if (!isNaN(value) && value >= 0) {
                                          const otherTargetsTotal = profitTargets.reduce((sum, t, idx) => 
                                            idx === index ? sum : sum + t.sellPercentage, 0
                                          );
                                          const maxValue = Math.max(0, 100 - otherTargetsTotal);
                                          handleTargetChange(index, 'sellPercentage', Math.min(value, maxValue));
                                        }
                                      }}
                                      placeholder="0.0"
                                      className={`text-xs md:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                                    />
                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>%</span>
                                  </div>
                                  <div className="w-full sm:w-40 flex items-center gap-2">
                                    <Input
                                      type="number"
                                      min={0}
                                      step="0.00000001"
                                      value={(() => {
                                        const qty = parseFloat(strategyQuantity);
                                        if (isNaN(qty) || qty <= 0 || target.sellPercentage <= 0) return '';
                                        const tokensEquivalent = (qty * target.sellPercentage) / 100;
                                        return tokensEquivalent > 0 ? tokensEquivalent.toFixed(8) : '0.00000000';
                                      })()}
                                      onChange={(e) => {
                                        const value = parseFloat(e.target.value);
                                        if (!isNaN(value) && value >= 0) {
                                          handleTokensChange(index, value);
                                        } else if (e.target.value === '') {
                                          handleTargetChange(index, 'sellPercentage', 0);
                                        }
                                      }}
                                      placeholder="0.00000000"
                                      className={`text-xs md:text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                                    />
                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {language === 'fr' ? 'tokens' : 'tokens'}
                                    </span>
                                  </div>
                                </div>
                                {profitTargets.reduce((sum, t) => sum + t.sellPercentage, 0) > 100 && (
                                  <p className={`mt-1 text-xs ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                                    {language === 'fr' ? 'La somme dépasse 100% !' : 'The sum exceeds 100%!'}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Carte de droite : Informations calculées */}
                            <Card className={`border h-full flex flex-col ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                              <CardContent className="p-4 md:p-6 flex flex-col h-full">
                                <div className="mb-3">
                                  <h4 className={`text-sm md:text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {language === 'fr' ? 'Simulation' : 'Simulation'} #{index + 1}
                                  </h4>
                                </div>
                                <div className="space-y-3 text-xs md:text-sm flex-grow flex flex-col justify-between">
                                  <div className="flex justify-between items-center py-1">
                                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                      {language === 'fr' ? 'Valorisation des tokens restants:' : 'Remaining tokens valuation:'}
                                    </span>
                                    <span className={`font-medium text-right ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                      {info ? formatCurrency(info.remainingTokensValuation, '$', 2) : '$0.00'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center py-1">
                                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                      {language === 'fr' ? 'Montant encaissé:' : 'Amount collected:'}
                                    </span>
                                    <span className={`font-medium text-right ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                      {info ? formatCurrency(info.amountCollected, '$', 2) : '$0.00'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between items-center py-1">
                                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                      {language === 'fr' ? 'Valeur du bag restant:' : 'Remaining bag value:'}
                                    </span>
                                    <span className={`font-medium text-right ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                                      {info ? formatCurrency(info.remainingBagValue, '$', 2) : '$0.00'}
                                    </span>
                                  </div>
                                  <div className={`flex justify-between items-center py-1 border-t pt-3 mt-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                                    <span className={`font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                      {language === 'fr' ? 'Nombre de tokens restants:' : 'Number of remaining tokens:'}
                                    </span>
                                    <span className={`font-bold text-lg text-right ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                                      {info ? info.remainingTokens.toFixed(8) : '0.00000000'}
                                    </span>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}

                {/* Barre de résumé en bas */}
                {strategyInfo.length > 0 && strategyQuantity && strategyAveragePrice && (
                  <div className={`mt-4 md:mt-8 rounded-xl p-4 md:p-6 w-full max-w-full ${
                    isDarkMode ? 'bg-gray-800 border-2 border-gray-700' : 'bg-white border-2 border-gray-200'
                  }`}>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 items-center">
                      <div>
                        <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {language === 'fr' ? 'Investi' : 'Invested'}
                        </p>
                        <p className={`text-base md:text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                          {formatCurrency(parseFloat(strategyQuantity) * parseFloat(strategyAveragePrice), '$', 2)}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {language === 'fr' ? 'Total encaissé' : 'Total cashed in'}
                        </p>
                        <p className={`text-base md:text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                          {formatCurrency(
                            strategyInfo.reduce((sum, info) => sum + info.amountCollected, 0),
                            '$',
                            2
                          )}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {language === 'fr' ? 'Résultat net' : 'Net result'}
                        </p>
                        <p className={`text-base md:text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                          {formatCurrency(
                            strategyInfo.reduce((sum, info) => sum + info.amountCollected, 0) - 
                            (parseFloat(strategyQuantity) * parseFloat(strategyAveragePrice)),
                            '$',
                            2
                          )}
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {language === 'fr' ? 'Rendement net' : 'Net yield'}
                        </p>
                        <p className={`text-base md:text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                          {(((
                            strategyInfo.reduce((sum, info) => sum + info.amountCollected, 0) - 
                            (parseFloat(strategyQuantity) * parseFloat(strategyAveragePrice))
                          ) / (parseFloat(strategyQuantity) * parseFloat(strategyAveragePrice))) * 100).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {language === 'fr' ? 'Tokens restants' : 'Remaining tokens'}
                        </p>
                        <p className={`text-base md:text-lg font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                          {strategyInfo.length > 0 
                            ? strategyInfo[strategyInfo.length - 1].remainingTokens.toFixed(6)
                            : '0.000000'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer - Design amélioré avec plus d'espace */}
                <div className={`mt-4 md:mt-8 pt-4 md:pt-8 border-t-2 rounded-xl p-4 md:p-6 -mx-4 md:-mx-0 w-full max-w-full overflow-x-hidden ${
                  isDarkMode 
                    ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900' 
                    : 'border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50'
                }`}>
                  <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 md:gap-6">
                      {/* Section informative à gauche */}
                      <div className="flex-1 space-y-2 md:space-y-3 w-full">
                        <div className="flex items-start gap-2 md:gap-3">
                          <div className={`p-2 rounded-lg flex-shrink-0 ${isDarkMode ? 'bg-blue-900/30' : 'bg-blue-100'}`}>
                            <ChartBarIcon className={`w-4 h-4 md:w-5 md:h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                          </div>
                          <div>
                            <h4 className={`text-sm md:text-base font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {language === 'fr' ? 'Stratégie optimisée pour vos gains' : 'Strategy optimized for your gains'}
                            </h4>
                            <p className={`text-xs md:text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {language === 'fr' 
                                ? 'Vos cibles de profit sont calculées en temps réel pour maximiser vos rendements'
                                : 'Your profit targets are calculated in real-time to maximize your returns'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Section bouton à droite */}
                      <div className="flex-shrink-0 w-full lg:w-auto">
                        <Button
                          onClick={handleCreateStrategy}
                          disabled={loading || !selectedStrategyToken || !strategyQuantity || !strategyAveragePrice || !strategyName || numberOfTargets === 0}
                          className={`w-full lg:w-auto px-6 md:px-10 py-3 md:py-4 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base ${
                            isDarkMode
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                              : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white'
                          }`}
                        >
                          {loading ? (
                            <span className="flex items-center gap-2">
                              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              {isEditMode ? (language === 'fr' ? 'Modification...' : 'Updating...') : (language === 'fr' ? 'Création...' : 'Creating...')}
                            </span>
                          ) : (
                            <span className="flex items-center gap-2">
                              <ChartBarIcon className="w-5 h-5" />
                              {isEditMode ? (language === 'fr' ? 'Modifier la stratégie' : 'Update Strategy') : (language === 'fr' ? 'Créer la stratégie' : 'Create Strategy')}
                            </span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
