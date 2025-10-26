'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { 
  ChartBarIcon, 
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  WalletIcon,
  BellIcon
} from '@heroicons/react/24/outline';

// SVG personnalisés pour le dashboard
const ETHPriceChart = ({ userPosition }: { userPosition: number }) => (
  <svg className="w-full h-32" viewBox="0 0 300 120" fill="none">
    <defs>
      <linearGradient id="ethGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#627EEA" stopOpacity="0.8"/>
        <stop offset="100%" stopColor="#627EEA" stopOpacity="0.1"/>
      </linearGradient>
      <linearGradient id="tealGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#14B8A6" stopOpacity="0.8"/>
        <stop offset="100%" stopColor="#14B8A6" stopOpacity="0.1"/>
      </linearGradient>
    </defs>
    
    {/* Grille de fond */}
    <rect x="0" y="0" width="300" height="120" fill="#1F2937"/>
    
    {/* Lignes de grille */}
    <line x1="0" y1="24" x2="300" y2="24" stroke="#374151" strokeWidth="1"/>
    <line x1="0" y1="48" x2="300" y2="48" stroke="#374151" strokeWidth="1"/>
    <line x1="0" y1="72" x2="300" y2="72" stroke="#374151" strokeWidth="1"/>
    <line x1="0" y1="96" x2="300" y2="96" stroke="#374151" strokeWidth="1"/>
    
    {/* Graphique ETH (ligne violette) */}
    <path
      d="M20,100 L50,85 L80,70 L110,60 L140,45 L170,35 L200,25 L230,30 L260,20 L290,15"
      stroke="#8B5CF6"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    
    {/* Zone remplie ETH */}
    <path
      d="M20,100 L50,85 L80,70 L110,60 L140,45 L170,35 L200,25 L230,30 L260,20 L290,15 L290,120 L20,120 Z"
      fill="url(#ethGradient)"
    />
    
    {/* Graphique secondaire (ligne teal) */}
    <path
      d="M20,95 L50,80 L80,65 L110,55 L140,40 L170,30 L200,20 L230,25 L260,15 L290,10"
      stroke="#14B8A6"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    
    {/* Position utilisateur */}
    <circle cx="200" cy="25" r="6" fill="#8B5CF6" stroke="#FFFFFF" strokeWidth="2"/>
    <circle cx="200" cy="25" r="3" fill="#FFFFFF"/>
    
    {/* Ligne de position utilisateur */}
    <line x1="200" y1="0" x2="200" y2="120" stroke="#8B5CF6" strokeWidth="1" strokeDasharray="4,4" opacity="0.6"/>
    
    {/* Labels Y */}
    <text x="5" y="20" textAnchor="start" fill="#9CA3AF" fontSize="10">50k</text>
    <text x="5" y="44" textAnchor="start" fill="#9CA3AF" fontSize="10">40k</text>
    <text x="5" y="68" textAnchor="start" fill="#9CA3AF" fontSize="10">30k</text>
    <text x="5" y="92" textAnchor="start" fill="#9CA3AF" fontSize="10">20k</text>
    <text x="5" y="116" textAnchor="start" fill="#9CA3AF" fontSize="10">10k</text>
  </svg>
);

