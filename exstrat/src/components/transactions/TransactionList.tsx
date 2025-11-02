'use client';

import React, { useState, useEffect } from 'react';
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
  isDarkMode?: boolean;
  language?: 'fr' | 'en';
}

export const TransactionList: React.FC<TransactionListProps> = ({ 
  onAddTransaction, 
  onEditTransaction,
  onTransactionDeleted,
  isDarkMode = true,
  language = 'fr'
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
    if (isDarkMode) {
      switch (type) {
        case 'BUY': return 'text-green-400 bg-green-900/30';
        case 'SELL': return 'text-red-400 bg-red-900/30';
        case 'TRANSFER_IN': return 'text-blue-400 bg-blue-900/30';
        case 'TRANSFER_OUT': return 'text-orange-400 bg-orange-900/30';
        case 'STAKING': return 'text-purple-400 bg-purple-900/30';
        case 'REWARD': return 'text-yellow-400 bg-yellow-900/30';
        default: return 'text-gray-400 bg-gray-800';
      }
    } else {
      switch (type) {
        case 'BUY': return 'text-green-600 bg-green-100';
        case 'SELL': return 'text-red-600 bg-red-100';
        case 'TRANSFER_IN': return 'text-blue-600 bg-blue-100';
        case 'TRANSFER_OUT': return 'text-orange-600 bg-orange-100';
        case 'STAKING': return 'text-purple-600 bg-purple-100';
        case 'REWARD': return 'text-yellow-600 bg-yellow-100';
        default: return 'text-gray-600 bg-gray-100';
      }
    }
  };

  if (loading) {
    return (
      <div className={`rounded-xl p-3 md:p-6 w-full max-w-full ${
        isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
      }`}>
        <div className="flex items-center justify-center">
          <div className={`animate-spin rounded-full h-6 w-6 md:h-8 md:w-8 border-b-2 ${
            isDarkMode ? 'border-purple-600' : 'border-purple-600'
          }`}></div>
          <span className={`ml-2 text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'fr' ? 'Chargement des transactions...' : 'Loading transactions...'}
          </span>
        </div>
      </div>
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
    <div className={`rounded-xl p-3 md:p-6 w-full max-w-full overflow-x-hidden ${
      isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
    }`}>
      <div className="mb-4 md:mb-6">
        <h2 className={`text-base md:text-xl font-semibold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {language === 'fr' ? 'Mes Transactions' : 'My Transactions'}
        </h2>
      </div>

      {error && (
        <div className={`mb-4 p-4 rounded-md ${
          isDarkMode ? 'bg-red-900/30 border border-red-800' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`text-sm ${
            isDarkMode ? 'text-red-400' : 'text-red-600'
          }`}>{error}</p>
        </div>
      )}

      {transactions.length === 0 ? (
        <div className="text-center py-6 md:py-8">
          <p className={`mb-4 text-sm md:text-base ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            {language === 'fr' ? 'Aucune transaction trouvée' : 'No transactions found'}
          </p>
          <Button
            onClick={onAddTransaction}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 md:px-6 py-2 text-sm md:text-base"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            {language === 'fr' ? 'Créer votre première transaction' : 'Create your first transaction'}
          </Button>
        </div>
        ) : (
          <>
            {/* Groupes par portfolio */}
            <div className="space-y-4 md:space-y-8">
              {Object.entries(groupedByPortfolio).map(([portfolioName, txs]) => (
                <div
                  key={portfolioName}
                  className={`rounded-lg p-3 md:p-4 w-full max-w-full ${
                    isDarkMode 
                      ? 'bg-gray-700 border border-gray-600' 
                      : 'bg-gray-50 border border-gray-200'
                  }`}
                >
                  <div className="mb-3 md:mb-4 flex items-center justify-between">
                    <h3 className={`text-base md:text-lg font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{portfolioName}</h3>
                  </div>

                  <div className="space-y-3 md:space-y-4">
                    {txs.map((transaction) => (
                      <div key={transaction.id} className={`rounded-lg p-3 md:p-4 transition-colors w-full max-w-full overflow-x-hidden ${
                        isDarkMode 
                          ? 'bg-gray-800 border border-gray-700 hover:bg-gray-750' 
                          : 'bg-white border border-gray-200 hover:bg-gray-50'
                      }`}>
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                          {/* Section gauche : Icône et infos de base */}
                          <div className="flex items-center space-x-2 md:space-x-3 min-w-0 flex-1">
                            <div className="flex-shrink-0">
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`font-medium text-sm md:text-base ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>{transaction.symbol}</span>
                                <span className={`text-xs md:text-sm hidden sm:inline ${
                                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>{transaction.name}</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${getTransactionTypeColor(transaction.type)}`}>
                                  {getTransactionTypeLabel(transaction.type)}
                                </span>
                              </div>
                              <div className={`text-xs md:text-sm mt-1 ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {new Date(transaction.transactionDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US')}
                              </div>
                            </div>
                          </div>

                          {/* Section droite : Montants et actions */}
                          <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
                            {/* Montants */}
                            <div className="text-right sm:text-right flex-1 sm:flex-initial">
                              <div className={`font-medium text-sm md:text-base ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>{transaction.quantity} {transaction.symbol}</div>
                              <div className={`text-xs md:text-sm ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>${transaction.amountInvested.toLocaleString()}</div>
                              <div className={`text-xs ${
                                isDarkMode ? 'text-gray-500' : 'text-gray-400'
                              }`}>@ ${transaction.averagePrice.toLocaleString()}</div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-1.5 sm:space-x-2 flex-shrink-0">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => onEditTransaction?.(transaction)}
                                className={`p-2 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleDeleteTransaction(transaction.id)} 
                                className={`p-2 ${
                                  isDarkMode 
                                    ? 'border-red-900 text-red-400 hover:bg-red-900/30' 
                                    : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                }`}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>

                        {transaction.notes && (
                          <div className={`mt-2 text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-600'
                          }`}>{transaction.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <div className="mt-4 md:mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0">
                <div className={`text-xs md:text-sm text-center sm:text-left ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {language === 'fr' 
                    ? `Affichage de ${((pagination.page - 1) * pagination.limit) + 1} à ${Math.min(pagination.page * pagination.limit, pagination.total)} sur ${pagination.total} transactions`
                    : `Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} transactions`
                  }
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTransactions(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className={`text-xs md:text-sm px-3 md:px-4 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
                  >
                    {language === 'fr' ? 'Précédent' : 'Previous'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchTransactions(pagination.page + 1)}
                    disabled={pagination.page * pagination.limit >= pagination.total}
                    className={`text-xs md:text-sm px-3 md:px-4 ${isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
                  >
                    {language === 'fr' ? 'Suivant' : 'Next'}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
    </div>
  );
};
