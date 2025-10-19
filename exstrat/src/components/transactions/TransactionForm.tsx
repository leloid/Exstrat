'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { TokenSearch } from './TokenSearch';
import { TokenSearchResult, CreateTransactionDto } from '@/types/transactions';
import { transactionsApi } from '@/lib/transactions-api';
import { formatUSD } from '@/lib/format';

interface TransactionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess, onCancel }) => {
  const [selectedToken, setSelectedToken] = useState<TokenSearchResult | null>(null);
  const [formData, setFormData] = useState({
    quantity: '',
    amountInvested: '',
    averagePrice: '',
    type: 'BUY' as const,
    transactionDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleTokenSelect = (token: TokenSearchResult | null) => {
    setSelectedToken(token);
    if (token) {
      // Auto-remplir le prix moyen avec le prix actuel
      setFormData(prev => ({
        ...prev,
        averagePrice: token.quote?.USD?.price?.toString() || '',
      }));
    }
  };

  const calculateAmountInvested = () => {
    const quantity = parseFloat(formData.quantity);
    const averagePrice = parseFloat(formData.averagePrice);
    if (!isNaN(quantity) && !isNaN(averagePrice)) {
      return (quantity * averagePrice).toString();
    }
    return '';
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      quantity: value,
    }));

    // Auto-calculer le montant investi
    const averagePrice = parseFloat(formData.averagePrice);
    if (!isNaN(parseFloat(value)) && !isNaN(averagePrice)) {
      setFormData(prev => ({
        ...prev,
        amountInvested: (parseFloat(value) * averagePrice).toString(),
      }));
    }
  };

  const handleAveragePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      averagePrice: value,
    }));

    // Auto-calculer le montant investi
    const quantity = parseFloat(formData.quantity);
    if (!isNaN(quantity) && !isNaN(parseFloat(value))) {
      setFormData(prev => ({
        ...prev,
        amountInvested: (quantity * parseFloat(value)).toString(),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedToken) {
      setError('Veuillez sélectionner un token');
      return;
    }

    if (!formData.quantity || !formData.averagePrice || !formData.amountInvested) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);
    setError(null);

    try {
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
      };

      await transactionsApi.createTransaction(transactionData);
      
      // Reset form
      setSelectedToken(null);
      setFormData({
        quantity: '',
        amountInvested: '',
        averagePrice: '',
        type: 'BUY',
        transactionDate: new Date().toISOString().split('T')[0],
        notes: '',
      });

      onSuccess?.();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création de la transaction');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Ajouter une Transaction</CardTitle>
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

          {/* Type de transaction */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de transaction *
            </label>
            <select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="BUY">Achat</option>
              <option value="SELL">Vente</option>
              <option value="TRANSFER_IN">Transfert entrant</option>
              <option value="TRANSFER_OUT">Transfert sortant</option>
              <option value="STAKING">Staking</option>
              <option value="REWARD">Récompense</option>
            </select>
          </div>

          {/* Quantité et Prix */}
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
                Prix moyen (USD) *
              </label>
              <Input
                type="number"
                name="averagePrice"
                value={formData.averagePrice}
                onChange={handleAveragePriceChange}
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>
          </div>

          {/* Montant investi */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Montant investi (USD) *
            </label>
            <Input
              type="number"
              name="amountInvested"
              value={formData.amountInvested}
              onChange={handleInputChange}
              placeholder="0.00"
              step="0.01"
              required
            />
            <p className="mt-1 text-sm text-gray-500">
              Calculé automatiquement: {calculateAmountInvested() || '0.00'} USD
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
              {loading ? 'Création...' : 'Créer la transaction'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
