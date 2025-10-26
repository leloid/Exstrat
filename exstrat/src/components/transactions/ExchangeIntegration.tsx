'use client';

import React from 'react';

interface ExchangeIntegrationProps {
  isDarkMode?: boolean;
  language?: 'fr' | 'en';
}

const exchanges = [
  { name: 'Binance', logo: 'B', color: 'bg-yellow-500', borderColor: 'border-yellow-600' },
  { name: 'Coinbase', logo: 'C', color: 'bg-blue-500', borderColor: 'border-blue-600' },
  { name: 'Kraken', logo: 'K', color: 'bg-purple-500', borderColor: 'border-purple-600' },
  { name: 'Ledger', logo: '🔒', color: 'bg-gray-500', borderColor: 'border-gray-600' },
  { name: 'Metamask', logo: '🦊', color: 'bg-orange-500', borderColor: 'border-orange-600' },
  { name: 'Phantom', logo: 'P', color: 'bg-purple-400', borderColor: 'border-purple-500' },
];

export const ExchangeIntegration: React.FC<ExchangeIntegrationProps> = ({ 
  isDarkMode = true, 
  language = 'fr' 
}) => {
  return (
    <div className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <h3 className={`text-lg font-semibold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {language === 'fr' ? 'Intégrations Exchange/Wallet' : 'Exchange/Wallet Integrations'}
        </h3>
      </div>
      
      {/* Barre de recherche */}
      <div className="mb-4">
        <div className={`relative ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border rounded-lg`}>
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={language === 'fr' 
              ? 'Recherchez votre exchange parmi +700 intégrations' 
              : 'Search your exchange among +700 integrations'
            }
            className={`w-full pl-10 pr-4 py-2 rounded-lg ${
              isDarkMode 
                ? 'bg-gray-800 text-white placeholder-gray-400 border-gray-700' 
                : 'bg-white text-gray-900 placeholder-gray-500 border-gray-200'
            }`}
            disabled
          />
        </div>
      </div>

      {/* Grille des exchanges */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {exchanges.map((exchange, index) => (
          <div
            key={index}
            className={`relative border-2 rounded-lg p-4 opacity-50 pointer-events-none ${
              isDarkMode 
                ? `${exchange.borderColor} bg-gray-800` 
                : `${exchange.borderColor} bg-gray-50`
            }`}
          >
            <div className="flex flex-col items-center text-center">
              <div className={`w-12 h-12 rounded-lg ${exchange.color} flex items-center justify-center mb-2`}>
                <span className="text-white font-bold text-lg">{exchange.logo}</span>
              </div>
              <h4 className={`text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {exchange.name}
              </h4>
              <p className={`text-xs mt-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Coming soon
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

