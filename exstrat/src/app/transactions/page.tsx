'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { ExchangeIntegration } from '@/components/transactions/ExchangeIntegration';
import { TransactionResponse } from '@/types/transactions';
import { XMarkIcon, PlusIcon as Plus } from '@heroicons/react/24/outline';
import { usePortfolio } from '@/contexts/PortfolioContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';
import * as portfoliosApi from '@/lib/portfolios-api';

export default function TransactionsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('transactions');
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { portfolios } = usePortfolio();
  const [globalInvested, setGlobalInvested] = useState(0);
  const [globalValue, setGlobalValue] = useState(0);
  
  // Utilisation du contexte global pour le thème
  const { isDarkMode, language } = useTheme();

  // Calcule les totaux globaux (tous portfolios)
  useEffect(() => {
    const loadGlobalTotals = async () => {
      let invested = 0;
      let value = 0;
      for (const p of portfolios) {
        try {
          const hs = await portfoliosApi.getPortfolioHoldings(p.id);
          invested += hs.reduce((s, h) => s + h.investedAmount, 0);
          value += hs.reduce((s, h) => s + (h.currentValue || 0), 0);
        } catch (e) {
          // ignore errors per portfolio
        }
      }
      setGlobalInvested(invested);
      setGlobalValue(value);
    };
    if (portfolios.length > 0) loadGlobalTotals();
  }, [portfolios]);

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
    // Force le rechargement de la liste
    setRefreshKey(prev => prev + 1);
    // Recharger les totaux globaux
    await reloadGlobalTotals();
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleTransactionDeleted = async () => {
    // Force le rechargement de la liste
    setRefreshKey(prev => prev + 1);
    // Recharger les totaux globaux
    await reloadGlobalTotals();
  };

  const reloadGlobalTotals = async () => {
    let invested = 0;
    let value = 0;
    for (const p of portfolios) {
      try {
        const hs = await portfoliosApi.getPortfolioHoldings(p.id);
        invested += hs.reduce((s, h) => s + h.investedAmount, 0);
        value += hs.reduce((s, h) => s + (h.currentValue || 0), 0);
      } catch (e) {
        // ignore errors per portfolio
      }
    }
    setGlobalInvested(invested);
    setGlobalValue(value);
  };

  return (
    <ProtectedRoute>
      <div className={`min-h-screen flex overflow-x-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />
        
        <div className="flex-1 flex flex-col overflow-x-hidden w-full max-w-full">
          <TopBar currentPageName={language === 'fr' ? 'Transactions' : 'Transactions'} />

          <div className={`flex-1 p-3 md:p-6 overflow-x-hidden max-w-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Header */}
            <div className="mb-4 md:mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div>
                  <p className={`text-sm md:text-base mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {language === 'fr' 
                      ? 'Gérez vos transactions crypto de façon professionnelle'
                      : 'Manage your crypto transactions professionally'
                    }
                  </p>
                </div>
                <Button 
                  onClick={handleAddTransaction} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 md:px-6 py-2 rounded-lg text-sm md:text-base font-medium flex items-center gap-2 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  {language === 'fr' ? 'Nouvelle Transaction' : 'New Transaction'}
                </Button>
              </div>
            </div>

            {/* Statistiques globales */}
            <div className="mb-4 md:mb-8 w-full max-w-full">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
                <div className={`rounded-xl p-4 md:p-6 w-full max-w-full ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
                }`}>
                  <div className={`text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {language === 'fr' ? 'Total investi' : 'Total Invested'}
                  </div>
                  <div className={`text-lg md:text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(globalInvested)}
                  </div>
                </div>
                <div className={`rounded-xl p-4 md:p-6 w-full max-w-full ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
                }`}>
                  <div className={`text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {language === 'fr' ? 'Valeur actuelle' : 'Current Value'}
                  </div>
                  <div className={`text-lg md:text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(globalValue)}
                  </div>
                </div>
                <div className={`rounded-xl p-4 md:p-6 w-full max-w-full sm:col-span-2 md:col-span-1 ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
                }`}>
                  <div className={`text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {language === 'fr' ? 'Performance' : 'Performance'}
                  </div>
                  <div className={`text-lg md:text-2xl font-semibold ${
                    globalValue >= globalInvested ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {formatCurrency(globalValue - globalInvested)}
                  </div>
                </div>
              </div>
            </div>

            {/* Intégration des exchanges */}
            <ExchangeIntegration isDarkMode={isDarkMode} language={language} />

            {/* Contenu principal */}
            <div className="space-y-4 md:space-y-8 w-full max-w-full">
              {/* Formulaire de transaction */}
              {showForm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 md:p-4 z-50 overflow-y-auto">
                  <div className={`rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto my-4 ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white'
                  }`}>
                    <div className={`flex items-center justify-between p-4 md:p-6 border-b ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <h2 className={`text-base md:text-lg font-semibold ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {editingTransaction 
                          ? (language === 'fr' ? 'Modifier la transaction' : 'Edit Transaction')
                          : (language === 'fr' ? 'Nouvelle transaction' : 'New Transaction')
                        }
                      </h2>
                      <button
                        onClick={handleFormCancel}
                        className={`p-1 ${
                          isDarkMode ? 'text-gray-400 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <XMarkIcon className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="p-4 md:p-6">
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
              <div className="w-full max-w-full">
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
      </div>
    </ProtectedRoute>
  );
}