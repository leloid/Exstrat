'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { PortfolioSummary, PortfolioItem } from '@/types/transactions';
import { transactionsApi } from '@/lib/transactions-api';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';

export const PortfolioView: React.FC = () => {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPortfolio = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await transactionsApi.getPortfolio();
      setPortfolio(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement du portfolio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

  const calculateTotalValue = (portfolio: PortfolioSummary) => {
    // Pour l'instant, on utilise le montant investi
    // Plus tard, on pourra intégrer les prix en temps réel
    return portfolio.positions.reduce((sum, position) => sum + position.totalInvested, 0);
  };

  const calculateTotalQuantity = (portfolio: PortfolioSummary) => {
    return portfolio.positions.reduce((sum, position) => sum + position.totalQuantity, 0);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Chargement du portfolio...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={fetchPortfolio}
              className="text-blue-600 hover:text-blue-800"
            >
              Réessayer
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!portfolio || portfolio.positions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Mon Portfolio</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">Aucune position dans votre portfolio</p>
            <p className="text-sm text-gray-400">
              Ajoutez des transactions pour voir votre portfolio
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalValue = calculateTotalValue(portfolio);
  const totalQuantity = calculateTotalQuantity(portfolio);

  return (
    <div className="space-y-6">
      {/* Résumé du portfolio */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ChartBarIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Positions actives</p>
                <p className="text-2xl font-semibold text-gray-900">{portfolio.totalPositions}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CurrencyDollarIcon className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total investi</p>
                <p className="text-2xl font-semibold text-gray-900">
                  ${totalValue.toLocaleString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <ArrowTrendingUpIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Tokens détenus</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {totalQuantity.toFixed(8)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Détail des positions */}
      <Card>
        <CardHeader>
          <CardTitle>Détail des Positions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {portfolio.positions.map((position, index) => (
              <div
                key={`${position.symbol}-${position.cmcId}`}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-10 w-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-white font-bold text-sm">
                          {position.symbol.substring(0, 2)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {position.symbol} - {position.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        Prix moyen: ${position.averagePrice.toLocaleString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {position.totalQuantity.toFixed(8)} {position.symbol}
                    </div>
                    <div className="text-sm text-gray-500">
                      ${position.totalInvested.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-400">
                      {position.transactions.length} transaction{position.transactions.length > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {/* Historique des transactions pour cette position */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-2">Dernières transactions:</div>
                  <div className="space-y-1">
                    {position.transactions.slice(-3).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                            transaction.type === 'BUY' ? 'bg-green-100 text-green-800' :
                            transaction.type === 'SELL' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {transaction.type}
                          </span>
                          <span className="text-gray-500">
                            {new Date(transaction.transactionDate).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div className="text-gray-600">
                          {transaction.quantity} @ ${transaction.averagePrice.toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
