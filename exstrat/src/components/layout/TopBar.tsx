'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  MagnifyingGlassIcon,
  BellIcon,
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  LanguageIcon
} from '@heroicons/react/24/outline';

interface TopBarProps {
  currentPageName: string;
}

export default function TopBar({ currentPageName }: TopBarProps) {
  const { user, signOut } = useAuth();
  const { isDarkMode, language, toggleDarkMode, setLanguage } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const languageMenuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Fermer les menus quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (languageMenuRef.current && !languageMenuRef.current.contains(event.target as Node)) {
        setShowLanguageMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className={`px-6 py-4 flex items-center justify-between ${
      isDarkMode ? 'bg-gray-800' : 'bg-white border-b border-gray-200'
    }`}>
      <div className="flex items-center gap-4">
        <h1 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {currentPageName}
        </h1>
      </div>
      
      <div className="flex items-center gap-4">
        <div className="relative">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <input
            type="text"
            placeholder={language === 'fr' ? 'Rechercher' : 'Search'}
            className={`px-10 py-2 rounded-lg w-64 ${
              isDarkMode 
                ? 'bg-gray-700 text-white placeholder-gray-400' 
                : 'bg-gray-100 text-gray-900 placeholder-gray-500 border border-gray-300'
            }`}
          />
        </div>
        
        {/* Mode sombre/clair */}
        <button 
          onClick={toggleDarkMode}
          className={`p-2 rounded-lg transition-colors ${
            isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
          }`}
          title={language === 'fr' ? 'Changer le thème' : 'Toggle theme'}
        >
          {isDarkMode ? (
            <SunIcon className="h-5 w-5 text-yellow-400" />
          ) : (
            <MoonIcon className="h-5 w-5 text-gray-700" />
          )}
        </button>
        
        {/* Sélecteur de langue */}
        <div className="relative" ref={languageMenuRef}>
          <button
            onClick={() => setShowLanguageMenu(!showLanguageMenu)}
            className={`p-2 rounded-lg transition-colors flex items-center gap-2 ${
              isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
            title={language === 'fr' ? 'Changer la langue' : 'Change language'}
          >
            <LanguageIcon className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-gray-700'}`} />
            <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {language.toUpperCase()}
            </span>
          </button>
          
          {/* Menu langue */}
          {showLanguageMenu && (
            <div className="absolute right-0 mt-2 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="py-2">
                <button 
                  onClick={() => {
                    setLanguage('fr');
                    setShowLanguageMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                    language === 'fr' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                >
                  🇫🇷 Français
                </button>
                <button 
                  onClick={() => {
                    setLanguage('en');
                    setShowLanguageMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 transition-colors ${
                    language === 'en' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>
          )}
        </div>
        
        <button className={`relative p-2 rounded-lg transition-colors ${
          isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
        }`}>
          <BellIcon className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-gray-700'}`} />
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
                      {language === 'fr' ? 'Mon profil' : 'My Profile'}
                    </button>
                    <button className="flex items-center gap-3 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors">
                      <Cog6ToothIcon className="h-5 w-5" />
                      {language === 'fr' ? 'Paramètres' : 'Settings'}
                    </button>
                    <hr className="my-1" />
                    <button 
                      onClick={handleSignOut}
                      className="flex items-center gap-3 w-full px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <ArrowRightOnRectangleIcon className="h-5 w-5" />
                      {language === 'fr' ? 'Se déconnecter' : 'Sign Out'}
                    </button>
                  </div>
                </div>
              )}
        </div>
      </div>
    </div>
  );
}
