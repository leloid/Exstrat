'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';

export const ConfigurationOrdersTab: React.FC = () => {
  const { isDarkMode, language } = useTheme();

  return (
    <div className={`rounded-lg p-8 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
      <div className="text-center">
        <div className={`text-4xl mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
          🔒
        </div>
        <h2 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {language === 'fr' ? 'Ordres / Exécution' : 'Orders / Execution'}
        </h2>
        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {language === 'fr'
            ? 'Cette fonctionnalité sera disponible dans la version 2. Elle permettra de gérer les ordres semi-automatiques et la connexion aux exchanges.'
            : 'This feature will be available in version 2. It will allow managing semi-automatic orders and connecting to exchanges.'}
        </p>
      </div>
    </div>
  );
};

