'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { usePortfolio } from '@/contexts/PortfolioContext';
import * as portfoliosApi from '@/lib/portfolios-api';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { TransactionForm } from '@/components/transactions/TransactionForm';
import { TransactionList } from '@/components/transactions/TransactionList';
import { ExchangeIntegration } from '@/components/transactions/ExchangeIntegration';
import { TransactionResponse } from '@/types/transactions';
import { 
  PlusIcon as Plus,
  WalletIcon as Wallet,
  PencilIcon as Edit,
  TrashIcon as Delete,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  XMarkIcon,
  ArrowRightIcon,
  CurrencyDollarIcon,
  BanknotesIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/format';
import type { Holding } from '@/types/portfolio';

interface PortfolioData {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  holdings: Holding[];
  invested: number;
  value: number;
  pnl: number;
  pnlPercentage: number;
  holdingsCount: number;
}

export default function InvestissementsPage() {
  const router = useRouter();
  const { 
    portfolios, 
    isLoading, 
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
  } = usePortfolio();

  const [activeTab, setActiveTab] = useState('investissements');
  const [currentView, setCurrentView] = useState<'portfolios' | 'transactions'>('portfolios');
  
  // États pour les portfolios
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<string | null>(null);
  const [portfolioData, setPortfolioData] = useState<Record<string, PortfolioData>>({});
  const [loadingPortfolios, setLoadingPortfolios] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false
  });
  
  // États pour les transactions
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<TransactionResponse | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [globalStats, setGlobalStats] = useState({
    invested: 0,
    value: 0,
    pnl: 0,
    pnlPercentage: 0,
  });
  const [loadingStats, setLoadingStats] = useState(false);
  
  const { isDarkMode, language } = useTheme();

  // Charger les données de tous les portfolios
  useEffect(() => {
    const loadPortfolioData = async () => {
      if (portfolios.length === 0 || loadingPortfolios) return;
      
      setLoadingPortfolios(true);
      try {
        const data: Record<string, PortfolioData> = {};
        
        for (const portfolio of portfolios) {
          try {
            const holdings = await portfoliosApi.getPortfolioHoldings(portfolio.id);
            const invested = holdings.reduce((sum, h) => sum + (h.investedAmount || 0), 0);
            const value = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
            const pnl = value - invested;
            const pnlPercentage = invested > 0 ? (pnl / invested) * 100 : 0;
            
            data[portfolio.id] = {
              id: portfolio.id,
              name: portfolio.name,
              description: portfolio.description,
              isDefault: portfolio.isDefault,
              holdings,
              invested,
              value,
              pnl,
              pnlPercentage,
              holdingsCount: holdings.length,
            };
          } catch (error) {
            console.error(`Erreur lors du chargement des holdings pour ${portfolio.name}:`, error);
            data[portfolio.id] = {
              id: portfolio.id,
              name: portfolio.name,
              description: portfolio.description,
              isDefault: portfolio.isDefault,
              holdings: [],
              invested: 0,
              value: 0,
              pnl: 0,
              pnlPercentage: 0,
              holdingsCount: 0,
            };
          }
        }
        
        setPortfolioData(data);
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
      } finally {
        setLoadingPortfolios(false);
      }
    };
    
    if (!isLoading && portfolios.length > 0) {
      loadPortfolioData();
    }
  }, [portfolios, isLoading]);

  // Charger les statistiques globales
  useEffect(() => {
    const loadGlobalStats = async () => {
      if (portfolios.length === 0 || isLoading || loadingStats) return;
      
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
  }, [portfolios.length, isLoading]);

  // Calculer les statistiques globales des portfolios
  const portfolioGlobalStats = useMemo(() => {
    const data = Object.values(portfolioData);
    return {
      totalInvested: data.reduce((sum, p) => sum + p.invested, 0),
      totalValue: data.reduce((sum, p) => sum + p.value, 0),
      totalPNL: data.reduce((sum, p) => sum + p.pnl, 0),
      totalPNLPercentage: data.reduce((sum, p) => sum + p.invested, 0) > 0
        ? (data.reduce((sum, p) => sum + p.pnl, 0) / data.reduce((sum, p) => sum + p.invested, 0)) * 100
        : 0,
      totalHoldings: data.reduce((sum, p) => sum + p.holdingsCount, 0),
    };
  }, [portfolioData]);

  // Handlers pour les portfolios
  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPortfolio(formData);
      setFormData({ name: '', description: '', isDefault: false });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    }
  };

  const handleUpdatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPortfolio) return;
    try {
      await updatePortfolio(editingPortfolio, formData);
      setFormData({ name: '', description: '', isDefault: false });
      setEditingPortfolio(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    const confirmText = language === 'fr' 
      ? 'Êtes-vous sûr de vouloir supprimer ce portfolio ?' 
      : 'Are you sure you want to delete this portfolio?';
    if (window.confirm(confirmText)) {
      try {
        await deletePortfolio(portfolioId);
        setPortfolioData(prev => {
          const newData = { ...prev };
          delete newData[portfolioId];
          return newData;
        });
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const startEdit = (portfolio: any) => {
    setEditingPortfolio(portfolio.id);
    setFormData({
      name: portfolio.name,
      description: portfolio.description || '',
      isDefault: portfolio.isDefault
    });
  };

  const cancelEdit = () => {
    setEditingPortfolio(null);
    setFormData({ name: '', description: '', isDefault: false });
  };

  // Handlers pour les transactions
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

  if (isLoading || loadingPortfolios) {
    return (
      <ProtectedRoute>
        <div className={`min-h-screen flex overflow-x-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />
          <div className="flex-1 flex flex-col overflow-x-hidden w-full max-w-full">
            <TopBar currentPageName={language === 'fr' ? 'Investissements' : 'Investments'} />
            <div className={`flex-1 p-3 md:p-6 flex items-center justify-center overflow-x-hidden max-w-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <div className="text-center">
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4`}></div>
                <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'fr' ? 'Chargement...' : 'Loading...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  // Statistiques à afficher selon la vue
  const stats = currentView === 'portfolios' ? portfolioGlobalStats : globalStats;

  return (
    <ProtectedRoute>
      <div className={`min-h-screen flex overflow-x-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />
        
        <div className="flex-1 flex flex-col overflow-x-hidden w-full max-w-full">
          <TopBar currentPageName={language === 'fr' ? 'Investissements' : 'Investments'} />
          
          <div className={`flex-1 p-3 md:p-6 overflow-x-hidden max-w-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Header avec onglets */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <p className={`text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {currentView === 'portfolios' 
                      ? `${portfolios.length} ${language === 'fr' ? 'portfolio' : 'portfolio'}${portfolios.length > 1 ? 's' : ''} • ${portfolioGlobalStats.totalHoldings} ${language === 'fr' ? 'positions' : 'positions'}`
                      : language === 'fr' 
                        ? 'Gérez toutes vos transactions crypto en un seul endroit'
                        : 'Manage all your crypto transactions in one place'
                    }
                  </p>
                </div>
                <Button 
                  onClick={() => {
                    if (currentView === 'portfolios') {
                      setShowCreateForm(true);
                    } else {
                      handleAddTransaction();
                    }
                  }}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl text-sm md:text-base font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <Plus className="h-5 w-5" />
                  {currentView === 'portfolios' 
                    ? (language === 'fr' ? 'Nouveau Portfolio' : 'New Portfolio')
                    : (language === 'fr' ? 'Nouvelle Transaction' : 'New Transaction')
                  }
                </Button>
              </div>

              {/* Onglets */}
              <div className="flex gap-2 mb-6">
                <button
                  onClick={() => setCurrentView('portfolios')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    currentView === 'portfolios'
                      ? isDarkMode
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-600 text-white'
                      : isDarkMode
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Wallet className="h-5 w-5" />
                  {language === 'fr' ? 'Portfolios' : 'Portfolios'}
                </button>
                <button
                  onClick={() => setCurrentView('transactions')}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                    currentView === 'transactions'
                      ? isDarkMode
                        ? 'bg-purple-600 text-white'
                        : 'bg-purple-600 text-white'
                      : isDarkMode
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <BanknotesIcon className="h-5 w-5" />
                  {language === 'fr' ? 'Transactions' : 'Transactions'}
                </button>
              </div>

              {/* Statistiques globales */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className={`rounded-xl p-5 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'} shadow-sm`}>
                  <div className={`text-xs md:text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {currentView === 'portfolios' 
                      ? (language === 'fr' ? 'Valeur Totale' : 'Total Value')
                      : (language === 'fr' ? 'Valeur Actuelle' : 'Current Value')
                    }
                  </div>
                  <div className={`text-xl md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(currentView === 'portfolios' ? portfolioGlobalStats.totalValue : globalStats.value)}
                  </div>
                </div>
                <div className={`rounded-xl p-5 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'} shadow-sm`}>
                  <div className={`text-xs md:text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fr' ? 'Total Investi' : 'Total Invested'}
                  </div>
                  <div className={`text-xl md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(currentView === 'portfolios' ? portfolioGlobalStats.totalInvested : globalStats.invested)}
                  </div>
                </div>
                <div className={`rounded-xl p-5 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'} shadow-sm`}>
                  <div className={`text-xs md:text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fr' ? 'Profit/Perte' : 'Profit/Loss'}
                  </div>
                  <div className={`text-xl md:text-2xl font-bold ${
                    (currentView === 'portfolios' ? portfolioGlobalStats.totalPNL : globalStats.pnl) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {formatCurrency(currentView === 'portfolios' ? portfolioGlobalStats.totalPNL : globalStats.pnl)}
                  </div>
                  <div className={`text-xs mt-1 ${
                    (currentView === 'portfolios' ? portfolioGlobalStats.totalPNLPercentage : globalStats.pnlPercentage) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {formatPercentage(currentView === 'portfolios' ? portfolioGlobalStats.totalPNLPercentage : globalStats.pnlPercentage)}
                  </div>
                </div>
                <div className={`rounded-xl p-5 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'} shadow-sm`}>
                  <div className={`text-xs md:text-sm mb-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fr' ? 'Rendement' : 'Return'}
                  </div>
                  <div className={`text-xl md:text-2xl font-bold ${
                    (currentView === 'portfolios' ? portfolioGlobalStats.totalPNLPercentage : globalStats.pnlPercentage) >= 0 ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {formatPercentage(currentView === 'portfolios' ? portfolioGlobalStats.totalPNLPercentage : globalStats.pnlPercentage)}
                  </div>
                </div>
              </div>
            </div>

            {/* Contenu selon la vue active */}
            {currentView === 'portfolios' ? (
              <>
                {/* Modal de création/édition portfolio */}
                {(showCreateForm || editingPortfolio) && (
                  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className={`rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto ${
                      isDarkMode ? 'bg-gray-800' : 'bg-white'
                    } shadow-2xl`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {editingPortfolio 
                            ? (language === 'fr' ? 'Modifier le Portfolio' : 'Edit Portfolio')
                            : (language === 'fr' ? 'Nouveau Portfolio' : 'New Portfolio')
                          }
                        </h3>
                        <button
                          onClick={editingPortfolio ? cancelEdit : () => setShowCreateForm(false)}
                          className={`${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                          <XMarkIcon className="h-5 w-5" />
                        </button>
                      </div>
                      <form onSubmit={editingPortfolio ? handleUpdatePortfolio : handleCreatePortfolio} className="space-y-4">
                        <div>
                          <Label htmlFor="name" className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {language === 'fr' ? 'Nom du Portfolio' : 'Portfolio Name'} *
                          </Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder={language === 'fr' ? 'Ex: Portfolio Principal' : 'Ex: Main Portfolio'}
                            className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="description" className={`text-sm font-medium mb-2 block ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {language === 'fr' ? 'Description' : 'Description'}
                          </Label>
                          <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder={language === 'fr' ? 'Description optionnelle...' : 'Optional description...'}
                            rows={3}
                            className={isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : ''}
                          />
                        </div>
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            id="isDefault"
                            checked={formData.isDefault}
                            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                            className="rounded border-gray-300"
                          />
                          <Label htmlFor="isDefault" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {language === 'fr' ? 'Portfolio par défaut' : 'Default portfolio'}
                          </Label>
                        </div>
                        <div className="flex justify-end gap-3 pt-4">
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={editingPortfolio ? cancelEdit : () => setShowCreateForm(false)}
                          >
                            {language === 'fr' ? 'Annuler' : 'Cancel'}
                          </Button>
                          <Button type="submit" className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                            {editingPortfolio ? (language === 'fr' ? 'Modifier' : 'Edit') : (language === 'fr' ? 'Créer' : 'Create')}
                          </Button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Liste des portfolios */}
                {portfolios.length === 0 ? (
                  <div className={`rounded-xl p-12 text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                    <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                      isDarkMode ? 'bg-gray-700' : 'bg-purple-100'
                    }`}>
                      <Wallet className={`h-8 w-8 ${isDarkMode ? 'text-gray-400' : 'text-purple-600'}`} />
                    </div>
                    <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {language === 'fr' ? 'Aucun portfolio' : 'No portfolios'}
                    </h3>
                    <p className={`text-sm mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                      {language === 'fr' 
                        ? 'Créez votre premier portfolio pour commencer à suivre vos investissements.'
                        : 'Create your first portfolio to start tracking your investments.'
                      }
                    </p>
                    <Button
                      onClick={() => setShowCreateForm(true)}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      {language === 'fr' ? 'Créer un portfolio' : 'Create portfolio'}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {portfolios.map((portfolio) => {
                      const data = portfolioData[portfolio.id];
                      if (!data) return null;
                      
                      return (
                        <div
                          key={portfolio.id}
                          className={`rounded-xl p-6 transition-all duration-200 hover:shadow-xl ${
                            isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white border border-gray-200 hover:border-purple-300'
                          }`}
                        >
                          {/* Header du portfolio */}
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-start gap-3 flex-1 min-w-0">
                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                isDarkMode ? 'bg-gradient-to-br from-purple-600 to-blue-600' : 'bg-gradient-to-br from-purple-100 to-blue-100'
                              }`}>
                                <Wallet className={`h-6 w-6 ${isDarkMode ? 'text-white' : 'text-purple-600'}`} />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className={`text-lg font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {data.name}
                                  </h3>
                                  {data.isDefault && (
                                    <Badge className={`text-xs px-2 py-0.5 ${
                                      isDarkMode ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
                                    }`}>
                                      {language === 'fr' ? 'Défaut' : 'Default'}
                                    </Badge>
                                  )}
                                </div>
                                {data.description && (
                                  <p className={`text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    {data.description}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => startEdit(portfolio)}
                                className={`p-2 rounded-lg transition-colors ${
                                  isDarkMode 
                                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white' 
                                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                                }`}
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDeletePortfolio(portfolio.id)}
                                className="p-2 rounded-lg transition-colors text-red-500 hover:bg-red-50 hover:text-red-700"
                              >
                                <Delete className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Statistiques principales */}
                          <div className="mb-4">
                            <div className={`text-2xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {formatCurrency(data.value)}
                            </div>
                            <div className={`text-sm flex items-center gap-2 ${
                              data.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {data.pnl >= 0 ? (
                                <ArrowTrendingUpIcon className="h-4 w-4" />
                              ) : (
                                <ArrowTrendingDownIcon className="h-4 w-4" />
                              )}
                              <span>{formatCurrency(data.pnl)}</span>
                              <span>({formatPercentage(data.pnlPercentage)})</span>
                            </div>
                          </div>

                          {/* Barre de progression */}
                          <div className="mb-4">
                            <div className={`w-full h-2 rounded-full overflow-hidden ${
                              isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                              <div
                                className={`h-full transition-all duration-500 ${
                                  data.pnlPercentage >= 0 ? 'bg-gradient-to-r from-green-400 to-green-600' : 'bg-gradient-to-r from-red-400 to-red-600'
                                }`}
                                style={{ 
                                  width: `${Math.min(Math.abs(data.pnlPercentage), 100)}%` 
                                }}
                              />
                            </div>
                          </div>

                          {/* Détails */}
                          <div className="grid grid-cols-3 gap-4 mb-4">
                            <div>
                              <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {language === 'fr' ? 'Investi' : 'Invested'}
                              </div>
                              <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {formatCurrency(data.invested)}
                              </div>
                            </div>
                            <div>
                              <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {language === 'fr' ? 'Positions' : 'Positions'}
                              </div>
                              <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {data.holdingsCount}
                              </div>
                            </div>
                            <div>
                              <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {language === 'fr' ? 'Tokens' : 'Tokens'}
                              </div>
                              <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                {new Set(data.holdings.map(h => h.token.symbol)).size}
                              </div>
                            </div>
                          </div>

                          {/* Top Holdings */}
                          {data.holdings.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h4 className={`text-sm font-semibold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                  {language === 'fr' ? 'Top Holdings' : 'Top Holdings'}
                                </h4>
                              </div>
                              <div className="space-y-2">
                                {data.holdings
                                  .sort((a, b) => (b.currentValue || 0) - (a.currentValue || 0))
                                  .slice(0, 3)
                                  .map((holding) => {
                                    const percentage = data.value > 0 ? ((holding.currentValue || 0) / data.value) * 100 : 0;
                                    return (
                                      <div
                                        key={holding.id}
                                        className={`flex items-center justify-between p-3 rounded-lg ${
                                          isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                                        }`}
                                      >
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                          <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            isDarkMode ? 'bg-gray-600' : 'bg-gradient-to-br from-purple-200 to-blue-200'
                                          }`}>
                                            <span className={`text-sm font-bold ${
                                              isDarkMode ? 'text-white' : 'text-purple-700'
                                            }`}>
                                              {holding.token.symbol.charAt(0)}
                                            </span>
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <div className={`font-semibold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                              {holding.token.symbol}
                                            </div>
                                            <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                              {percentage.toFixed(1)}% • {holding.quantity.toFixed(4)}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                          <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {formatCurrency(holding.currentValue || 0)}
                                          </div>
                                          <div className={`text-xs flex items-center gap-1 ${
                                            (holding.profitLoss || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                                          }`}>
                                            {(holding.profitLoss || 0) >= 0 ? (
                                              <ArrowTrendingUpIcon className="h-3 w-3" />
                                            ) : (
                                              <ArrowTrendingDownIcon className="h-3 w-3" />
                                            )}
                                            {formatPercentage(holding.profitLossPercentage || 0)}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                              </div>
                            </div>
                          )}

                          {/* Message si aucun holding */}
                          {data.holdings.length === 0 && (
                            <div className={`text-center py-6 rounded-lg ${
                              isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                            }`}>
                              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {language === 'fr' ? 'Aucun holding pour le moment' : 'No holdings yet'}
                              </p>
                              <button
                                onClick={() => setCurrentView('transactions')}
                                className={`mt-2 text-sm font-medium ${
                                  isDarkMode ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'
                                }`}
                              >
                                {language === 'fr' ? 'Ajouter une transaction' : 'Add transaction'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

