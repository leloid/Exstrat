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

interface ProfitTarget {
  id: string;
  targetType: 'percentage' | 'price';
  targetValue: number;
  sellPercentage: number;
}

export default function CreateStrategyPage() {
  const router = useRouter();
  const { isDarkMode, language } = useTheme();
  const [activeTab, setActiveTab] = useState('strategies');
  
  // État du formulaire
  const [strategyName, setStrategyName] = useState<string>('');
  const [selectedToken, setSelectedToken] = useState<TokenSearchResult | null>(null);
  const [quantity, setQuantity] = useState<string>('');
  const [averagePrice, setAveragePrice] = useState<string>('');
  const [numberOfTargets, setNumberOfTargets] = useState<number>(3);
  const [profitTargets, setProfitTargets] = useState<ProfitTarget[]>([]);
  
  // États de chargement
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingStrategyId, setEditingStrategyId] = useState<string | null>(null);
  
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
  
  // Calculer les simulations
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
      
      results.push({
        targetPrice,
        tokensToSell,
        profitRealized,
        remainingTokens,
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
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('💾 Création de la stratégie...');
      
      // Préparer les données de la stratégie
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
      
      console.log('📤 Données de la stratégie:', strategyData);
      
      // Appel à l'API (création ou modification)
      if (isEditMode && editingStrategyId) {
        const updatedStrategy = await portfoliosApi.updateTheoreticalStrategy(editingStrategyId, strategyData);
        console.log('✅ Stratégie modifiée:', updatedStrategy);
        alert(language === 'fr' ? 'Stratégie modifiée avec succès !' : 'Strategy updated successfully!');
      } else {
        const createdStrategy = await portfoliosApi.createTheoreticalStrategy(strategyData);
        console.log('✅ Stratégie créée:', createdStrategy);
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
                          </Label>
                          <Input
                            id="quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            placeholder={language === 'fr' ? 'Ex: 1.5' : 'Ex: 1.5'}
                            step="0.00000001"
                            required
                            className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                          />
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
                            {language === 'fr' ? 'Simulation' : 'Simulation'}
                          </h2>
                        </div>
                        <div className="space-y-4">
                          {simulations.map((sim, index) => (
                            <div key={index} className={`border-b pb-3 last:border-b-0 ${
                              isDarkMode ? 'border-gray-700' : 'border-gray-200'
                            }`}>
                              <h3 className={`text-sm font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {language === 'fr' ? 'Cible' : 'Target'} #{index + 1}
                              </h3>
                              <div className="space-y-1 text-xs">
                                <div className="flex justify-between">
                                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                    {language === 'fr' ? 'Prix cible:' : 'Target Price:'}
                                  </span>
                                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(sim.targetPrice)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                    {language === 'fr' ? 'Tokens vendus:' : 'Tokens Sold:'}
                                  </span>
                                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {sim.tokensToSell.toFixed(4)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                    {language === 'fr' ? 'Profit:' : 'Profit:'}
                                  </span>
                                  <span className={`font-medium ${sim.profitRealized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {formatCurrency(sim.profitRealized)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}

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
