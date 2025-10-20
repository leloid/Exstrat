'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { TransactionResponse, TransactionSearchResponse } from '@/types/transactions';
import { transactionsApi } from '@/lib/transactions-api';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';

interface TransactionListProps {
  onAddTransaction?: () => void;
  onEditTransaction?: (transaction: TransactionResponse) => void;
  onTransactionDeleted?: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ 
  onAddTransaction, 
  onEditTransaction,
  onTransactionDeleted
}) => {
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
  });

  const fetchTransactions = async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      const response = await transactionsApi.getTransactions({
        page,
        limit: pagination.limit,
      });
      
      console.log('📊 Transactions reçues:', response.transactions);
      console.log('📊 Première transaction:', response.transactions[0]);
      console.log('📊 portfolioId:', response.transactions[0]?.portfolioId);
      console.log('📊 portfolio:', response.transactions[0]?.portfolio);
      
      setTransactions(response.transactions);
      setPagination({
        page: response.page,
        limit: response.limit,
        total: response.total,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleDeleteTransaction = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette transaction ?')) {
      return;
    }

    try {
      console.log('🗑️ Suppression de la transaction:', id);
      console.log('🔍 Type de l\'ID:', typeof id);
      console.log('🔍 Est un UUID valide?', /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
      await transactionsApi.deleteTransaction(id);
      console.log('✅ Transaction supprimée avec succès');
      await fetchTransactions(pagination.page);
      // Notifier le parent que la transaction a été supprimée
      onTransactionDeleted?.();
    } catch (err: any) {
      console.error('❌ Erreur lors de la suppression:', err);
      console.error('❌ Détails de l\'erreur:', err.response?.data);
      const errorMessage = err.response?.data?.message || err.response?.data?.error || 'Erreur lors de la suppression';
      setError(errorMessage);
      alert(`Erreur: ${errorMessage}`);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'BUY':
        return <ArrowUpIcon className="h-4 w-4 text-green-600" />;
      case 'SELL':
        return <ArrowDownIcon className="h-4 w-4 text-red-600" />;
      case 'TRANSFER_IN':
        return <ArrowRightIcon className="h-4 w-4 text-blue-600" />;
      case 'TRANSFER_OUT':
        return <ArrowLeftIcon className="h-4 w-4 text-orange-600" />;
      case 'STAKING':
        return <div className="h-4 w-4 bg-purple-600 rounded-full" />;
      case 'REWARD':
        return <div className="h-4 w-4 bg-yellow-600 rounded-full" />;
      default:
        return <div className="h-4 w-4 bg-gray-600 rounded-full" />;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'BUY': return 'Achat';
      case 'SELL': return 'Vente';
      case 'TRANSFER_IN': return 'Transfert entrant';
      case 'TRANSFER_OUT': return 'Transfert sortant';
      case 'STAKING': return 'Staking';
      case 'REWARD': return 'Récompense';
      default: return type;
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type) {
      case 'BUY': return 'text-green-600 bg-green-100';
      case 'SELL': return 'text-red-600 bg-red-100';
      case 'TRANSFER_IN': return 'text-blue-600 bg-blue-100';
      case 'TRANSFER_OUT': return 'text-orange-600 bg-orange-100';
      case 'STAKING': return 'text-purple-600 bg-purple-100';
      case 'REWARD': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Chargement des transactions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Grouper par portfolio (wallet)
  const groupedByPortfolio: Record<string, TransactionResponse[]> = transactions.reduce((acc, tx) => {
    // Utiliser le nom du portfolio s'il existe, sinon "Sans portfolio"
    const portfolioName = tx.portfolio?.name;
    const key = portfolioName || 'Sans portfolio';
    
    console.log(`📋 Transaction ${tx.symbol}: portfolioId=${tx.portfolioId}, portfolio.name=${portfolioName}, key=${key}`);
    
    if (!acc[key]) acc[key] = [];
    acc[key].push(tx);
    return acc;
  }, {} as Record<string, TransactionResponse[]>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mes Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">Aucune transaction trouvée</p>
            <Button
              onClick={onAddTransaction}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Créer votre première transaction
            </Button>
          </div>
        ) : (
          <>
            {/* Groupes par portfolio */}
            <div className="space-y-8">
              {Object.entries(groupedByPortfolio).map(([portfolioName, txs]) => (
                <div
                  key={portfolioName}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">{portfolioName}</h3>
                  </div>

                  <div className="space-y-4">
                    {txs.map((transaction) => (
                      <div key={transaction.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getTransactionIcon(transaction.type)}
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium text-gray-900">{transaction.symbol}</span>
                                <span className="text-sm text-gray-500">{transaction.name}</span>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTransactionTypeColor(transaction.type)}`}>
                                  {getTransactionTypeLabel(transaction.type)}
                                </span>
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date(transaction.transactionDate).toLocaleDateString('fr-FR')}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="font-medium text-gray-900">{transaction.quantity} {transaction.symbol}</div>
                            <div className="text-sm text-gray-500">${transaction.amountInvested.toLocaleString()}</div>
                            <div className="text-xs text-gray-400">@ ${transaction.averagePrice.toLocaleString()}</div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => onEditTransaction?.(transaction)}>
                              <PencilIcon className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteTransaction(transaction.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50">
                              <TrashIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {transaction.notes && (
                          <div className="mt-2 text-sm text-gray-600">{transaction.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div className="mt-6 flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  Affichage de {((pagination.page - 1) * pagination.limit) + 1} à {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} transactions
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTransactions(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTransactions(pagination.page + 1)}
                    disabled={pagination.page * pagination.limit >= pagination.total}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
