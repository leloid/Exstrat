'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { 
  PowerIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  WalletIcon,
  BanknotesIcon,
  SparklesIcon,
  AdjustmentsHorizontalIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

// SVG personnalisés pour le dashboard

const DashboardIcon = ({ isDark }: { isDark: boolean }) => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill={isDark ? "white" : "#374151"}/>
  </svg>
);

const PortfolioIcon = ({ isDark }: { isDark: boolean }) => (
  <WalletIcon className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-700'}`} />
);

const TransactionIcon = ({ isDark }: { isDark: boolean }) => (
  <BanknotesIcon className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-700'}`} />
);

const StrategyIcon = ({ isDark }: { isDark: boolean }) => (
  <SparklesIcon className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-700'}`} />
);

const ConfigIcon = ({ isDark }: { isDark: boolean }) => (
  <AdjustmentsHorizontalIcon className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-700'}`} />
);

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isDarkMode?: boolean;
}

export default function Sidebar({ activeTab, onTabChange, isDarkMode = true }: SidebarProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const navigation = [
    { id: 'dashboard', name: 'Dashboard', href: '/dashboard', icon: DashboardIcon },
    { id: 'investissements', name: 'Investissements', href: '/investissements', icon: PortfolioIcon },
    { id: 'strategies', name: 'Stratégies', href: '/strategies', icon: StrategyIcon },
    { id: 'config', name: 'Prévisions', href: '/prevision', icon: ConfigIcon },
  ];

  const [isExpanded, setIsExpanded] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

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

  return (
    <>
      {/* Sidebar Desktop */}
      <div className={`hidden md:flex ${isExpanded ? 'w-64' : 'w-20'} flex-col ${isExpanded ? 'items-start px-4' : 'items-center'} py-6 transition-all duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white border-r border-gray-200'}`}>
        {/* Logo ExStrat et bouton toggle */}
        <div className={`mb-8 flex items-center ${isExpanded ? 'w-full justify-between' : 'justify-center'}`}>
          {isExpanded && (
            <div className="flex items-center gap-2">
              <Image 
                src="/logo_dark.svg"
                alt="ExStrat Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                ExStrat
              </span>
            </div>
          )}
          {!isExpanded && (
            <Image 
              src="/logo_dark.svg"
              alt="ExStrat Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            title={isExpanded ? 'Réduire' : 'Développer'}
          >
            {isExpanded ? (
              <ChevronLeftIcon className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-gray-700'}`} />
            ) : (
              <ChevronRightIcon className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-gray-700'}`} />
            )}
          </button>
        </div>
        
        {/* Navigation */}
        <div className="flex flex-col gap-2 w-full">
          {navigation.map((item) => {
            const IconComponent = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  router.push(item.href);
                }}
                className={`${isExpanded ? 'w-full px-4 py-3 rounded-lg flex items-center gap-3' : 'w-12 h-12 rounded-lg flex items-center justify-center'} transition-colors ${
                  activeTab === item.id 
                    ? isExpanded 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-purple-600'
                    : (isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
                }`}
                title={!isExpanded ? item.name : undefined}
              >
                <IconComponent isDark={isDarkMode} />
                {isExpanded && (
                  <span className={`font-medium text-lg ${activeTab === item.id ? 'text-white' : (isDarkMode ? 'text-white' : 'text-gray-700')}`}>
                    <span className="mr-2 text-xl">{item.emoji}</span>
                    {item.name}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Menu utilisateur */}
        <div className={`mt-auto ${isExpanded ? 'w-full' : 'relative'}`} ref={userMenuRef}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`${isExpanded ? 'w-full px-4 py-3 rounded-lg flex items-center gap-3' : 'w-12 h-12 rounded-lg flex items-center justify-center'} transition-colors ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
            title={!isExpanded ? (user?.email || 'Utilisateur') : undefined}
          >
            <UserCircleIcon className={`h-6 w-6 ${isDarkMode ? 'text-white' : 'text-gray-700'}`} />
            {isExpanded && (
              <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>
                {user?.email || 'Utilisateur'}
              </span>
            )}
          </button>

          {/* Menu déroulant */}
          {showUserMenu && (
            <div className={`absolute ${isExpanded ? 'bottom-16 left-0' : 'bottom-16 left-0'} mb-2 w-56 rounded-lg shadow-lg border ${
              isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <div className="py-2">
                {/* Email utilisateur */}
                <div className={`px-4 py-2 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {user?.email || 'Utilisateur'}
                  </p>
                </div>

                {/* Réglages */}
                <button
                  onClick={() => {
                    router.push('/settings');
                    setShowUserMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <Cog6ToothIcon className="h-5 w-5" />
                  <span className="text-sm">Réglages</span>
                </button>

                {/* Déconnexion */}
                <button
                  onClick={() => {
                    handleSignOut();
                    setShowUserMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-left transition-colors ${
                    isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  <span className="text-sm">Se déconnecter</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Overlay pour mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar Mobile */}
      <div className={`fixed left-0 top-0 h-full w-64 ${isDarkMode ? 'bg-gray-800' : 'bg-white'} z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full py-6">
          {/* Header avec logo et bouton fermer */}
          <div className="flex items-center justify-between px-4 mb-8">
            <Image 
              src="/logo_dark.svg"
              alt="ExStrat Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className={`p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
            >
              <XMarkIcon className={`h-6 w-6 ${isDarkMode ? 'text-white' : 'text-gray-700'}`} />
            </button>
          </div>

          {/* Navigation */}
          <div className="flex flex-col gap-2 px-4">
            {navigation.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onTabChange(item.id);
                    router.push(item.href);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id 
                      ? 'bg-purple-600 text-white' 
                      : (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')
                  }`}
                >
                  <IconComponent isDark={isDarkMode} />
                  <span className="font-medium">{item.name}</span>
                </button>
              );
            })}
          </div>

          {/* Menu utilisateur mobile */}
          <div className="mt-auto px-4 space-y-2">
            {/* Réglages */}
            <button
              onClick={() => {
                router.push('/settings');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === 'settings'
                  ? 'bg-purple-600 text-white'
                  : (isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')
              }`}
            >
              <Cog6ToothIcon className="h-5 w-5" />
              <span className="font-medium">Réglages</span>
            </button>

            {/* Déconnexion */}
            <button 
              onClick={() => {
                handleSignOut();
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span className="font-medium">Se déconnecter</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bouton hamburger pour mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className={`md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg ${isDarkMode ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'}`}
      >
        <Bars3Icon className="h-6 w-6" />
      </button>
    </>
  );
}
