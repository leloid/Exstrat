'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { useTheme } from '@/contexts/ThemeContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { 
  ArrowLeftIcon,
  InformationCircleIcon,
  ChartBarIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/format';
import * as portfoliosApi from '@/lib/portfolios-api';
import { TokenSearch } from '@/components/transactions/TokenSearch';
import { TokenSearchResult } from '@/types/transactions';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { strategiesApi } from '@/lib/strategies-api';

interface ProfitTarget {
  id: string;
  targetType: 'percentage' | 'price';
  targetValue: number;
  sellPercentage: number;
}

export default function CreateStrategyPage() {
  const router = useRouter();
  const { isDarkMode, language } = useTheme();
  const { portfolios, refreshPortfolios } = usePortfolio();
  const [activeTab, setActiveTab] = useState('strategies');
  
  // État du formulaire
  const [strategyName, setStrategyName] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<TokenSearchResult | null>(null);
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('virtual'); // 'virtual' ou un ID de portfolio
  const [availableQuantity, setAvailableQuantity] = useState<number>(0); // Quantité disponible dans le portfolio
  const [quantity, setQuantity] = useState<string>('');
  const [averagePrice, setAveragePrice] = useState<string>('');
  const [numberOfTargets, setNumberOfTargets] = useState<number>(3);
  const [profitTargets, setProfitTargets] = useState<ProfitTarget[]>([]);
  
  // États de chargement
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingStrategyId, setEditingStrategyId] = useState<string | null>(null);
  
  const isVirtualWallet = selectedPortfolioId === 'virtual';
  
  // Charger la quantité disponible quand le portfolio ou le token change
  useEffect(() => {
    const loadAvailableQuantity = async () => {
      if (isVirtualWallet || !selectedToken || !selectedPortfolioId || selectedPortfolioId === 'virtual') {
        setAvailableQuantity(0);
        return;
      }
      
      try {
        const holdings = await portfoliosApi.getPortfolioHoldings(selectedPortfolioId);
        const holding = holdings.find(h => 
          h.token.symbol.toUpperCase() === selectedToken.symbol.toUpperCase()
        );
        
        if (holding) {
          setAvailableQuantity(holding.quantity);
          // Si la quantité actuelle dépasse ce qui est disponible, la réduire
          const currentQty = parseFloat(quantity);
          if (!isNaN(currentQty) && currentQty > holding.quantity) {
            setQuantity(holding.quantity.toString());
          }
        } else {
          setAvailableQuantity(0);
          // Si aucun holding n'existe pour ce token, réinitialiser la quantité
          if (quantity && parseFloat(quantity) > 0) {
            setQuantity('');
          }
        }
      } catch (error) {
        console.error('Erreur lors du chargement de la quantité disponible:', error);
        setAvailableQuantity(0);
      }
    };
    
    loadAvailableQuantity();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPortfolioId, selectedToken?.symbol]);
  
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
      setQuantity(strategy.quantity.toString());
      setAveragePrice(strategy.averagePrice.toString());
      setNumberOfTargets(strategy.numberOfTargets);
      
      // Pré-remplir le token
      setSelectedToken({
        id: 0, // Pas d'ID CMC pour les stratégies théoriques
        name: strategy.tokenName,
        symbol: strategy.tokenSymbol,
        slug: strategy.tokenSymbol.toLowerCase(),
        cmc_rank: 0,
        quote: null,
      });
      
      // Pré-remplir les cibles de profit
      const targets: ProfitTarget[] = strategy.profitTargets.map((target: any, index: number) => ({
        id: `target-${index}`,
        targetType: target.targetType,
        targetValue: target.targetValue,
        sellPercentage: target.sellPercentage,
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
    const newTargets: ProfitTarget[] = [];
    for (let i = 0; i < numberOfTargets; i++) {
      newTargets.push({
        id: `target-${i}`,
        targetType: 'percentage',
        targetValue: (i + 1) * 50, // 50%, 100%, 150%, etc.
        sellPercentage: 100 / numberOfTargets, // Répartition égale
      });
    }
    setProfitTargets(newTargets);
  }, [numberOfTargets]);

  // Auto-remplir le prix moyen avec le prix actuel du token
  const handleTokenSelect = (token: TokenSearchResult | null) => {
    setSelectedToken(token);
    if (token && token.quote?.USD?.price) {
      setAveragePrice(token.quote.USD.price.toFixed(2));
    }
  };
  
  // Gérer les modifications des cibles
  const handleTargetChange = (index: number, field: keyof ProfitTarget, value: any) => {
    const newTargets = [...profitTargets];
    newTargets[index] = { ...newTargets[index], [field]: value };
    setProfitTargets(newTargets);
  };
  
  // Calculer les simulations et les informations de stratégie
  const calculateSimulations = () => {
    const qty = parseFloat(quantity);
    const avgPrice = parseFloat(averagePrice);
    
    if (isNaN(qty) || isNaN(avgPrice) || qty <= 0 || avgPrice <= 0) {
      return [];
    }
    
    let remainingTokens = qty;
    const results: any[] = [];
    
    profitTargets.forEach((target) => {
      const tokensToSell = (qty * target.sellPercentage) / 100;
      
      let targetPrice = 0;
      if (target.targetType === 'percentage') {
        targetPrice = avgPrice * (1 + target.targetValue / 100);
      } else {
        targetPrice = target.targetValue;
      }
      
      const profitRealized = tokensToSell * (targetPrice - avgPrice);
      remainingTokens = remainingTokens - tokensToSell;
      
      // Valorisation des tokens restants au prix cible
      const remainingTokensValuation = remainingTokens * targetPrice;
      
      // Valeur du bag restant au prix d'achat moyen
      const remainingBagValue = remainingTokens * avgPrice;
      
      // Montant encaissé
      const amountCollected = tokensToSell * targetPrice;
      
      results.push({
        targetPrice,
        tokensToSell,
        profitRealized,
        remainingTokens,
        remainingTokensValuation,
        remainingBagValue,
        amountCollected,
      });
    });
    
    return results;
  };
  
  const simulations = calculateSimulations();
  const totalInvested = parseFloat(quantity) * parseFloat(averagePrice) || 0;
  const totalProfitRealized = simulations.reduce((sum, sim) => sum + sim.profitRealized, 0);
  const totalReturnPercentage = totalInvested > 0 ? (totalProfitRealized / totalInvested) * 100 : 0;
  
  // Sauvegarder la stratégie
  const handleSaveStrategy = async () => {
    // Validation
    if (!strategyName.trim()) {
      alert(language === 'fr' ? 'Veuillez entrer un nom pour la stratégie' : 'Please enter a strategy name');
      return;
    }
    if (!selectedToken) {
      alert(language === 'fr' ? 'Veuillez sélectionner un token' : 'Please select a token');
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      alert(language === 'fr' ? 'Veuillez entrer une quantité valide' : 'Please enter a valid quantity');
      return;
    }
    if (!averagePrice || parseFloat(averagePrice) <= 0) {
      alert(language === 'fr' ? 'Veuillez entrer un prix moyen valide' : 'Please enter a valid average price');
      return;
    }
    
    // Validation de la quantité selon le type de wallet
    if (!isVirtualWallet && selectedPortfolioId) {
      const qty = parseFloat(quantity);
      if (qty > availableQuantity) {
        alert(
          language === 'fr' 
            ? `La quantité (${qty}) ne peut pas dépasser ce que vous possédez dans ce wallet (${availableQuantity})`
            : `Quantity (${qty}) cannot exceed what you own in this wallet (${availableQuantity})`
        );
        return;
      }
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('💾 Création de la stratégie...');
      console.log('Type de wallet:', isVirtualWallet ? 'Virtuel' : 'Réel');
      
      if (isVirtualWallet) {
        // Stratégie théorique
        const strategyData = {
          name: strategyName,
          description: `${language === 'fr' ? 'Stratégie pour' : 'Strategy for'} ${selectedToken.symbol} - ${numberOfTargets} ${language === 'fr' ? 'cibles de profit' : 'profit targets'}`,
          tokenSymbol: selectedToken.symbol,
          tokenName: selectedToken.name,
          quantity: parseFloat(quantity),
          averagePrice: parseFloat(averagePrice),
          profitTargets: profitTargets.map((target, index) => ({
            order: index + 1,
            targetType: target.targetType,
            targetValue: target.targetValue,
            sellPercentage: target.sellPercentage,
          })),
          status: 'active',
        };
        
        console.log('📤 Données de la stratégie théorique:', strategyData);
        
        if (isEditMode && editingStrategyId) {
          const updatedStrategy = await portfoliosApi.updateTheoreticalStrategy(editingStrategyId, strategyData);
          console.log('✅ Stratégie théorique modifiée:', updatedStrategy);
          alert(language === 'fr' ? 'Stratégie modifiée avec succès !' : 'Strategy updated successfully!');
        } else {
          const createdStrategy = await portfoliosApi.createTheoreticalStrategy(strategyData);
          console.log('✅ Stratégie théorique créée:', createdStrategy);
          alert(language === 'fr' ? 'Stratégie créée avec succès !' : 'Strategy created successfully!');
        }
      } else {
        // Stratégie réelle - utiliser l'API /strategies
        const strategyData = {
          name: strategyName,
          symbol: selectedToken.symbol,
          tokenName: selectedToken.name,
          cmcId: selectedToken.id || 0,
          baseQuantity: parseFloat(quantity),
          referencePrice: parseFloat(averagePrice),
          steps: profitTargets.map((target) => ({
            targetType: target.targetType === 'percentage' ? 'percentage_of_average' : 'exact_price',
            targetValue: target.targetValue,
            sellPercentage: target.sellPercentage,
            notes: '',
          })),
          notes: `${language === 'fr' ? 'Stratégie pour' : 'Strategy for'} ${selectedToken.symbol} - ${numberOfTargets} ${language === 'fr' ? 'cibles de profit' : 'profit targets'}`,
        };
        
        console.log('📤 Données de la stratégie réelle:', strategyData);
        
        const createdStrategy = await strategiesApi.createStrategy(strategyData);
        console.log('✅ Stratégie réelle créée:', createdStrategy);
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
      <div className={`min-h-screen flex ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />
        
        <div className="flex-1 flex flex-col">
          <TopBar 
            currentPageName={isEditMode 
              ? (language === 'fr' ? 'Modifier la Stratégie' : 'Edit Strategy') 
              : (language === 'fr' ? 'Créer une Stratégie' : 'Create Strategy')
            } 
          />

          <div className={`flex-1 p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto">
              {/* Header */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {isEditMode 
                        ? (language === 'fr' ? 'Modifiez les paramètres de votre stratégie existante' : 'Modify your existing strategy settings')
                        : (language === 'fr' ? 'Définissez vos cibles de profit théoriques pour n\'importe quel token' : 'Define your theoretical profit targets for any token')
                      }
                    </p>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/strategies')} 
                    className="flex items-center gap-2"
                  >
                    <ArrowLeftIcon className="h-4 w-4" />
                    {language === 'fr' ? 'Retour' : 'Back'}
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Colonne gauche: Configuration */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Informations de base */}
                  <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                    <div className="mb-4">
                      <h2 className={`flex items-center gap-2 text-xl font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        <ChartBarIcon className="h-5 w-5 text-purple-600" />
                        {language === 'fr' ? 'Informations de la Stratégie' : 'Strategy Information'}
                      </h2>
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'fr' ? 'Définissez le nom et le token cible' : 'Define the name and target token'}
                      </p>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="strategyName" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                          {language === 'fr' ? 'Nom de la stratégie *' : 'Strategy Name *'}
                        </Label>
                        <Input
                          id="strategyName"
                          type="text"
                          value={strategyName}
                          onChange={(e) => setStrategyName(e.target.value)}
                          placeholder={language === 'fr' ? 'Ex: Stratégie BTC Conservative' : 'Ex: BTC Conservative Strategy'}
                          required
                          className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="portfolio" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                          {language === 'fr' ? 'Portfolio / Wallet *' : 'Portfolio / Wallet *'}
                        </Label>
                        <Select
                          value={selectedPortfolioId}
                          onValueChange={(value) => {
                            setSelectedPortfolioId(value);
                            // Réinitialiser la quantité quand on change de portfolio
                            if (value !== 'virtual') {
                              setQuantity('');
                            }
                          }}
                        >
                          <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}>
                            <SelectValue placeholder={language === 'fr' ? 'Sélectionner un wallet' : 'Select a wallet'} />
                          </SelectTrigger>
                          <SelectContent>
                            {/* Portfolios réels */}
                            {portfolios.filter(p => p && p.id && p.name).map((portfolio) => (
                              <SelectItem key={portfolio.id} value={portfolio.id}>
                                {portfolio.name}
                              </SelectItem>
                            ))}
                            {/* Séparateur visuel */}
                            <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-t border-gray-200">
                              {language === 'fr' ? 'Simulation' : 'Simulation'}
                            </div>
                            {/* Wallet virtuelle */}
                            <SelectItem value="virtual">
                              {language === 'fr' ? 'Wallet Virtuelle' : 'Virtual Wallet'}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {!isVirtualWallet && availableQuantity > 0 && selectedToken && (
                          <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {language === 'fr' 
                              ? `Quantité disponible: ${availableQuantity.toLocaleString()} ${selectedToken.symbol}`
                              : `Available quantity: ${availableQuantity.toLocaleString()} ${selectedToken.symbol}`
                            }
                          </p>
                        )}
                      </div>
                      
                      <div>
                        <Label htmlFor="token" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                          {language === 'fr' ? 'Token *' : 'Token *'}
                        </Label>
                        <TokenSearch
                          onTokenSelect={handleTokenSelect}
                          selectedToken={selectedToken}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="quantity" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                            {language === 'fr' ? 'Quantité *' : 'Quantity *'}
                            {!isVirtualWallet && availableQuantity > 0 && (
                              <span className="text-xs text-gray-500 ml-2">
                                (max: {availableQuantity.toLocaleString()})
                              </span>
                            )}
                          </Label>
                          <Input
                            id="quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => {
                              const value = e.target.value;
                              // Validation : si c'est un wallet réel, ne pas dépasser la quantité disponible
                              if (!isVirtualWallet && availableQuantity > 0 && value) {
                                const numValue = parseFloat(value);
                                if (numValue > availableQuantity) {
                                  // Ne pas mettre à jour si ça dépasse, mais afficher un message
                                  setError(
                                    language === 'fr'
                                      ? `La quantité ne peut pas dépasser ${availableQuantity.toLocaleString()} ${selectedToken?.symbol || ''}`
                                      : `Quantity cannot exceed ${availableQuantity.toLocaleString()} ${selectedToken?.symbol || ''}`
                                  );
                                  return;
                                }
                                setError(null);
                              }
                              setQuantity(value);
                            }}
                            placeholder={language === 'fr' ? 'Ex: 1.5' : 'Ex: 1.5'}
                            step="0.00000001"
                            max={!isVirtualWallet && availableQuantity > 0 ? availableQuantity : undefined}
                            required
                            className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                          />
                          {!isVirtualWallet && parseFloat(quantity) > availableQuantity && (
                            <p className="mt-1 text-sm text-red-600">
                              {language === 'fr'
                                ? `Quantité supérieure à celle disponible (${availableQuantity.toLocaleString()})`
                                : `Quantity exceeds available (${availableQuantity.toLocaleString()})`
                              }
                            </p>
                          )}
                        </div>
                        <div>
                          <Label htmlFor="averagePrice" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                            {language === 'fr' ? 'Prix moyen (USD) *' : 'Average Price (USD) *'}
                          </Label>
                          <Input
                            id="averagePrice"
                            type="number"
                            value={averagePrice}
                            onChange={(e) => setAveragePrice(e.target.value)}
                            placeholder={language === 'fr' ? 'Ex: 45000' : 'Ex: 45000'}
                            step="0.01"
                            required
                            className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Configuration des cibles */}
                  <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                    <div className="mb-4">
                      <h2 className={`flex items-center gap-2 text-xl font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        <PencilIcon className="h-5 w-5 text-purple-600" />
                        {language === 'fr' ? 'Cibles de Prise de Profit' : 'Profit Targets'}
                      </h2>
                      <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {language === 'fr' ? 'Définissez vos points de sortie' : 'Define your exit points'}
                      </p>
                    </div>
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="numberOfTargets" className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                          {language === 'fr' ? 'Nombre de sorties (1-10)' : 'Number of exits (1-10)'}
                        </Label>
                        <Input
                          id="numberOfTargets"
                          type="number"
                          min="1"
                          max="10"
                          value={numberOfTargets}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            if (!isNaN(val) && val >= 1 && val <= 10) {
                              setNumberOfTargets(val);
                            }
                          }}
                          className={`w-24 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                        />
                      </div>

                      {profitTargets.map((target, index) => (
                        <div key={target.id} className={`border p-4 rounded-lg space-y-3 ${
                          isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50'
                        }`}>
                          <h3 className={`text-md font-semibold ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {language === 'fr' ? 'Cible' : 'Target'} #{index + 1}
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor={`targetType-${index}`} className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                {language === 'fr' ? 'Type' : 'Type'}
                              </Label>
                              <Select
                                value={target.targetType}
                                onValueChange={(value: 'percentage' | 'price') => 
                                  handleTargetChange(index, 'targetType', value)
                                }
                              >
                                <SelectTrigger className={isDarkMode ? 'bg-gray-700 border-gray-600' : ''}>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="percentage">{language === 'fr' ? '% de profit' : '% profit'}</SelectItem>
                                  <SelectItem value="price">{language === 'fr' ? 'Prix exact' : 'Exact price'}</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Label htmlFor={`targetValue-${index}`} className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                {target.targetType === 'percentage' 
                                  ? (language === 'fr' ? 'Pourcentage (%)' : 'Percentage (%)')
                                  : (language === 'fr' ? 'Prix (USD)' : 'Price (USD)')
                                }
                              </Label>
                              <Input
                                id={`targetValue-${index}`}
                                type="number"
                                value={target.targetValue}
                                onChange={(e) => 
                                  handleTargetChange(index, 'targetValue', parseFloat(e.target.value))
                                }
                                step="0.01"
                                className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor={`sellPercentage-${index}`} className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                              {language === 'fr' ? 'Quantité à vendre' : 'Quantity to sell'}: {target.sellPercentage.toFixed(1)}%
                            </Label>
                            <Slider
                              min={0}
                              max={100}
                              step={1}
                              value={[target.sellPercentage]}
                              onValueChange={(value) => 
                                handleTargetChange(index, 'sellPercentage', value[0])
                              }
                              className="w-full"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Colonne droite: Résumé et Simulation */}
                <div className="lg:col-span-1 space-y-6">
                  {selectedToken && quantity && averagePrice && (
                    <>
                      <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                        <div className="mb-4">
                          <h2 className={`flex items-center gap-2 text-xl font-semibold ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            <InformationCircleIcon className="h-5 w-5 text-purple-600" />
                            {language === 'fr' ? 'Données d\'investissement' : 'Investment Data'}
                          </h2>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                              {language === 'fr' ? 'Token:' : 'Token:'}
                            </span>
                            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {selectedToken.symbol}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                              {language === 'fr' ? 'Quantité:' : 'Quantity:'}
                            </span>
                            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {quantity}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                              {language === 'fr' ? 'Prix moyen:' : 'Avg Price:'}
                            </span>
                            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {formatCurrency(parseFloat(averagePrice))}
                            </span>
                          </div>
                          <div className={`flex justify-between border-t pt-2 mt-2 ${
                            isDarkMode ? 'border-gray-700' : 'border-gray-200'
                          }`}>
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                              {language === 'fr' ? 'Investi total:' : 'Total Invested:'}
                            </span>
                            <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {formatCurrency(totalInvested)}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                        <div className="mb-4">
                          <h2 className={`flex items-center gap-2 text-xl font-semibold ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            <ChartBarIcon className="h-5 w-5 text-green-600" />
                            {language === 'fr' ? 'Informations de la stratégie' : 'Strategy Information'}
                          </h2>
                        </div>
                        <div className="space-y-4">
                          {profitTargets.map((target, index) => {
                            const sim = simulations[index];
                            if (!sim) return null;
                            
                            return (
                              <Card key={index} className={`border ${
                                isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                              }`}>
                                <CardContent className="p-4">
                                  <div className="mb-2">
                                    <h4 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                      {index + 1}
                                    </h4>
                                  </div>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                        {language === 'fr' ? 'Valorisation des tokens restants:' : 'Remaining tokens valuation:'}
                                      </span>
                                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {formatCurrency(sim.remainingTokensValuation, '$', 2)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                        {language === 'fr' ? 'Montant encaissé:' : 'Amount collected:'}
                                      </span>
                                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {formatCurrency(sim.amountCollected, '$', 2)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                        {language === 'fr' ? 'Valeur du bag restant:' : 'Remaining bag value:'}
                                      </span>
                                      <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {formatCurrency(sim.remainingBagValue, '$', 2)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className={isDarkMode ? 'text-gray-400' : 'text-gray-600'}>
                                        {language === 'fr' ? 'Nombre de tokens restants:' : 'Number of remaining tokens:'}
                                      </span>
                                      <span className="font-medium text-orange-600">
                                        {sim.remainingTokens.toFixed(6)}
                                      </span>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}

                          <div className={`pt-4 border-t space-y-2 ${
                            isDarkMode ? 'border-gray-700' : 'border-gray-200'
                          }`}>
                            <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {language === 'fr' ? 'Résumé Global' : 'Global Summary'}
                            </h3>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                  {language === 'fr' ? 'Profit total:' : 'Total Profit:'}
                                </span>
                                <span className={`font-medium ${totalProfitRealized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatCurrency(totalProfitRealized)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                  {language === 'fr' ? 'Rendement:' : 'Return:'}
                                </span>
                                <span className={`font-medium ${totalReturnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {formatPercentage(totalReturnPercentage)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                  {language === 'fr' ? 'Tokens restants:' : 'Remaining Tokens:'}
                                </span>
                                <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                  {simulations.length > 0 
                                    ? simulations[simulations.length - 1].remainingTokens.toFixed(4)
                                    : '0'
                                  }
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <Button
                    onClick={handleSaveStrategy}
                    disabled={loading || !selectedToken || !quantity || !averagePrice || !strategyName}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {loading 
                      ? (isEditMode ? (language === 'fr' ? 'Modification...' : 'Updating...') : (language === 'fr' ? 'Création...' : 'Creating...'))
                      : (isEditMode ? (language === 'fr' ? 'Modifier la stratégie' : 'Update Strategy') : (language === 'fr' ? 'Créer la stratégie' : 'Create Strategy'))
                    }
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
