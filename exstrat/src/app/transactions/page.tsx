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
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Transactions</h1>
          <p className="mt-2 text-gray-600">
            Ajoutez et gérez vos transactions crypto manuellement
          </p>
        </div>

        {/* Bandeau global (tous portfolios) */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Total (tous les portfolios)</h2>
              <p className="text-sm text-gray-600">
                Investi: {formatCurrency(globalInvested)} • Valeur: {formatCurrency(globalValue)}
              </p>
            </div>
            <div>
              <Button onClick={handleAddTransaction} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Ajouter une transaction
              </Button>
            </div>
          </div>
        </div>

        {/* Contenu principal */}
        <div className="space-y-8">

          {/* Formulaire de transaction (modal-like) */}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
              <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingTransaction ? 'Modifier la transaction' : 'Ajouter une transaction'}
                  </h2>
                  <button
                    onClick={handleFormCancel}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="h-6 w-6" />
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
