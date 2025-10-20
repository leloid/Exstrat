'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { 
  PlusIcon,
  MinusIcon,
  ArrowPathIcon,
  PencilIcon,
  TrashIcon,
  InformationCircleIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/format';
import * as portfoliosApi from '@/lib/portfolios-api';

interface ProfitTarget {
  id: string;
  targetType: 'percentage' | 'price';
  targetValue: number;
  sellPercentage: number;
}

export default function CreateStrategyPage() {
  const router = useRouter();
  const { portfolios, holdings, refreshPortfolios, refreshHoldings } = usePortfolio();
  
  // État du formulaire
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>('');
  const [selectedTokenSymbol, setSelectedTokenSymbol] = useState<string>('');
  const [strategyName, setStrategyName] = useState<string>('');
  const [numberOfTargets, setNumberOfTargets] = useState<number>(3);
  const [profitTargets, setProfitTargets] = useState<ProfitTarget[]>([]);
  
  // Données du token sélectionné
  const [tokenData, setTokenData] = useState<any>(null);
  
  // Charger les portfolios au démarrage
  useEffect(() => {
    refreshPortfolios();
  }, []);
  
  // Charger les holdings quand le portfolio change
  useEffect(() => {
    if (selectedPortfolioId) {
      refreshHoldings(selectedPortfolioId);
    }
  }, [selectedPortfolioId]);
  
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
  
  // Récupérer les données du token sélectionné
  useEffect(() => {
    if (selectedTokenSymbol && holdings.length > 0) {
      const holding = holdings.find(h => h.token.symbol === selectedTokenSymbol);
      if (holding) {
        setTokenData({
          symbol: holding.token.symbol,
          name: holding.token.name,
          quantity: holding.quantity,
          investedAmount: holding.investedAmount,
          averagePrice: holding.averagePrice,
          currentPrice: holding.averagePrice, // TODO: Récupérer le prix actuel depuis une API
        });
      }
    }
  }, [selectedTokenSymbol, holdings]);
  
  // Calculer les simulations
  const calculateSimulations = () => {
    if (!tokenData) return [];
    
    let remainingTokens = tokenData.quantity;
    
    return profitTargets.map((target, index) => {
      const tokensToSell = (tokenData.quantity * target.sellPercentage) / 100;
      remainingTokens = remainingTokens - tokensToSell;
      
      let targetPrice = 0;
      if (target.targetType === 'percentage') {
        targetPrice = tokenData.averagePrice * (1 + target.targetValue / 100);
      } else {
        targetPrice = target.targetValue;
      }
      
      const profitRealized = tokensToSell * (targetPrice - tokenData.averagePrice);
      const profitUnrealized = remainingTokens * (targetPrice - tokenData.averagePrice);
      const tokenValueAtTarget = remainingTokens * targetPrice;
      
      return {
        targetNumber: index + 1,
        targetPrice,
        tokensToSell,
        remainingTokens,
        profitRealized,
        profitUnrealized,
        tokenValueAtTarget,
      };
    });
  };
  
  const simulations = calculateSimulations();
  
  // Calculer les totaux
  const totalInvested = tokenData?.investedAmount || 0;
  const totalProfitRealized = simulations.reduce((sum, sim) => sum + sim.profitRealized, 0);
  const totalReturn = totalInvested > 0 ? (totalProfitRealized / totalInvested) * 100 : 0;
  const tokensRemaining = simulations.length > 0 ? simulations[simulations.length - 1].remainingTokens : 0;
  
  const updateProfitTarget = (index: number, field: keyof ProfitTarget, value: any) => {
    const newTargets = [...profitTargets];
    newTargets[index] = { ...newTargets[index], [field]: value };
    setProfitTargets(newTargets);
  };
  
  const handleSaveStrategy = async () => {
    if (!selectedPortfolioId || !selectedTokenSymbol || !strategyName) {
      alert('Veuillez remplir tous les champs obligatoires');
      return;
    }
    
    try {
      console.log('💾 Sauvegarde de la stratégie...');
      
      // 1. Créer la stratégie
      const strategyData = {
        portfolioId: selectedPortfolioId,
        name: strategyName,
        description: `Stratégie pour ${selectedTokenSymbol} avec ${numberOfTargets} cibles de profit`,
        status: 'active' as const,
      };
      
      console.log('📤 Données de la stratégie:', strategyData);
      
      const createdStrategy = await portfoliosApi.createUserStrategy(strategyData);
      console.log('✅ Stratégie créée:', createdStrategy);
      
      // 2. Trouver le holding correspondant au token sélectionné
      const holding = holdings.find(h => h.token.symbol === selectedTokenSymbol);
      if (!holding) {
        throw new Error('Holding introuvable pour ce token');
      }
      
      // 3. Configurer les règles de prise de profit personnalisées
      const customRules = {
        levels: profitTargets.map((target, index) => ({
          order: index + 1,
          targetType: target.targetType,
          targetValue: target.targetValue,
          sellPercentage: target.sellPercentage,
        })),
      };
      
      const tokenConfigData = {
        holdingId: holding.id,
        customProfitTakingRules: customRules,
      };
      
      console.log('📤 Configuration du token:', tokenConfigData);
      
      await portfoliosApi.configureTokenStrategy(createdStrategy.id, tokenConfigData);
      console.log('✅ Configuration du token créée');
      
      alert('Stratégie créée avec succès !');
      
      // Rediriger vers la liste des stratégies
      router.push('/strategies');
    } catch (error: any) {
      console.error('❌ Erreur lors de la sauvegarde:', error);
      alert(`Erreur lors de la sauvegarde de la stratégie: ${error.response?.data?.message || error.message}`);
    }
  };
  
  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/strategies')}
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Nouvelle Stratégie</h1>
              <p className="mt-2 text-gray-600">
                Configurez votre stratégie de prise de profit automatisée
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Colonne gauche : Paramètres */}
          <div className="space-y-6">
            {/* Paramètres de la stratégie */}
            <Card>
              <CardHeader>
                <CardTitle>Paramètres de la stratégie</CardTitle>
                <CardDescription>
                  Choisissez le portfolio, le token concerné, et une stratégie existante ou à créer.
                  Définissez ensuite le nombre de prises de profit que vous souhaitez planifier.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Sélection du portfolio */}
                <div>
                  <Label htmlFor="portfolio">Portfolios *</Label>
                  <Select value={selectedPortfolioId} onValueChange={setSelectedPortfolioId}>
                    <SelectTrigger id="portfolio">
                      <SelectValue placeholder="Sélectionner un portfolio" />
                    </SelectTrigger>
                    <SelectContent>
                      {portfolios.map((portfolio) => (
                        <SelectItem key={portfolio.id} value={portfolio.id}>
                          {portfolio.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Sélection du token */}
                <div>
                  <Label htmlFor="token">Tokens *</Label>
                  <Select 
                    value={selectedTokenSymbol} 
                    onValueChange={setSelectedTokenSymbol}
                    disabled={!selectedPortfolioId}
                  >
                    <SelectTrigger id="token">
                      <SelectValue placeholder="Sélectionner un token" />
                    </SelectTrigger>
                    <SelectContent>
                      {holdings.map((holding) => (
                        <SelectItem key={holding.id} value={holding.token.symbol}>
                          {holding.token.symbol}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Nom de la stratégie */}
                <div>
                  <Label htmlFor="strategy">Nom de la stratégie *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="strategy"
                      value={strategyName}
                      onChange={(e) => setStrategyName(e.target.value)}
                      placeholder="Ex: Stratégie BTC conservatrice"
                    />
                    <Button variant="outline" size="sm">
                      <ArrowPathIcon className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <PencilIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Nombre de sorties */}
                <div>
                  <Label htmlFor="targets">Nombre de sorties *</Label>
                  <Input
                    id="targets"
                    type="number"
                    min="1"
                    max="10"
                    value={numberOfTargets}
                    onChange={(e) => setNumberOfTargets(parseInt(e.target.value) || 1)}
                  />
                </div>
              </CardContent>
            </Card>
            
            {/* Cibles de sortie */}
            <Card>
              <CardHeader>
                <CardTitle>Cibles de sortie</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {profitTargets.map((target, index) => (
                  <div key={target.id} className="space-y-4 pb-6 border-b last:border-b-0">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold">
                        {index + 1}
                      </div>
                      <h3 className="font-medium">Cible de sortie</h3>
                      <Button variant="outline" size="sm" className="ml-auto">
                        <ArrowPathIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {/* Type de cible */}
                      <div className="flex items-center gap-2">
                        <Label className="text-sm">Cible de sortie</Label>
                        <button
                          onClick={() => updateProfitTarget(index, 'targetType', target.targetType === 'percentage' ? 'price' : 'percentage')}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          {target.targetType === 'percentage' ? 'Pourcentage du prix moyen d\'achat' : 'Valeur exacte du token'}
                        </button>
                      </div>
                      
                      {/* Valeur de la cible */}
                      <div className="flex items-center gap-2">
                        {target.targetType === 'percentage' ? (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateProfitTarget(index, 'targetValue', Math.max(0, target.targetValue - 10))}
                            >
                              <MinusIcon className="h-4 w-4" />
                            </Button>
                            <Input
                              type="number"
                              value={target.targetValue}
                              onChange={(e) => updateProfitTarget(index, 'targetValue', parseFloat(e.target.value) || 0)}
                              className="text-center"
                            />
                            <span className="text-sm">%</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateProfitTarget(index, 'targetValue', target.targetValue + 10)}
                            >
                              <PlusIcon className="h-4 w-4" />
                            </Button>
                            <span className="ml-2 text-sm font-medium">
                              {tokenData ? formatCurrency(tokenData.averagePrice * (1 + target.targetValue / 100)) : '$0.00'}
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-sm">$</span>
                            <Input
                              type="number"
                              value={target.targetValue}
                              onChange={(e) => updateProfitTarget(index, 'targetValue', parseFloat(e.target.value) || 0)}
                              placeholder="0.00"
                            />
                          </>
                        )}
                      </div>
                      
                      {/* Quantité à vendre */}
                      <div>
                        <Label className="text-sm">Quantité à vendre</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={target.sellPercentage}
                              onChange={(e) => updateProfitTarget(index, 'sellPercentage', parseFloat(e.target.value))}
                              className="w-full"
                            />
                          </div>
                          <span className="text-sm font-medium w-16 text-right">
                            {target.sellPercentage.toFixed(0)}%
                          </span>
                          <span className="text-sm text-gray-500">
                            {tokenData ? (tokenData.quantity * target.sellPercentage / 100).toFixed(4) : '0.0000'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          
          {/* Colonne droite : Données d'investissement et Simulations */}
          <div className="space-y-6">
            {/* Données d'investissement */}
            <Card>
              <CardHeader>
                <CardTitle>Données d'investissement</CardTitle>
                <CardDescription>
                  Visualisez ici les informations clés liées à votre investissement sur ce token.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tokenData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Nombre de saisies</p>
                        <p className="text-2xl font-bold">1</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Total investi</p>
                        <p className="text-2xl font-bold">{formatCurrency(tokenData.investedAmount)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Tokens détenus</p>
                        <p className="text-2xl font-bold">{tokenData.quantity.toFixed(4)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Prix moyen d'achat d'un token</p>
                        <p className="text-2xl font-bold">{formatCurrency(tokenData.averagePrice)}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Sélectionnez un portfolio et un token pour voir les données
                  </p>
                )}
              </CardContent>
            </Card>
            
            {/* Simulations */}
            {tokenData && simulations.length > 0 && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <InformationCircleIcon className="h-5 w-5 text-blue-600" />
                    <CardTitle>Simulations</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {simulations.map((sim) => (
                    <div key={sim.targetNumber} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm font-semibold">
                          {sim.targetNumber}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div>
                          <p className="text-gray-500 text-xs">Valorisation des tokens restants</p>
                          <p className="font-medium">{formatCurrency(sim.tokenValueAtTarget)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Montant du profit réalisé</p>
                          <p className="font-medium">{formatCurrency(sim.profitRealized)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Montant du profit non réalisé</p>
                          <p className="font-medium">{formatCurrency(sim.profitUnrealized)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 text-xs">Nombre de tokens restants</p>
                          <p className="font-medium">{sim.remainingTokens.toFixed(4)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
        
        {/* Footer avec résumé et actions */}
        {tokenData && (
          <Card className="mt-6">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex gap-8">
                  <div>
                    <span className="text-sm text-gray-500">Investi</span>
                    <span className="ml-2 font-bold">{formatCurrency(totalInvested)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Profit total réalisé</span>
                    <span className="ml-2 font-bold">{formatCurrency(totalProfitRealized)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Rendement</span>
                    <span className="ml-2 font-bold">{formatPercentage(totalReturn)}</span>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Token restants</span>
                    <span className="ml-2 font-bold">{tokensRemaining.toFixed(4)}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => router.push('/strategies')}
                  >
                    Annuler
                  </Button>
                  <Button 
                    onClick={handleSaveStrategy} 
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!selectedPortfolioId || !selectedTokenSymbol || !strategyName}
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    Créer la stratégie
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
