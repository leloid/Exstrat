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
  WalletIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/format';
import * as portfoliosApi from '@/lib/portfolios-api';
import { strategiesApi } from '@/lib/strategies-api';

export default function StrategiesPage() {
  const router = useRouter();
  const { portfolios, refreshPortfolios } = usePortfolio();
  const [activeTab, setActiveTab] = useState('strategies');
  const [viewType, setViewType] = useState<'real' | 'theoretical'>('real'); // Nouveau : type de vue
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

  // Obtenir les stratégies selon le type de vue
  const currentStrategies = viewType === 'real' ? realStrategies : theoreticalStrategies;

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
            <div className="mb-4 md:mb-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
                <div>
                  <p className={`text-sm md:text-base mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fr' 
                      ? 'Gérez vos stratégies de prise de profit automatisées'
                      : 'Manage your automated profit-taking strategies'
                    }
                  </p>
                </div>
                <Button 
                  onClick={handleCreateStrategy} 
                  className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2 px-4 md:px-6 py-2 text-sm md:text-base w-full sm:w-auto"
                >
                  <PlusIcon className="h-4 w-4 md:h-5 md:w-5" />
                  {language === 'fr' ? 'Nouvelle Stratégie' : 'New Strategy'}
                </Button>
              </div>
            </div>

            {/* Tabs pour séparer Réelles et Théoriques */}
            <div className={`mb-4 md:mb-6 flex gap-2 p-1 rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <button
                onClick={() => setViewType('real')}
                className={`flex-1 flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-3 rounded-lg text-sm md:text-base font-medium transition-all ${
                  viewType === 'real'
                    ? isDarkMode
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-purple-600 shadow'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <WalletIcon className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">{language === 'fr' ? 'Portfolios Réels' : 'Real Portfolios'}</span>
                <span className="sm:hidden">{language === 'fr' ? 'Réels' : 'Real'}</span>
                <Badge className={`ml-1 md:ml-2 text-xs ${
                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}>
                  {realStrategies.length}
                </Badge>
              </button>
              <button
                onClick={() => setViewType('theoretical')}
                className={`flex-1 flex items-center justify-center gap-1 md:gap-2 px-2 md:px-4 py-2 md:py-3 rounded-lg text-sm md:text-base font-medium transition-all ${
                  viewType === 'theoretical'
                    ? isDarkMode
                      ? 'bg-purple-600 text-white'
                      : 'bg-white text-purple-600 shadow'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BeakerIcon className="h-4 w-4 md:h-5 md:w-5" />
                <span className="hidden sm:inline">{language === 'fr' ? 'Portfolio Virtuel' : 'Virtual Portfolio'}</span>
                <span className="sm:hidden">{language === 'fr' ? 'Virtuel' : 'Virtual'}</span>
                <Badge className={`ml-1 md:ml-2 text-xs ${
                  isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                }`}>
                  {theoreticalStrategies.length}
                </Badge>
              </button>
            </div>

            {/* Liste des stratégies */}
            {currentStrategies.length === 0 ? (
              <div className={`rounded-xl p-6 md:p-12 text-center w-full max-w-full ${
                isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <ChartBarIcon className={`h-10 w-10 md:h-12 md:w-12 mx-auto mb-3 md:mb-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
                <h3 className={`text-base md:text-lg font-medium mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {language === 'fr' 
                    ? viewType === 'real' 
                      ? 'Aucune stratégie réelle' 
                      : 'Aucune stratégie théorique'
                    : viewType === 'real'
                      ? 'No real strategies'
                      : 'No theoretical strategies'
                  }
                </h3>
                <p className={`text-sm md:text-base mb-4 md:mb-6 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {language === 'fr' 
                    ? viewType === 'real'
                      ? 'Créez une stratégie liée à vos portfolios réels pour automatiser vos gains.'
                      : 'Créez une stratégie dans votre portfolio virtuel pour simuler et planifier vos stratégies.'
                    : viewType === 'real'
                      ? 'Create a strategy linked to your real portfolios to automate your gains.'
                      : 'Create a strategy in your virtual portfolio to simulate and plan your strategies.'
                  }
                </p>
                <Button 
                  onClick={handleCreateStrategy} 
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 md:px-6 py-2 text-sm md:text-base"
                >
                  <PlusIcon className="h-4 w-4 md:h-5 md:w-5 mr-2" />
                  {language === 'fr' ? 'Créer ma première stratégie' : 'Create my first strategy'}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full max-w-full">
                {currentStrategies.map((strategy) => (
                  <div 
                    key={strategy.id} 
                    className={`rounded-xl p-4 md:p-6 transition-shadow hover:shadow-lg w-full max-w-full ${
                      isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
                    } ${strategy.type === 'theoretical' ? 'ring-2 ring-purple-500/20' : ''}`}
                  >
                    {/* Header */}
                    <div className="mb-3 md:mb-4">
                      <div className="flex flex-col sm:flex-row items-start sm:items-start justify-between mb-2 gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <h3 className={`text-base md:text-lg font-semibold truncate ${
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
                          <p className={`mt-1 text-xs md:text-sm truncate ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {strategy.portfolioName} • {strategy.tokenSymbol}
                          </p>
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
                    <div className="space-y-2 md:space-y-3 mb-4 md:mb-6">
                      <div className="flex items-center justify-between text-xs md:text-sm">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                          {language === 'fr' ? 'Token' : 'Token'}
                        </span>
                        <span className={`font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {strategy.tokenSymbol}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs md:text-sm">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                          {language === 'fr' ? 'Nombre de sorties' : 'Exit Targets'}
                        </span>
                        <span className={`font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {strategy.numberOfTargets}
                        </span>
                      </div>
                      {/* Afficher les champs selon le type de stratégie */}
                      {strategy.type === 'theoretical' ? (
                        <>
                          <div className="flex items-center justify-between text-xs md:text-sm">
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                              {language === 'fr' ? 'Investi' : 'Invested'}
                            </span>
                            <span className={`font-medium text-xs md:text-sm ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {formatCurrency(strategy.totalInvested || 0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs md:text-sm">
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                              {language === 'fr' ? 'Profit attendu' : 'Expected Profit'}
                            </span>
                            <span className="font-medium text-xs md:text-sm text-green-600">
                              {formatCurrency(strategy.expectedProfit || 0)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs md:text-sm">
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                              {language === 'fr' ? 'Rendement' : 'Return'}
                            </span>
                            <span className="font-medium text-xs md:text-sm text-green-600 flex items-center gap-1">
                              <ArrowTrendingUpIcon className="h-3 w-3 md:h-4 md:w-4" />
                              {formatPercentage(strategy.returnPercentage || 0)}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-center justify-between text-xs md:text-sm">
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                              {language === 'fr' ? 'Quantité' : 'Quantity'}
                            </span>
                            <span className={`font-medium text-xs md:text-sm ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {strategy.baseQuantity?.toLocaleString() || 0} {strategy.tokenSymbol}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs md:text-sm">
                            <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                              {language === 'fr' ? 'Prix de référence' : 'Reference Price'}
                            </span>
                            <span className={`font-medium text-xs md:text-sm ${
                              isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                              {formatCurrency(strategy.referencePrice || 0)}
                            </span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-3 md:pt-4 border-t border-gray-700">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`flex-1 text-xs md:text-sm px-2 md:px-4 ${
                          isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''
                        }`}
                        onClick={() => handleEditStrategy(strategy.id, strategy.type)}
                      >
                        <PencilIcon className="h-3 w-3 md:h-4 md:w-4 mr-1" />
                        <span className="hidden sm:inline">{language === 'fr' ? 'Modifier' : 'Edit'}</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`p-2 md:p-0 ${
                          isDarkMode 
                            ? 'border-red-900 text-red-400 hover:bg-red-900/30' 
                            : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                        }`}
                        onClick={() => handleDeleteStrategy(strategy.id, strategy.type)}
                      >
                        <TrashIcon className="h-3 w-3 md:h-4 md:w-4" />
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
