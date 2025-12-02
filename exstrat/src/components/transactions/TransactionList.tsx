'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { TransactionResponse, TransactionSearchResponse } from '@/types/transactions';
import { transactionsApi } from '@/lib/transactions-api';
import { formatCurrency } from '@/lib/format';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowLeftIcon,
  ChevronDownIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

interface TransactionListProps {
  onAddTransaction?: () => void;
  onEditTransaction?: (transaction: TransactionResponse) => void;
  onTransactionDeleted?: () => void;
  isDarkMode?: boolean;
  language?: 'fr' | 'en';
  displayMode?: 'cards' | 'table';
}

export const TransactionList: React.FC<TransactionListProps> = ({ 
  onAddTransaction, 
  onEditTransaction,
  onTransactionDeleted,
  isDarkMode = true,
  language = 'fr',
  displayMode = 'cards'
}) => {
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
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
        case 'BUY': return 'text-green-400 bg-green-900/30 border-green-700/50';
        case 'SELL': return 'text-red-400 bg-red-900/30 border-red-700/50';
        case 'TRANSFER_IN': return 'text-blue-400 bg-blue-900/30 border-blue-700/50';
        case 'TRANSFER_OUT': return 'text-orange-400 bg-orange-900/30 border-orange-700/50';
        case 'STAKING': return 'text-purple-400 bg-purple-900/30 border-purple-700/50';
        case 'REWARD': return 'text-yellow-400 bg-yellow-900/30 border-yellow-700/50';
        default: return 'text-gray-400 bg-gray-800';
      }
    } else {
      switch (type) {
        case 'BUY': return 'text-green-600 bg-green-100 border-green-200';
        case 'SELL': return 'text-red-600 bg-red-100 border-red-200';
        case 'TRANSFER_IN': return 'text-blue-600 bg-blue-100 border-blue-200';
        case 'TRANSFER_OUT': return 'text-orange-600 bg-orange-100 border-orange-200';
        case 'STAKING': return 'text-purple-600 bg-purple-100 border-purple-200';
        case 'REWARD': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
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

  // Si displayMode est 'table', on retourne juste le contenu sans wrapper
  if (displayMode === 'table') {
    if (loading) {
      return (
        <div className="px-6 py-12 text-center">
          <div className={`animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4 ${
            isDarkMode ? 'border-purple-400' : 'border-purple-600'
          }`}></div>
          <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'fr' ? 'Chargement...' : 'Loading...'}
          </span>
        </div>
      );
    }

    if (error) {
      return (
        <div className={`px-6 py-4 ${
          isDarkMode ? 'bg-red-900/30 border-b border-red-800' : 'bg-red-50 border-b border-red-200'
        }`}>
          <p className={`text-sm ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{error}</p>
        </div>
      );
    }

    if (transactions.length === 0) {
      return (
        <div className="px-6 py-12 text-center">
          <p className={`mb-4 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {language === 'fr' ? 'Aucune transaction trouvée' : 'No transactions found'}
          </p>
          {onAddTransaction && (
            <button
              onClick={onAddTransaction}
              className={`inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDarkMode
                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              {language === 'fr' ? 'Créer votre première transaction' : 'Create your first transaction'}
            </button>
          )}
        </div>
      );
    }

    // Grouper les transactions par token et portfolio
    const groupedTransactions = transactions.reduce((acc, transaction) => {
      const key = `${transaction.symbol}_${transaction.portfolioId || 'no-portfolio'}`;
      if (!acc[key]) {
        acc[key] = {
          symbol: transaction.symbol || '',
          name: transaction.name || '',
          portfolioId: transaction.portfolioId || null,
          portfolioName: transaction.portfolio?.name || (language === 'fr' ? 'Sans portfolio' : 'No portfolio'),
          transactions: [],
          totalQuantity: 0,
          totalAmount: 0,
          averagePrice: 0,
          types: new Set<string>(),
        };
      }
      acc[key].transactions.push(transaction);
      acc[key].totalQuantity += transaction.quantity || 0;
      acc[key].totalAmount += transaction.amountInvested || 0;
      acc[key].types.add(transaction.type);
      return acc;
    }, {} as Record<string, {
      symbol: string;
      name: string;
      portfolioId: string | null;
      portfolioName: string;
      transactions: TransactionResponse[];
      totalQuantity: number;
      totalAmount: number;
      averagePrice: number;
      types: Set<string>;
    }>);

    // Calculer le prix moyen pour chaque groupe
    Object.values(groupedTransactions).forEach(group => {
      group.averagePrice = group.totalQuantity > 0 ? group.totalAmount / group.totalQuantity : 0;
    });

    const toggleGroup = (key: string) => {
      setExpandedGroups(prev => {
        const newSet = new Set(prev);
        if (newSet.has(key)) {
          newSet.delete(key);
        } else {
          newSet.add(key);
        }
        return newSet;
      });
    };

    // Affichage en tableau avec regroupement
    return (
      <>
        {Object.entries(groupedTransactions).map(([key, group]) => {
          const isExpanded = expandedGroups.has(key);
          const primaryType = group.transactions[0]?.type || 'BUY';
          const transactionCount = group.transactions.length;

          return (
            <React.Fragment key={key}>
              {/* Ligne principale du groupe */}
              <div
                className={`grid grid-cols-12 gap-4 px-6 py-4 transition-all duration-200 hover:shadow-md cursor-pointer ${
                  isDarkMode 
                    ? 'hover:bg-gray-750/50' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => toggleGroup(key)}
              >
                {/* Colonne Type */}
                <div className="col-span-2 flex items-center gap-2 min-w-0">
                  <div className="flex-shrink-0">
                    {getTransactionIcon(primaryType)}
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getTransactionTypeColor(primaryType)}`}>
                    {getTransactionTypeLabel(primaryType)}
                  </span>
                  {transactionCount > 1 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                      {transactionCount}
                    </span>
                  )}
                </div>

                {/* Colonne Token */}
                <div className="col-span-2 flex items-center gap-2 min-w-0">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-purple-100 to-blue-100'
                  }`}>
                    <span className={`text-xs font-bold ${
                      isDarkMode ? 'text-white' : 'text-purple-700'
                    }`}>
                      {group.symbol?.charAt(0) || '?'}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className={`text-sm font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {group.symbol}
                    </div>
                    {group.name && (
                      <div className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {group.name}
                      </div>
                    )}
                  </div>
                </div>

                {/* Colonne Portfolio */}
                <div className="col-span-2 flex items-center min-w-0">
                  <div className={`text-sm truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {group.portfolioName}
                  </div>
                </div>

                {/* Colonne Quantité */}
                <div className="col-span-2 text-right flex flex-col justify-center">
                  <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {group.totalQuantity.toLocaleString()}
                  </div>
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {group.symbol}
                  </div>
                </div>

                {/* Colonne Montant */}
                <div className="col-span-2 text-right flex flex-col justify-center">
                  <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(group.totalAmount)}
                  </div>
                </div>

                {/* Colonne Prix */}
                <div className="col-span-1 text-right flex flex-col justify-center">
                  <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {formatCurrency(group.averagePrice, '$', 2)}
                  </div>
                </div>

                {/* Colonne Actions - Flèche pour développer */}
                <div className="col-span-1 flex items-center justify-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleGroup(key);
                    }}
                    className={`p-2 rounded-lg transition-colors ${
                      isDarkMode 
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                        : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                    }`}
                    title={isExpanded ? (language === 'fr' ? 'Réduire' : 'Collapse') : (language === 'fr' ? 'Développer' : 'Expand')}
                  >
                    {isExpanded ? (
                      <ChevronDownIcon className="h-4 w-4" />
                    ) : (
                      <ChevronRightIcon className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Détails des transactions individuelles (quand développé) */}
              {isExpanded && (
                <div className={`${isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'}`}>
                  {group.transactions.map((transaction, index) => (
                    <div
                      key={transaction.id}
                      className={`grid grid-cols-12 gap-4 px-6 py-3 border-b last:border-b-0 ${
                        isDarkMode ? 'border-gray-700' : 'border-gray-200'
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Colonne Type */}
                      <div className="col-span-2 flex items-center gap-2 min-w-0 pl-8">
                        <div className="flex-shrink-0">
                          {getTransactionIcon(transaction.type)}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${getTransactionTypeColor(transaction.type)}`}>
                          {getTransactionTypeLabel(transaction.type)}
                        </span>
                      </div>

                      {/* Colonne Token - Vide car c'est le même */}
                      <div className="col-span-2 flex items-center min-w-0">
                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {new Date(transaction.transactionDate).toLocaleDateString(language === 'fr' ? 'fr-FR' : 'en-US', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </div>
                      </div>

                      {/* Colonne Portfolio - Vide */}
                      <div className="col-span-2"></div>

                      {/* Colonne Quantité */}
                      <div className="col-span-2 text-right flex flex-col justify-center">
                        <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {transaction.quantity?.toLocaleString() || '0'}
                        </div>
                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {transaction.symbol}
                        </div>
                      </div>

                      {/* Colonne Montant */}
                      <div className="col-span-2 text-right flex flex-col justify-center">
                        <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          {formatCurrency(transaction.amountInvested || 0)}
                        </div>
                      </div>

                      {/* Colonne Prix */}
                      <div className="col-span-1 text-right flex flex-col justify-center">
                        <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                          {transaction.averagePrice ? formatCurrency(transaction.averagePrice, '$', 2) : '-'}
                        </div>
                      </div>

                      {/* Colonne Actions */}
                      <div className="col-span-1 flex items-center justify-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onEditTransaction?.(transaction);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode 
                              ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                              : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                          }`}
                          title={language === 'fr' ? 'Modifier' : 'Edit'}
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteTransaction(transaction.id);
                          }}
                          className={`p-2 rounded-lg transition-colors ${
                            isDarkMode
                              ? 'text-red-400 hover:bg-red-900/20 hover:text-red-300'
                              : 'text-red-500 hover:bg-red-50 hover:text-red-700'
                          }`}
                          title={language === 'fr' ? 'Supprimer' : 'Delete'}
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Pagination */}
        {pagination.total > pagination.limit && (
          <div className={`px-6 py-4 border-t flex flex-col sm:flex-row items-center justify-between gap-3 ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <div className={`text-xs text-center sm:text-left ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {language === 'fr' 
                ? `Affichage de ${((pagination.page - 1) * pagination.limit) + 1} à ${Math.min(pagination.page * pagination.limit, pagination.total)} sur ${pagination.total} transactions`
                : `Showing ${((pagination.page - 1) * pagination.limit) + 1} to ${Math.min(pagination.page * pagination.limit, pagination.total)} of ${pagination.total} transactions`
              }
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => fetchTransactions(pagination.page - 1)}
                disabled={pagination.page === 1}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  pagination.page === 1
                    ? isDarkMode
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {language === 'fr' ? 'Précédent' : 'Previous'}
              </button>
              <button
                onClick={() => fetchTransactions(pagination.page + 1)}
                disabled={pagination.page * pagination.limit >= pagination.total}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  pagination.page * pagination.limit >= pagination.total
                    ? isDarkMode
                      ? 'bg-gray-800 text-gray-600 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isDarkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {language === 'fr' ? 'Suivant' : 'Next'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Mode cards (affichage original)
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