const TokenCard = ({ symbol, name, price, change, icon, color, isDarkMode }: {
  symbol: string;
  name: string;
  price: string;
  change: string;
  icon: string;
  color: string;
  isDarkMode: boolean;
}) => {
  const isPositive = change.startsWith('+');
  
  return (
    <div className={`rounded-xl p-4 min-w-[200px] transition-colors ${
      isDarkMode ? 'bg-gray-800 hover:bg-gray-750' : 'bg-white hover:bg-gray-50 border border-gray-200'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color}`}>
          <span className="text-white font-bold text-sm">{icon}</span>
        </div>
        <div>
          <div className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{symbol}</div>
          <div className="text-gray-400 text-xs">{name}</div>
        </div>
      </div>
      
      <div className="mb-2">
        <div className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{price}</div>
        <div className={`text-sm flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <ArrowUpIcon className="h-3 w-3" /> : <ArrowDownIcon className="h-3 w-3" />}
          {change}
        </div>
      </div>
      
      {/* Mini graphique */}
      <div className="h-8">
        <svg className="w-full h-full" viewBox="0 0 100 32" fill="none">
          <path
            d="M0,20 L20,15 L40,10 L60,8 L80,12 L100,5"
            stroke={isPositive ? "#10B981" : "#EF4444"}
            strokeWidth="1.5"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [language, setLanguage] = useState<'fr' | 'en'>('fr');

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
    }
  };

  const tokens = [
    { symbol: 'BTC', name: 'Bitcoin', price: '€44,230', change: '+6.2%', icon: '₿', color: 'bg-orange-500' },
    { symbol: 'ETH', name: 'Ethereum', price: '€3,420', change: '-3.8%', icon: 'Ξ', color: 'bg-blue-500' },
    { symbol: 'ADA', name: 'Cardano', price: '€0.52', change: '+4.2%', icon: '₳', color: 'bg-blue-600' },
    { symbol: 'SOL', name: 'Solana', price: '€98.50', change: '+12.1%', icon: '◎', color: 'bg-purple-500' },
    { symbol: 'DOT', name: 'Polkadot', price: '€7.20', change: '-2.1%', icon: '●', color: 'bg-pink-500' },
  ];

  return (
    <ProtectedRoute>
      <div className={`min-h-screen flex ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        {/* Sidebar */}
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {/* Top Bar */}
          <TopBar 
            currentPageName={language === 'fr' ? 'Dashboard' : 'Dashboard'}
            isDarkMode={isDarkMode}
            onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
            language={language}
            onLanguageChange={setLanguage}
          />

          {/* Content */}
          <div className={`flex-1 p-6 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Hero Section */}
              <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 relative overflow-hidden">
                <div className="relative z-10">
                  <h2 className="text-white text-2xl font-bold mb-2">
                    {language === 'fr' ? 'Préparez votre Bull Run' : 'Prepare Your Bull Run'}
                  </h2>
                  <div className="text-purple-200 text-sm mb-4">EXSTRAT 2.0</div>
                  <p className="text-white text-sm mb-4">
                    {language === 'fr' 
                      ? 'ExStrat est votre plateforme de stratégies crypto. Optimisez vos gains pour le prochain cycle haussier.'
                      : 'ExStrat is your crypto strategy platform. Optimize your gains for the next bull cycle.'
                    }
                  </p>
                  <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                    {language === 'fr' ? 'Commencer maintenant' : 'Start Now'}
                  </button>
          </div>

                {/* Formes géométriques décoratives */}
                <div className="absolute top-4 right-4 w-8 h-8 bg-black rounded-full opacity-20"></div>
                <div className="absolute bottom-4 right-8 w-6 h-12 bg-blue-400 rounded-full opacity-20"></div>
                <div className="absolute top-8 right-12 w-0 h-0 border-l-4 border-r-4 border-b-6 border-transparent border-b-purple-300 opacity-20"></div>
              </div>

              {/* ETH Price Chart */}
              <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-bold">Ξ</span>
                    </div>
                    <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>ETH/EUR</span>
                    <ArrowDownIcon className="h-4 w-4 text-gray-400" />
                          </div>
                  <div className="flex gap-2">
                    <button className="bg-purple-600 text-white px-3 py-1 rounded text-xs">1D</button>
                    <button className={`px-3 py-1 rounded text-xs ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>1W</button>
                    <button className={`px-3 py-1 rounded text-xs ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>1M</button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <ETHPriceChart userPosition={200} />
                </div>
                
                <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Position: <span className="text-purple-600 font-semibold">€3,420</span>
                </div>
              </div>
            </div>

            {/* Token Overview */}
            <div className="mb-6">
              <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {language === 'fr' ? 'Overview des Tokens' : 'Token Overview'}
              </h3>
              <div className="flex gap-4 overflow-x-auto pb-2">
                {tokens.map((token, index) => (
                  <TokenCard key={index} {...token} isDarkMode={isDarkMode} />
                ))}
                <div className={`flex items-center justify-center min-w-[200px] rounded-xl border-2 border-dashed transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 hover:border-gray-500' 
                    : 'bg-white border-gray-300 hover:border-gray-400'
                }`}>
                  <PlusIcon className="h-8 w-8 text-gray-400" />
                  <span className="text-gray-400 text-sm ml-2">
                    {language === 'fr' ? '+ Ajouter' : '+ Add'}
                  </span>
                </div>
              </div>
          </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Actions Rapides */}
              <div className={`rounded-xl p-6 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <h3 className={`font-semibold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Actions Rapides</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => handleQuickAction('transaction')}
                    className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-lg transition-colors flex flex-col items-center gap-2"
                  >
                    <PlusIcon className="h-6 w-6" />
                    <span className="text-sm font-medium">Nouvelle Transaction</span>
                  </button>
                  <button 
                    onClick={() => handleQuickAction('strategy')}
                    className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-lg transition-colors flex flex-col items-center gap-2"
                  >
                    <ChartBarIcon className="h-6 w-6" />
                    <span className="text-sm font-medium">Créer Stratégie</span>
                  </button>
                  <button 
                    onClick={() => handleQuickAction('portfolio')}
                    className="bg-green-600 hover:bg-green-700 text-white p-4 rounded-lg transition-colors flex flex-col items-center gap-2"
                  >
                    <WalletIcon className="h-6 w-6" />
                    <span className="text-sm font-medium">Nouveau Portfolio</span>
                  </button>
                  <button 
                    onClick={() => handleQuickAction('alert')}
                    className="bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-lg transition-colors flex flex-col items-center gap-2"
                  >
                    <BellIcon className="h-6 w-6" />
                    <span className="text-sm font-medium">Alerte Prix</span>
                  </button>
            </div>
          </div>

              {/* Vue d'ensemble */}
              <div className={`rounded-xl p-6 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <h3 className={`font-semibold mb-4 ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>Vue d'ensemble</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className={`text-sm ${
                        isDarkMode ? 'text-white' : 'text-gray-700'
                      }`}>Portfolios actifs</span>
                    </div>
                    <span className={`font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>3</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className={`text-sm ${
                        isDarkMode ? 'text-white' : 'text-gray-700'
                      }`}>Stratégies en cours</span>
                    </div>
                    <span className={`font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>8</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className={`text-sm ${
                        isDarkMode ? 'text-white' : 'text-gray-700'
                      }`}>Tokens détenus</span>
                    </div>
                    <span className={`font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>12</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className={`text-sm ${
                        isDarkMode ? 'text-white' : 'text-gray-700'
                      }`}>Alertes actives</span>
                    </div>
                    <span className={`font-semibold ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>5</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Second Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              {/* Top Holdings */}
              <div className={`rounded-xl p-6 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">€</span>
                  </div>
                  <h3 className={`font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Top Holdings</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                      <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>BTC Bitcoin</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>€18,420</div>
                      <div className="text-green-400 text-xs flex items-center gap-1">
                        <ArrowUpIcon className="h-3 w-3" />
                        +5.2%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>ETH Ethereum</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>€12,150</div>
                      <div className="text-green-400 text-xs flex items-center gap-1">
                        <ArrowUpIcon className="h-3 w-3" />
                        +3.8%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                      <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>ADA Cardano</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>€4,230</div>
                      <div className="text-green-400 text-xs flex items-center gap-1">
                        <ArrowUpIcon className="h-3 w-3" />
                        +7.1%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                      <span className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>SOL Solana</span>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>€3,890</div>
                      <div className="text-gray-400 text-xs">+0.0%</div>
                    </div>
            </div>
          </div>

                {/* Mini pie chart */}
                <div className="mt-4 flex justify-center">
                  <svg className="w-24 h-24" viewBox="0 0 100 100" fill="none">
                    {/* Fond gris foncé */}
                    <circle cx="50" cy="50" r="45" fill="#1F2937" stroke="#374151" strokeWidth="2"/>
                    
                    {/* Segments du donut */}
                    <path d="M50 5 A45 45 0 0 1 95 50 L50 50 Z" fill="#F97316" />
                    <path d="M95 50 A45 45 0 0 1 50 95 L50 50 Z" fill="#3B82F6" />
                    <path d="M50 95 A45 45 0 0 1 5 50 L50 50 Z" fill="#10B981" />
                    <path d="M5 50 A45 45 0 0 1 50 5 L50 50 Z" fill="#374151" />
                    
                    {/* Cercle central */}
                    <circle cx="50" cy="50" r="25" fill="#1F2937" />
                    
                    {/* Texte central */}
                    <text x="50" y="48" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">€45.2K</text>
                  </svg>
                </div>
              </div>

              {/* Activités Récentes */}
              <div className={`rounded-xl p-6 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">🕐</span>
                  </div>
                  <h3 className={`font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Activités Récentes</h3>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">⚡</span>
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Stratégie BTC activée</div>
                      <div className="text-gray-400 text-xs">Il y a 2h</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">+</span>
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Achat ETH +0.5</div>
                      <div className="text-gray-400 text-xs">Il y a 4h</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs">⭐</span>
                    </div>
                    <div className="flex-1">
                      <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Alerte prix atteinte</div>
                      <div className="text-gray-400 text-xs">Il y a 6h</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}