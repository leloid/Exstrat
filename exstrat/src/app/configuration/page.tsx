'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { usePortfolio } from '@/contexts/PortfolioContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { ConfigurationAlertsTab } from '@/components/configuration/ConfigurationAlertsTab';
import { ConfigurationOrdersTab } from '@/components/configuration/ConfigurationOrdersTab';

export default function ConfigurationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDarkMode, language } = useTheme();
  const { portfolios } = usePortfolio();
  const [activeTab, setActiveTab] = useState('alerts');
  const [activeSubTab, setActiveSubTab] = useState<'alerts' | 'orders'>('alerts');

  return (
    <ProtectedRoute>
      <div className={`min-h-screen flex overflow-x-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Sidebar activeTab="configuration" onTabChange={() => {}} isDarkMode={isDarkMode} />

        <div className="flex-1 flex flex-col md:ml-0 overflow-x-hidden w-full max-w-full">
          <TopBar currentPageName={language === 'fr' ? 'Configuration' : 'Configuration'} />

          <div className={`flex-1 p-4 md:p-6 overflow-x-hidden max-w-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-7xl mx-auto">
              {/* Titre de la page */}
              <div className="mb-6">
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fr' ? 'Configuration' : 'Configuration'}
                </h1>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'fr'
                    ? 'Configurez vos alertes et ordres pour vos stratégies'
                    : 'Configure your alerts and orders for your strategies'}
                </p>
              </div>

              {/* Onglets principaux */}
              <div className="mb-6">
                <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => setActiveSubTab('alerts')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeSubTab === 'alerts'
                        ? isDarkMode
                          ? 'text-purple-400 border-b-2 border-purple-400'
                          : 'text-purple-600 border-b-2 border-purple-600'
                        : isDarkMode
                          ? 'text-gray-400 hover:text-gray-300'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {language === 'fr' ? 'Alertes' : 'Alerts'}
                  </button>
                  <button
                    onClick={() => setActiveSubTab('orders')}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      activeSubTab === 'orders'
                        ? isDarkMode
                          ? 'text-purple-400 border-b-2 border-purple-400'
                          : 'text-purple-600 border-b-2 border-purple-600'
                        : isDarkMode
                          ? 'text-gray-400 hover:text-gray-300'
                          : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {language === 'fr' ? 'Ordres / Exécution' : 'Orders / Execution'}
                    <span className="ml-2 text-xs opacity-75">
                      ({language === 'fr' ? 'V2' : 'V2'})
                    </span>
                  </button>
                </div>
              </div>

              {/* Contenu des onglets */}
              {activeSubTab === 'alerts' ? (
                <ConfigurationAlertsTab />
              ) : (
                <ConfigurationOrdersTab />
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

