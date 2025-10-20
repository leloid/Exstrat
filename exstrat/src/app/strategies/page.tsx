'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/format';
import * as portfoliosApi from '@/lib/portfolios-api';

export default function StrategiesPage() {
  const router = useRouter();
  const { portfolios, refreshPortfolios } = usePortfolio();
  const [strategies, setStrategies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStrategies();
    refreshPortfolios();
  }, []);

  const loadStrategies = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Chargement des stratégies...');
      
      // Charger les stratégies depuis l'API
      const data = await portfoliosApi.getUserStrategies();
      console.log('✅ Stratégies chargées:', data);
      
      // Transformer les données pour l'affichage
      const transformedStrategies = await Promise.all(
        data.map(async (strategy) => {
          try {
            // Récupérer les configurations de tokens pour cette stratégie
            const tokenConfigs = await portfoliosApi.getTokenStrategyConfigs(strategy.id);
            console.log(`📋 Configs pour stratégie ${strategy.id}:`, tokenConfigs);
            
            // Calculer les statistiques à partir des configs
            let totalInvested = 0;
            let expectedProfit = 0;
            let tokenSymbol = '';
            let numberOfTargets = 0;
            
            if (tokenConfigs.length > 0) {
              const config = tokenConfigs[0];
              totalInvested = config.holding.investedAmount;
              tokenSymbol = config.holding.token.symbol;
              
              // Calculer le profit attendu à partir des règles personnalisées
              if (config.customProfitTakingRules?.levels) {
                numberOfTargets = config.customProfitTakingRules.levels.length;
                const levels = config.customProfitTakingRules.levels;
                
                levels.forEach((level: any) => {
                  const tokensToSell = (config.holding.quantity * level.sellPercentage) / 100;
                  let targetPrice = 0;
                  
                  if (level.targetType === 'percentage') {
                    targetPrice = config.holding.averagePrice * (1 + level.targetValue / 100);
                  } else {
                    targetPrice = level.targetValue;
                  }
                  
                  const profit = tokensToSell * (targetPrice - config.holding.averagePrice);
                  expectedProfit += profit;
                });
              }
            }
            
            const returnPercentage = totalInvested > 0 ? (expectedProfit / totalInvested) * 100 : 0;
            
            return {
              id: strategy.id,
              name: strategy.name,
              portfolioName: strategy.portfolio.name,
              tokenSymbol,
              tokenName: tokenSymbol,
              numberOfTargets,
              totalInvested,
              expectedProfit,
              returnPercentage,
              status: strategy.status,
              createdAt: strategy.createdAt,
            };
          } catch (error) {
            console.error(`Erreur lors du chargement des configs pour ${strategy.id}:`, error);
            return {
              id: strategy.id,
              name: strategy.name,
              portfolioName: strategy.portfolio.name,
              tokenSymbol: '',
              tokenName: '',
              numberOfTargets: 0,
              totalInvested: 0,
              expectedProfit: 0,
              returnPercentage: 0,
              status: strategy.status,
              createdAt: strategy.createdAt,
            };
          }
        })
      );
      
      setStrategies(transformedStrategies);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des stratégies:', error);
      setStrategies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStrategy = () => {
    router.push('/strategies/create');
  };

  const handleEditStrategy = (strategyId: string) => {
    router.push(`/strategies/edit/${strategyId}`);
  };

  const handleDeleteStrategy = async (strategyId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette stratégie ?')) {
      return;
    }
    
    try {
      console.log(`🗑️ Suppression de la stratégie ${strategyId}...`);
      await portfoliosApi.deleteUserStrategy(strategyId);
      console.log(`✅ Stratégie supprimée avec succès`);
      
      // Recharger la liste des stratégies
      await loadStrategies();
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression:', error);
      alert(`Erreur lors de la suppression de la stratégie: ${error.response?.data?.message || error.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des stratégies...</p>
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mes Stratégies</h1>
            <p className="mt-2 text-gray-600">
              Gérez vos stratégies de prise de profit automatisées
            </p>
          </div>
          <Button onClick={handleCreateStrategy} className="bg-blue-600 hover:bg-blue-700">
            <PlusIcon className="h-5 w-5 mr-2" />
            Nouvelle Stratégie
          </Button>
        </div>

        {/* Liste des stratégies */}
        {strategies.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <ChartBarIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune stratégie</h3>
              <p className="text-gray-500 mb-6">
                Créez votre première stratégie de prise de profit pour commencer à automatiser vos gains.
              </p>
              <Button onClick={handleCreateStrategy} className="bg-blue-600 hover:bg-blue-700">
                <PlusIcon className="h-5 w-5 mr-2" />
                Créer ma première stratégie
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {strategies.map((strategy) => (
              <Card key={strategy.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{strategy.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {strategy.portfolioName} • {strategy.tokenSymbol}
                      </CardDescription>
                    </div>
                    <Badge 
                      variant={strategy.status === 'active' ? 'default' : 'secondary'}
                      className={strategy.status === 'active' ? 'bg-green-100 text-green-800' : ''}
                    >
                      {strategy.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Statistiques */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Token</span>
                      <span className="font-medium">{strategy.tokenSymbol}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Nombre de sorties</span>
                      <span className="font-medium">{strategy.numberOfTargets}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Investi</span>
                      <span className="font-medium">{formatCurrency(strategy.totalInvested)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Profit attendu</span>
                      <span className="font-medium text-green-600">
                        {formatCurrency(strategy.expectedProfit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Rendement</span>
                      <span className="font-medium text-green-600 flex items-center gap-1">
                        <ArrowTrendingUpIcon className="h-4 w-4" />
                        {formatPercentage(strategy.returnPercentage)}
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditStrategy(strategy.id)}
                    >
                      <PencilIcon className="h-4 w-4 mr-1" />
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDeleteStrategy(strategy.id)}
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Statistiques globales */}
        {strategies.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Résumé Global</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-gray-500">Stratégies actives</p>
                  <p className="text-2xl font-bold">
                    {strategies.filter(s => s.status === 'active').length}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total investi</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(strategies.reduce((sum, s) => sum + s.totalInvested, 0))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Profit attendu</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(strategies.reduce((sum, s) => sum + s.expectedProfit, 0))}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rendement moyen</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatPercentage(
                      strategies.reduce((sum, s) => sum + s.returnPercentage, 0) / strategies.length
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
