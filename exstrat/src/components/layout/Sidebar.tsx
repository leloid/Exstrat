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
  AdjustmentsHorizontalIcon
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
  const userMenuRef = useRef<HTMLDivElement>(null);

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
    <div className={`w-16 flex flex-col items-center py-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white border-r border-gray-200'}`}>
      {/* Logo ExStrat */}
      <div className="mb-8">
        <Image 
          src={isDarkMode ? "/logo_dark.svg" : "/logo_light.svg"}
          alt="ExStrat Logo"
          width={32}
          height={32}
          className="w-8 h-8"
        />
      </div>
      
      {/* Navigation */}
      <div className="flex flex-col gap-4">
        {navigation.map((item) => {
          const IconComponent = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => {
                onTabChange(item.id);
                router.push(item.href);
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                activeTab === item.id ? 'bg-purple-600' : (isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
              }`}
              title={item.name}
            >
              <IconComponent isDark={isDarkMode} />
            </button>
          );
        })}
      </div>
      
      {/* Déconnexion */}
      <div className="mt-auto">
        <button 
          onClick={handleSignOut}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
          title="Se déconnecter"
        >
          <PowerIcon className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-gray-700'}`} />
        </button>
      </div>
    </div>
  );
}
