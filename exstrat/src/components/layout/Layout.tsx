'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AppBar from './AppBar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();

  // Si l'utilisateur n'est pas connecté, ne pas afficher la barre de navigation
  if (!user) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppBar />
      <main className="pt-16">
        {children}
      </main>
    </div>
  );
};

export default Layout;
