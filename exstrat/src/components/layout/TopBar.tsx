'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { 
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  LanguageIcon
} from '@heroicons/react/24/outline';

interface TopBarProps {
  currentPageName: string;
}

export default function TopBar({ currentPageName }: TopBarProps) {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { isDarkMode, language, setLanguage } = useTheme();
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
                    <button 
                      onClick={() => {
                        router.push('/settings');
                        setShowUserMenu(false);
                      }}
                      className={`flex items-center gap-3 w-full px-4 py-2 transition-colors ${
                        isDarkMode 
                          ? 'text-gray-300 hover:bg-gray-700' 
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <UserCircleIcon className={`h-5 w-5 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`} />
                      {language === 'fr' ? 'Mon profil' : 'My Profile'}
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
