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
  CheckIcon as Check,
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  Cog6ToothIcon,
  StarIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/format';
import type { Holding } from '@/types/portfolio';

// Design épuré et professionnel
const MinimalChartSVG = ({ value, invested }: { value: number, invested: number }) => {
  const percentage = invested > 0 ? (value / invested) * 100 : 0;
  const isProfit = value >= invested;
  
  return (
    <svg className="w-full h-8" viewBox="0 0 100 32" fill="none">
      <rect x="0" y="16" width="100" height="1" fill="#E5E7EB"/>
      <rect 
        x="0" 
        y="16" 
        width={`${Math.min(percentage, 100)}`} 
        height="1" 
        fill={isProfit ? "#10B981" : "#EF4444"}
      />
    </svg>
  );
};

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
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header épuré */}
        <div className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-gray-900">Portfolios</h1>
              <p className="text-gray-500 mt-1">
                {totalPortfolios} portfolio{totalPortfolios > 1 ? 's' : ''} • {totalPositions} position{totalPositions > 1 ? 's' : ''}
              </p>
            </div>
            <Button 
              onClick={() => setShowCreateForm(true)} 
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2 rounded-lg font-medium"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nouveau Portfolio
            </Button>
          </div>
        </div>

        {/* Statistiques globales épurées */}
        <div className="mb-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-500 mb-1">Valeur totale</div>
              <div className="text-2xl font-semibold text-gray-900">{formatCurrency(globalValue)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-500 mb-1">Investi</div>
              <div className="text-2xl font-semibold text-gray-900">{formatCurrency(globalInvested)}</div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-500 mb-1">Performance</div>
              <div className={`text-2xl font-semibold ${globalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(globalProfitLoss)}
              </div>
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="text-sm text-gray-500 mb-1">Rendement</div>
              <div className={`text-2xl font-semibold ${globalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(globalProfitLossPercentage)}
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire simplifié */}
        {(showCreateForm || editingPortfolio) && (
          <div className="mb-8 bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingPortfolio ? 'Modifier le Portfolio' : 'Nouveau Portfolio'}
            </h3>
            <form onSubmit={editingPortfolio ? handleUpdatePortfolio : handleCreatePortfolio} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nom du Portfolio</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Portfolio Principal"
                    className="mt-1"
                    required
                  />
                </div>
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={formData.isDefault}
                    onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-500"
                  />
                  <Label htmlFor="isDefault" className="text-sm font-medium text-gray-700">Portfolio par défaut</Label>
                </div>
              </div>
              <div>
                <Label htmlFor="description" className="text-sm font-medium text-gray-700">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Description optionnelle..."
                  rows={2}
                  className="mt-1"
                />
              </div>
              <div className="flex justify-end gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={editingPortfolio ? cancelEdit : () => setShowCreateForm(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" className="bg-gray-900 hover:bg-gray-800 text-white">
                  {editingPortfolio ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </div>
        )}


        {/* Liste des portfolios épurée */}
        <div className="space-y-4">
          {portfolios.map((portfolio) => {
            const portfolioValue = portfolioValues[portfolio.id]?.value || 0;
            const portfolioInvested = portfolioValues[portfolio.id]?.invested || 0;
            const portfolioProfitLoss = portfolioValue - portfolioInvested;
            const portfolioProfitLossPercentage = portfolioInvested > 0 ? (portfolioProfitLoss / portfolioInvested) * 100 : 0;
            const portfolioHoldings = holdingsByPortfolio[portfolio.id] || [];
            
            return (
              <div key={portfolio.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Wallet className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        {portfolio.name}
                        {portfolio.isDefault && (
                          <Badge className="bg-gray-900 text-white text-xs px-2 py-1">
                            Par défaut
                          </Badge>
                        )}
                      </h3>
                      <p className="text-sm text-gray-500">{portfolio.description || 'Aucune description'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(portfolio)}
                      className="text-gray-600 hover:text-gray-900"
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
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-500">Positions</div>
                    <div className="text-lg font-semibold text-gray-900">{portfolio.holdingsCount || 0}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Investi</div>
                    <div className="text-lg font-semibold text-gray-900">{formatCurrency(portfolioInvested)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Valeur</div>
                    <div className="text-lg font-semibold text-gray-900">{formatCurrency(portfolioValue)}</div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-500">Performance</div>
                    <div className={`text-lg font-semibold ${portfolioProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(portfolioProfitLoss)} ({formatPercentage(portfolioProfitLossPercentage)})
                    </div>
                  </div>
                </div>
                
                {/* Barre de performance minimaliste */}
                <div className="mb-4">
                  <MinimalChartSVG value={portfolioValue} invested={portfolioInvested} />
                </div>
                
                {/* Tokens détenus */}
                {portfolioHoldings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Tokens détenus</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {portfolioHoldings.slice(0, 6).map((holding) => {
                        const percentage = portfolioValue > 0 ? ((holding.currentValue || 0) / portfolioValue) * 100 : 0;
                        return (
                          <div key={holding.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">
                                  {holding.token.symbol.charAt(0)}
                                </span>
                              </div>
                              <div>
                                <div className="text-sm font-medium text-gray-900">{holding.token.symbol}</div>
                                <div className="text-xs text-gray-500">{percentage.toFixed(1)}%</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900">{formatCurrency(holding.currentValue || 0)}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Message si pas de portfolios */}
        {portfolios.length === 0 && (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
              <Wallet className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun portfolio</h3>
            <p className="text-gray-500">
              Utilisez le bouton "Nouveau Portfolio" en haut de la page pour créer votre premier portfolio.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}