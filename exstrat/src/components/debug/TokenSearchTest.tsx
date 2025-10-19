'use client';

import React, { useState } from 'react';
import { TokenSearch } from '@/components/transactions/TokenSearch';
import { TokenSearchResult } from '@/types/transactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

export const TokenSearchTest: React.FC = () => {
  const [selectedToken, setSelectedToken] = useState<TokenSearchResult | null>(null);

  const handleTokenSelect = (token: TokenSearchResult | null) => {
    setSelectedToken(token);
    console.log('Token sélectionné:', token);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Test de Recherche de Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <TokenSearch
            onTokenSelect={handleTokenSelect}
            selectedToken={selectedToken}
          />
        </CardContent>
      </Card>

      {selectedToken && (
        <Card>
          <CardHeader>
            <CardTitle>Token Sélectionné</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {JSON.stringify(selectedToken, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
