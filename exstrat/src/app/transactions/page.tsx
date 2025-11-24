'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { ExchangeIntegration } from '@/components/transactions/ExchangeIntegration';
import { TransactionResponse } from '@/types/transactions';
import { XMarkIcon, PlusIcon as Plus, CurrencyDollarIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { usePortfolio } from '@/contexts/PortfolioContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { formatCurrency, formatPercentage } from '@/lib/format';
import * as portfoliosApi from '@/lib/portfolios-api';

export default function TransactionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('transactions');
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { portfolios, isLoading: portfoliosLoading } = usePortfolio();
  const [globalStats, setGlobalStats] = useState({
    invested: 0,
    value: 0,
    pnl: 0,
    pnlPercentage: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);
  
  const { isDarkMode, language } = useTheme();

  // Charger les statistiques globales (une seule fois)
  useEffect(() => {
    const loadGlobalStats = async () => {
      if (portfolios.length === 0 || portfoliosLoading || loadingStats) return;
      
      setLoadingStats(true);
      try {
        let invested = 0;
        let value = 0;
        
        for (const p of portfolios) {
          try {
            const hs = await portfoliosApi.getPortfolioHoldings(p.id);
            invested += hs.reduce((s, h) => s + (h.investedAmount || 0), 0);
            value += hs.reduce((s, h) => s + (h.currentValue || 0), 0);
          } catch (e) {
            // ignore errors per portfolio
          }
        }
        
        const pnl = value - invested;
        const pnlPercentage = invested > 0 ? (pnl / invested) * 100 : 0;
        
        setGlobalStats({ invested, value, pnl, pnlPercentage });
      } catch (error) {
        console.error('Erreur lors du chargement des stats:', error);
      } finally {
        setLoadingStats(false);
      }
    };
    
    loadGlobalStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolios.length, portfoliosLoading]);

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };

  const handleEditTransaction = (transaction: TransactionResponse) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleFormSuccess = async () => {
    setShowForm(false);
    setEditingTransaction(null);
    setRefreshKey(prev => prev + 1);
    // Recharger les stats après une transaction
    setLoadingStats(true);
    try {
      let invested = 0;
      let value = 0;
      for (const p of portfolios) {
        try {
          const hs = await portfoliosApi.getPortfolioHoldings(p.id);
          invested += hs.reduce((s, h) => s + (h.investedAmount || 0), 0);
          value += hs.reduce((s, h) => s + (h.currentValue || 0), 0);
        } catch (e) {
          // ignore errors
        }
      }
      const pnl = value - invested;
      const pnlPercentage = invested > 0 ? (pnl / invested) * 100 : 0;
      setGlobalStats({ invested, value, pnl, pnlPercentage });
    } catch (error) {
      console.error('Erreur lors du rechargement des stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleTransactionDeleted = async () => {
    setRefreshKey(prev => prev + 1);
    // Recharger les stats après suppression
    setLoadingStats(true);
    try {
      let invested = 0;
      let value = 0;
      for (const p of portfolios) {
        try {
          const hs = await portfoliosApi.getPortfolioHoldings(p.id);
          invested += hs.reduce((s, h) => s + (h.investedAmount || 0), 0);
          value += hs.reduce((s, h) => s + (h.currentValue || 0), 0);
        } catch (e) {
          // ignore errors
        }
      }
      const pnl = value - invested;
      const pnlPercentage = invested > 0 ? (pnl / invested) * 100 : 0;
      setGlobalStats({ invested, value, pnl, pnlPercentage });
    } catch (error) {
      console.error('Erreur lors du rechargement des stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className={`min-h-screen flex overflow-x-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />
        
        <div className="flex-1 flex flex-col overflow-x-hidden w-full max-w-full">
          <TopBar currentPageName={language === 'fr' ? 'Transactions' : 'Transactions'} />

          <div className={`flex-1 p-3 md:p-6 overflow-x-hidden max-w-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fr' ? 'Mes Transactions' : 'My Transactions'}
                  </h1>
                  <p className={`text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fr' 
                      ? 'Gérez toutes vos transactions crypto en un seul endroit'
                      : 'Manage all your crypto transactions in one place'
                    }
                  </p>
                </div>
                <Button 
                  onClick={handleAddTransaction} 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl text-sm md:text-base font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="h-5 w-5" />
                  {language === 'fr' ? 'Nouvelle Transaction' : 'New Transaction'}
                </Button>
              </div>

              {/* Statistiques globales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`rounded-xl p-5 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'} shadow-sm`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fr' ? 'Total Investi' : 'Total Invested'}
                    </div>
                    <CurrencyDollarIcon className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  </div>
                  <div className={`text-xl md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(globalStats.invested)}
                  </div>
                </div>
                
                <div className={`rounded-xl p-5 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'} shadow-sm`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fr' ? 'Valeur Actuelle' : 'Current Value'}
                    </div>
                    <ArrowTrendingUpIcon className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  </div>
                  <div className={`text-xl md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(globalStats.value)}
                  </div>
                </div>
                
                <div className={`rounded-xl p-5 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'} shadow-sm`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fr' ? 'Profit/Perte' : 'Profit/Loss'}
                    </div>
                    {globalStats.pnl >= 0 ? (
                      <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className={`text-xl md:text-2xl font-bold ${
                    globalStats.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {formatCurrency(globalStats.pnl)}
                  </div>
                  <div className={`text-xs mt-1 ${
                    globalStats.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {formatPercentage(globalStats.pnlPercentage)}
                  </div>
                </div>
                
                <div className={`rounded-xl p-5 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'} shadow-sm`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fr' ? 'Rendement' : 'Return'}
                    </div>
                    {globalStats.pnlPercentage >= 0 ? (
                      <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />
                    )}
                  </div>
                  <div className={`text-xl md:text-2xl font-bold ${
                    globalStats.pnlPercentage >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {formatPercentage(globalStats.pnlPercentage)}
                  </div>
                </div>
              </div>
            </div>

            {/* Intégration des exchanges */}
            <div className="mb-6">
              <ExchangeIntegration isDarkMode={isDarkMode} language={language} />
            </div>

            {/* Modal de transaction */}
            {showForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                <div className={`rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <div className={`sticky top-0 flex items-center justify-between p-6 border-b ${
                    isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                  }`}>
                    <h2 className={`text-lg md:text-xl font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {editingTransaction 
                        ? (language === 'fr' ? 'Modifier la transaction' : 'Edit Transaction')
                        : (language === 'fr' ? 'Nouvelle transaction' : 'New Transaction')
                      }
                    </h2>
                    <button
                      onClick={handleFormCancel}
                      className={`p-2 rounded-lg transition-colors ${
                        isDarkMode 
                          ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <div className="p-6">
                    <TransactionForm
                      onSuccess={handleFormSuccess}
                      onCancel={handleFormCancel}
                      initialData={editingTransaction}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Liste des transactions */}
            <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'} shadow-sm`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg md:text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fr' ? 'Historique des Transactions' : 'Transaction History'}
                </h2>
              </div>
              <TransactionList
                key={refreshKey}
                onAddTransaction={handleAddTransaction}
                onEditTransaction={handleEditTransaction}
                onTransactionDeleted={handleTransactionDeleted}
                isDarkMode={isDarkMode}
                language={language}
              />
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
