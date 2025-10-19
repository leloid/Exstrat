'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PortfolioContextType {
  refreshKey: number;
  refreshPortfolio: () => void;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

export const usePortfolio = () => {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error('usePortfolio must be used within a PortfolioProvider');
  }
  return context;
};

interface PortfolioProviderProps {
  children: ReactNode;
}

export const PortfolioProvider: React.FC<PortfolioProviderProps> = ({ children }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshPortfolio = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <PortfolioContext.Provider value={{ refreshKey, refreshPortfolio }}>
      {children}
    </PortfolioContext.Provider>
  );
};
