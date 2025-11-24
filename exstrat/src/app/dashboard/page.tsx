'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/contexts/PortfolioContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  ChartBarIcon, 
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  WalletIcon,
  BellIcon,
  AcademicCapIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  CurrencyDollarIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/format';
import * as portfoliosApi from '@/lib/portfolios-api';
import { transactionsApi } from '@/lib/transactions-api';
import { strategiesApi } from '@/lib/strategies-api';

interface DashboardStats {
  totalPortfolios: number;
  totalStrategies: number;
  totalHoldings: number;
  totalInvested: number;
  totalValue: number;
  totalPNL: number;
  totalPNLPercentage: number;
}

interface TopHolding {
  symbol: string;
  name: string;
  quantity: number;
  investedAmount: number;
  currentValue: number;
  pnl: number;
  pnlPercentage: number;
  averagePrice: number;
  currentPrice: number;
}

interface RecentActivity {
  id: string;
  type: 'transaction' | 'strategy' | 'portfolio';
  title: string;
  description: string;
  timestamp: Date;
  icon: string;
  color: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { portfolios, isLoading: portfoliosLoading, refreshPortfolios } = usePortfolio();
  const { isDarkMode, language } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats>({
    totalPortfolios: 0,
    totalStrategies: 0,
    totalHoldings: 0,
    totalInvested: 0,
    totalValue: 0,
    totalPNL: 0,
    totalPNLPercentage: 0,
  });
  const [topHoldings, setTopHoldings] = useState<TopHolding[]>([]);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les données du dashboard
  useEffect(() => {
    const loadDashboardData = async () => {
      if (!user || portfoliosLoading) return;
      
      setLoading(true);
      try {
        // Utiliser les portfolios déjà chargés par le contexte
        const currentPortfolios = portfolios;
        
        // Charger toutes les stratégies théoriques
        const strategies = await portfoliosApi.getTheoreticalStrategies();
        
        // Charger les transactions récentes
        const transactionsResponse = await transactionsApi.getTransactions({
          limit: 10,
          page: 1,
        });
        
        // Calculer les statistiques
        let totalInvested = 0;
        let totalValue = 0;
        const holdingsMap = new Map<string, TopHolding>();
        
        // Parcourir tous les portfolios pour calculer les stats
        for (const portfolio of currentPortfolios) {
          try {
            const holdings = await portfoliosApi.getPortfolioHoldings(portfolio.id);
            
            holdings.forEach((holding: any) => {
              const invested = holding.investedAmount || 0;
              const currentPrice = holding.currentPrice || holding.averagePrice || 0;
              const quantity = holding.quantity || 0;
              const currentValue = quantity * currentPrice;
              const pnl = currentValue - invested;
              const pnlPercentage = invested > 0 ? (pnl / invested) * 100 : 0;
              
              totalInvested += invested;
              totalValue += currentValue;
              
              const symbol = holding.token?.symbol || holding.symbol || 'UNKNOWN';
              const existing = holdingsMap.get(symbol);
              
              if (existing) {
                existing.quantity += quantity;
                existing.investedAmount += invested;
                existing.currentValue += currentValue;
                existing.pnl += pnl;
              } else {
                holdingsMap.set(symbol, {
                  symbol,
                  name: holding.token?.name || symbol,
                  quantity,
                  investedAmount: invested,
                  currentValue,
                  pnl,
                  pnlPercentage,
                  averagePrice: holding.averagePrice || 0,
                  currentPrice,
                });
              }
            });
          } catch (error) {
            console.error(`Erreur lors du chargement des holdings pour ${portfolio.id}:`, error);
          }
        }
        
        // Calculer le PNL total
        const totalPNL = totalValue - totalInvested;
        const totalPNLPercentage = totalInvested > 0 ? (totalPNL / totalInvested) * 100 : 0;
        
        // Mettre à jour les stats
        setStats({
          totalPortfolios: currentPortfolios.length,
          totalStrategies: strategies.length,
          totalHoldings: holdingsMap.size,
          totalInvested,
          totalValue,
          totalPNL,
          totalPNLPercentage,
        });
        
        // Calculer les top holdings (triés par valeur actuelle)
        const holdingsArray = Array.from(holdingsMap.values());
        holdingsArray.forEach(holding => {
          holding.pnl = holding.currentValue - holding.investedAmount;
          holding.pnlPercentage = holding.investedAmount > 0 
            ? (holding.pnl / holding.investedAmount) * 100 
            : 0;
        });
        
        const sortedHoldings = holdingsArray
          .sort((a, b) => b.currentValue - a.currentValue)
          .slice(0, 5);
        setTopHoldings(sortedHoldings);
        
        // Créer les activités récentes depuis les transactions
        const activities: RecentActivity[] = transactionsResponse.transactions
          .slice(0, 5)
          .map((tx: any) => {
            const isBuy = tx.type === 'BUY' || tx.type === 'TRANSFER_IN' || tx.type === 'STAKING' || tx.type === 'REWARD';
            return {
              id: tx.id,
              type: 'transaction' as const,
              title: isBuy 
                ? (language === 'fr' ? `Achat ${tx.symbol}` : `Buy ${tx.symbol}`)
                : (language === 'fr' ? `Vente ${tx.symbol}` : `Sell ${tx.symbol}`),
              description: `${tx.quantity} ${tx.symbol} - ${formatCurrency(tx.amountInvested || 0)}`,
              timestamp: new Date(tx.transactionDate || tx.createdAt),
              icon: isBuy ? '📈' : '📉',
              color: isBuy ? 'bg-green-500' : 'bg-red-500',
            };
          });
        
        setRecentActivities(activities);
      } catch (error) {
        console.error('Erreur lors du chargement du dashboard:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, portfoliosLoading, language]);

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'transaction':
        router.push('/transactions');
        break;
      case 'strategy':
        router.push('/strategies');
        break;
      case 'portfolio':
        router.push('/portfolio');
        break;
      case 'alert':
        // TODO: Implémenter la création d'alerte
        console.log('Créer une alerte prix');
        break;
      case 'onboarding':
        router.push('/onboarding');
        break;
    }
  };

  const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) {
      return language === 'fr' ? `Il y a ${minutes} min` : `${minutes}m ago`;
    } else if (hours < 24) {
      return language === 'fr' ? `Il y a ${hours}h` : `${hours}h ago`;
    } else {
      return language === 'fr' ? `Il y a ${days}j` : `${days}d ago`;
    }
  };

  if (loading || portfoliosLoading) {
    return (
      <ProtectedRoute>
        <div className={`min-h-screen flex overflow-x-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />
          <div className="flex-1 flex flex-col md:ml-0 overflow-x-hidden w-full max-w-full">
            <TopBar currentPageName={language === 'fr' ? 'Vue d\'ensemble' : 'Overview'} />
            <div className={`flex-1 p-3 md:p-6 flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
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

  return (
    <ProtectedRoute>
      <div className={`min-h-screen flex overflow-x-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col md:ml-0 overflow-x-hidden w-full max-w-full">
          {/* Top Bar */}
          <TopBar currentPageName={language === 'fr' ? 'Vue d\'ensemble' : 'Overview'} />

          {/* Content */}
          <div className={`flex-1 p-3 md:p-6 overflow-x-hidden max-w-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Actions Rapides */}
            <div className={`rounded-xl p-4 mb-6 max-w-full ${
              isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
            }`}>
              <div className="grid grid-cols-2 md:flex md:items-center gap-3 w-full">
                <button 
                  onClick={() => handleQuickAction('transaction')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">{language === 'fr' ? 'Transaction' : 'Transaction'}</span>
                </button>
                <button 
                  onClick={() => handleQuickAction('strategy')}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <ChartBarIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">{language === 'fr' ? 'Stratégie' : 'Strategy'}</span>
                </button>
                <button 
                  onClick={() => handleQuickAction('portfolio')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                  <WalletIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">{language === 'fr' ? 'Portfolio' : 'Portfolio'}</span>
                </button>
                <button 
                  onClick={() => handleQuickAction('onboarding')}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg hover:shadow-xl col-span-2 md:col-span-1"
                >
                  <AcademicCapIcon className="h-5 w-5" />
                  <span className="text-sm font-medium">{language === 'fr' ? 'Onboarding' : 'Onboarding'}</span>
                </button>
              </div>
            </div>

            {/* Statistiques principales */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {/* Total Investi */}
              <div className={`rounded-xl p-6 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fr' ? 'Total Investi' : 'Total Invested'}
                  </div>
                  <CurrencyDollarIcon className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(stats.totalInvested)}
                </div>
              </div>

              {/* Valeur Totale */}
              <div className={`rounded-xl p-6 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fr' ? 'Valeur Totale' : 'Total Value'}
                  </div>
                  <ArrowTrendingUpIcon className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(stats.totalValue)}
                </div>
              </div>

              {/* PNL Total */}
              <div className={`rounded-xl p-6 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fr' ? 'Profit/Perte' : 'Profit/Loss'}
                  </div>
                  {stats.totalPNL >= 0 ? (
                    <ArrowTrendingUpIcon className="h-5 w-5 text-green-500" />
                  ) : (
                    <ArrowTrendingDownIcon className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <div className={`text-2xl font-bold ${
                  stats.totalPNL >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {formatCurrency(stats.totalPNL)}
                </div>
                <div className={`text-sm mt-1 ${
                  stats.totalPNL >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {formatPercentage(stats.totalPNLPercentage)}
                </div>
              </div>

              {/* Portfolios */}
              <div className={`rounded-xl p-6 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {language === 'fr' ? 'Portfolios' : 'Portfolios'}
                  </div>
                  <WalletIcon className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                </div>
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {stats.totalPortfolios}
                </div>
                <div className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stats.totalStrategies} {language === 'fr' ? 'stratégies' : 'strategies'}
                </div>
              </div>
            </div>

            {/* Grille principale */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              {/* Top Holdings */}
              <div className={`lg:col-span-2 rounded-xl p-6 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fr' ? 'Top Holdings' : 'Top Holdings'}
                  </h3>
                  <button
                    onClick={() => router.push('/portfolio')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                  >
                    {language === 'fr' ? 'Voir tout' : 'View all'}
                    <ArrowRightIcon className="h-4 w-4" />
                  </button>
                </div>
                
                {topHoldings.length === 0 ? (
                  <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <WalletIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>{language === 'fr' ? 'Aucun holding pour le moment' : 'No holdings yet'}</p>
                    <button
                      onClick={() => router.push('/transactions')}
                      className="mt-4 text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {language === 'fr' ? 'Ajouter une transaction' : 'Add a transaction'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topHoldings.map((holding, index) => (
                      <div
                        key={holding.symbol}
                        className={`flex items-center justify-between p-4 rounded-lg ${
                          isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                            {holding.symbol.charAt(0)}
                          </div>
                          <div className="flex-1">
                            <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {holding.symbol}
                            </div>
                            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                              {holding.quantity.toFixed(4)} {holding.symbol}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {formatCurrency(holding.currentValue)}
                          </div>
                          <div className={`text-sm flex items-center gap-1 ${
                            holding.pnl >= 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {holding.pnl >= 0 ? (
                              <ArrowUpIcon className="h-3 w-3" />
                            ) : (
                              <ArrowDownIcon className="h-3 w-3" />
                            )}
                            {formatPercentage(holding.pnlPercentage)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Activités Récentes */}
              <div className={`rounded-xl p-6 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <BellIcon className={`h-5 w-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                  <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fr' ? 'Activités Récentes' : 'Recent Activities'}
                  </h3>
                </div>
                
                {recentActivities.length === 0 ? (
                  <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <p className="text-sm">{language === 'fr' ? 'Aucune activité récente' : 'No recent activities'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3"
                      >
                        <div className={`w-8 h-8 rounded-full ${activity.color} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white text-xs">{activity.icon}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {activity.title}
                          </div>
                          <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                            {activity.description}
                          </div>
                          <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                            {formatTimeAgo(activity.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Statistiques détaillées */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Portfolios */}
              <div className={`rounded-xl p-6 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <WalletIcon className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fr' ? 'Portfolios' : 'Portfolios'}
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fr' ? 'Portfolios actifs' : 'Active portfolios'}
                    </span>
                    <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {stats.totalPortfolios}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fr' ? 'Stratégies' : 'Strategies'}
                    </span>
                    <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {stats.totalStrategies}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fr' ? 'Tokens détenus' : 'Tokens held'}
                    </span>
                    <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {stats.totalHoldings}
                    </span>
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div className={`rounded-xl p-6 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <ChartBarIcon className={`h-5 w-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fr' ? 'Performance' : 'Performance'}
                  </h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fr' ? 'Rendement' : 'Return'}
                    </span>
                    <span className={`font-semibold ${
                      stats.totalPNLPercentage >= 0 ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {formatPercentage(stats.totalPNLPercentage)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fr' ? 'Valeur investie' : 'Invested value'}
                    </span>
                    <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(stats.totalInvested)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {language === 'fr' ? 'Valeur actuelle' : 'Current value'}
                    </span>
                    <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {formatCurrency(stats.totalValue)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions Rapides */}
              <div className={`rounded-xl p-6 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <PlusIcon className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fr' ? 'Actions Rapides' : 'Quick Actions'}
                  </h3>
                </div>
                <div className="space-y-2">
                  <button
                    onClick={() => router.push('/transactions')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    {language === 'fr' ? '➕ Ajouter une transaction' : '➕ Add transaction'}
                  </button>
                  <button
                    onClick={() => router.push('/strategies')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    {language === 'fr' ? '📊 Créer une stratégie' : '📊 Create strategy'}
                  </button>
                  <button
                    onClick={() => router.push('/portfolio')}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      isDarkMode 
                        ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                    }`}
                  >
                    {language === 'fr' ? '💼 Gérer les portfolios' : '💼 Manage portfolios'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
