'use client';

import React from 'react';
import { PortfolioViewFixed } from '@/components/transactions/PortfolioViewFixed';
import { usePortfolio } from '@/contexts/PortfolioContext';

export default function PortfolioPage() {
  const { refreshKey } = usePortfolio();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Mon Portfolio</h1>
          <p className="mt-2 text-gray-600">
            Vue d'ensemble de vos positions crypto
          </p>
        </div>

        {/* Contenu du portfolio */}
        <PortfolioViewFixed refreshKey={refreshKey} />
      </div>
    </div>
  );
}
