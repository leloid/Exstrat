'use client';

import React, { useState, useEffect } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import * as portfoliosApi from '@/lib/portfolios-api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import { 
  PlusIcon as Plus,
  WalletIcon as Wallet,
  PencilIcon as Edit,
  TrashIcon as Delete,
  CheckIcon as Check
} from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/format';
import type { Holding } from '@/types/portfolio';

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
    refreshHoldings,
    syncPortfolios
  } = usePortfolio();

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingPortfolio, setEditingPortfolio] = useState<string | null>(null);
  const [portfolioValues, setPortfolioValues] = useState<Record<string, {invested: number, value: number}>>({});
  const [holdingsByPortfolio, setHoldingsByPortfolio] = useState<Record<string, Holding[]>>({});
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isDefault: false
  });

  // Calculer les totaux pour le portfolio actuellement sélectionné
  const currentPortfolioValue = currentPortfolio ? holdings.reduce((sum, holding) => sum + (holding.currentValue || 0), 0) : 0;
  const currentPortfolioInvested = currentPortfolio ? holdings.reduce((sum, holding) => sum + holding.investedAmount, 0) : 0;
  const currentPortfolioProfitLoss = currentPortfolioValue - currentPortfolioInvested;
  const currentPortfolioProfitLossPercentage = currentPortfolioInvested > 0 ? (currentPortfolioProfitLoss / currentPortfolioInvested) * 100 : 0;

  // Statistiques globales (tous les portfolios)
  const totalPortfolios = portfolios.length;
  const totalPositions = portfolios.reduce((sum, p) => sum + (p.holdingsCount || 0), 0);
  const globalInvested = Object.values(portfolioValues).reduce((sum, v) => sum + (v?.invested || 0), 0);
  const globalValue = Object.values(portfolioValues).reduce((sum, v) => sum + (v?.value || 0), 0);
  const globalProfitLoss = globalValue - globalInvested;
  const globalProfitLossPercentage = globalInvested > 0 ? (globalProfitLoss / globalInvested) * 100 : 0;

  // Charger les valeurs de tous les portfolios
  useEffect(() => {
    const loadAllPortfolioValues = async () => {
      const values: Record<string, {invested: number, value: number}> = {};
      const byPortfolio: Record<string, Holding[]> = {};
      
      for (const portfolio of portfolios) {
        try {
          const portfolioHoldings = await portfoliosApi.getPortfolioHoldings(portfolio.id);
          const invested = portfolioHoldings.reduce((sum, holding) => sum + holding.investedAmount, 0);
          const value = portfolioHoldings.reduce((sum, holding) => sum + (holding.currentValue || 0), 0);
          values[portfolio.id] = { invested, value };
          byPortfolio[portfolio.id] = portfolioHoldings;
        } catch (error) {
          console.error(`Erreur lors du chargement des holdings pour ${portfolio.name}:`, error);
          values[portfolio.id] = { invested: 0, value: 0 };
          byPortfolio[portfolio.id] = [] as Holding[];
        }
      }
      
      setPortfolioValues(values);
      setHoldingsByPortfolio(byPortfolio);
    };
    
    if (portfolios.length > 0) {
      loadAllPortfolioValues();
    }
  }, [portfolios]);

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
    <div className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Portfolios</h1>
          <p className="mt-2 text-gray-600">
            Créez et gérez vos portfolios de crypto-monnaies
          </p>
        </div>

        {/* Aperçu global */}
        <div className="mb-8">
          <Card>
            <CardContent className="py-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-sm text-muted-foreground">Portfolios</div>
                  <div className="mt-1 text-2xl font-bold">{totalPortfolios}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Positions</div>
                  <div className="mt-1 text-2xl font-bold">{totalPositions}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Investi (total)</div>
                  <div className="mt-1 text-2xl font-bold">{formatCurrency(globalInvested)}</div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">Valeur actuelle</div>
                  <div className="mt-1 text-2xl font-bold">{formatCurrency(globalValue)}</div>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6 text-center">
                <div className="lg:col-start-2">
                  <div className="text-sm text-muted-foreground">P/L global</div>
                  <div className={`mt-1 text-2xl font-bold ${globalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(globalProfitLoss)}
                    <span className="ml-2 text-base font-medium text-gray-600">{formatPercentage(globalProfitLossPercentage)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
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
                          onClick={async () => {
                            setCurrentPortfolio(portfolio);
                            // Charger les holdings de ce portfolio
                            if (portfolio.id) {
                              await refreshHoldings(portfolio.id);
                              // Mettre à jour les valeurs de ce portfolio
                              try {
                                const portfolioHoldings = await portfoliosApi.getPortfolioHoldings(portfolio.id);
                                const invested = portfolioHoldings.reduce((sum, holding) => sum + holding.investedAmount, 0);
                                const value = portfolioHoldings.reduce((sum, holding) => sum + (holding.currentValue || 0), 0);
                                setPortfolioValues(prev => ({
                                  ...prev,
                                  [portfolio.id]: { invested, value }
                                }));
                              } catch (error) {
                                console.error('Erreur lors du chargement des valeurs:', error);
                              }
                            }
                          }}
                        >
                          Sélectionner
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Statistiques du portfolio */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-2xl font-bold">{portfolio.holdingsCount || 0}</div>
                        <div className="text-sm text-muted-foreground">Positions</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {formatCurrency(portfolioValues[portfolio.id]?.invested || 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Investi</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">
                          {formatCurrency(portfolioValues[portfolio.id]?.value || 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Valeur actuelle</div>
                      </div>
                    </div>
                    
                    {/* Tokens du portfolio */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Tokens détenus</h4>
                      {holdingsByPortfolio[portfolio.id] && holdingsByPortfolio[portfolio.id].length > 0 ? (
                        <div className="space-y-2">
                          {holdingsByPortfolio[portfolio.id].map((holding) => (
                            <div key={holding.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-bold text-blue-600">
                                    {holding.token.symbol.charAt(0)}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium">{holding.token.symbol}</div>
                                  <div className="text-xs text-muted-foreground">{holding.token.name}</div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">{holding.quantity} {holding.token.symbol}</div>
                                <div className="text-xs text-muted-foreground">
                                  {formatCurrency(holding.investedAmount)}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <p className="text-sm">Aucun token dans ce portfolio</p>
                        </div>
                      )}
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