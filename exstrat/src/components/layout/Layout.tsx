'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePathname } from 'next/navigation';
import AppBar from './AppBar';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();
  const pathname = usePathname();

  // Pages qui ne doivent pas avoir la barre de navigation
  const noNavPages = ['/onboarding', '/landing', '/login', '/dashboard', '/portfolio'];
  const shouldShowNav = user && !noNavPages.includes(pathname);

  // Si l'utilisateur n'est pas connecté ou si c'est une page sans nav, ne pas afficher la barre de navigation
  if (!shouldShowNav) {
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
