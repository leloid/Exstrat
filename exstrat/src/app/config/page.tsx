'use client';

import React, { useState, useEffect } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
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
  const { portfolios, holdings, isLoading, refreshPortfolios } = usePortfolio();
  
  const [theoreticalStrategies, setTheoreticalStrategies] = useState<any[]>([]);
  const [appliedStrategies, setAppliedStrategies] = useState<Record<string, AppliedStrategy>>({});
  const [simulations, setSimulations] = useState<Record<string, any>>({});
  const [loadingStrategies, setLoadingStrategies] = useState(true);

  useEffect(() => {
    refreshPortfolios();
    loadTheoreticalStrategies();
  }, []);

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

  // Grouper les holdings par portfolio
  const holdingsByPortfolio = holdings.reduce((acc, holding) => {
    const portfolioId = holding.portfolioId;
    if (!acc[portfolioId]) {
      acc[portfolioId] = [];
    }
    acc[portfolioId].push(holding);
    return acc;
  }, {} as Record<string, typeof holdings>);

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
      const holding = holdings.find(h => h.id === holdingId);
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
    const holding = holdings.find(h => h.id === holdingId);
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

  if (isLoading || loadingStrategies) {
    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement de la configuration...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuration</h1>
          <p className="mt-2 text-gray-600">
            Pour chaque actif, sélectionnez une stratégie et les prises de profit à activer
          </p>
        </div>

        {/* Résultats globaux */}
        {Object.keys(simulations).length > 0 && (
          <Card className="mb-8 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartBarIcon className="h-5 w-5 text-blue-600" />
                Résultats Globaux
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(globalStats.totalProjectedValue)}
                  </div>
                  <div className="text-sm text-gray-600">Valeur Projetée</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(globalStats.totalProfit)}
                  </div>
                  <div className="text-sm text-gray-600">Profit Attendu</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {formatPercentage(globalReturnPercentage)}
                  </div>
                  <div className="text-sm text-gray-600">Rendement</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {Object.keys(appliedStrategies).length}
                  </div>
                  <div className="text-sm text-gray-600">Stratégies Appliquées</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Section Paramètres */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Paramètres</CardTitle>
            <CardDescription>Configuration des stratégies par token</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Token</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Quantité</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Investi</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">Prix moyen</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Stratégie</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Prises de profit</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-gray-500">
                        Aucun holding disponible. Ajoutez des transactions d'abord.
                      </td>
                    </tr>
                  ) : (
                    holdings.map((holding) => {
                      const compatibleStrategies = getCompatibleStrategies(holding.token.symbol);
                      const appliedStrategy = appliedStrategies[holding.id];
                      const simulation = simulations[holding.id];

                      return (
                        <tr key={holding.id} className="border-b hover:bg-gray-50">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-bold text-blue-600">
                                  {holding.token.symbol.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">{holding.token.symbol}</div>
                                <div className="text-xs text-gray-500">{holding.token.name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="text-right py-4 px-4">{holding.quantity}</td>
                          <td className="text-right py-4 px-4">{formatCurrency(holding.investedAmount)}</td>
                          <td className="text-right py-4 px-4">{formatCurrency(holding.averagePrice)}</td>
                          <td className="py-4 px-4">
                            <Select
                              value={appliedStrategy?.strategyId || 'none'}
                              onValueChange={(value) => handleStrategyChange(holding.id, value)}
                            >
                              <SelectTrigger className="w-[200px]">
                                <SelectValue placeholder="Choisir..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  Sans TP (défaut)
                                </SelectItem>
                                {compatibleStrategies.map((strategy) => (
                                  <SelectItem key={strategy.id} value={strategy.id}>
                                    {strategy.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-4 px-4">
                            {simulation ? (
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="secondary">
                                    {simulation.results.length} sorties
                                  </Badge>
                                </div>
                                <div className="text-xs text-gray-600">
                                  Profit: <span className="font-medium text-green-600">
                                    {formatCurrency(simulation.totalProfit)}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-600">
                                  Rendement: <span className="font-medium">
                                    {formatPercentage(simulation.returnPercentage)}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Section Résultats détaillés */}
        {Object.keys(simulations).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Résultats</CardTitle>
              <CardDescription>Détails des simulations par token</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Token</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Valeur projetée</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Rendement</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-700">Token restants</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(simulations).map(([holdingId, simulation]) => {
                      const holding = holdings.find(h => h.id === holdingId);
                      if (!holding) return null;

                      return (
                        <tr key={holdingId} className="border-b">
                          <td className="py-4 px-4 font-medium">{holding.token.symbol}</td>
                          <td className="text-right py-4 px-4">{formatCurrency(simulation.projectedValue)}</td>
                          <td className="text-right py-4 px-4">
                            <span className={simulation.returnPercentage >= 0 ? 'text-green-600' : 'text-red-600'}>
                              {formatPercentage(simulation.returnPercentage)}
                            </span>
                          </td>
                          <td className="text-right py-4 px-4">{simulation.remainingTokens.toFixed(4)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bouton de simulation finale */}
        {Object.keys(appliedStrategies).length > 0 && (
          <div className="mt-8 flex justify-end">
            <Button size="lg" className="flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5" />
              Simuler les résultats
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

