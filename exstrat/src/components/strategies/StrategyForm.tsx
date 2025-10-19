'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { StrategyFormData, StrategyStepFormData, TargetType, TransactionResponse } from '@/types/strategies';
import { formatUSD, formatQuantity } from '@/lib/format';
import {
  PlusIcon,
  TrashIcon,
  InformationCircleIcon,
  CalculatorIcon,
} from '@heroicons/react/24/outline';

interface StrategyFormProps {
  initialData?: Partial<StrategyFormData>;
  userTransactions: TransactionResponse[];
  onSubmit: (data: StrategyFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  isEditing?: boolean;
}

export const StrategyForm: React.FC<StrategyFormProps> = ({
  initialData,
  userTransactions,
  onSubmit,
  onCancel,
  loading = false,
  isEditing = false,
}) => {
  const [formData, setFormData] = useState<StrategyFormData>({
    name: initialData?.name || '',
    symbol: initialData?.symbol || '',
    tokenName: initialData?.tokenName || '',
    cmcId: initialData?.cmcId || 0,
    baseQuantity: initialData?.baseQuantity || 0,
    referencePrice: initialData?.referencePrice || 0,
    steps: initialData?.steps?.length ? initialData.steps.map(step => ({
      targetType: step.targetType || TargetType.PERCENTAGE_OF_AVERAGE,
      targetValue: step.targetValue || 0,
      sellPercentage: step.sellPercentage || 0,
      notes: step.notes || '',
    })) : [
      {
        targetType: TargetType.PERCENTAGE_OF_AVERAGE,
        targetValue: 25,
        sellPercentage: 20,
        notes: '',
      },
    ],
    notes: initialData?.notes || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Calculer les statistiques du portfolio
  const portfolioStats = React.useMemo(() => {
    const stats: Record<string, { totalQuantity: number; totalInvested: number; averagePrice: number }> = {};
    
    userTransactions.forEach(transaction => {
      if (!stats[transaction.symbol]) {
        stats[transaction.symbol] = { totalQuantity: 0, totalInvested: 0, averagePrice: 0 };
      }
      
      if (transaction.type === 'BUY' || transaction.type === 'TRANSFER_IN' || transaction.type === 'STAKING' || transaction.type === 'REWARD') {
        stats[transaction.symbol].totalQuantity += transaction.quantity;
        stats[transaction.symbol].totalInvested += transaction.amountInvested;
      } else {
        stats[transaction.symbol].totalQuantity -= transaction.quantity;
        stats[transaction.symbol].totalInvested -= transaction.amountInvested;
      }
    });

    // Calculer le prix moyen
    Object.keys(stats).forEach(symbol => {
      if (stats[symbol].totalQuantity > 0) {
        stats[symbol].averagePrice = stats[symbol].totalInvested / stats[symbol].totalQuantity;
      }
    });

    return stats;
  }, [userTransactions]);

  // Mettre à jour les données quand le symbole change
  useEffect(() => {
    if (formData.symbol && portfolioStats[formData.symbol]) {
      const stats = portfolioStats[formData.symbol];
      setFormData(prev => ({
        ...prev,
        tokenName: prev.tokenName || formData.symbol,
        baseQuantity: prev.baseQuantity || stats.totalQuantity,
        referencePrice: prev.referencePrice || stats.averagePrice,
      }));
    }
  }, [formData.symbol, portfolioStats]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom de la stratégie est requis';
    }

    if (!formData.symbol.trim()) {
      newErrors.symbol = 'Le symbole du token est requis';
    }

    if (formData.baseQuantity <= 0) {
      newErrors.baseQuantity = 'La quantité doit être positive';
    }

    if (formData.referencePrice <= 0) {
      newErrors.referencePrice = 'Le prix de référence doit être positif';
    }

    if (formData.steps.length === 0) {
      newErrors.steps = 'Au moins une étape est requise';
    }

    // Vérifier que la somme des pourcentages ne dépasse pas 100%
    const totalPercentage = formData.steps.reduce((sum, step) => sum + step.sellPercentage, 0);
    if (totalPercentage > 100) {
      newErrors.steps = 'La somme des pourcentages de vente ne peut pas dépasser 100%';
    }

    // Vérifier chaque étape
    formData.steps.forEach((step, index) => {
      if (step.targetValue <= 0) {
        newErrors[`step_${index}_targetValue`] = 'La valeur cible doit être positive';
      }
      if (step.sellPercentage <= 0 || step.sellPercentage > 100) {
        newErrors[`step_${index}_sellPercentage`] = 'Le pourcentage doit être entre 1 et 100';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [
        ...prev.steps,
        {
          targetType: TargetType.PERCENTAGE_OF_AVERAGE,
          targetValue: 50,
          sellPercentage: 20,
          notes: '',
        },
      ],
    }));
  };

  const removeStep = (index: number) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  const updateStep = (index: number, field: keyof StrategyStepFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.map((step, i) => 
        i === index ? { ...step, [field]: value } : step
      ),
    }));
  };

  const calculateTargetPrice = (step: StrategyStepFormData): number => {
    if (step.targetType === TargetType.EXACT_PRICE) {
      return step.targetValue;
    } else {
      return formData.referencePrice * (1 + step.targetValue / 100);
    }
  };

  const calculateTotalTokensToSell = (): number => {
    return formData.steps.reduce((sum, step) => {
      return sum + (formData.baseQuantity * step.sellPercentage / 100);
    }, 0);
  };

  const calculateEstimatedProfit = (): number => {
    return formData.steps.reduce((sum, step) => {
      const tokensToSell = formData.baseQuantity * step.sellPercentage / 100;
      const targetPrice = calculateTargetPrice(step);
      const profit = tokensToSell * (targetPrice - formData.referencePrice);
      return sum + profit;
    }, 0);
  };

  const availableTokens = Object.keys(portfolioStats).filter(symbol => 
    portfolioStats[symbol].totalQuantity > 0
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informations générales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <InformationCircleIcon className="h-5 w-5" />
            <span>Informations de la stratégie</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom de la stratégie *
              </label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="ex: Stratégie BTC 2025"
                className={errors.name ? 'border-red-500' : ''}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Token *
              </label>
              <select
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
              >
                <option value="">Sélectionner un token</option>
                {availableTokens.map(symbol => (
                  <option key={symbol} value={symbol}>
                    {symbol} - {formatQuantity(portfolioStats[symbol].totalQuantity)} tokens
                  </option>
                ))}
              </select>
              {errors.symbol && <p className="text-red-500 text-xs mt-1">{errors.symbol}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Quantité de référence *
              </label>
              <Input
                type="number"
                step="0.00000001"
                value={formData.baseQuantity === 0 ? '' : (formData.baseQuantity || '')}
                onChange={(e) => setFormData(prev => ({ ...prev, baseQuantity: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00000000"
                className={errors.baseQuantity ? 'border-red-500' : ''}
              />
              {errors.baseQuantity && <p className="text-red-500 text-xs mt-1">{errors.baseQuantity}</p>}
              <p className="text-xs text-gray-500 mt-1">
                Disponible: {formData.symbol && portfolioStats[formData.symbol] 
                  ? formatQuantity(portfolioStats[formData.symbol].totalQuantity) 
                  : '0'} {formData.symbol}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prix de référence (USD) *
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.referencePrice === 0 ? '' : (formData.referencePrice || '')}
                onChange={(e) => setFormData(prev => ({ ...prev, referencePrice: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
                className={errors.referencePrice ? 'border-red-500' : ''}
              />
              {errors.referencePrice && <p className="text-red-500 text-xs mt-1">{errors.referencePrice}</p>}
              <p className="text-xs text-gray-500 mt-1">
                Prix moyen: {formData.symbol && portfolioStats[formData.symbol] 
                  ? formatUSD(portfolioStats[formData.symbol].averagePrice) 
                  : '$0.00'}
              </p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes (optionnel)
            </label>
            <Input
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Description de votre stratégie..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Étapes de la stratégie */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <CalculatorIcon className="h-5 w-5" />
              <span>Étapes de sortie</span>
            </CardTitle>
            <Button type="button" onClick={addStep} variant="outline" size="sm">
              <PlusIcon className="h-4 w-4 mr-1" />
              Ajouter une étape
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.steps.map((step, index) => (
            <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium text-gray-900 dark:text-white">
                  Sortie {index + 1}
                </h4>
                {formData.steps.length > 1 && (
                  <Button
                    type="button"
                    onClick={() => removeStep(index)}
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Type de cible
                  </label>
                  <select
                    value={step.targetType}
                    onChange={(e) => updateStep(index, 'targetType', e.target.value as TargetType)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                  >
                    <option value={TargetType.PERCENTAGE_OF_AVERAGE}>Pourcentage du prix moyen</option>
                    <option value={TargetType.EXACT_PRICE}>Prix exact</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {step.targetType === TargetType.EXACT_PRICE ? 'Prix cible (USD)' : 'Pourcentage (%)'}
                  </label>
                  <Input
                    type="number"
                    step={step.targetType === TargetType.EXACT_PRICE ? "0.01" : "1"}
                    value={step.targetValue === 0 ? '' : (step.targetValue || '')}
                    onChange={(e) => updateStep(index, 'targetValue', parseFloat(e.target.value) || 0)}
                    placeholder={step.targetType === TargetType.EXACT_PRICE ? "0.00" : "0"}
                    className={errors[`step_${index}_targetValue`] ? 'border-red-500' : ''}
                  />
                  {errors[`step_${index}_targetValue`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`step_${index}_targetValue`]}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Prix cible: {formatUSD(calculateTargetPrice(step))}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Pourcentage à vendre (%)
                  </label>
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    value={step.sellPercentage === 0 ? '' : (step.sellPercentage || '')}
                    onChange={(e) => updateStep(index, 'sellPercentage', parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className={errors[`step_${index}_sellPercentage`] ? 'border-red-500' : ''}
                  />
                  {errors[`step_${index}_sellPercentage`] && (
                    <p className="text-red-500 text-xs mt-1">{errors[`step_${index}_sellPercentage`]}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Quantité: {formatQuantity(formData.baseQuantity * step.sellPercentage / 100)} {formData.symbol}
                  </p>
                </div>
              </div>

              <div className="mt-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes (optionnel)
                </label>
                <Input
                  value={step.notes}
                  onChange={(e) => updateStep(index, 'notes', e.target.value)}
                  placeholder="Description de cette sortie..."
                />
              </div>
            </div>
          ))}

          {errors.steps && <p className="text-red-500 text-sm">{errors.steps}</p>}
        </CardContent>
      </Card>

      {/* Résumé de la stratégie */}
      <Card>
        <CardHeader>
          <CardTitle>Résumé de la stratégie</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Total à vendre</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatQuantity(calculateTotalTokensToSell())} {formData.symbol}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Tokens restants</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatQuantity(formData.baseQuantity - calculateTotalTokensToSell())} {formData.symbol}
              </p>
            </div>
            <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400">Profit estimé</p>
              <p className={`text-lg font-semibold ${
                calculateEstimatedProfit() >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatUSD(calculateEstimatedProfit())}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={loading}>
          {loading 
            ? (isEditing ? 'Mise à jour...' : 'Création...') 
            : (isEditing ? 'Mettre à jour la stratégie' : 'Créer la stratégie')
          }
        </Button>
      </div>
    </form>
  );
};
