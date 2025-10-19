'use client';

import React from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowPathIcon as RefreshCw,
  ArrowTrendingUpIcon as TrendingUp,
  ArrowTrendingDownIcon as TrendingDown,
  WalletIcon as Wallet,
  ArrowsRightLeftIcon as Sync
} from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/format';

export const PortfolioSummary: React.FC = () => {
  const { 
    portfolios, 
    currentPortfolio, 
    holdings, 
    isLoading, 
    error, 
    refreshPortfolios, 
    syncPortfolios 
  } = usePortfolio();

  const totalValue = holdings.reduce((sum, holding) => sum + (holding.currentValue || 0), 0);
  const totalInvested = holdings.reduce((sum, holding) => sum + holding.investedAmount, 0);
  const totalProfitLoss = totalValue - totalInvested;
  const totalProfitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  const handleSync = async () => {
    try {
      await syncPortfolios();
    } catch (error) {
      console.error('Erreur lors de la synchronisation:', error);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshPortfolios();
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Portfolios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="ml-2">Chargement...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Portfolios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={handleRefresh} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* En-tête avec actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="h-6 w-6" />
            Portfolios
          </h2>
          <p className="text-muted-foreground">
            {portfolios.length} portfolio{portfolios.length > 1 ? 's' : ''} • {holdings.length} position{holdings.length > 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSync} variant="outline" size="sm">
            <Sync className="h-4 w-4 mr-2" />
            Synchroniser
          </Button>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Portfolio courant */}
      {currentPortfolio && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
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
                  {totalProfitLoss >= 0 ? (
                    <TrendingUp className="h-4 w-4" />
                  ) : (
                    <TrendingDown className="h-4 w-4" />
                  )}
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

      {/* Liste des positions */}
      {holdings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Positions actuelles</CardTitle>
            <CardDescription>
              Vos avoirs dans le portfolio {currentPortfolio?.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {holdings.map((holding) => (
                <div key={holding.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                      <span className="font-bold text-sm">{holding.token.symbol}</span>
                    </div>
                    <div>
                      <div className="font-medium">{holding.token.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {holding.quantity.toFixed(6)} {holding.token.symbol}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatCurrency(holding.currentValue || 0)}</div>
                    <div className={`text-sm ${
                      (holding.profitLossPercentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(holding.profitLoss || 0)} ({formatPercentage(holding.profitLossPercentage || 0)})
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Message si pas de positions */}
      {holdings.length === 0 && currentPortfolio && (
        <Card>
          <CardContent className="text-center py-8">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Aucune position</h3>
            <p className="text-muted-foreground mb-4">
              Ce portfolio ne contient encore aucune position. Ajoutez des transactions pour voir vos avoirs.
            </p>
            <Button onClick={handleSync} variant="outline">
              <Sync className="h-4 w-4 mr-2" />
              Synchroniser avec les transactions
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
