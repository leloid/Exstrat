'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  HomeIcon,
  WalletIcon,
  ShoppingBagIcon,
  Cog6ToothIcon,
  PowerIcon,
  MagnifyingGlassIcon,
  BellIcon,
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlusIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

// SVG personnalisés pour le dashboard
const ExStratLogo = () => (
  <svg className="w-8 h-8" viewBox="0 0 32 32" fill="none">
    <defs>
      <linearGradient id="exstratGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6"/>
        <stop offset="100%" stopColor="#8B5CF6"/>
      </linearGradient>
    </defs>
    <rect x="4" y="4" width="24" height="24" rx="4" fill="url(#exstratGradient)"/>
    <text x="16" y="20" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">E</text>
  </svg>
);

const DashboardIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill="white"/>
  </svg>
);

const PortfolioIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="white"/>
  </svg>
);

const TransactionIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
    <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z" fill="white"/>
  </svg>
);

const StrategyIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
    <path d="M9 11H7V9H9V11ZM13 11H11V9H13V11ZM17 11H15V9H17V11ZM19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20Z" fill="white"/>
  </svg>
);

const ConfigIcon = () => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
    <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" fill="white"/>
  </svg>
);

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
    <text x="5" y="20" className="text-xs fill-gray-400">50k</text>
    <text x="5" y="44" className="text-xs fill-gray-400">40k</text>
    <text x="5" y="68" className="text-xs fill-gray-400">30k</text>
    <text x="5" y="92" className="text-xs fill-gray-400">20k</text>
    <text x="5" y="116" className="text-xs fill-gray-400">10k</text>
  </svg>
);

