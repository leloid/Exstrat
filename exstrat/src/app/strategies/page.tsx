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
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/format';
import * as portfoliosApi from '@/lib/portfolios-api';

export default function StrategiesPage() {
  const router = useRouter();
  const { portfolios, refreshPortfolios } = usePortfolio();
  const [activeTab, setActiveTab] = useState('strategies');
  const [strategies, setStrategies] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Utilisation du contexte global pour le thème
  const { isDarkMode, language } = useTheme();

  useEffect(() => {
    loadStrategies();
    refreshPortfolios();
  }, []);

  const loadStrategies = async () => {
    try {
      setIsLoading(true);
      console.log('📥 Chargement des stratégies théoriques...');
      
      // Charger les stratégies théoriques depuis l'API
      const data = await portfoliosApi.getTheoreticalStrategies();
      console.log('✅ Stratégies chargées:', data);
      
      // Les stratégies théoriques contiennent déjà toutes les données calculées
      const transformedStrategies = data.map((strategy) => ({
        id: strategy.id,
        name: strategy.name,
        portfolioName: 'Théorique', // Les stratégies théoriques ne sont pas liées à un portfolio
        tokenSymbol: strategy.tokenSymbol,
        tokenName: strategy.tokenName,
        numberOfTargets: strategy.numberOfTargets,
        totalInvested: strategy.totalInvested,
        expectedProfit: strategy.expectedProfit,
        returnPercentage: strategy.returnPercentage,
        status: strategy.status,
        createdAt: strategy.createdAt,
      }));
      
      setStrategies(transformedStrategies);
    } catch (error) {
      console.error('❌ Erreur lors du chargement des stratégies:', error);
      setStrategies([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateStrategy = () => {
    router.push('/strategies/create');
  };

  const handleEditStrategy = (strategyId: string) => {
    router.push(`/strategies/create?id=${strategyId}`);
  };

  const handleDeleteStrategy = async (strategyId: string) => {
    const confirmText = language === 'fr' ? 'Êtes-vous sûr de vouloir supprimer cette stratégie ?' : 'Are you sure you want to delete this strategy?';
    if (!confirm(confirmText)) {
      return;
    }
    
    try {
      console.log(`🗑️ Suppression de la stratégie ${strategyId}...`);
      await portfoliosApi.deleteTheoreticalStrategy(strategyId);
      console.log(`✅ Stratégie supprimée avec succès`);
      
      // Recharger la liste des stratégies
      await loadStrategies();
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression:', error);
      alert(`Erreur lors de la suppression de la stratégie: ${error.response?.data?.message || error.message}`);
    }
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className={`min-h-screen flex ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />
          <div className="flex-1 flex flex-col">
            <TopBar currentPageName={language === 'fr' ? 'Stratégies' : 'Strategies'} />
            <div className={`flex-1 p-6 flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
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
      <div className={`min-h-screen flex ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />
        
        <div className="flex-1 flex flex-col">
          <TopBar currentPageName={language === 'fr' ? 'Stratégies' : 'Strategies'} />

          <div className={`flex-1 p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fr' 
                      ? 'Gérez vos stratégies de prise de profit automatisées'
                      : 'Manage your automated profit-taking strategies'
                    }
                  </p>
                </div>
                <Button 
                  onClick={handleCreateStrategy} 
                  className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
                >
                  <PlusIcon className="h-5 w-5" />
                  {language === 'fr' ? 'Nouvelle Stratégie' : 'New Strategy'}
                </Button>
              </div>
            </div>

            {/* Liste des stratégies */}
            {strategies.length === 0 ? (
              <div className={`rounded-xl p-12 text-center ${
                isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <ChartBarIcon className={`h-12 w-12 mx-auto mb-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`} />
                <h3 className={`text-lg font-medium mb-2 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                  {language === 'fr' ? 'Aucune stratégie' : 'No strategies'}
                </h3>
                <p className={`mb-6 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {language === 'fr' 
                    ? 'Créez votre première stratégie de prise de profit pour commencer à automatiser vos gains.'
                    : 'Create your first profit-taking strategy to start automating your gains.'
                  }
                </p>
                <Button 
                  onClick={handleCreateStrategy} 
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  {language === 'fr' ? 'Créer ma première stratégie' : 'Create my first strategy'}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {strategies.map((strategy) => (
                  <div 
                    key={strategy.id} 
                    className={`rounded-xl p-6 transition-shadow hover:shadow-lg ${
                      isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
                    }`}
                  >
                    {/* Header */}
                    <div className="mb-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className={`text-lg font-semibold ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            {strategy.name}
                          </h3>
                          <p className={`mt-1 text-sm ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            {strategy.portfolioName} • {strategy.tokenSymbol}
                          </p>
                        </div>
                        <Badge 
                          className={
                            strategy.status === 'active' 
                              ? (isDarkMode ? 'bg-green-900/30 text-green-400' : 'bg-green-100 text-green-800')
                              : (isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-800')
                          }
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
                      <div className="flex items-center justify-between text-sm">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                          {language === 'fr' ? 'Token' : 'Token'}
                        </span>
                        <span className={`font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {strategy.tokenSymbol}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                          {language === 'fr' ? 'Nombre de sorties' : 'Exit Targets'}
                        </span>
                        <span className={`font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {strategy.numberOfTargets}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                          {language === 'fr' ? 'Investi' : 'Invested'}
                        </span>
                        <span className={`font-medium ${
                          isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                          {formatCurrency(strategy.totalInvested)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                          {language === 'fr' ? 'Profit attendu' : 'Expected Profit'}
                        </span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(strategy.expectedProfit)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                          {language === 'fr' ? 'Rendement' : 'Return'}
                        </span>
                        <span className="font-medium text-green-600 flex items-center gap-1">
                          <ArrowTrendingUpIcon className="h-4 w-4" />
                          {formatPercentage(strategy.returnPercentage)}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-4 border-t border-gray-700">
                      <Button
                        variant="outline"
                        size="sm"
                        className={`flex-1 ${
                          isDarkMode ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''
                        }`}
                        onClick={() => handleEditStrategy(strategy.id)}
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        {language === 'fr' ? 'Modifier' : 'Edit'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className={`${
                          isDarkMode 
                            ? 'border-red-900 text-red-400 hover:bg-red-900/30' 
                            : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                        }`}
                        onClick={() => handleDeleteStrategy(strategy.id)}
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
