'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { usePortfolio } from '@/contexts/PortfolioContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  WalletIcon,
  BeakerIcon,
  CurrencyDollarIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/format';
import * as portfoliosApi from '@/lib/portfolios-api';
import { strategiesApi } from '@/lib/strategies-api';

export default function StrategiesPage() {
  const router = useRouter();
  const { portfolios, refreshPortfolios } = usePortfolio();
  const [activeTab, setActiveTab] = useState('strategies');
  const [realStrategies, setRealStrategies] = useState<any[]>([]); // Stratégies réelles
  const [theoreticalStrategies, setTheoreticalStrategies] = useState<any[]>([]); // Stratégies théoriques
  const [isLoading, setIsLoading] = useState(true);
  
  // Utilisation du contexte global pour le thème
  const { isDarkMode, language } = useTheme();

  useEffect(() => {
    loadAllStrategies();
    refreshPortfolios();
  }, []);

  const loadAllStrategies = async () => {
    try {
      setIsLoading(true);
      
      // Charger les stratégies réelles (liées aux portfolios)
      try {
        console.log('📥 Chargement des stratégies réelles...');
        const realData = await strategiesApi.getStrategies({});
        console.log('✅ Stratégies réelles chargées:', realData);
        
        const transformedReal = realData.strategies.map((strategy) => ({
          id: strategy.id,
          name: strategy.name,
          type: 'real' as const,
          portfolioName: 'Portfolio Réel', // À améliorer avec le nom réel du portfolio
          tokenSymbol: strategy.symbol,
          tokenName: strategy.tokenName,
          baseQuantity: strategy.baseQuantity,
          referencePrice: strategy.referencePrice,
          numberOfTargets: strategy.steps?.length || 0,
          status: strategy.status,
          createdAt: strategy.createdAt,
          steps: strategy.steps,
        }));
        
        setRealStrategies(transformedReal);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des stratégies réelles:', error);
        setRealStrategies([]);
      }
      
      // Charger les stratégies théoriques (portfolio virtuel)
      try {
        console.log('📥 Chargement des stratégies théoriques...');
        const theoreticalData = await portfoliosApi.getTheoreticalStrategies();
        console.log('✅ Stratégies théoriques chargées:', theoreticalData);
        
        const transformedTheoretical = theoreticalData.map((strategy) => ({
          id: strategy.id,
          name: strategy.name,
          type: 'theoretical' as const,
          portfolioName: 'Portfolio Virtuel', // Portfolio virtuel
          tokenSymbol: strategy.tokenSymbol,
          tokenName: strategy.tokenName,
          numberOfTargets: strategy.numberOfTargets,
          totalInvested: strategy.totalInvested,
          expectedProfit: strategy.expectedProfit,
          returnPercentage: strategy.returnPercentage,
          status: strategy.status,
          createdAt: strategy.createdAt,
        }));
        
        setTheoreticalStrategies(transformedTheoretical);
      } catch (error) {
        console.error('❌ Erreur lors du chargement des stratégies théoriques:', error);
        setTheoreticalStrategies([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStrategy = () => {
    router.push('/strategies/create');
  };

  const handleEditStrategy = (strategyId: string, type: 'real' | 'theoretical') => {
    if (type === 'theoretical') {
      router.push(`/strategies/create?id=${strategyId}`);
    } else {
      // Pour les stratégies réelles, on pourrait avoir une page d'édition différente
      router.push(`/strategies/${strategyId}/edit`);
    }
  };

  const handleDeleteStrategy = async (strategyId: string, type: 'real' | 'theoretical') => {
    const confirmText = language === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cette stratégie ?' : 'Are you sure you want to delete this strategy?';
    if (!confirm(confirmText)) {
      return;
    }
    
    try {
      console.log(`🗑️ Suppression de la stratégie ${strategyId} (type: ${type})...`);
      
      if (type === 'theoretical') {
        await portfoliosApi.deleteTheoreticalStrategy(strategyId);
      } else {
        await strategiesApi.deleteStrategy(strategyId);
      }
      
      console.log(`✅ Stratégie supprimée avec succès`);
      
      // Recharger la liste des stratégies
      await loadAllStrategies();
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression:', error);
      alert(`Erreur lors de la suppression de la stratégie: ${error.response?.data?.message || error.message}`);
    }
  };

  // Combiner toutes les stratégies
  const allStrategies = [...realStrategies, ...theoreticalStrategies];

  // Rediriger vers la page de création si aucune stratégie n'existe
  useEffect(() => {
    if (!isLoading && allStrategies.length === 0) {
      router.push('/strategies/create');
    }
  }, [isLoading, allStrategies.length, router]);

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className={`min-h-screen flex overflow-x-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />
          <div className="flex-1 flex flex-col overflow-x-hidden w-full max-w-full">
            <TopBar currentPageName={language === 'fr' ? 'Stratégies' : 'Strategies'} />
            <div className={`flex-1 p-3 md:p-6 flex items-center justify-center overflow-x-hidden max-w-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
              <div className="text-center">
                <div className={`animate-spin rounded-full h-12 w-12 border-b-2 ${
                  isDarkMode ? 'border-purple-600' : 'border-purple-600'
                } mx-auto`}></div>
                <p className={`mt-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'fr' ? 'Chargement des stratégies...' : 'Loading strategies...'}
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
          <TopBar currentPageName={language === 'fr' ? 'Stratégies' : 'Strategies'} />

          <div className={`flex-1 p-3 md:p-6 overflow-x-hidden max-w-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Header */}
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fr' ? 'Mes Stratégies' : 'My Strategies'}
                  </h1>
                  <p className={`text-sm md:text-base ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fr' 
                      ? 'Gérez vos stratégies de prise de profit automatisées'
                      : 'Manage your automated profit-taking strategies'
                    }
                  </p>
                </div>
                <Button 
                  onClick={handleCreateStrategy} 
                  className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-xl text-sm md:text-base font-medium flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <PlusIcon className="h-5 w-5" />
                  {language === 'fr' ? 'Nouvelle Stratégie' : 'New Strategy'}
                </Button>
              </div>
            </div>

            {/* Liste des stratégies - Tableau professionnel */}
            {allStrategies.length > 0 && (
              <div className={`rounded-xl overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'} shadow-sm`}>
                {/* En-tête du tableau */}
                <div className={`grid grid-cols-12 gap-4 px-6 py-4 border-b ${
                  isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  <div className="col-span-4">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fr' ? 'Stratégie' : 'Strategy'}
                    </span>
                  </div>
                  <div className="col-span-1">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fr' ? 'Token' : 'Token'}
                    </span>
                  </div>
                  <div className="col-span-1 text-center">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fr' ? 'Sorties' : 'Targets'}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fr' ? 'Investi / Quantité' : 'Invested / Qty'}
                    </span>
                  </div>
                  <div className="col-span-2 text-right">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fr' ? 'Profit / Prix réf.' : 'Profit / Ref. Price'}
                    </span>
                  </div>
                  <div className="col-span-2 text-center">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fr' ? 'Actions' : 'Actions'}
                    </span>
                  </div>
                </div>

                {/* Lignes des stratégies */}
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {allStrategies.map((strategy) => (
                    <div
                      key={strategy.id}
                      className={`grid grid-cols-12 gap-4 px-6 py-4 transition-all duration-200 hover:shadow-md ${
                        isDarkMode 
                          ? 'hover:bg-gray-750/50' 
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Colonne Stratégie */}
                      <div className="col-span-4 flex items-center gap-3 min-w-0">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isDarkMode ? 'bg-gradient-to-br from-purple-600 to-blue-600' : 'bg-gradient-to-br from-purple-100 to-blue-100'
                        }`}>
                          <ChartBarIcon className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-purple-600'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {strategy.name}
                          </div>
                          <div className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {strategy.tokenName || strategy.tokenSymbol}
                          </div>
                        </div>
                      </div>

                      {/* Colonne Token */}
                      <div className="col-span-1 flex items-center">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gradient-to-br from-purple-100 to-blue-100'
                        }`}>
                          <span className={`text-xs font-bold ${
                            isDarkMode ? 'text-white' : 'text-purple-700'
                          }`}>
                            {strategy.tokenSymbol?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div className={`ml-2 text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {strategy.tokenSymbol}
                        </div>
                      </div>

                      {/* Colonne Sorties */}
                      <div className="col-span-1 text-center flex flex-col justify-center">
                        <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {strategy.numberOfTargets}
                        </div>
                      </div>

                      {/* Colonne Investi / Quantité */}
                      <div className="col-span-2 text-right flex flex-col justify-center">
                        {strategy.type === 'theoretical' ? (
                          <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(strategy.totalInvested || 0)}
                          </div>
                        ) : (
                          <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {strategy.baseQuantity?.toLocaleString() || 0} {strategy.tokenSymbol}
                          </div>
                        )}
                      </div>

                      {/* Colonne Profit / Prix réf. */}
                      <div className="col-span-2 text-right flex flex-col justify-center">
                        {strategy.type === 'theoretical' ? (
                          <div className={`text-sm font-semibold flex items-center justify-end gap-1 ${
                            (strategy.expectedProfit || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {(strategy.expectedProfit || 0) >= 0 ? (
                              <ArrowTrendingUpIcon className="h-4 w-4" />
                            ) : (
                              <ArrowTrendingDownIcon className="h-4 w-4" />
                            )}
                            <span>{formatCurrency(strategy.expectedProfit || 0)}</span>
                          </div>
                        ) : (
                          <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                            {formatCurrency(strategy.referencePrice || 0)}
                          </div>
                        )}
                      </div>

                      {/* Colonne Actions */}
                      <div className="col-span-2 flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleEditStrategy(strategy.id, strategy.type)}
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
                          onClick={() => handleDeleteStrategy(strategy.id, strategy.type)}
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
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
