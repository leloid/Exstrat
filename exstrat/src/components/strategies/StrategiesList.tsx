'use client';

import React, { useState } from 'react';
import { StrategyResponse, StrategyStatus } from '@/types/strategies';
import { StrategyCard } from './StrategyCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  AdjustmentsHorizontalIcon,
} from '@heroicons/react/24/outline';

interface StrategiesListProps {
  strategies: StrategyResponse[];
  loading?: boolean;
  onCreateNew?: () => void;
  onEdit?: (strategy: StrategyResponse) => void;
  onDelete?: (strategy: StrategyResponse) => void;
  onToggleStatus?: (strategy: StrategyResponse) => void;
  onViewDetails?: (strategy: StrategyResponse) => void;
}

export const StrategiesList: React.FC<StrategiesListProps> = ({
  strategies,
  loading = false,
  onCreateNew,
  onEdit,
  onDelete,
  onToggleStatus,
  onViewDetails,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StrategyStatus | 'all'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filtrer les stratégies
  const filteredStrategies = strategies.filter(strategy => {
    const matchesSearch = strategy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         strategy.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         strategy.tokenName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || strategy.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusCounts = () => {
    const counts = {
      all: strategies.length,
      [StrategyStatus.ACTIVE]: 0,
      [StrategyStatus.PAUSED]: 0,
      [StrategyStatus.COMPLETED]: 0,
    };

    strategies.forEach(strategy => {
      counts[strategy.status]++;
    });

    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Mes Stratégies
          </h2>
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full" />
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Mes Stratégies
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {filteredStrategies.length} stratégie{filteredStrategies.length !== 1 ? 's' : ''} 
            {searchTerm || statusFilter !== 'all' ? ' trouvée' + (filteredStrategies.length !== 1 ? 's' : '') : ''}
          </p>
        </div>
        {onCreateNew && (
          <Button onClick={onCreateNew} className="flex items-center space-x-2">
            <PlusIcon className="h-4 w-4" />
            <span>Nouvelle Stratégie</span>
          </Button>
        )}
      </div>

      {/* Barre de recherche et filtres */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Rechercher par nom, symbole ou token..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2"
          >
            <FunnelIcon className="h-4 w-4" />
            <span>Filtres</span>
          </Button>
        </div>

        {/* Filtres avancés */}
        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 mr-2">
                  Statut:
                </span>
                {(['all', StrategyStatus.ACTIVE, StrategyStatus.PAUSED, StrategyStatus.COMPLETED] as const).map((status) => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      statusFilter === status
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                    }`}
                  >
                    {status === 'all' ? 'Toutes' : 
                     status === StrategyStatus.ACTIVE ? 'Actives' :
                     status === StrategyStatus.PAUSED ? 'En pause' : 'Terminées'}
                    {status !== 'all' && (
                      <span className="ml-1 text-xs opacity-75">
                        ({statusCounts[status]})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Liste des stratégies */}
      {filteredStrategies.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="flex flex-col items-center space-y-4">
              <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full">
                <AdjustmentsHorizontalIcon className="h-8 w-8 text-gray-400" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  {strategies.length === 0 ? 'Aucune stratégie créée' : 'Aucune stratégie trouvée'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {strategies.length === 0 
                    ? 'Créez votre première stratégie de prise de profit pour commencer à optimiser vos investissements.'
                    : 'Essayez de modifier vos critères de recherche ou de filtrage.'
                  }
                </p>
                {strategies.length === 0 && onCreateNew && (
                  <Button onClick={onCreateNew}>
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Créer ma première stratégie
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStrategies.map((strategy) => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              onEdit={onEdit}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
};
