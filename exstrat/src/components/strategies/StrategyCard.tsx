'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StrategyResponse, StrategyStatus, StepState } from '@/types/strategies';
import { formatUSD, formatPercentage, formatQuantity } from '@/lib/format';
import {
  ChartBarIcon,
  PencilIcon,
  TrashIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

interface StrategyCardProps {
  strategy: StrategyResponse;
  onEdit?: (strategy: StrategyResponse) => void;
  onDelete?: (strategy: StrategyResponse) => void;
  onToggleStatus?: (strategy: StrategyResponse) => void;
  onViewDetails?: (strategy: StrategyResponse) => void;
}

export const StrategyCard: React.FC<StrategyCardProps> = ({
  strategy,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewDetails,
}) => {
  const getStatusBadge = (status: StrategyStatus) => {
    const statusConfig = {
      [StrategyStatus.ACTIVE]: {
        color: 'bg-green-100 text-green-800',
        icon: PlayIcon,
        label: 'Active',
      },
      [StrategyStatus.PAUSED]: {
        color: 'bg-yellow-100 text-yellow-800',
        icon: PauseIcon,
        label: 'En pause',
      },
      [StrategyStatus.COMPLETED]: {
        color: 'bg-blue-100 text-blue-800',
        icon: CheckCircleIcon,
        label: 'Terminée',
      },
    };

    const config = statusConfig[status];
    const Icon = config.icon;

    return (
      <Badge className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getStepStatusIcon = (state: StepState) => {
    switch (state) {
      case StepState.PENDING:
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
      case StepState.TRIGGERED:
        return <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500" />;
      case StepState.DONE:
        return <CheckCircleIcon className="h-4 w-4 text-green-500" />;
      default:
        return <ClockIcon className="h-4 w-4 text-gray-400" />;
    }
  };

  const totalSteps = strategy.steps.length;
  const completedSteps = strategy.steps.filter(step => step.state === StepState.DONE).length;
  const activeSteps = strategy.steps.filter(step => step.state === StepState.PENDING).length;

  const totalTokensToSell = strategy.steps.reduce((sum, step) => {
    return sum + (strategy.baseQuantity * step.sellPercentage / 100);
  }, 0);

  const estimatedProfit = strategy.steps.reduce((sum, step) => {
    const tokensToSell = strategy.baseQuantity * step.sellPercentage / 100;
    const profit = tokensToSell * (step.targetPrice - strategy.referencePrice);
    return sum + profit;
  }, 0);

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
              {strategy.name}
            </CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {strategy.symbol}
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-500">
                {strategy.tokenName}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getStatusBadge(strategy.status)}
            <div className="flex space-x-1">
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onEdit(strategy)}
                  className="h-8 w-8 p-0"
                >
                  <PencilIcon className="h-4 w-4" />
                </Button>
              )}
              {onToggleStatus && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onToggleStatus(strategy)}
                  className="h-8 w-8 p-0"
                >
                  {strategy.status === StrategyStatus.ACTIVE ? (
                    <PauseIcon className="h-4 w-4" />
                  ) : (
                    <PlayIcon className="h-4 w-4" />
                  )}
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(strategy)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <TrashIcon className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Statistiques principales */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Quantité de référence</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatQuantity(strategy.baseQuantity)} {strategy.symbol}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Prix de référence</p>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {formatUSD(strategy.referencePrice)}
            </p>
          </div>
        </div>

        {/* Progression des étapes */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">Progression des étapes</p>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {completedSteps}/{totalSteps} terminées
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedSteps / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Étapes de la stratégie */}
        <div className="space-y-2 mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">Étapes de sortie</p>
          {strategy.steps.slice(0, 3).map((step, index) => (
            <div key={step.id} className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-2">
                {getStepStatusIcon(step.state)}
                <span className="text-gray-600 dark:text-gray-400">
                  Sortie {index + 1}: {formatUSD(step.targetPrice)}
                </span>
              </div>
              <span className="text-gray-500 dark:text-gray-500">
                {step.sellPercentage}%
              </span>
            </div>
          ))}
          {strategy.steps.length > 3 && (
            <p className="text-xs text-gray-500 dark:text-gray-500">
              +{strategy.steps.length - 3} autres étapes...
            </p>
          )}
        </div>

        {/* Résumé financier */}
        <div className="border-t pt-3">
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-gray-500 dark:text-gray-400">Tokens à vendre</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {formatQuantity(totalTokensToSell)} {strategy.symbol}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400">Profit estimé</p>
              <p className={`font-medium ${
                estimatedProfit >= 0 
                  ? 'text-green-600 dark:text-green-400' 
                  : 'text-red-600 dark:text-red-400'
              }`}>
                {formatUSD(estimatedProfit)}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        {onViewDetails && (
          <div className="mt-4 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(strategy)}
              className="w-full"
            >
              <ChartBarIcon className="h-4 w-4 mr-2" />
              Voir les détails
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
