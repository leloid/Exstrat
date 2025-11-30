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
    const days = 30;

    const currentInvested = portfolioStats.capitalInvesti;
    const currentValue = portfolioStats.valeurActuelle;

    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      const progress = i / days;
      const simulatedInvested = currentInvested * (0.7 + 0.3 * progress);
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
    if (showStrategies) {
      return;
    }
  };

  if (portfoliosLoading) {
    return (
      <ProtectedRoute>
        <div className={`min-h-screen flex overflow-x-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
          <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />
          <div className="flex-1 flex flex-col md:ml-0 overflow-x-hidden w-full max-w-full">
            <TopBar currentPageName={language === 'fr' ? 'Dashboard' : 'Dashboard'} />
            <div className={`flex-1 p-4 flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
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

          <div className={`flex-1 p-3 md:p-4 overflow-x-hidden max-w-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            {/* Sélecteur de portfolio - Compact inline */}
            {portfolios.length > 1 && (
              <div className={`mb-3 inline-flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="text-xs font-medium">{language === 'fr' ? 'Portfolio:' : 'Portfolio:'}</span>
                <select
                  value={currentPortfolio?.id || ''}
                  onChange={(e) => selectPortfolio(e.target.value)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                    isDarkMode
                      ? 'bg-gray-800 border-gray-700 text-white hover:border-gray-600'
                      : 'bg-white border-gray-300 text-gray-900 hover:border-gray-400'
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
              <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <p className="mb-4">
                    {language === 'fr' 
                      ? 'Aucun portfolio sélectionné. Veuillez créer un portfolio ou en sélectionner un.'
                      : 'No portfolio selected. Please create a portfolio or select one.'}
                  </p>
                  <button
                    onClick={() => router.push('/portfolio')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                  >
                    {language === 'fr' ? 'Gérer les portfolios' : 'Manage Portfolios'}
                  </button>
                </div>
              </div>
            ) : holdings.length === 0 ? (
              <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                  <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <p className="mb-4">
                    {language === 'fr' 
                      ? 'Ce portfolio ne contient aucun token. Ajoutez des transactions pour commencer.'
                      : 'This portfolio contains no tokens. Add transactions to get started.'}
                  </p>
                    <button
                      onClick={() => router.push('/transactions')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                    >
                    {language === 'fr' ? 'Ajouter une transaction' : 'Add Transaction'}
                    </button>
                </div>
              </div>
            ) : (
                <div className="space-y-3">
                {/* Bloc A - Résumé global */}
                <BlocA_ResumeGlobal
                  capitalInvesti={portfolioStats.capitalInvesti}
                  valeurActuelle={portfolioStats.valeurActuelle}
                  pnlAbsolu={portfolioStats.pnlAbsolu}
                  pnlRelatif={portfolioStats.pnlRelatif}
                />

                {/* Graphique + Tableau collés ensemble */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
                  {/* Colonne gauche : Graphique + Tableau */}
                  <div className="xl:col-span-8">
                    {/* Graphique d'évolution */}
                    <div className="rounded-lg overflow-hidden">
                      <BlocB_EvolutionPortfolio data={evolutionData} />
                  </div>
                    
                    {/* Tableau des tokens - collé juste en dessous sans espace */}
                    <div className="-mt-3">
                      <BlocC_TableauTokens
                        holdings={holdings}
                        onTokenClick={handleTokenClick}
                      />
              </div>

                    {/* Bloc E - Stratégies & Prévisions - collé juste en dessous du tableau */}
                    {showStrategies && currentPortfolio && (
                      <div className="-mt-3">
                        <BlocE_StrategiesPrevisions
                          portfolioId={currentPortfolio.id}
                          holdings={holdings}
                          onClose={() => setShowStrategies(false)}
                        />
                </div>
                    )}
                  </div>

                  {/* Colonne droite : Visualisations */}
                  <div className="xl:col-span-4 space-y-3">
                    {/* Visualisations compactes */}
                    <BlocD_VisualisationsCompact holdings={holdings} />
                    
                    {/* Histogramme valorisation */}
                    <BlocD_HistogrammeValorisation holdings={holdings} compact={true} />
                </div>
              </div>

                {/* Bouton pour afficher le bloc E si pas encore affiché */}
                {forecasts.length > 0 && !showStrategies && (
                  <div className="text-center pt-2">
                  <button
                      onClick={() => setShowStrategies(true)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isDarkMode 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                      {language === 'fr' ? 'Afficher les Stratégies & Prévisions' : 'Show Strategies & Forecasts'}
                  </button>
                  </div>
                )}

                {/* Bouton pour afficher le bloc E */}
                {forecasts.length > 0 && !showStrategies && (
                  <div className="text-center pt-2">
                  <button
                      onClick={() => setShowStrategies(true)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      isDarkMode 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
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
