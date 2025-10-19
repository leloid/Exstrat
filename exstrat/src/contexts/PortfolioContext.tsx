'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Portfolio, Holding, PortfolioContextType, CreatePortfolioDto, UpdatePortfolioDto } from '@/types/portfolio';
import * as portfoliosApi from '@/lib/portfolios-api';

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

interface PortfolioProviderProps {
  children: React.ReactNode;
}

export const PortfolioProvider: React.FC<PortfolioProviderProps> = ({ children }) => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [currentPortfolio, setCurrentPortfolio] = useState<Portfolio | null>(null);
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les portfolios au démarrage
  useEffect(() => {
    loadPortfolios();
  }, []);

  // Charger les holdings quand le portfolio courant change
  useEffect(() => {
    if (currentPortfolio) {
      loadHoldings(currentPortfolio.id);
    } else {
      setHoldings([]);
    }
  }, [currentPortfolio]);

  const loadPortfolios = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Chargement des portfolios...');
      const data = await portfoliosApi.getPortfolios();
      console.log('📊 Portfolios reçus:', data);
      console.log('📊 Nombre de portfolios:', data.length);
      
      // Filtrer les portfolios par utilisateur (sécurité supplémentaire)
      const filteredPortfolios = data.filter(portfolio => {
        console.log(`Portfolio: ${portfolio.name} - ID: ${portfolio.id}`);
        return portfolio; // L'API backend filtre déjà par utilisateur
      });
      
      console.log('📊 Portfolios filtrés:', filteredPortfolios.length);
      setPortfolios(filteredPortfolios);
      
      // Sélectionner le portfolio par défaut s'il existe
      const defaultPortfolio = filteredPortfolios.find(p => p.isDefault);
      if (defaultPortfolio) {
        console.log('✅ Portfolio par défaut sélectionné:', defaultPortfolio.name);
        setCurrentPortfolio(defaultPortfolio);
      } else if (filteredPortfolios.length > 0) {
        console.log('✅ Premier portfolio sélectionné:', filteredPortfolios[0].name);
        setCurrentPortfolio(filteredPortfolios[0]);
      }
    } catch (err: any) {
      console.error('❌ Erreur lors du chargement des portfolios:', err);
      setError(err.response?.data?.message || 'Erreur lors du chargement des portfolios');
    } finally {
      setIsLoading(false);
    }
  };

  const loadHoldings = async (portfolioId: string) => {
    try {
      setError(null);
      const data = await portfoliosApi.getPortfolioHoldings(portfolioId);
      setHoldings(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du chargement des avoirs');
      console.error('Erreur lors du chargement des avoirs:', err);
    }
  };

  const createPortfolio = async (data: CreatePortfolioDto) => {
    try {
      setError(null);
      const newPortfolio = await portfoliosApi.createPortfolio(data);
      setPortfolios(prev => [...prev, newPortfolio]);
      
      // Si c'est le portfolio par défaut, le sélectionner
      if (data.isDefault) {
        setCurrentPortfolio(newPortfolio);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création du portfolio');
      throw err;
    }
  };

  const updatePortfolio = async (id: string, data: UpdatePortfolioDto) => {
    try {
      setError(null);
      const updatedPortfolio = await portfoliosApi.updatePortfolio(id, data);
      setPortfolios(prev => prev.map(p => p.id === id ? updatedPortfolio : p));
      
      // Si c'est le portfolio courant qui est modifié, le mettre à jour
      if (currentPortfolio?.id === id) {
        setCurrentPortfolio(updatedPortfolio);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du portfolio');
      throw err;
    }
  };

  const deletePortfolio = async (id: string) => {
    try {
      setError(null);
      await portfoliosApi.deletePortfolio(id);
      setPortfolios(prev => prev.filter(p => p.id !== id));
      
      // Si c'est le portfolio courant qui est supprimé, sélectionner un autre
      if (currentPortfolio?.id === id) {
        const remainingPortfolios = portfolios.filter(p => p.id !== id);
        if (remainingPortfolios.length > 0) {
          const defaultPortfolio = remainingPortfolios.find(p => p.isDefault) || remainingPortfolios[0];
          setCurrentPortfolio(defaultPortfolio);
        } else {
          setCurrentPortfolio(null);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la suppression du portfolio');
      throw err;
    }
  };

  const refreshPortfolios = async () => {
    await loadPortfolios();
  };

  const refreshHoldings = async (portfolioId: string) => {
    await loadHoldings(portfolioId);
  };

  const selectPortfolio = (portfolioId: string | null) => {
    if (portfolioId === null) {
      setCurrentPortfolio(null);
    } else {
      const portfolio = portfolios.find(p => p.id === portfolioId);
      if (portfolio) {
        setCurrentPortfolio(portfolio);
      }
    }
  };

  const syncPortfolios = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('🔄 Synchronisation des portfolios...');
      await portfoliosApi.syncPortfolios();
      console.log('✅ Synchronisation terminée');
      // Recharger les portfolios après synchronisation
      await loadPortfolios();
    } catch (err: any) {
      console.error('❌ Erreur lors de la synchronisation:', err);
      setError(err.response?.data?.message || 'Erreur lors de la synchronisation');
    } finally {
      setIsLoading(false);
    }
  };

  const value: PortfolioContextType = {
    portfolios,
    currentPortfolio,
    holdings,
    isLoading,
    error,
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
    setCurrentPortfolio,
    selectPortfolio,
    refreshPortfolios,
    refreshHoldings,
    syncPortfolios,
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};