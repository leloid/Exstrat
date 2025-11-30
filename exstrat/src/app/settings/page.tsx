'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';
import { CheckCircleIcon, PencilIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api';

export default function SettingsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const { isDarkMode, language, toggleDarkMode, setLanguage } = useTheme();
  const [activeTab, setActiveTab] = useState('settings');
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // États pour le formulaire
  const [formData, setFormData] = useState({
    email: user?.email || '',
    firstName: '',
    lastName: '',
    currency: 'EUR',
  });

  // Charger les données utilisateur
  React.useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        email: user.email || '',
      }));
    }
  }, [user]);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // Ici, on pourrait appeler une API pour mettre à jour le profil
      // Pour l'instant, on simule juste la sauvegarde
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSaveMessage({
        type: 'success',
        text: language === 'fr' ? 'Paramètres sauvegardés avec succès' : 'Settings saved successfully'
      });
      
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      setSaveMessage({
        type: 'error',
        text: language === 'fr' ? 'Erreur lors de la sauvegarde' : 'Error saving settings'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailEdit = () => {
    setIsEditingEmail(true);
  };

  const currencies = [
    { value: 'EUR', label: '€ - EUR' },
    { value: 'USD', label: '$ - USD' },
    { value: 'GBP', label: '£ - GBP' },
    { value: 'JPY', label: '¥ - JPY' },
  ];

  return (
    <ProtectedRoute>
      <div className={`min-h-screen flex overflow-x-hidden ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Sidebar activeTab={activeTab} onTabChange={setActiveTab} isDarkMode={isDarkMode} />

        <div className="flex-1 flex flex-col md:ml-0 overflow-x-hidden w-full max-w-full">
          <TopBar currentPageName={language === 'fr' ? 'Réglages' : 'Settings'} />

          <div className={`flex-1 p-4 md:p-6 overflow-x-hidden max-w-full ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="max-w-4xl mx-auto">
              {/* Titre de la page */}
              <div className="mb-6">
                <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {language === 'fr' ? 'Réglages' : 'Settings'}
                </h1>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {language === 'fr' 
                    ? 'Gérez vos paramètres de compte et préférences'
                    : 'Manage your account settings and preferences'}
                </p>
              </div>

              {/* Message de sauvegarde */}
              {saveMessage && (
                <div className={`mb-4 p-3 rounded-lg ${
                  saveMessage.type === 'success'
                    ? isDarkMode ? 'bg-green-900/30 border border-green-700/30' : 'bg-green-50 border border-green-200'
                    : isDarkMode ? 'bg-red-900/30 border border-red-700/30' : 'bg-red-50 border border-red-200'
                }`}>
                  <p className={`text-sm ${
                    saveMessage.type === 'success'
                      ? isDarkMode ? 'text-green-400' : 'text-green-700'
                      : isDarkMode ? 'text-red-400' : 'text-red-700'
                  }`}>
                    {saveMessage.text}
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {/* Section Mon profil */}
                <div className={`rounded-lg p-5 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                  <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fr' ? 'Mon profil' : 'My Profile'}
                  </h2>

                  <div className="space-y-4">
                    {/* Email */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {language === 'fr' ? 'Adresse email' : 'Email address'}
                      </label>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            disabled={!isEditingEmail}
                            className={`w-full px-4 py-2 rounded-lg border transition-all ${
                              isDarkMode
                                ? 'bg-gray-700/50 border-gray-600 text-white disabled:bg-gray-800 disabled:text-gray-500'
                                : 'bg-gray-50 border-gray-300 text-gray-900 disabled:bg-gray-100 disabled:text-gray-500'
                            } ${!isEditingEmail ? 'cursor-not-allowed' : ''}`}
                          />
                        </div>
                        {!isEditingEmail && (
                          <>
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${
                              isDarkMode ? 'bg-green-900/30 border border-green-700/30' : 'bg-green-50 border border-green-200'
                            }`}>
                              <CheckCircleIcon className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                              <span className={`text-xs font-medium ${isDarkMode ? 'text-green-400' : 'text-green-700'}`}>
                                {language === 'fr' ? 'VÉRIFIÉ' : 'VERIFIED'}
                              </span>
                            </div>
                            <button
                              onClick={handleEmailEdit}
                              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                                isDarkMode
                                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                              }`}
                            >
                              <PencilIcon className="h-4 w-4" />
                              {language === 'fr' ? 'Modifier' : 'Edit'}
                            </button>
                          </>
                        )}
                        {isEditingEmail && (
                          <button
                            onClick={() => setIsEditingEmail(false)}
                            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              isDarkMode
                                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                          >
                            {language === 'fr' ? 'Annuler' : 'Cancel'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Prénom (optionnel pour V1) */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {language === 'fr' ? 'Prénom' : 'First Name'}
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder={language === 'fr' ? 'Votre prénom' : 'Your first name'}
                        className={`w-full px-4 py-2 rounded-lg border transition-all ${
                          isDarkMode
                            ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-500'
                            : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                    </div>

                    {/* Nom (optionnel pour V1) */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {language === 'fr' ? 'Nom' : 'Last Name'}
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder={language === 'fr' ? 'Votre nom' : 'Your last name'}
                        className={`w-full px-4 py-2 rounded-lg border transition-all ${
                          isDarkMode
                            ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-500'
                            : 'bg-gray-50 border-gray-300 text-gray-900 placeholder-gray-400'
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Section Préférences */}
                <div className={`rounded-lg p-5 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                  <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {language === 'fr' ? 'Préférences' : 'Preferences'}
                  </h2>

                  <div className="space-y-4">
                    {/* Langue */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {language === 'fr' ? 'Langue' : 'Language'}
                      </label>
                      <select
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as 'fr' | 'en')}
                        className={`w-full px-4 py-2 rounded-lg border transition-all ${
                          isDarkMode
                            ? 'bg-gray-700/50 border-gray-600 text-white hover:border-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                            : 'bg-gray-50 border-gray-300 text-gray-900 hover:border-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                        }`}
                      >
                        <option value="fr">Français</option>
                        <option value="en">English</option>
                      </select>
                    </div>

                    {/* Devise */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {language === 'fr' ? 'Devise' : 'Currency'}
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        className={`w-full px-4 py-2 rounded-lg border transition-all ${
                          isDarkMode
                            ? 'bg-gray-700/50 border-gray-600 text-white hover:border-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                            : 'bg-gray-50 border-gray-300 text-gray-900 hover:border-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                        }`}
                      >
                        {currencies.map((currency) => (
                          <option key={currency.value} value={currency.value}>
                            {currency.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Thème */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        {language === 'fr' ? 'Thème' : 'Theme'}
                      </label>
                      <div className="flex items-center gap-3">
                        <select
                          value={isDarkMode ? 'dark' : 'light'}
                          onChange={(e) => {
                            if (e.target.value === 'dark' && !isDarkMode) {
                              toggleDarkMode();
                            } else if (e.target.value === 'light' && isDarkMode) {
                              toggleDarkMode();
                            }
                          }}
                          className={`flex-1 px-4 py-2 rounded-lg border transition-all ${
                            isDarkMode
                              ? 'bg-gray-700/50 border-gray-600 text-white hover:border-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                              : 'bg-gray-50 border-gray-300 text-gray-900 hover:border-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                          }`}
                        >
                          <option value="light">{language === 'fr' ? 'Mode clair' : 'Light Mode'}</option>
                          <option value="dark">{language === 'fr' ? 'Mode sombre' : 'Dark Mode'}</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bouton de sauvegarde */}
                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                      isDarkMode
                        ? 'bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-700 disabled:text-gray-400'
                        : 'bg-purple-600 hover:bg-purple-700 text-white disabled:bg-gray-300 disabled:text-gray-500'
                    }`}
                  >
                    {isSaving
                      ? (language === 'fr' ? 'Sauvegarde...' : 'Saving...')
                      : (language === 'fr' ? 'Enregistrer les modifications' : 'Save Changes')
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

