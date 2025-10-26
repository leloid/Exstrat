'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';
import { 
  PowerIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';

// SVG personnalisés pour le dashboard

const DashboardIcon = ({ isDark }: { isDark: boolean }) => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" fill={isDark ? "white" : "#374151"}/>
  </svg>
);

const PortfolioIcon = ({ isDark }: { isDark: boolean }) => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={isDark ? "white" : "#374151"}/>
  </svg>
);

const TransactionIcon = ({ isDark }: { isDark: boolean }) => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
    <path d="M7 4V2C7 1.45 7.45 1 8 1H16C16.55 1 17 1.45 17 2V4H20C20.55 4 21 4.45 21 5S20.55 6 20 6H19V19C19 20.1 18.1 21 17 21H7C5.9 21 5 20.1 5 19V6H4C3.45 6 3 5.55 3 5S3.45 4 4 4H7ZM9 3V4H15V3H9ZM7 6V19H17V6H7Z" fill={isDark ? "white" : "#374151"}/>
  </svg>
);

const StrategyIcon = ({ isDark }: { isDark: boolean }) => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
    <path d="M9 11H7V9H9V11ZM13 11H11V9H13V11ZM17 11H15V9H17V11ZM19 4H18V2H16V4H8V2H6V4H5C3.89 4 3.01 4.9 3.01 6L3 20C3 21.1 3.89 22 5 22H19C20.1 22 21 21.1 21 20V6C21 4.9 20.1 4 19 4ZM19 20H5V9H19V20Z" fill={isDark ? "white" : "#374151"}/>
  </svg>
);

const ConfigIcon = ({ isDark }: { isDark: boolean }) => (
  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
    <path d="M12 15.5A3.5 3.5 0 0 1 8.5 12A3.5 3.5 0 0 1 12 8.5a3.5 3.5 0 0 1 3.5 3.5a3.5 3.5 0 0 1-3.5 3.5m7.43-2.53c.04-.32.07-.64.07-.97c0-.33-.03-.66-.07-1l2.11-1.63c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.31-.61-.22l-2.49 1c-.52-.39-1.06-.73-1.69-.98l-.37-2.65A.506.506 0 0 0 14 2h-4c-.25 0-.46.18-.5.42l-.37 2.65c-.63.25-1.17.59-1.69.98l-2.49-1c-.22-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64L4.57 11c-.04.34-.07.67-.07 1c0 .33.03.65.07.97l-2.11 1.66c-.19.15-.25.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1.01c.52.4 1.06.74 1.69.99l.37 2.65c.04.24.25.42.5.42h4c.25 0 .46-.18.5-.42l.37-2.65c.63-.26 1.17-.59 1.69-.99l2.49 1.01c.22.08.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.66Z" fill={isDark ? "white" : "#374151"}/>
  </svg>
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
