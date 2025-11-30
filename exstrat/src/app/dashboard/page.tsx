'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { usePortfolio } from '@/contexts/PortfolioContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { useTheme } from '@/contexts/ThemeContext';
import { BlocA_ResumeGlobal } from '@/components/dashboard/BlocA_ResumeGlobal';
import { BlocB_EvolutionPortfolio } from '@/components/dashboard/BlocB_EvolutionPortfolio';
import { BlocC_TableauTokens } from '@/components/dashboard/BlocC_TableauTokens';
import { BlocD_VisualisationsCompact } from '@/components/dashboard/BlocD_VisualisationsCompact';
import { BlocD_HistogrammeValorisation } from '@/components/dashboard/BlocD_HistogrammeValorisation';
import { BlocE_StrategiesPrevisions } from '@/components/dashboard/BlocE_StrategiesPrevisions';
import { Holding } from '@/types/portfolio';
import * as portfoliosApi from '@/lib/portfolios-api';
import type { ForecastResponse } from '@/lib/portfolios-api';

interface EvolutionDataPoint {
  date: string;
  valeurBrute: number;
  valeurNette: number;
  investi: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const {
    portfolios,
    currentPortfolio,
    holdings,
    isLoading: portfoliosLoading,
    selectPortfolio,
  } = usePortfolio();
  const { isDarkMode, language } = useTheme();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showStrategies, setShowStrategies] = useState(false);
  const [forecasts, setForecasts] = useState<ForecastResponse[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les prévisions pour vérifier s'il y en a
  useEffect(() => {
    const loadForecasts = async () => {
      if (!currentPortfolio) return;
      
      try {
        const data = await portfoliosApi.getForecasts();
        const portfolioForecasts = data.filter(f => f.portfolioId === currentPortfolio.id);
        setForecasts(portfolioForecasts);
        
        // Afficher automatiquement le bloc E s'il y a des prévisions
        if (portfolioForecasts.length > 0) {
          setShowStrategies(true);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des prévisions:', error);
      }
    };

    if (currentPortfolio) {
      loadForecasts();
    }
  }, [currentPortfolio]);

  // Calculer les statistiques du portfolio actuel
  const portfolioStats = useMemo(() => {
    if (!holdings || holdings.length === 0) {
      return {
        capitalInvesti: 0,
        valeurActuelle: 0,
        pnlAbsolu: 0,
        pnlRelatif: 0,
      };
    }

    const capitalInvesti = holdings.reduce((sum, h) => sum + (h.investedAmount || 0), 0);
    const valeurActuelle = holdings.reduce((sum, h) => {
      const currentValue = h.currentValue || (h.currentPrice || h.averagePrice) * h.quantity;
      return sum + currentValue;
    }, 0);
    const pnlAbsolu = valeurActuelle - capitalInvesti;
    const pnlRelatif = capitalInvesti > 0 ? (pnlAbsolu / capitalInvesti) * 100 : 0;

    return {
      capitalInvesti,
      valeurActuelle,
      pnlAbsolu,
      pnlRelatif,
    };
  }, [holdings]);

  // Générer des données d'évolution (simulation - à remplacer par de vraies données historiques)
  const evolutionData = useMemo<EvolutionDataPoint[]>(() => {
    if (!holdings || holdings.length === 0) return [];

    const now = new Date();
    const data: EvolutionDataPoint[] = [];
    const days = 30; // Générer 30 jours de données

    // Calculer les valeurs actuelles
    const currentInvested = portfolioStats.capitalInvesti;
    const currentValue = portfolioStats.valeurActuelle;

    // Générer des données historiques simulées
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Simuler une évolution progressive
      const progress = i / days;
      const simulatedInvested = currentInvested * (0.7 + 0.3 * progress); // Investissement progressif
      const simulatedValue = simulatedInvested * (1 + (portfolioStats.pnlRelatif / 100) * progress);
      
      data.push({
        date: date.toISOString(),
        valeurBrute: simulatedValue,
        valeurNette: simulatedValue - simulatedInvested,
        investi: simulatedInvested,
      });
    }

    return data;
  }, [holdings, portfolioStats]);

  // Gérer le clic sur un token dans le tableau
  const handleTokenClick = (holding: Holding) => {
    // Si le bloc E est affiché, on peut ouvrir les détails
    // Sinon, on peut naviguer vers la page des stratégies
    if (showStrategies) {
      // Le bloc E gérera l'affichage des détails
      return;
    }
    // Optionnel : naviguer vers les stratégies pour ce token
    // router.push(`/strategies?token=${holding.token.symbol}`);
  };

  if (portfoliosLoading) {
    return (
      <ProtectedRoute>
        <div className={`min-h-screen flex overflow-x-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />
          <div className="flex-1 flex flex-col md:ml-0 overflow-x-hidden w-full max-w-full">
            <TopBar currentPageName={language === 'fr' ? 'Dashboard' : 'Dashboard'} />
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
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />

        <div className="flex-1 flex flex-col md:ml-0 overflow-x-hidden w-full max-w-full">
          <TopBar currentPageName={language === 'fr' ? 'Dashboard' : 'Dashboard'} />

          <div className={`flex-1 p-4 md:p-6 lg:p-8 overflow-x-hidden max-w-full ${isDarkMode ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800' : 'bg-gradient-to-br from-gray-50 via-white to-gray-50'}`}>
            {/* Sélecteur de portfolio */}
            {portfolios.length > 1 && (
              <div className={`mb-5 rounded-2xl p-4 shadow-lg ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-sm border border-gray-700/50' : 'bg-white border border-gray-200/80 shadow-sm'}`}>
                <label className={`block text-xs font-bold uppercase tracking-wide mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {language === 'fr' ? 'Sélectionner un portfolio' : 'Select Portfolio'}
                </label>
                <select
                  value={currentPortfolio?.id || ''}
                  onChange={(e) => selectPortfolio(e.target.value)}
                  className={`w-full md:w-64 px-4 py-2.5 rounded-lg border transition-all duration-200 ${
                    isDarkMode
                      ? 'bg-gray-700/50 border-gray-600/50 text-white hover:border-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                      : 'bg-gray-50 border-gray-300/60 text-gray-900 hover:border-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                  }`}
                >
                  {portfolios.map((portfolio) => (
                    <option key={portfolio.id} value={portfolio.id}>
                      {portfolio.name}
                      {portfolio.isDefault && ` (${language === 'fr' ? 'défaut' : 'default'})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {!currentPortfolio ? (
              <div className={`rounded-2xl p-8 shadow-lg ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-sm border border-gray-700/50' : 'bg-white border border-gray-200/80 shadow-sm'}`}>
                <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <p className="text-lg mb-4">
                    {language === 'fr' 
                      ? 'Aucun portfolio sélectionné. Veuillez créer un portfolio ou en sélectionner un.'
                      : 'No portfolio selected. Please create a portfolio or select one.'}
                  </p>
                  <button
                    onClick={() => router.push('/portfolio')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                  >
                    {language === 'fr' ? 'Gérer les portfolios' : 'Manage Portfolios'}
                  </button>
                </div>
              </div>
            ) : holdings.length === 0 ? (
              <div className={`rounded-2xl p-8 shadow-lg ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-sm border border-gray-700/50' : 'bg-white border border-gray-200/80 shadow-sm'}`}>
                <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <p className="text-lg mb-4">
                    {language === 'fr' 
                      ? 'Ce portfolio ne contient aucun token. Ajoutez des transactions pour commencer.'
                      : 'This portfolio contains no tokens. Add transactions to get started.'}
                  </p>
                  <button
                    onClick={() => router.push('/transactions')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                  >
                    {language === 'fr' ? 'Ajouter une transaction' : 'Add Transaction'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Bloc A - Résumé global (toujours en haut, pleine largeur) */}
                <BlocA_ResumeGlobal
                  capitalInvesti={portfolioStats.capitalInvesti}
                  valeurActuelle={portfolioStats.valeurActuelle}
                  pnlAbsolu={portfolioStats.pnlAbsolu}
                  pnlRelatif={portfolioStats.pnlRelatif}
                />

                {/* Grille principale : Bloc B (graphique) + Bloc D (visualisations compact) */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                  {/* Bloc B - Graphique d'évolution (2/3 de la largeur sur grand écran) */}
                  <div className="xl:col-span-2">
                    <BlocB_EvolutionPortfolio data={evolutionData} />
                  </div>

                  {/* Bloc D - Visualisations graphiques compactes (1/3 de la largeur sur grand écran) */}
                  <div className="xl:col-span-1">
                    <BlocD_VisualisationsCompact holdings={holdings} />
                  </div>
                </div>

                {/* Grille : Bloc C (tableau) + Histogramme valorisation */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  {/* Bloc C - Tableau des tokens (2/3 de la largeur sur grand écran) */}
                  <div className="lg:col-span-2">
                    <BlocC_TableauTokens
                      holdings={holdings}
                      onTokenClick={handleTokenClick}
                    />
                  </div>

                  {/* Histogramme valorisation (1/3 de la largeur sur grand écran) */}
                  <div className="lg:col-span-1">
                    <BlocD_HistogrammeValorisation holdings={holdings} compact={true} />
                  </div>
                </div>

                {/* Bloc E - Surcouche Stratégies & Prévisions (conditionnel, pleine largeur) */}
                {showStrategies && currentPortfolio && (
                  <BlocE_StrategiesPrevisions
                    portfolioId={currentPortfolio.id}
                    holdings={holdings}
                    onClose={() => setShowStrategies(false)}
                  />
                )}

                {/* Bouton pour afficher le bloc E si des prévisions existent mais ne sont pas affichées */}
                {forecasts.length > 0 && !showStrategies && (
                  <div className="text-center">
                    <button
                      onClick={() => setShowStrategies(true)}
                      className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 shadow-md hover:shadow-lg ${
                        isDarkMode
                          ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20'
                          : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/20'
                      }`}
                    >
                      {language === 'fr' ? 'Afficher les Stratégies & Prévisions' : 'Show Strategies & Forecasts'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
