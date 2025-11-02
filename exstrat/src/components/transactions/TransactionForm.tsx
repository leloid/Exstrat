'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { TokenSearch } from './TokenSearch';
import { TokenSearchResult, CreateTransactionDto } from '@/types/transactions';
import { transactionsApi } from '@/lib/transactions-api';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { formatUSD } from '@/lib/format';

interface TransactionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: any; // Transaction à modifier
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess, onCancel, initialData }) => {
  const { portfolios, currentPortfolio, selectPortfolio } = usePortfolio();
  const [selectedToken, setSelectedToken] = useState<TokenSearchResult | null>(null);
  const [formData, setFormData] = useState({
    quantity: '',
    amountInvested: '',
    averagePrice: '',
    type: 'BUY' as const,
    transactionDate: new Date().toISOString().split('T')[0],
    notes: '',
    portfolioId: currentPortfolio?.id || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Initialiser le formulaire avec les données existantes (mode édition)
  useEffect(() => {
    if (initialData) {
      setIsEditMode(true);
      setFormData({
        quantity: initialData.quantity?.toString() || '',
        amountInvested: initialData.amountInvested?.toString() || '',
        averagePrice: initialData.averagePrice?.toString() || '',
        type: initialData.type || 'BUY',
        transactionDate: initialData.transactionDate 
          ? new Date(initialData.transactionDate).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0],
        notes: initialData.notes || '',
        portfolioId: initialData.portfolioId || currentPortfolio?.id || '',
      });
      
      // Pré-remplir le token sélectionné
      if (initialData.symbol && initialData.name && initialData.cmcId) {
        setSelectedToken({
          id: initialData.cmcId,
          name: initialData.name,
          symbol: initialData.symbol,
          slug: initialData.symbol.toLowerCase(),
          cmc_rank: 0,
          quote: null,
        });
      }
    }
  }, [initialData, currentPortfolio]);

  // Mettre à jour le portfolioId quand currentPortfolio change (seulement en mode création)
  useEffect(() => {
    if (currentPortfolio && !isEditMode) {
      setFormData(prev => ({
        ...prev,
        portfolioId: currentPortfolio.id,
      }));
    }
  }, [currentPortfolio, isEditMode]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTokenSelect = (token: TokenSearchResult | null) => {
    setSelectedToken(token);
    // Ne plus auto-remplir le prix moyen car il sera calculé automatiquement
    // Le prix moyen sera calculé à partir de quantité et montant investi
  };

  const calculateAveragePrice = () => {
    const quantity = parseFloat(formData.quantity);
    const amountInvested = parseFloat(formData.amountInvested);
    if (!isNaN(quantity) && !isNaN(amountInvested) && quantity > 0) {
      return (amountInvested / quantity).toFixed(8);
    }
    return '';
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => {
      const newData = { ...prev, quantity: value };
      // Calculer automatiquement le prix moyen à partir de la quantité et du montant investi
      const qty = parseFloat(value);
      const amount = parseFloat(newData.amountInvested);
      if (!isNaN(qty) && !isNaN(amount) && qty > 0) {
        newData.averagePrice = (amount / qty).toFixed(8);
      } else {
        newData.averagePrice = '';
      }
      return newData;
    });
  };

  const handleAmountInvestedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => {
      const newData = { ...prev, amountInvested: value };
      // Calculer automatiquement le prix moyen à partir de la quantité et du montant investi
      const qty = parseFloat(newData.quantity);
      const amount = parseFloat(value);
      if (!isNaN(qty) && !isNaN(amount) && qty > 0) {
        newData.averagePrice = (amount / qty).toFixed(8);
      } else {
        newData.averagePrice = '';
      }
      return newData;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedToken) {
      setError('Veuillez sélectionner un token');
      return;
    }

    if (!formData.quantity || !formData.averagePrice || !formData.amountInvested || !formData.portfolioId) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditMode && initialData?.id) {
        // Mode édition : envoyer seulement les champs modifiables
        const updateData = {
          quantity: parseFloat(formData.quantity),
          amountInvested: parseFloat(formData.amountInvested),
          averagePrice: parseFloat(formData.averagePrice),
          type: formData.type,
          transactionDate: new Date(formData.transactionDate).toISOString(),
          notes: formData.notes || undefined,
        };
        await transactionsApi.updateTransaction(initialData.id, updateData);
      } else {
        // Mode création : envoyer tous les champs
        const transactionData: CreateTransactionDto = {
          symbol: selectedToken.symbol,
          name: selectedToken.name,
          cmcId: selectedToken.id,
          quantity: parseFloat(formData.quantity),
          amountInvested: parseFloat(formData.amountInvested),
          averagePrice: parseFloat(formData.averagePrice),
          type: formData.type,
          transactionDate: new Date(formData.transactionDate).toISOString(),
          notes: formData.notes || undefined,
          portfolioId: formData.portfolioId,
        };
        await transactionsApi.createTransaction(transactionData);
      }
      
      // Reset form
      setSelectedToken(null);
      setFormData({
        quantity: '',
        amountInvested: '',
        averagePrice: '',
        type: 'BUY',
        transactionDate: new Date().toISOString().split('T')[0],
        notes: '',
        portfolioId: currentPortfolio?.id || '',
      });
      setIsEditMode(false);

      onSuccess?.();
    } catch (err: any) {
      const action = isEditMode ? 'modification' : 'création';
      setError(err.response?.data?.message || `Erreur lors de la ${action} de la transaction`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{isEditMode ? 'Modifier la transaction' : 'Ajouter une Transaction'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Recherche de token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Token *
            </label>
            <TokenSearch
              onTokenSelect={handleTokenSelect}
              selectedToken={selectedToken}
            />
          </div>

          {/* Sélection du portefeuille */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Portefeuille *
            </label>
            <Select
              value={formData.portfolioId}
              onValueChange={(value) => {
                setFormData(prev => ({ ...prev, portfolioId: value }));
                // Mettre à jour le portfolio sélectionné dans le contexte
                const portfolio = portfolios.find(p => p.id === value);
                if (portfolio) {
                  selectPortfolio(portfolio.id);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un portefeuille" />
              </SelectTrigger>
              <SelectContent>
                {portfolios.map((portfolio) => (
                  <SelectItem key={portfolio.id} value={portfolio.id}>
                    {portfolio.name} {portfolio.isDefault && '(Défaut)'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {portfolios.length === 0 && (
              <p className="text-sm text-gray-500 mt-1">
                Aucun portefeuille disponible. Créez-en un d'abord.
              </p>
            )}
          </div>

          {/* Quantité et Montant investi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantité *
              </label>
              <Input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleQuantityChange}
                placeholder="0.00"
                step="0.00000001"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Montant investi (USD) *
              </label>
              <Input
                type="number"
                name="amountInvested"
                value={formData.amountInvested}
                onChange={handleAmountInvestedChange}
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>
          </div>

          {/* Prix moyen (calculé automatiquement) */}
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">
              Prix moyen (USD) *
            </label>
            <Input
              type="number"
              name="averagePrice"
              value={formData.averagePrice}
              readOnly
              disabled
              placeholder="0.00"
              step="0.00000001"
              className="bg-gray-100 cursor-not-allowed"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Calculé automatiquement: {calculateAveragePrice() || '0.00'} USD
            </p>
          </div>

          {/* Date de transaction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date de transaction *
            </label>
            <Input
              type="date"
              name="transactionDate"
              value={formData.transactionDate}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes (optionnel)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows={3}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              placeholder="Ajoutez des notes sur cette transaction..."
            />
          </div>

          {/* Erreur */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Boutons */}
          <div className="flex justify-end space-x-3">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={loading}
              >
                Annuler
              </Button>
            )}
            <Button
              type="submit"
              disabled={loading || !selectedToken}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading 
                ? (isEditMode ? 'Modification...' : 'Création...') 
                : (isEditMode ? 'Modifier la transaction' : 'Créer la transaction')
              }
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
