'use client';

import React, { useState } from 'react';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { PortfolioSummary } from '@/components/portfolio/PortfolioSummary';
import { TransactionResponse } from '@/types/transactions';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function TransactionsPage() {
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleAddTransaction = () => {
    setEditingTransaction(null);
    setShowForm(true);
  };

  const handleEditTransaction = (transaction: TransactionResponse) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingTransaction(null);
    // Force le rechargement de la liste
    setRefreshKey(prev => prev + 1);
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingTransaction(null);
  };

  const handleTransactionDeleted = () => {
    // Force le rechargement de la liste
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Transactions</h1>
          <p className="mt-2 text-gray-600">
            Ajoutez et gérez vos transactions crypto manuellement
          </p>
        </div>

        {/* Contenu principal */}
        <div className="space-y-8">
          {/* Résumé des portfolios */}
          <PortfolioSummary />

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
