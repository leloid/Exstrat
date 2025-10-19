'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/contexts/PortfolioContext';
import AppBar from '@/components/layout/AppBar';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { StrategiesList } from '@/components/strategies/StrategiesList';
import { StrategyForm } from '@/components/strategies/StrategyForm';
import { Toast } from '@/components/ui/Toast';
import { strategiesApi } from '@/lib/strategies-api';
import { transactionsApi } from '@/lib/transactions-api';
import { 
  StrategyResponse, 
  StrategyFormData, 
  StrategyStatus,
  TransactionResponse 
} from '@/types/strategies';

export default function StrategiesPage() {
  const { user } = useAuth();
  const { refreshKey } = usePortfolio();
  const [strategies, setStrategies] = useState<StrategyResponse[]>([]);
  const [userTransactions, setUserTransactions] = useState<TransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<StrategyResponse | null>(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Charger les données
  useEffect(() => {
    loadData();
  }, [refreshKey]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [strategiesData, transactionsData] = await Promise.all([
        strategiesApi.getStrategies(),
        transactionsApi.getTransactions(),
      ]);
      
      setStrategies(strategiesData.strategies);
      setUserTransactions(transactionsData.transactions);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      showToast('Erreur lors du chargement des données', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  const handleCreateStrategy = async (formData: StrategyFormData) => {
    try {
      setFormLoading(true);
      
      // Trouver le token correspondant dans les transactions
      const tokenTransaction = userTransactions.find(tx => tx.symbol === formData.symbol);
      if (!tokenTransaction) {
        showToast('Token non trouvé dans vos transactions', 'error');
        return;
      }

      const createData = {
        ...formData,
        cmcId: tokenTransaction.cmcId,
        tokenName: tokenTransaction.name,
      };

      await strategiesApi.createStrategy(createData);
      showToast('Stratégie créée avec succès !', 'success');
      setShowForm(false);
      loadData();
    } catch (error: any) {
      console.error('Erreur lors de la création de la stratégie:', error);
      showToast(
        error.response?.data?.message || 'Erreur lors de la création de la stratégie',
        'error'
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleUpdateStrategy = async (formData: StrategyFormData) => {
    if (!editingStrategy) return;
    
    try {
      setFormLoading(true);
      
      // Trouver le token correspondant dans les transactions
      const tokenTransaction = userTransactions.find(tx => tx.symbol === formData.symbol);
      if (!tokenTransaction) {
        showToast('Token non trouvé dans vos transactions', 'error');
        return;
      }

      const updateData = {
        name: formData.name,
        symbol: formData.symbol,
        tokenName: formData.tokenName,
        cmcId: tokenTransaction.cmcId,
        baseQuantity: formData.baseQuantity,
        referencePrice: formData.referencePrice,
        steps: formData.steps,
        notes: formData.notes,
      };

      await strategiesApi.updateStrategy(editingStrategy.id, updateData);
      showToast('Stratégie mise à jour avec succès !', 'success');
      setShowForm(false);
      setEditingStrategy(null);
      loadData();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour de la stratégie:', error);
      showToast(
        error.response?.data?.message || 'Erreur lors de la mise à jour de la stratégie',
        'error'
      );
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditStrategy = (strategy: StrategyResponse) => {
    setEditingStrategy(strategy);
    setShowForm(true);
  };

  const handleDeleteStrategy = async (strategy: StrategyResponse) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer la stratégie "${strategy.name}" ?`)) {
      return;
    }

    try {
      await strategiesApi.deleteStrategy(strategy.id);
      showToast('Stratégie supprimée avec succès', 'success');
      loadData();
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error);
      showToast(
        error.response?.data?.message || 'Erreur lors de la suppression',
        'error'
      );
    }
  };

  const handleToggleStatus = async (strategy: StrategyResponse) => {
    try {
      const newStatus = strategy.status === StrategyStatus.ACTIVE 
        ? StrategyStatus.PAUSED 
        : StrategyStatus.ACTIVE;

      await strategiesApi.updateStrategy(strategy.id, { status: newStatus });
      showToast(
        `Stratégie ${newStatus === StrategyStatus.ACTIVE ? 'activée' : 'mise en pause'}`,
        'success'
      );
      loadData();
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error);
      showToast(
        error.response?.data?.message || 'Erreur lors de la mise à jour',
        'error'
      );
    }
  };

  const handleViewDetails = (strategy: StrategyResponse) => {
    // TODO: Implémenter la vue détaillée
    console.log('Voir détails:', strategy);
    showToast('Fonctionnalité à venir', 'info');
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingStrategy(null);
  };

  if (showForm) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <AppBar />
          <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
            <div className="px-4 py-6 sm:px-0">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {editingStrategy ? 'Modifier la stratégie' : 'Nouvelle stratégie'}
                </h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  {editingStrategy 
                    ? 'Modifiez les paramètres de votre stratégie de prise de profit'
                    : 'Créez une nouvelle stratégie de prise de profit pour optimiser vos investissements'
                  }
                </p>
              </div>

              <StrategyForm
                initialData={editingStrategy ? {
                  name: editingStrategy.name || '',
                  symbol: editingStrategy.symbol || '',
                  tokenName: editingStrategy.tokenName || '',
                  cmcId: editingStrategy.cmcId || 0,
                  baseQuantity: editingStrategy.baseQuantity || 0,
                  referencePrice: editingStrategy.referencePrice || 0,
                  notes: editingStrategy.notes || '',
                  steps: editingStrategy.steps?.map(step => ({
                    targetType: step.targetType,
                    targetValue: step.targetValue || 0,
                    sellPercentage: step.sellPercentage || 0,
                    notes: step.notes || '',
                  })) || [],
                } : undefined}
                userTransactions={userTransactions}
                onSubmit={editingStrategy ? handleUpdateStrategy : handleCreateStrategy}
                onCancel={handleCancelForm}
                loading={formLoading}
                isEditing={!!editingStrategy}
              />
            </div>
          </main>
          {toast && (
            <Toast
              message={toast.message}
              type={toast.type}
              onClose={() => setToast(null)}
            />
          )}
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <AppBar />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <StrategiesList
              strategies={strategies}
              loading={loading}
              onCreateNew={() => setShowForm(true)}
              onEdit={handleEditStrategy}
              onDelete={handleDeleteStrategy}
              onToggleStatus={handleToggleStatus}
              onViewDetails={handleViewDetails}
            />
          </div>
        </main>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
