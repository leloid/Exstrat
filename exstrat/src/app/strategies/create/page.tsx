'use client';

import React, { useState, useEffect } from 'react';
import { usePortfolio } from '@/contexts/PortfolioContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  PlusIcon as Plus,
  ChartBarIcon as ChartBar,
  CheckIcon as Check,
  ArrowLeftIcon as ArrowLeft
} from '@heroicons/react/24/outline';
import { useRouter } from 'next/navigation';
import * as portfoliosApi from '@/lib/portfolios-api';

export default function CreateStrategyPage() {
  const router = useRouter();
  const { portfolios, currentPortfolio, refreshPortfolios } = usePortfolio();
  const [strategyTemplates, setStrategyTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    portfolioId: currentPortfolio?.id || '',
    strategyTemplateId: '',
    status: 'draft' as 'draft' | 'active' | 'paused' | 'completed'
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      setIsLoading(true);
      const templates = await portfoliosApi.getStrategyTemplates();
      setStrategyTemplates(templates);
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.portfolioId) return;

    try {
      setIsSaving(true);
      await portfoliosApi.createUserStrategy({
        portfolioId: formData.portfolioId,
        name: formData.name,
        description: formData.description,
        status: formData.status
      });
      
      await refreshPortfolios();
      router.push('/strategies');
    } catch (error) {
      console.error('Erreur lors de la création de la stratégie:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Chargement des templates...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Créer une Stratégie</h1>
              <p className="mt-2 text-gray-600">
                Créez une nouvelle stratégie de trading personnalisée
              </p>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ChartBar className="h-6 w-6" />
              Nouvelle Stratégie
            </CardTitle>
            <CardDescription>
              Configurez les paramètres de base de votre stratégie
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Label htmlFor="name">Nom de la stratégie *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Bullrun 2025 Q3"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description (optionnel)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Décrivez votre stratégie..."
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="portfolioId">Portfolio *</Label>
                  <Select value={formData.portfolioId} onValueChange={(value) => setFormData({ ...formData, portfolioId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un portfolio..." />
                    </SelectTrigger>
                    <SelectContent>
                      {portfolios.map((portfolio) => (
                        <SelectItem key={portfolio.id} value={portfolio.id}>
                          {portfolio.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Statut</Label>
                  <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="paused">En pause</SelectItem>
                      <SelectItem value="completed">Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="strategyTemplateId">Template de stratégie (optionnel)</Label>
                <Select value={formData.strategyTemplateId} onValueChange={(value) => setFormData({ ...formData, strategyTemplateId: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {strategyTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Un template peut vous aider à démarrer avec des paramètres prédéfinis
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Annuler
                </Button>
                <Button type="submit" disabled={isSaving || !formData.portfolioId} className="flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  {isSaving ? 'Création...' : 'Créer la stratégie'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Aide */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Comment ça marche ?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  1
                </div>
                <h3 className="font-medium">Créez la stratégie</h3>
                <p className="text-sm text-muted-foreground">
                  Définissez le nom et la description de votre stratégie
                </p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  2
                </div>
                <h3 className="font-medium">Configurez les tokens</h3>
                <p className="text-sm text-muted-foreground">
                  Appliquez la stratégie à vos tokens spécifiques
                </p>
              </div>
              <div className="text-center">
                <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  3
                </div>
                <h3 className="font-medium">Surveillez</h3>
                <p className="text-sm text-muted-foreground">
                  Suivez les performances et ajustez si nécessaire
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
