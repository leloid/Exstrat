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

            {/* Liste des stratégies */}
            {allStrategies.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-full">
                {allStrategies.map((strategy) => (
                  <div 
                    key={strategy.id} 
                    className={`rounded-xl p-6 transition-all hover:shadow-xl w-full max-w-full ${
                      isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white border border-gray-200 hover:border-purple-300'
                    } ${strategy.type === 'theoretical' ? 'ring-2 ring-purple-500/20' : ''} shadow-sm`}
                  >
                    {/* Header */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              isDarkMode ? 'bg-gradient-to-br from-purple-600 to-blue-600' : 'bg-gradient-to-br from-purple-100 to-blue-100'
                            }`}>
                              <ChartBarIcon className={`h-6 w-6 ${isDarkMode ? 'text-white' : 'text-purple-600'}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className={`text-lg font-bold truncate ${
                                  isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                  {strategy.name}
                                </h3>
                                {strategy.type === 'theoretical' && (
                                  <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 text-xs flex-shrink-0">
                                    {language === 'fr' ? 'Virtuel' : 'Virtual'}
                                  </Badge>
                                )}
                              </div>
                              <p className={`text-sm truncate ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-600'
                              }`}>
                                {strategy.portfolioName} • {strategy.tokenSymbol}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Badge 
                          className={`flex-shrink-0 ${
                            strategy.status === 'active' 
                              ? (isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800')
                              : (isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-800')
                          }`}
                        >
                          {strategy.status === 'active' 
                            ? (language === 'fr' ? 'Active' : 'Active')
                            : (language === 'fr' ? 'Inactive' : 'Inactive')
                          }
                        </Badge>
                      </div>
                    </div>

                    {/* Statistiques */}
                    <div className="space-y-3 mb-6">
                      <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {language === 'fr' ? 'Token' : 'Token'}
                          </span>
                        </div>
                        <span className={`text-sm font-bold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {strategy.tokenSymbol}
                        </span>
                      </div>
                      <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {language === 'fr' ? 'Nombre de sorties' : 'Exit Targets'}
                          </span>
                        </div>
                        <span className={`text-sm font-bold ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {strategy.numberOfTargets}
                        </span>
                      </div>
                      {/* Afficher les champs selon le type de stratégie */}
                      {strategy.type === 'theoretical' ? (
                        <>
                          <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {language === 'fr' ? 'Investi' : 'Invested'}
                              </span>
                              <CurrencyDollarIcon className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                            </div>
                            <span className={`text-sm font-bold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {formatCurrency(strategy.totalInvested || 0)}
                            </span>
                          </div>
                          <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {language === 'fr' ? 'Profit attendu' : 'Expected Profit'}
                              </span>
                              <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                            </div>
                            <span className="text-sm font-bold text-green-500">
                              {formatCurrency(strategy.expectedProfit || 0)}
                            </span>
                          </div>
                          <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {language === 'fr' ? 'Rendement' : 'Return'}
                              </span>
                              {(strategy.returnPercentage || 0) >= 0 ? (
                                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500" />
                              ) : (
                                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                            <span className={`text-sm font-bold ${
                              (strategy.returnPercentage || 0) >= 0 ? 'text-green-500' : 'text-red-500'
                            }`}>
                              {formatPercentage(strategy.returnPercentage || 0)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {language === 'fr' ? 'Quantité' : 'Quantity'}
                              </span>
                            </div>
                            <span className={`text-sm font-bold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {strategy.baseQuantity?.toLocaleString() || 0} {strategy.tokenSymbol}
                            </span>
                          </div>
                          <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                {language === 'fr' ? 'Prix de référence' : 'Reference Price'}
                              </span>
                              <CurrencyDollarIcon className={`h-4 w-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                            </div>
                            <span className={`text-sm font-bold ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {formatCurrency(strategy.referencePrice || 0)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-gray-700">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`flex-1 text-sm ${
                          isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''
                        }`}
                        onClick={() => handleEditStrategy(strategy.id, strategy.type)}
                      >
                        <PencilIcon className="h-4 w-4 mr-2" />
                        <span className="hidden sm:inline">{language === 'fr' ? 'Modifier' : 'Edit'}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`p-2 ${
                          isDarkMode 
                            ? 'border-red-900 text-red-400 hover:bg-red-900/30' 
                            : 'text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200'
                        }`}
                        onClick={() => handleDeleteStrategy(strategy.id, strategy.type)}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
