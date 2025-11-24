'use client';

import React, { useState } from 'react';

interface ExchangeIntegrationProps {
  isDarkMode?: boolean;
  language?: 'fr' | 'en';
}

interface Exchange {
  name: string;
  logoUrl: string;
  fallbackColor: string;
  borderColor: string;
}

interface ExchangeCardProps {
  exchange: Exchange;
  isDarkMode: boolean;
}

const ExchangeCard: React.FC<ExchangeCardProps> = ({ exchange, isDarkMode }) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  return (
    <div
      className={`relative border-2 rounded-lg p-3 md:p-4 opacity-50 pointer-events-none w-full max-w-full transition-all ${
        isDarkMode 
          ? `${exchange.borderColor} bg-gray-800` 
          : `${exchange.borderColor} bg-gray-50`
      }`}
    >
      <div className="flex flex-col items-center text-center">
        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg flex items-center justify-center mb-2 overflow-hidden relative ${
          imageError ? exchange.fallbackColor : 'bg-transparent'
        }`}>
          {!imageError ? (
            <>
              {imageLoading && (
                <div className={`absolute inset-0 ${exchange.fallbackColor} flex items-center justify-center`}>
                  <span className={`text-white font-bold text-xs ${exchange.fallbackColor} w-full h-full flex items-center justify-center`}>
                    {exchange.name.charAt(0)}
                  </span>
                </div>
              )}
              <img
                src={exchange.logoUrl}
                alt={exchange.name}
                className={`w-full h-full object-contain p-1 ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity`}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
                onLoad={() => setImageLoading(false)}
              />
            </>
          ) : (
            <span className={`text-white font-bold text-base md:text-lg ${exchange.fallbackColor} w-full h-full flex items-center justify-center`}>
              {exchange.name.charAt(0)}
            </span>
          )}
        </div>
        <h4 className={`text-xs md:text-sm font-medium ${
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
  );
};

const exchanges: Exchange[] = [
  { 
    name: 'Binance', 
    logoUrl: '/assets/binance.png',
    fallbackColor: 'bg-yellow-500', 
    borderColor: 'border-yellow-600' 
  },
  { 
    name: 'Coinbase', 
    logoUrl: '/assets/Coinbase.png',
    fallbackColor: 'bg-blue-500', 
    borderColor: 'border-blue-600' 
  },
  { 
    name: 'Kraken', 
    logoUrl: '/assets/kraken.png',
    fallbackColor: 'bg-purple-500', 
    borderColor: 'border-purple-600' 
  },
  { 
    name: 'Ledger', 
    logoUrl: '/assets/ledger.png',
    fallbackColor: 'bg-gray-500', 
    borderColor: 'border-gray-600' 
  },
  { 
    name: 'Metamask', 
    logoUrl: '/assets/meta.png',
    fallbackColor: 'bg-orange-500', 
    borderColor: 'border-orange-600' 
  },
  { 
    name: 'Phantom', 
    logoUrl: '/assets/phantom.png',
    fallbackColor: 'bg-purple-400', 
    borderColor: 'border-purple-500' 
  },
];

export const ExchangeIntegration: React.FC<ExchangeIntegrationProps> = ({ 
  isDarkMode = true, 
  language = 'fr' 
}) => {
  return (
    <div className="mb-4 md:mb-8 w-full max-w-full">
      <div className="flex items-center gap-2 mb-3 md:mb-4">
        <h3 className={`text-base md:text-lg font-semibold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          {language === 'fr' ? 'Intégrations Exchange/Wallet' : 'Exchange/Wallet Integrations'}
        </h3>
      </div>
      
      {/* Barre de recherche */}
      <div className="mb-3 md:mb-4 w-full max-w-full">
        <div className={`relative ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        } border rounded-lg w-full max-w-full`}>
          <div className="absolute inset-y-0 left-0 flex items-center pl-2 md:pl-3 pointer-events-none">
            <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder={language === 'fr' 
              ? 'Recherchez votre exchange parmi +700 intégrations' 
              : 'Search your exchange among +700 integrations'
            }
            className={`w-full pl-8 md:pl-10 pr-3 md:pr-4 py-2 text-sm md:text-base rounded-lg ${
              isDarkMode 
                ? 'bg-gray-800 text-white placeholder-gray-400 border-gray-700' 
                : 'bg-white text-gray-900 placeholder-gray-500 border-gray-200'
            }`}
            disabled
          />
        </div>
      </div>

      {/* Grille des exchanges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4 w-full max-w-full">
        {exchanges.map((exchange, index) => (
          <ExchangeCard 
            key={index}
            exchange={exchange}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>
    </div>
  );
};