const TokenCard = ({ symbol, name, price, change, icon, color }: {
  symbol: string;
  name: string;
  price: string;
  change: string;
  icon: string;
  color: string;
}) => {
  const isPositive = change.startsWith('+');
  
  return (
    <div className="bg-gray-800 rounded-xl p-4 min-w-[200px] hover:bg-gray-750 transition-colors">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${color}`}>
          <span className="text-white font-bold text-sm">{icon}</span>
        </div>
        <div>
          <div className="text-white font-semibold">{symbol}</div>
          <div className="text-gray-400 text-xs">{name}</div>
        </div>
      </div>
      
      <div className="mb-2">
        <div className="text-white text-xl font-bold">{price}</div>
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

export default function TestDashboardPage() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu utilisateur quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
    { id: 'portfolio', name: 'Portfolio', href: '/portfolio', icon: PortfolioIcon },
    { id: 'transactions', name: 'Transactions', href: '/transactions', icon: TransactionIcon },
    { id: 'strategies', name: 'Stratégies', href: '/strategies', icon: StrategyIcon },
    { id: 'config', name: 'Configuration', href: '/config', icon: ConfigIcon },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

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

  const marketTrends = [
    { name: 'BTC Bitcoin', price: '€44,230', change: '+2,540', isPositive: true },
    { name: 'ETH Ethereum', price: '€3,420', change: '-1,320', isPositive: false },
    { name: 'ADA Cardano', price: '€0.52', change: '+2,140', isPositive: true },
    { name: 'SOL Solana', price: '€98.50', change: '-1,903', isPositive: false },
    { name: 'DOT Polkadot', price: '€7.20', change: '+1,976', isPositive: true },
  ];

  return (
    <div className="min-h-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-16 bg-gray-800 flex flex-col items-center py-6">
        {/* Logo ExStrat */}
        <div className="mb-8">
          <ExStratLogo />
        </div>
        
        {/* Navigation */}
        <div className="flex flex-col gap-4">
          {navigation.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  router.push(item.href);
                }}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  activeTab === item.id ? 'bg-purple-600' : 'hover:bg-gray-700'
                }`}
                title={item.name}
              >
                <IconComponent />
              </button>
            );
          })}
        </div>
        
        {/* Déconnexion */}
        <div className="mt-auto">
          <button 
            onClick={handleSignOut}
            className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-700 transition-colors"
            title="Se déconnecter"
          >
            <PowerIcon className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-gray-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-white text-lg font-semibold">
              {navigation.find(item => item.id === activeTab)?.name || 'Dashboard'}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Rechercher"
                className="bg-gray-700 text-white placeholder-gray-400 px-10 py-2 rounded-lg w-64"
              />
            </div>
            
            <button className="relative p-2 hover:bg-gray-700 rounded-lg transition-colors">
              <BellIcon className="h-5 w-5 text-white" />
              <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div>
            </button>
            
            {/* Menu utilisateur */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors"
              >
                <span className="text-white text-sm font-semibold">
                  {user?.email?.charAt(0).toUpperCase() || 'E'}
                </span>
              </button>
              
              {/* Dropdown menu */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="py-2">
                    <button className="flex items-center gap-3 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors">
                      <UserCircleIcon className="h-5 w-5" />
                      Mon profil
                    </button>
                    <button className="flex items-center gap-3 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors">
                      <Cog6ToothIcon className="h-5 w-5" />
                      Paramètres
                    </button>
                    <hr className="my-1" />
                    <button 
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      Se déconnecter
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 relative overflow-hidden">
              <div className="relative z-10">
                <h2 className="text-white text-2xl font-bold mb-2">Votre Portail vers la Blockchain</h2>
                <div className="text-purple-200 text-sm mb-4">EXSTRAT 2.0</div>
                <p className="text-white text-sm mb-4">
                  ExStrat est une plateforme de stratégies crypto. Nous rendons le trading accessible.
                </p>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  En savoir plus.
                </button>
              </div>
              
              {/* Formes géométriques décoratives */}
              <div className="absolute top-4 right-4 w-8 h-8 bg-black rounded-full opacity-20"></div>
              <div className="absolute bottom-4 right-8 w-6 h-12 bg-blue-400 rounded-full opacity-20"></div>
              <div className="absolute top-8 right-12 w-0 h-0 border-l-4 border-r-4 border-b-6 border-transparent border-b-purple-300 opacity-20"></div>
            </div>

            {/* ETH Price Chart */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">Ξ</span>
                  </div>
                  <span className="text-white font-semibold">ETH/EUR</span>
                  <ArrowDownIcon className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex gap-2">
                  <button className="bg-purple-600 text-white px-3 py-1 rounded text-xs">1D</button>
                  <button className="bg-gray-700 text-gray-300 px-3 py-1 rounded text-xs">1W</button>
                  <button className="bg-gray-700 text-gray-300 px-3 py-1 rounded text-xs">1M</button>
                </div>
              </div>
              
              <div className="mb-4">
                <ETHPriceChart userPosition={200} />
              </div>
              
              <div className="text-white text-sm">
                Position: <span className="text-purple-400 font-semibold">€3,420</span>
              </div>
            </div>
          </div>

          {/* Token Overview */}
          <div className="mb-6">
            <h3 className="text-white text-lg font-semibold mb-4">Overview des Tokens</h3>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {tokens.map((token, index) => (
                <TokenCard key={index} {...token} />
              ))}
              <div className="flex items-center justify-center min-w-[200px] bg-gray-800 rounded-xl border-2 border-dashed border-gray-600 hover:border-gray-500 transition-colors">
                <PlusIcon className="h-8 w-8 text-gray-400" />
              </div>
            </div>
          </div>

          {/* Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Actions Rapides */}
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Actions Rapides</h3>
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
            <div className="bg-gray-800 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">Vue d'ensemble</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-white text-sm">Portfolios actifs</span>
                  </div>
                  <span className="text-white font-semibold">3</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-white text-sm">Stratégies en cours</span>
                  </div>
                  <span className="text-white font-semibold">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-white text-sm">Tokens détenus</span>
                  </div>
                  <span className="text-white font-semibold">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-white text-sm">Alertes actives</span>
                  </div>
                  <span className="text-white font-semibold">5</span>
                </div>
              </div>
            </div>
          </div>

          {/* Second Bottom Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            {/* Top Holdings */}
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">€</span>
                </div>
                <h3 className="text-white font-semibold">Top Holdings</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                    <span className="text-white text-sm">BTC Bitcoin</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-sm font-semibold">€18,420</div>
                    <div className="text-green-400 text-xs flex items-center gap-1">
                      <ArrowUpIcon className="h-3 w-3" />
                      +5.2%
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-white text-sm">ETH Ethereum</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-sm font-semibold">€12,150</div>
                    <div className="text-green-400 text-xs flex items-center gap-1">
                      <ArrowUpIcon className="h-3 w-3" />
                      +3.8%
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                    <span className="text-white text-sm">ADA Cardano</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-sm font-semibold">€4,230</div>
                    <div className="text-green-400 text-xs flex items-center gap-1">
                      <ArrowUpIcon className="h-3 w-3" />
                      +7.1%
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                    <span className="text-white text-sm">SOL Solana</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white text-sm font-semibold">€3,890</div>
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
            <div className="bg-gray-800 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs">🕐</span>
                </div>
                <h3 className="text-white font-semibold">Activités Récentes</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">⚡</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm">Stratégie BTC activée</div>
                    <div className="text-gray-400 text-xs">Il y a 2h</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">+</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm">Achat ETH +0.5</div>
                    <div className="text-gray-400 text-xs">Il y a 4h</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">⭐</span>
                  </div>
                  <div className="flex-1">
                    <div className="text-white text-sm">Alerte prix atteinte</div>
                    <div className="text-gray-400 text-xs">Il y a 6h</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
