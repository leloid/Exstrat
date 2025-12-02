'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { TokenSearchResult } from '@/types/transactions';
import { transactionsApi } from '@/lib/transactions-api';
import { formatPrice, formatPercentage, formatUSD } from '@/lib/format';

interface TokenSearchProps {
  onTokenSelect: (token: TokenSearchResult | null) => void;
  selectedToken?: TokenSearchResult | null;
}

// Cache simple pour éviter les requêtes répétées
const searchCache = new Map<string, { data: TokenSearchResult[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const TokenSearch: React.FC<TokenSearchProps> = ({ onTokenSelect, selectedToken }) => {
  const [query, setQuery] = useState('');
  const [tokens, setTokens] = useState<TokenSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [rateLimited, setRateLimited] = useState(false);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchRef = useRef<string>('');

  const searchTokens = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setTokens([]);
      setShowResults(false);
      setError(null);
      return;
    }

    // Vérifier le cache
    const cacheKey = searchQuery.trim().toLowerCase();
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setTokens(cached.data);
      setShowResults(true);
      setError(null);
      setLoading(false);
      return;
    }

    // Éviter les recherches identiques consécutives
    if (lastSearchRef.current === cacheKey) {
      return;
    }

    setLoading(true);
    setError(null);
    setRateLimited(false);
    lastSearchRef.current = cacheKey;

    try {
      const results = await transactionsApi.searchTokens(searchQuery.trim());
      setTokens(results);
      setShowResults(true);
      setError(null);
      setRateLimited(false);
      
      // Mettre en cache les résultats
      searchCache.set(cacheKey, { data: results, timestamp: Date.now() });
    } catch (err: unknown) {
      console.error('Erreur recherche tokens:', err);
      // Gérer les différentes erreurs
      let errorMessage = 'Erreur lors de la recherche de tokens';
      const error = err as { response?: { status?: number; data?: { message?: string } }; message?: string };
      
      if (error.response?.status === 429) {
        errorMessage = 'Trop de requêtes. Veuillez patienter quelques instants avant de réessayer.';
        setRateLimited(true);
        // Réessayer après 5 secondes
        setTimeout(() => {
          setRateLimited(false);
          setError(null);
        }, 5000);
      } else if (error.response?.status === 502 || error.response?.status === 503 || error.response?.status === 504) {
        errorMessage = 'Le serveur backend n\'est pas accessible. Veuillez vérifier que le serveur est démarré.';
      } else if (error.response?.status === 500) {
        errorMessage = 'Erreur interne du serveur. Veuillez réessayer plus tard.';
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      setError(errorMessage);
      setTokens([]);
      setShowResults(false);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Annuler le debounce précédent
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    
    // Si rate limited, ne pas faire de recherche
    if (rateLimited) {
      return;
    }
    
    // Debounce la recherche (augmenté à 500ms pour réduire les requêtes)
    debounceTimeoutRef.current = setTimeout(() => {
      searchTokens(value);
    }, 500);
  };

  const handleTokenSelect = (token: TokenSearchResult) => {
    setQuery(`${token.symbol} - ${token.name}`);
    setShowResults(false);
    onTokenSelect(token);
  };

  const handleClear = () => {
    setQuery('');
    setTokens([]);
    setShowResults(false);
    setError(null);
    setRateLimited(false);
    lastSearchRef.current = '';
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    onTokenSelect(null);
  };

  // Nettoyer le timeout au démontage
  useEffect(() => {
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={handleInputChange}
          placeholder="Rechercher un token (ex: BTC, ETH, ADA...)"
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        {query && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <button
              type="button"
              onClick={handleClear}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Résultats de recherche */}
      {showResults && (
        <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
          {loading && (
            <div className="px-4 py-2 text-gray-500 text-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mx-auto"></div>
              <span className="ml-2">Recherche en cours...</span>
            </div>
          )}

          {error && (
            <div className={`px-4 py-3 text-center rounded-md ${
              rateLimited 
                ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' 
                : 'bg-red-50 border border-red-200 text-red-600'
            }`}>
              <div className="font-medium text-sm">{error}</div>
              {rateLimited && (
                <div className="text-xs mt-1 text-yellow-700">
                  Attendez quelques secondes avant de réessayer...
                </div>
              )}
            </div>
          )}

          {!loading && !error && tokens.length === 0 && query && (
            <div className="px-4 py-2 text-gray-500 text-center">
              Aucun token trouvé pour "{query}"
            </div>
          )}

          {!loading && !error && tokens.map((token) => (
            <button
              key={token.id}
              onClick={() => handleTokenSelect(token)}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium text-gray-900">
                    {token.symbol} - {token.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    Rank #{token.cmc_rank} • {formatUSD(token.quote?.USD?.price)}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    {formatUSD(token.quote?.USD?.price)}
                  </div>
                  <div className={`text-xs ${(token.quote?.USD?.percent_change_24h || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercentage(token.quote?.USD?.percent_change_24h)}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Token sélectionné */}
      {selectedToken && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-blue-900">
                {selectedToken.symbol} - {selectedToken.name}
              </div>
              <div className="text-sm text-blue-700">
                Prix actuel: {formatUSD(selectedToken.quote?.USD?.price)}
              </div>
            </div>
            <button
              onClick={handleClear}
              className="text-blue-600 hover:text-blue-800"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
