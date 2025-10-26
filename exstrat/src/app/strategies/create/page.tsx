'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
      alert('Erreur lors du chargement de la stratégie à modifier');
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
      alert('Veuillez entrer un nom pour la stratégie');
      return;
    }
    if (!selectedToken) {
      alert('Veuillez sélectionner un token');
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      alert('Veuillez entrer une quantité valide');
      return;
    }
    if (!averagePrice || parseFloat(averagePrice) <= 0) {
      alert('Veuillez entrer un prix moyen valide');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      console.log('💾 Création de la stratégie...');
      
      // Préparer les données de la stratégie
      const strategyData = {
        name: strategyName,
        description: `Stratégie pour ${selectedToken.symbol} - ${numberOfTargets} cibles de profit`,
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
        alert('Stratégie modifiée avec succès !');
      } else {
        const createdStrategy = await portfoliosApi.createTheoreticalStrategy(strategyData);
        console.log('✅ Stratégie créée:', createdStrategy);
        alert('Stratégie créée avec succès !');
      }
      
      // Rediriger vers la liste des stratégies
      router.push('/strategies');
    } catch (error: any) {
      console.error('❌ Erreur:', error);
      setError(error.response?.data?.message || error.message);
      alert(`Erreur: ${error.response?.data?.message || error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditMode ? 'Modifier la Stratégie' : 'Créer une Stratégie'}
            </h1>
            <p className="mt-2 text-gray-600">
              {isEditMode 
                ? 'Modifiez les paramètres de votre stratégie existante'
                : 'Définissez vos cibles de profit théoriques pour n\'importe quel token'
              }
            </p>
          </div>
          <Button variant="outline" onClick={() => router.push('/strategies')} className="flex items-center gap-2">
            <ArrowLeftIcon className="h-4 w-4" />
            Retour
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Colonne gauche: Configuration */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations de base */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartBarIcon className="h-5 w-5 text-blue-600" />
                  Informations de la Stratégie
                </CardTitle>
                <CardDescription>Définissez le nom et le token cible</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="strategyName">Nom de la stratégie *</Label>
                  <Input
                    id="strategyName"
                    type="text"
                    value={strategyName}
                    onChange={(e) => setStrategyName(e.target.value)}
                    placeholder="Ex: Stratégie BTC Conservative"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="token">Token *</Label>
                  <TokenSearch
                    onTokenSelect={handleTokenSelect}
                    selectedToken={selectedToken}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="quantity">Quantité *</Label>
                    <Input
                      id="quantity"
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="Ex: 1.5"
                      step="0.00000001"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="averagePrice">Prix moyen (USD) *</Label>
                    <Input
                      id="averagePrice"
                      type="number"
                      value={averagePrice}
                      onChange={(e) => setAveragePrice(e.target.value)}
                      placeholder="Ex: 45000"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Configuration des cibles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PencilIcon className="h-5 w-5 text-purple-600" />
                  Cibles de Prise de Profit
                </CardTitle>
                <CardDescription>Définissez vos points de sortie</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="numberOfTargets">Nombre de sorties (1-10)</Label>
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
                    className="w-24"
                  />
                </div>

                {profitTargets.map((target, index) => (
                  <div key={target.id} className="border p-4 rounded-lg space-y-3 bg-gray-50">
                    <h3 className="text-md font-semibold">Cible #{index + 1}</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`targetType-${index}`}>Type</Label>
                        <Select
                          value={target.targetType}
                          onValueChange={(value: 'percentage' | 'price') => 
                            handleTargetChange(index, 'targetType', value)
                          }
                        >
                          <SelectTrigger id={`targetType-${index}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="percentage">% de profit</SelectItem>
                            <SelectItem value="price">Prix exact</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`targetValue-${index}`}>
                          {target.targetType === 'percentage' ? 'Pourcentage (%)' : 'Prix (USD)'}
                        </Label>
                        <Input
                          id={`targetValue-${index}`}
                          type="number"
                          value={target.targetValue}
                          onChange={(e) => 
                            handleTargetChange(index, 'targetValue', parseFloat(e.target.value))
                          }
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`sellPercentage-${index}`}>
                        Quantité à vendre: {target.sellPercentage.toFixed(1)}%
                      </Label>
                      <Slider
                        id={`sellPercentage-${index}`}
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
              </CardContent>
            </Card>
          </div>

          {/* Colonne droite: Résumé et Simulation */}
          <div className="lg:col-span-1 space-y-6">
            {selectedToken && quantity && averagePrice && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                      Données d'investissement
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Token:</span>
                      <span className="font-medium">{selectedToken.symbol}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Quantité:</span>
                      <span className="font-medium">{quantity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prix moyen:</span>
                      <span className="font-medium">{formatCurrency(parseFloat(averagePrice))}</span>
                    </div>
                    <div className="flex justify-between border-t pt-2 mt-2">
                      <span className="text-muted-foreground">Investi total:</span>
                      <span className="font-medium">{formatCurrency(totalInvested)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ChartBarIcon className="h-5 w-5 text-green-600" />
                      Simulation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {simulations.map((sim, index) => (
                      <div key={index} className="border-b pb-3 last:border-b-0">
                        <h3 className="text-sm font-semibold mb-2">Cible #{index + 1}</h3>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Prix cible:</span>
                            <span className="font-medium">{formatCurrency(sim.targetPrice)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Tokens vendus:</span>
                            <span className="font-medium">{sim.tokensToSell.toFixed(4)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Profit:</span>
                            <span className={`font-medium ${sim.profitRealized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {formatCurrency(sim.profitRealized)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="pt-4 border-t space-y-2">
                      <h3 className="font-semibold">Résumé Global</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Profit total:</span>
                          <span className={`font-medium ${totalProfitRealized >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(totalProfitRealized)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rendement:</span>
                          <span className={`font-medium ${totalReturnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(totalReturnPercentage)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Tokens restants:</span>
                          <span className="font-medium">
                            {simulations.length > 0 
                              ? simulations[simulations.length - 1].remainingTokens.toFixed(4)
                              : '0'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            <Button
              onClick={handleSaveStrategy}
              disabled={loading || !selectedToken || !quantity || !averagePrice || !strategyName}
              className="w-full"
            >
              {loading 
                ? (isEditMode ? 'Modification...' : 'Création...') 
                : (isEditMode ? 'Modifier la stratégie' : 'Créer la stratégie')
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
