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
  const userButtonRef = useRef<HTMLButtonElement>(null);
  const languageButtonRef = useRef<HTMLButtonElement>(null);
  const [userMenuPosition, setUserMenuPosition] = useState({ top: 0, right: 0 });
  const [languageMenuPosition, setLanguageMenuPosition] = useState({ top: 0, right: 0 });

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Calculer la position du menu utilisateur
  useEffect(() => {
    if (showUserMenu && userButtonRef.current) {
      const rect = userButtonRef.current.getBoundingClientRect();
      setUserMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [showUserMenu]);

  // Calculer la position du menu langue
  useEffect(() => {
    if (showLanguageMenu && languageButtonRef.current) {
      const rect = languageButtonRef.current.getBoundingClientRect();
      setLanguageMenuPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [showLanguageMenu]);

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
    <div className={`pl-14 md:pl-6 pr-3 md:pr-6 py-4 flex items-center justify-between overflow-x-hidden max-w-full ${
      isDarkMode ? 'bg-gray-800' : 'bg-white border-b border-gray-200'
    }`}>
      <div className="flex items-center gap-2 md:gap-4">
        <h1 className={`text-base md:text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {currentPageName}
        </h1>
      </div>
      
      <div className="flex items-center gap-2 md:gap-4">
        <div className="relative hidden md:block">
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
        
        {/* Bouton recherche mobile */}
        <button className={`md:hidden p-2 rounded-lg ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}>
          <MagnifyingGlassIcon className={`h-5 w-5 ${isDarkMode ? 'text-white' : 'text-gray-700'}`} />
        </button>
        
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
            ref={languageButtonRef}
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
            <div 
              className={`fixed w-32 rounded-lg shadow-xl border z-[9999] ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-700' 
                  : 'bg-white border-gray-200'
              }`}
              style={{ 
                top: `${languageMenuPosition.top}px`,
                right: `${languageMenuPosition.right}px`
              }}
            >
              <div className="py-2">
                <button 
                  onClick={() => {
                    setLanguage('fr');
                    setShowLanguageMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                    language === 'fr' 
                      ? 'bg-blue-50 text-blue-600' 
                      : isDarkMode 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  🇫🇷 Français
                </button>
                <button 
                  onClick={() => {
                    setLanguage('en');
                    setShowLanguageMenu(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm transition-colors ${
                    language === 'en' 
                      ? 'bg-blue-50 text-blue-600' 
                      : isDarkMode 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-100'
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
            ref={userButtonRef}
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center hover:bg-purple-700 transition-colors"
          >
            <span className="text-white text-sm font-semibold">
              {user?.email?.charAt(0).toUpperCase() || 'E'}
            </span>
          </button>
          
              {/* Dropdown menu */}
              {showUserMenu && (
                <div 
                  className={`fixed w-48 rounded-lg shadow-xl border z-[9999] ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-700' 
                      : 'bg-white border-gray-200'
                  }`}
                  style={{ 
                    top: `${userMenuPosition.top}px`,
                    right: `${userMenuPosition.right}px`
                  }}
                >
                  <div className="py-2">
                    <button className={`flex items-center gap-3 w-full px-4 py-2 transition-colors ${
                      isDarkMode 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}>
                      <UserCircleIcon className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                      {language === 'fr' ? 'Mon profil' : 'My Profile'}
                    </button>
                    <button className={`flex items-center gap-3 w-full px-4 py-2 transition-colors ${
                      isDarkMode 
                        ? 'text-gray-300 hover:bg-gray-700' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}>
                      <Cog6ToothIcon className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                      {language === 'fr' ? 'Paramètres' : 'Settings'}
                    </button>
                    <hr className={`my-1 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />
                    <button 
                      onClick={handleSignOut}
                      className={`flex items-center gap-3 w-full px-4 py-2 transition-colors ${
                        isDarkMode 
                          ? 'text-gray-300 hover:bg-gray-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <ArrowRightOnRectangleIcon className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
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
