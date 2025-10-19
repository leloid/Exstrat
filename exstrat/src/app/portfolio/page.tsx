'use client';

import React, { useState } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  PlusIcon as Plus,
  WalletIcon as Wallet,
  PencilIcon as Edit,
  TrashIcon as Delete,
  CheckIcon as Check
} from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/format';

export default function PortfolioPage() {
  const { 
    portfolios, 
    currentPortfolio, 
    holdings, 
    isLoading, 
    error, 
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
    setCurrentPortfolio,
    refreshPortfolios,
    syncPortfolios 
  } = usePortfolio();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false
  });

  const totalValue = holdings.reduce((sum, holding) => sum + (holding.currentValue || 0), 0);
  const totalInvested = holdings.reduce((sum, holding) => sum + holding.investedAmount, 0);
  const totalProfitLoss = totalValue - totalInvested;
  const totalProfitLossPercentage = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

  const handleCreatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createPortfolio(formData);
      setFormData({ name: '', description: '', isDefault: false });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Erreur lors de la création:', error);
    }
  };

  const handleUpdatePortfolio = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPortfolio) return;
    try {
      await updatePortfolio(editingPortfolio, formData);
      setFormData({ name: '', description: '', isDefault: false });
      setEditingPortfolio(null);
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
    }
  };

  const handleDeletePortfolio = async (portfolioId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce portfolio ?')) {
      try {
        await deletePortfolio(portfolioId);
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
      }
    }
  };

  const startEdit = (portfolio: any) => {
    setEditingPortfolio(portfolio.id);
    setFormData({
      name: portfolio.name,
      description: portfolio.description || '',
      isDefault: portfolio.isDefault
    });
  };

  const cancelEdit = () => {
    setEditingPortfolio(null);
    setFormData({ name: '', description: '', isDefault: false });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des portfolios...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Portfolios</h1>
          <p className="mt-2 text-gray-600">
            Créez et gérez vos portfolios de crypto-monnaies
          </p>
        </div>

        {/* Contenu principal */}
        <div className="space-y-8">
          {/* Actions */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Mes Portfolios</h2>
              <p className="text-gray-600">
                {portfolios.length} portfolio{portfolios.length > 1 ? 's' : ''} • {holdings.length} position{holdings.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={syncPortfolios} 
                variant="outline" 
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Synchroniser
              </Button>
              <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Nouveau Portfolio
              </Button>
            </div>
          </div>

          {/* Formulaire de création/modification */}
          {(showCreateForm || editingPortfolio) && (
            <Card>
              <CardHeader>
                <CardTitle>
                  {editingPortfolio ? 'Modifier le Portfolio' : 'Nouveau Portfolio'}
                </CardTitle>
                <CardDescription>
                  {editingPortfolio ? 'Modifiez les informations de votre portfolio' : 'Créez un nouveau portfolio pour organiser vos investissements'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={editingPortfolio ? handleUpdatePortfolio : handleCreatePortfolio} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nom du Portfolio *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Portfolio Principal"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description (optionnel)</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Décrivez votre portfolio..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isDefault"
                      checked={formData.isDefault}
                      onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor="isDefault">Portfolio par défaut</Label>
                  </div>

                  <div className="flex justify-end gap-3">
                    <Button type="button" variant="outline" onClick={editingPortfolio ? cancelEdit : () => setShowCreateForm(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" className="flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      {editingPortfolio ? 'Modifier' : 'Créer'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Liste des portfolios */}
          <div className="grid gap-6">
            {portfolios.map((portfolio) => (
              <Card key={portfolio.id} className={currentPortfolio?.id === portfolio.id ? 'ring-2 ring-blue-500' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wallet className="h-6 w-6 text-blue-600" />
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {portfolio.name}
                          {portfolio.isDefault && (
                            <Badge variant="secondary">Par défaut</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{portfolio.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => startEdit(portfolio)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeletePortfolio(portfolio.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Delete className="h-4 w-4" />
                      </Button>
                      {currentPortfolio?.id !== portfolio.id && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPortfolio(portfolio)}
                        >
                          Sélectionner
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold">{portfolio.holdingsCount || 0}</div>
                      <div className="text-sm text-muted-foreground">Positions</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{formatCurrency(totalInvested)}</div>
                      <div className="text-sm text-muted-foreground">Investi</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
                      <div className="text-sm text-muted-foreground">Valeur actuelle</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Message si pas de portfolios */}
          {portfolios.length === 0 && (
            <Card>
              <CardContent className="text-center py-12">
                <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Aucun portfolio</h3>
                <p className="text-muted-foreground mb-4">
                  Créez votre premier portfolio pour commencer à organiser vos investissements.
                </p>
                <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Créer un portfolio
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}