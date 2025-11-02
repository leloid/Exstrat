'use client';

import React, { useState, useEffect } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { 
  XMarkIcon as X,
  CheckIcon as Save,
  Cog6ToothIcon as Settings,
  ArrowTrendingUpIcon as TrendingUp
} from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/format';
import * as portfoliosApi from '@/lib/portfolios-api';

interface StrategyConfigurationProps {
  holdingId?: string | null;
  onClose: () => void;
}

export const StrategyConfiguration: React.FC<StrategyConfigurationProps> = ({
  holdingId,
  onClose,
}) => {
  const { holdings, currentPortfolio, refreshPortfolios } = usePortfolio();
  const [strategyTemplates, setStrategyTemplates] = useState<any[]>([]);
  const [profitTakingTemplates, setProfitTakingTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // État du formulaire
  const [strategyName, setStrategyName] = useState('');
  const [strategyDescription, setStrategyDescription] = useState('');
  const [selectedStrategyTemplate, setSelectedStrategyTemplate] = useState('');
  const [selectedProfitTakingTemplate, setSelectedProfitTakingTemplate] = useState('');
  const [customRules, setCustomRules] = useState('');

  const holding = holdingId ? holdings.find(h => h.id === holdingId) : null;

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const [strategyTemplatesData, profitTakingTemplatesData] = await Promise.all([
        portfoliosApi.getStrategyTemplates(),
        portfoliosApi.getProfitTakingTemplates(),
      ]);
      setStrategyTemplates(strategyTemplatesData);
      setProfitTakingTemplates(profitTakingTemplatesData);
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentPortfolio || !holding) return;

    try {
      setIsSaving(true);

      // Créer une nouvelle stratégie utilisateur
      const userStrategy = await portfoliosApi.createUserStrategy({
        portfolioId: currentPortfolio.id,
        name: strategyName || `Stratégie ${holding.token.symbol}`,
        description: strategyDescription,
        status: 'draft',
      });

      // Configurer la stratégie pour ce token
      await portfoliosApi.configureTokenStrategy(userStrategy.id, {
        holdingId: holding.id,
        strategyTemplateId: selectedStrategyTemplate || undefined,
        profitTakingTemplateId: selectedProfitTakingTemplate || undefined,
        customProfitTakingRules: customRules ? JSON.parse(customRules) : undefined,
      });

      // Rafraîchir les portfolios
      await refreshPortfolios();
      
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="max-w-2xl w-full">
          <CardContent className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Chargement des templates...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!holding) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <Card className="max-w-2xl w-full">
          <CardContent className="text-center py-12">
            <p className="text-red-500">Position non trouvée</p>
            <Button onClick={onClose} className="mt-4">
              Fermer
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-6 w-6" />
                Configuration de stratégie
              </CardTitle>
              <CardDescription>
                Configurez une stratégie pour {holding.token.name} ({holding.token.symbol})
              </CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Informations sur la position */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-background rounded-full flex items-center justify-center">
                  <span className="font-bold text-lg">{holding.token.symbol}</span>
                </div>
                <div>
                  <h3 className="font-semibold">{holding.token.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {holding.quantity.toFixed(6)} {holding.token.symbol} • 
                    Prix moyen: {formatCurrency(holding.averagePrice)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xl font-bold">{formatCurrency(holding.currentValue || 0)}</div>
                <div className={`text-sm ${
                  (holding.profitLossPercentage || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(holding.profitLoss || 0)} ({formatPercentage(holding.profitLossPercentage || 0)})
                </div>
              </div>
            </div>
          </div>

          {/* Configuration de la stratégie */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="strategyName">Nom de la stratégie</Label>
              <Input
                id="strategyName"
                value={strategyName}
                onChange={(e) => setStrategyName(e.target.value)}
                placeholder={`Ex: Bullrun 2025 Q3 - ${holding.token.symbol}`}
              />
            </div>

            <div>
              <Label htmlFor="strategyDescription">Description (optionnel)</Label>
              <Textarea
                id="strategyDescription"
                value={strategyDescription}
                onChange={(e) => setStrategyDescription(e.target.value)}
                placeholder="Décrivez votre stratégie..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="strategyTemplate">Type de stratégie</Label>
                <Select value={selectedStrategyTemplate} onValueChange={setSelectedStrategyTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {strategyTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="profitTakingTemplate">Prises de profit</Label>
                <Select value={selectedProfitTakingTemplate} onValueChange={setSelectedProfitTakingTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir..." />
                  </SelectTrigger>
                  <SelectContent>
                    {profitTakingTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="customRules">Règles personnalisées (JSON, optionnel)</Label>
              <Textarea
                id="customRules"
                value={customRules}
                onChange={(e) => setCustomRules(e.target.value)}
                placeholder='{"levels": [{"percentage": 25, "targetPrice": 1.5}]}'
                rows={4}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Format JSON pour des règles de prise de profit personnalisées
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
