'use client';

import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Portfolio } from '@/types/portfolio';

interface WalletSelectorProps {
  portfolios: Portfolio[];
  selectedPortfolioId: string;
  onPortfolioChange: (portfolioId: string) => void;
}

export const WalletSelector: React.FC<WalletSelectorProps> = ({
  portfolios,
  selectedPortfolioId,
  onPortfolioChange,
}) => {
  const { isDarkMode, language } = useTheme();

  return (
    <div>
      <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {language === 'fr' ? 'Sélectionner un wallet' : 'Select a wallet'}
      </label>
      <select
        value={selectedPortfolioId}
        onChange={(e) => onPortfolioChange(e.target.value)}
        className={`w-full px-4 py-2 rounded-lg border transition-all ${
          isDarkMode
            ? 'bg-gray-700/50 border-gray-600 text-white hover:border-gray-500 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
            : 'bg-gray-50 border-gray-300 text-gray-900 hover:border-gray-400 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
        }`}
      >
        <option value="">
          {language === 'fr' ? '-- Sélectionner un wallet --' : '-- Select a wallet --'}
        </option>
        {portfolios.map((portfolio) => (
          <option key={portfolio.id} value={portfolio.id}>
            {portfolio.name}
            {portfolio.isDefault && ` (${language === 'fr' ? 'défaut' : 'default'})`}
          </option>
        ))}
      </select>
    </div>
  );
};

