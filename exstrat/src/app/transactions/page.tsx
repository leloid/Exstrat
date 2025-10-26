'use client';

import React, { useEffect, useState } from 'react';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { TransactionResponse } from '@/types/transactions';
import { XMarkIcon, PlusIcon as Plus } from '@heroicons/react/24/outline';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/format';
import * as portfoliosApi from '@/lib/portfolios-api';

export default function TransactionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const { portfolios } = usePortfolio();
  const [globalInvested, setGlobalInvested] = useState(0);
  const [globalValue, setGlobalValue] = useState(0);

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
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header épuré */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Transactions</h1>
              <p className="text-gray-500 mt-1">
                Gérez vos transactions crypto de façon professionnelle
              </p>
            </div>
            <Button 
              onClick={handleAddTransaction} 
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Transaction
            </Button>
          </div>
        </div>

        {/* Statistiques globales épurées */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-500 mb-1">Total investi</div>
              <div className="text-2xl font-semibold text-gray-900">{formatCurrency(globalInvested)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-500 mb-1">Valeur actuelle</div>
              <div className="text-2xl font-semibold text-gray-900">{formatCurrency(globalValue)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-500 mb-1">Performance</div>
              <div className={`text-2xl font-semibold ${globalValue >= globalInvested ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(globalValue - globalInvested)}
              </div>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="space-y-8">

        {/* Formulaire de transaction épuré */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {editingTransaction ? 'Modifier la transaction' : 'Nouvelle transaction'}
                </h2>
                <button
                  onClick={handleFormCancel}
                  className="text-gray-400 hover:text-gray-600 p-1"
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
        <TransactionList
          key={refreshKey}
          onAddTransaction={handleAddTransaction}
          onEditTransaction={handleEditTransaction}
          onTransactionDeleted={handleTransactionDeleted}
        />
        </div>
      </div>
    </div>
  );
}
