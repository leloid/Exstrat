'use client';

import React, { useState, useEffect } from 'react';
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
import { 
  PlusIcon as Plus,
  WalletIcon as Wallet,
  PencilIcon as Edit,
  TrashIcon as Delete,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/format';
import type { Holding } from '@/types/portfolio';

export default function PortfolioPage() {
  const router = useRouter();
  const { 
    portfolios, 
    currentPortfolio, 
    holdings, 
    isLoading, 
    error, 
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
    setCurrentPortfolio,
    refreshPortfolios,
    refreshHoldings,
    syncPortfolios
  } = usePortfolio();

  const [activeTab, setActiveTab] = useState('portfolio');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<string | null>(null);
  const [portfolioValues, setPortfolioValues] = useState<Record<string, {invested: number, value: number}>>({});
  const [holdingsByPortfolio, setHoldingsByPortfolio] = useState<Record<string, Holding[]>>({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false
  });
  
  // Utilisation du contexte global pour le thème
  const { isDarkMode, language } = useTheme();

  // Calculer les totaux pour le portfolio actuellement sélectionné
  const currentPortfolioValue = currentPortfolio ? holdings.reduce((sum, holding) => sum + (holding.currentValue || 0), 0) : 0;
  const currentPortfolioInvested = currentPortfolio ? holdings.reduce((sum, holding) => sum + holding.investedAmount, 0) : 0;
  const currentPortfolioProfitLoss = currentPortfolioValue - currentPortfolioInvested;
  const currentPortfolioProfitLossPercentage = currentPortfolioInvested > 0 ? (currentPortfolioProfitLoss / currentPortfolioInvested) * 100 : 0;

  // Statistiques globales (tous les portfolios)
  const totalPortfolios = portfolios.length;
  const totalPositions = portfolios.reduce((sum, p) => sum + (p.holdingsCount || 0), 0);
  const globalInvested = Object.values(portfolioValues).reduce((sum, v) => sum + (v?.invested || 0), 0);
  const globalValue = Object.values(portfolioValues).reduce((sum, v) => sum + (v?.value || 0), 0);
  const globalProfitLoss = globalValue - globalInvested;
  const globalProfitLossPercentage = globalInvested > 0 ? (globalProfitLoss / globalInvested) * 100 : 0;

  // Charger les valeurs de tous les portfolios
  useEffect(() => {
    const loadAllPortfolioValues = async () => {
      const values: Record<string, {invested: number, value: number}> = {};
      const byPortfolio: Record<string, Holding[]> = {};
      
      for (const portfolio of portfolios) {
        try {
          const portfolioHoldings = await portfoliosApi.getPortfolioHoldings(portfolio.id);
          const invested = portfolioHoldings.reduce((sum, holding) => sum + holding.investedAmount, 0);
          const value = portfolioHoldings.reduce((sum, holding) => sum + (holding.currentValue || 0), 0);
          values[portfolio.id] = { invested, value };
          byPortfolio[portfolio.id] = portfolioHoldings;
        } catch (error) {
          console.error(`Erreur lors du chargement des holdings pour ${portfolio.name}:`, error);
          values[portfolio.id] = { invested: 0, value: 0 };
          byPortfolio[portfolio.id] = [] as Holding[];
        }
      }
      
      setPortfolioValues(values);
      setHoldingsByPortfolio(byPortfolio);
    };
    
    if (portfolios.length > 0) {
      loadAllPortfolioValues();
    }
  }, [portfolios]);

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
    const confirmText = language === 'fr' ? 'Êtes-vous sûr de vouloir supprimer ce portfolio ?' : 'Are you sure you want to delete this portfolio?';
    if (window.confirm(confirmText)) {
      try {
        await deletePortfolio(portfolioId);
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

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className={`min-h-screen flex overflow-x-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />
          <div className="flex-1 flex flex-col overflow-x-hidden w-full max-w-full">
            <TopBar currentPageName={language === 'fr' ? 'Portfolios' : 'Portfolios'} />
            <div className={`flex-1 p-3 md:p-6 flex items-center justify-center overflow-x-hidden max-w-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <div className="text-center">
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
                  isDarkMode ? 'border-purple-600' : 'border-purple-600'
                } mx-auto`}></div>
                <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'fr' ? 'Chargement des portfolios...' : 'Loading portfolios...'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className={`min-h-screen flex overflow-x-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />
        
        <div className="flex-1 flex flex-col overflow-x-hidden w-full max-w-full">
          <TopBar currentPageName={language === 'fr' ? 'Portfolios' : 'Portfolios'} />

          <div className={`flex-1 p-3 md:p-6 overflow-x-hidden max-w-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Header */}
            <div className="mb-4 md:mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div>
                  <p className={`text-sm md:text-base mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {totalPortfolios} {language === 'fr' ? 'portfolio' : 'portfolio'}{totalPortfolios > 1 ? 's' : ''} • {totalPositions} {language === 'fr' ? 'position' : 'position'}{totalPositions > 1 ? 's' : ''}
                  </p>
                </div>
                <Button 
                  onClick={() => setShowCreateForm(true)} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 md:px-6 py-2 rounded-lg text-sm md:text-base font-medium flex items-center gap-2 w-full sm:w-auto"
                >
                  <Plus className="h-4 w-4" />
                  {language === 'fr' ? 'Nouveau Portfolio' : 'New Portfolio'}
                </Button>
              </div>
            </div>

            {/* Statistiques globales */}
            <div className="mb-4 md:mb-8 w-full max-w-full">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6">
                <div className={`rounded-xl p-4 md:p-6 w-full max-w-full ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
                }`}>
                  <div className={`text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {language === 'fr' ? 'Valeur totale' : 'Total Value'}
                  </div>
                  <div className={`text-lg md:text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(globalValue)}
                  </div>
                </div>
                <div className={`rounded-xl p-4 md:p-6 w-full max-w-full ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
                }`}>
                  <div className={`text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {language === 'fr' ? 'Investi' : 'Invested'}
                  </div>
                  <div className={`text-lg md:text-2xl font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {formatCurrency(globalInvested)}
                  </div>
                </div>
                <div className={`rounded-xl p-4 md:p-6 w-full max-w-full ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
                }`}>
                  <div className={`text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {language === 'fr' ? 'Performance' : 'Performance'}
                  </div>
                  <div className={`text-lg md:text-2xl font-semibold ${
                    globalProfitLoss >= 0 ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {formatCurrency(globalProfitLoss)}
                  </div>
                </div>
                <div className={`rounded-xl p-4 md:p-6 w-full max-w-full ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
                }`}>
                  <div className={`text-xs md:text-sm mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {language === 'fr' ? 'Rendement' : 'Return'}
                  </div>
                  <div className={`text-lg md:text-2xl font-semibold ${
                    globalProfitLoss >= 0 ? 'text-green-600' : 'text-red-500'
                  }`}>
                    {formatPercentage(globalProfitLossPercentage)}
                  </div>
                </div>
              </div>
            </div>

            {/* Formulaire */}
            {(showCreateForm || editingPortfolio) && (
              <div className={`mb-4 md:mb-8 rounded-xl p-4 md:p-6 w-full max-w-full ${
                isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <h3 className={`text-base md:text-lg font-semibold mb-3 md:mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {editingPortfolio ? (language === 'fr' ? 'Modifier le Portfolio' : 'Edit Portfolio') : (language === 'fr' ? 'Nouveau Portfolio' : 'New Portfolio')}
                </h3>
                <form onSubmit={editingPortfolio ? handleUpdatePortfolio : handleCreatePortfolio} className="space-y-3 md:space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                    <div>
                      <Label htmlFor="name" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {language === 'fr' ? 'Nom du Portfolio' : 'Portfolio Name'}
                      </Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder={language === 'fr' ? 'Ex: Portfolio Principal' : 'Ex: Main Portfolio'}
                        className={`mt-1 ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300'
                        }`}
                        required
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
                  </div>
                  <div>
                    <Label htmlFor="description" className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {language === 'fr' ? 'Description' : 'Description'}
                    </Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder={language === 'fr' ? 'Description optionnelle...' : 'Optional description...'}
                      rows={2}
                      className={`mt-1 ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={editingPortfolio ? cancelEdit : () => setShowCreateForm(false)}
                    >
                      {language === 'fr' ? 'Annuler' : 'Cancel'}
                    </Button>
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700 text-white">
                      {editingPortfolio ? (language === 'fr' ? 'Modifier' : 'Edit') : (language === 'fr' ? 'Créer' : 'Create')}
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {/* Liste des portfolios */}
            <div className="space-y-3 md:space-y-4">
              {portfolios.map((portfolio) => {
                const portfolioValue = portfolioValues[portfolio.id]?.value || 0;
                const portfolioInvested = portfolioValues[portfolio.id]?.invested || 0;
                const portfolioProfitLoss = portfolioValue - portfolioInvested;
                const portfolioProfitLossPercentage = portfolioInvested > 0 ? (portfolioProfitLoss / portfolioInvested) * 100 : 0;
                const portfolioHoldings = holdingsByPortfolio[portfolio.id] || [];
                
                return (
                  <div key={portfolio.id} className={`rounded-xl p-4 md:p-6 w-full max-w-full ${
                    isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
                  }`}>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-3 md:mb-4">
                      <div className="flex items-center gap-2 md:gap-3 w-full sm:w-auto">
                        <div className={`w-8 h-8 md:w-10 md:h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isDarkMode ? 'bg-gray-700' : 'bg-purple-100'
                        }`}>
                          <Wallet className={`h-4 w-4 md:h-5 md:w-5 ${
                            isDarkMode ? 'text-gray-300' : 'text-purple-600'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-base md:text-lg font-semibold flex flex-wrap items-center gap-2 ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            <span className="truncate">{portfolio.name}</span>
                            {portfolio.isDefault && (
                              <Badge className={`text-xs px-2 py-1 flex-shrink-0 ${
                                isDarkMode ? 'bg-purple-600 text-white' : 'bg-purple-100 text-purple-700'
                              }`}>
                                {language === 'fr' ? 'Par défaut' : 'Default'}
                              </Badge>
                            )}
                          </h3>
                          <p className={`text-xs md:text-sm truncate ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {portfolio.description || (language === 'fr' ? 'Aucune description' : 'No description')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end sm:justify-start">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEdit(portfolio)}
                          className={`flex-1 sm:flex-initial ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeletePortfolio(portfolio.id)}
                          className="flex-1 sm:flex-initial text-red-600 hover:text-red-700"
                        >
                          <Delete className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-3 md:mb-4">
                      <div>
                        <div className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {language === 'fr' ? 'Positions' : 'Positions'}
                        </div>
                        <div className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {portfolio.holdingsCount || 0}
                        </div>
                      </div>
                      <div>
                        <div className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {language === 'fr' ? 'Investi' : 'Invested'}
                        </div>
                        <div className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency(portfolioInvested)}
                        </div>
                      </div>
                      <div>
                        <div className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {language === 'fr' ? 'Valeur' : 'Value'}
                        </div>
                        <div className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {formatCurrency(portfolioValue)}
                        </div>
                      </div>
                      <div>
                        <div className={`text-xs md:text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          {language === 'fr' ? 'Performance' : 'Performance'}
                        </div>
                        <div className={`text-sm md:text-lg font-semibold ${
                          portfolioProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <div className="truncate">{formatCurrency(portfolioProfitLoss)}</div>
                          <div className="text-xs md:text-sm">({formatPercentage(portfolioProfitLossPercentage)})</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Barre de performance */}
                    <div className="mb-4">
                      <div className={`w-full h-2 rounded-full ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                      }`}>
                        <div 
                          className={`h-full rounded-full ${
                            portfolioProfitLoss >= 0 ? 'bg-green-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(Math.abs(portfolioProfitLossPercentage), 100)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Tokens détenus */}
                    {portfolioHoldings.length > 0 && (
                      <div className="w-full max-w-full">
                        <h4 className={`text-xs md:text-sm font-medium mb-2 md:mb-3 ${
                          isDarkMode ? 'text-gray-300' : 'text-gray-700'
                        }`}>
                          {language === 'fr' ? 'Tokens détenus' : 'Held Tokens'}
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                          {portfolioHoldings.slice(0, 6).map((holding) => {
                            const percentage = portfolioValue > 0 ? ((holding.currentValue || 0) / portfolioValue) * 100 : 0;
                            return (
                              <div key={holding.id} className={`flex items-center justify-between p-2 md:p-3 rounded-lg w-full max-w-full ${
                                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                              }`}>
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <div className={`w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                                    isDarkMode ? 'bg-gray-600' : 'bg-purple-200'
                                  }`}>
                                    <span className={`text-xs font-medium ${
                                      isDarkMode ? 'text-white' : 'text-purple-700'
                                    }`}>
                                      {holding.token.symbol.charAt(0)}
                                    </span>
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className={`text-xs md:text-sm font-medium truncate ${
                                      isDarkMode ? 'text-white' : 'text-gray-900'
                                    }`}>
                                      {holding.token.symbol}
                                    </div>
                                    <div className={`text-xs ${
                                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                      {percentage.toFixed(1)}%
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right flex-shrink-0 ml-2">
                                  <div className={`text-xs md:text-sm font-medium ${
                                    isDarkMode ? 'text-white' : 'text-gray-900'
                                  }`}>
                                    {formatCurrency(holding.currentValue || 0)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Message si pas de portfolios */}
            {portfolios.length === 0 && (
              <div className="text-center py-8 md:py-16 w-full max-w-full">
                <div className={`w-12 h-12 md:w-16 md:h-16 rounded-full mx-auto mb-3 md:mb-4 flex items-center justify-center ${
                  isDarkMode ? 'bg-gray-800' : 'bg-purple-100'
                }`}>
                  <Wallet className={`h-6 w-6 md:h-8 md:w-8 ${
                    isDarkMode ? 'text-gray-400' : 'text-purple-600'
                  }`} />
                </div>
                <h3 className={`text-base md:text-lg font-semibold mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {language === 'fr' ? 'Aucun portfolio' : 'No portfolios'}
                </h3>
                <p className={`text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {language === 'fr' 
                    ? 'Utilisez le bouton "Nouveau Portfolio" pour créer votre premier portfolio.'
                    : 'Use the "New Portfolio" button to create your first portfolio.'
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}