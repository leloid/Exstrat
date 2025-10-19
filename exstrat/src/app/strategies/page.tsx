'use client';

import React, { useState, useEffect } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { StrategyConfiguration } from '@/components/strategies/StrategyConfiguration';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  PlusIcon as Plus,
  Cog6ToothIcon as Settings,
  ArrowTrendingUpIcon as TrendingUp,
  WalletIcon as Wallet,
  ChartBarIcon as ChartBar,
  PencilIcon as Edit,
  TrashIcon as Delete
} from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/format';
import { useRouter } from 'next/navigation';
import * as portfoliosApi from '@/lib/portfolios-api';

export default function StrategiesPage() {
  const router = useRouter();
  const { 
    portfolios, 
    currentPortfolio, 
    holdings, 
    isLoading, 
    error, 
    refreshPortfolios 
  } = usePortfolio();

  const [strategies, setStrategies] = useState<any[]>([]);
  const [showConfig, setShowConfig] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<string | null>(null);
  const [selectedHolding, setSelectedHolding] = useState<string | null>(null);

  useEffect(() => {
    refreshPortfolios();
    loadStrategies();
  }, [refreshPortfolios]);

  const loadStrategies = async () => {
    try {
      const data = await portfoliosApi.getUserStrategies();
      setStrategies(data);
    } catch (error) {
      console.error('Erreur lors du chargement des stratégies:', error);
    }
  };

  const totalValue = holdings.reduce((sum, holding) => sum + (holding.currentValue || 0), 0);
  const totalInvested = holdings.reduce((sum, holding) => sum + holding.investedAmount, 0);
  const totalProfitLoss = totalValue - totalInvested;
  const totalProfitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  const handleCreateStrategy = () => {
    router.push('/strategies/create');
  };

  const handleConfigureToken = (holdingId: string) => {
    setSelectedHolding(holdingId);
    setShowConfig(true);
  };

  const handleConfigClose = () => {
    setShowConfig(false);
    setSelectedHolding(null);
  };

  const handleDeleteStrategy = async (strategyId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette stratégie ?')) {
      try {
        await portfoliosApi.deleteUserStrategy(strategyId);
        await loadStrategies();
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des portfolios...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <Button onClick={refreshPortfolios} variant="outline">
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Configuration des Stratégies</h1>
          <p className="mt-2 text-gray-600">
            Configurez des stratégies de trading personnalisées pour vos tokens
          </p>
        </div>

        {/* Contenu principal */}
        <div className="space-y-8">
          {/* Résumé du portfolio */}
          {currentPortfolio && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Wallet className="h-6 w-6" />
                      {currentPortfolio.name}
                      {currentPortfolio.isDefault && (
                        <Badge variant="secondary">Par défaut</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{currentPortfolio.description}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                    <div className={`text-sm flex items-center gap-1 ${
                      totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <TrendingUp className="h-4 w-4" />
                      {formatCurrency(totalProfitLoss)} ({formatPercentage(totalProfitLossPercentage)})
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{holdings.length}</div>
                    <div className="text-sm text-muted-foreground">Positions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
                    <div className="text-sm text-muted-foreground">Investi</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                    <div className="text-sm text-muted-foreground">Valeur actuelle</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Stratégies</h2>
              <p className="text-gray-600">
                {strategies.length} stratégie{strategies.length > 1 ? 's' : ''} • {holdings.length} position{holdings.length > 1 ? 's' : ''} disponible{holdings.length > 1 ? 's' : ''}
              </p>
            </div>
            <Button onClick={handleCreateStrategy} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Nouvelle stratégie
            </Button>
          </div>

          {/* Liste des stratégies */}
          {strategies.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Mes Stratégies</h3>
              <div className="grid gap-4">
                {strategies.map((strategy) => (
                  <Card key={strategy.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <ChartBar className="h-6 w-6 text-blue-600" />
                          <div>
                            <CardTitle className="text-lg">{strategy.name}</CardTitle>
                            <CardDescription>{strategy.description}</CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={strategy.status === 'active' ? 'default' : 'secondary'}>
                            {strategy.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteStrategy(strategy.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Delete className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        Portfolio: {strategy.portfolio.name} • 
                        Configurations: {strategy.tokenConfigsCount || 0}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Liste des positions pour configuration */}
          {holdings.length > 0 ? (
            <div className="grid gap-6">
              {holdings.map((holding) => (
                <Card key={holding.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                          <span className="font-bold text-lg">{holding.token.symbol}</span>
                        </div>
                        <div>
                          <CardTitle className="text-lg">{holding.token.name}</CardTitle>
                          <CardDescription>
                            {holding.quantity.toFixed(6)} {holding.token.symbol} • 
                            Prix moyen: {formatCurrency(holding.averagePrice)}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xl font-bold">{formatCurrency(holding.currentValue || 0)}</div>
                        <div className={`text-sm ${
                          (holding.profitLossPercentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(holding.profitLoss || 0)} ({formatPercentage(holding.profitLossPercentage || 0)})
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Investi: {formatCurrency(holding.investedAmount)}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleConfigureToken(holding.id)}
                        className="flex items-center gap-2"
                      >
                        <Settings className="h-4 w-4" />
                        Configurer
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucune position</h3>
                <p className="text-muted-foreground mb-4">
                  Vous n'avez encore aucune position dans ce portfolio. 
                  Ajoutez des transactions pour commencer à configurer des stratégies.
                </p>
                <Button onClick={() => window.location.href = '/transactions'} variant="outline">
                  Aller aux transactions
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Modal de configuration */}
          {showConfig && (
            <StrategyConfiguration
              holdingId={selectedHolding}
              onClose={handleConfigClose}
            />
          )}
        </div>
      </div>
    </div>
  );
}