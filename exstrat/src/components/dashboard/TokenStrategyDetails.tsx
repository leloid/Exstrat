'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { formatCurrency, formatPercentage } from '@/lib/format';
import { useTheme } from '@/contexts/ThemeContext';
import { Holding } from '@/types/portfolio';
import * as configurationApi from '@/lib/configuration-api';
import { getForecasts, getForecastById, getTheoreticalStrategies } from '@/lib/portfolios-api';
import { AlertConfiguration } from '@/types/configuration';
import { TheoreticalStrategyResponse } from '@/types/strategies';
import type { ForecastResponse } from '@/lib/portfolios-api';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

interface TokenStrategyDetailsProps {
  holding: Holding | null;
  portfolioId?: string;
  onClose: () => void;
}

export const TokenStrategyDetails: React.FC<TokenStrategyDetailsProps> = ({
  holding,
  portfolioId,
  onClose,
}) => {
  const { isDarkMode, language } = useTheme();
  const [forecast, setForecast] = useState<ForecastResponse | null>(null);
  const [strategy, setStrategy] = useState<TheoreticalStrategyResponse | null>(null);
  const [alertConfiguration, setAlertConfiguration] = useState<AlertConfiguration | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      if (!holding || !portfolioId) {
        setForecast(null);
        setStrategy(null);
        setAlertConfiguration(null);
        return;
      }

      try {
        setLoading(true);

        // Charger toutes les configurations d'alertes actives
        const allConfigs = await configurationApi.getAlertConfigurations();
        const activeConfigs = allConfigs.filter(config => config.isActive);

        // Trouver la configuration qui contient une alerte pour ce token
        const configWithToken = activeConfigs.find(config => 
          config.tokenAlerts?.some(ta => ta.holdingId === holding.id && ta.isActive)
        );

        if (!configWithToken) {
          setForecast(null);
          setStrategy(null);
          setAlertConfiguration(null);
          return;
        }

        setAlertConfiguration(configWithToken);

        // Charger la prévision associée
        const allForecasts = await getForecasts();
        const forecastData = allForecasts.find(f => f.id === configWithToken.forecastId);
        
        if (!forecastData) {
          setForecast(null);
          setStrategy(null);
          return;
        }
        setForecast(forecastData);

        // Trouver la stratégie associée au token
        const tokenAlert = configWithToken.tokenAlerts?.find(ta => ta.holdingId === holding.id);
        if (tokenAlert?.strategyId) {
          const allStrategies = await getTheoreticalStrategies();
          const foundStrategy = allStrategies.find(s => s.id === tokenAlert.strategyId);
          setStrategy(foundStrategy || null);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        setForecast(null);
        setStrategy(null);
        setAlertConfiguration(null);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [holding, portfolioId]);

  // Générer des données historiques simulées pour le graphique de prix
  // IMPORTANT: Tous les hooks doivent être appelés avant les retours conditionnels
  const priceChartData = useMemo(() => {
    if (!holding) return [];
    const currentPrice = holding.currentPrice || holding.averagePrice || 0;
    if (currentPrice <= 0) return [];

    const data = [];
    const now = new Date();
    const days = 30; // 30 derniers jours
    
    // Générer des variations de prix réalistes autour du prix actuel
    let price = currentPrice;
    const volatility = 0.05; // 5% de volatilité
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Variation aléatoire avec tendance
      const change = (Math.random() - 0.5) * volatility * 2;
      price = price * (1 + change);
      
      // S'assurer que le prix ne devient pas négatif
      price = Math.max(price, currentPrice * 0.5);
      
      data.push({
        date: date.toISOString().split('T')[0],
        price: Number(price.toFixed(2)),
      });
    }
    
    return data;
  }, [holding?.currentPrice, holding?.averagePrice]);

  if (!holding) {
    return null;
  }

  if (loading) {
    return (
      <div className={`rounded-lg p-5 ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-sm border border-gray-700/50' : 'bg-white border border-gray-200/80 shadow-sm'}`}>
        <div className="flex items-center justify-center py-8">
          <div className="flex flex-col items-center gap-3">
            <div className={`animate-spin rounded-full h-8 w-8 border-b-2 ${isDarkMode ? 'border-purple-400' : 'border-purple-600'}`}></div>
            <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {language === 'fr' ? 'Chargement...' : 'Loading...'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!forecast || !strategy || !alertConfiguration) {
    return (
      <div className={`rounded-lg p-5 ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-sm border border-gray-700/50' : 'bg-white border border-gray-200/80 shadow-sm'}`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-sm shadow-md`}>
              {holding.token.symbol.charAt(0)}
            </div>
            <div>
              <h3 className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {holding.token.symbol}
              </h3>
              <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {language === 'fr' ? 'Détails de la stratégie' : 'Strategy Details'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              isDarkMode 
                ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
            }`}
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {language === 'fr' 
            ? 'Aucune stratégie active trouvée pour ce token.'
            : 'No active strategy found for this token.'}
        </div>
      </div>
    );
  }

  const tokenAlert = alertConfiguration.tokenAlerts?.find(ta => ta.holdingId === holding.id);
  const currentPrice = holding.currentPrice || holding.averagePrice || 0;
  const tpAlerts = tokenAlert?.tpAlerts || [];

  // Calculer les statistiques
  const totalTP = strategy.profitTargets.length;
  const tpReached = tpAlerts.filter(tp => tp.isActive && currentPrice >= tp.targetPrice).length;
  const completionPercentage = totalTP > 0 ? (tpReached / totalTP) * 100 : 0;

  // Calculer la valeur projetée totale
  const projectedValue = tpAlerts.reduce((sum, tp) => sum + (tp.projectedAmount || 0), 0);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`rounded-xl p-3 shadow-2xl border backdrop-blur-sm ${
          isDarkMode 
            ? 'bg-gray-800/95 border-gray-700/50' 
            : 'bg-white/95 border-gray-200/80'
        }`}>
          <div className={`text-xs font-semibold mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {new Date(label).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
          </div>
          <div className={`text-base font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formatCurrency(payload[0].value, '€', 2)}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`rounded-lg p-3 ${
      isDarkMode 
        ? 'bg-gray-800/95 backdrop-blur-sm border border-gray-700/50 shadow-xl' 
        : 'bg-white border border-gray-200/80 shadow-lg'
    }`}>
      {/* En-tête compact */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-xs shadow-md flex-shrink-0`}>
            {holding.token.symbol.charAt(0)}
          </div>
          <div>
            <h3 className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {holding.token.symbol}
            </h3>
            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              {strategy.name}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className={`p-1.5 rounded-lg transition-all duration-200 ${
            isDarkMode 
              ? 'text-gray-400 hover:text-white hover:bg-gray-700/50' 
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>

      {/* Statistiques principales compactes */}
      <div className={`grid grid-cols-2 gap-2 mb-3 p-2.5 rounded-lg ${
        isDarkMode ? 'bg-gray-700/30' : 'bg-gradient-to-br from-blue-50 to-purple-50'
      }`}>
        <div>
          <p className={`text-xs mb-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'fr' ? 'Progression' : 'Progress'}
          </p>
          <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {Math.round(completionPercentage)}%
          </p>
        </div>
        <div>
          <p className={`text-xs mb-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {language === 'fr' ? 'Valeur projetée' : 'Projected Value'}
          </p>
          <p className={`text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
            {formatCurrency(projectedValue, '€', 0)}
          </p>
        </div>
      </div>

      {/* Barre de progression compacte */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalTP }).map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  i < tpReached
                    ? 'bg-green-500 shadow-md shadow-green-500/50'
                    : isDarkMode
                    ? 'bg-gray-600 border border-gray-500'
                    : 'bg-gray-300 border border-gray-200'
                }`}
              />
            ))}
          </div>
          <div className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {tpReached}/{totalTP} {language === 'fr' ? 'TP' : 'TP'}
          </div>
        </div>
        <div className="relative">
          <div className={`w-full h-2 rounded-full overflow-hidden ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
          }`}>
            <div
              className={`h-full bg-gradient-to-r from-green-500 to-emerald-500 transition-all duration-500 ${
                completionPercentage > 0 ? 'shadow-md shadow-green-500/30' : ''
              }`}
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Section des paliers de prise de profit compacte */}
      <div className="mb-3">
        <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>
          {language === 'fr' ? 'Paliers TP' : 'TP Levels'}
        </h4>
        <div className="space-y-1.5 max-h-48 overflow-y-auto">
          {strategy.profitTargets.map((tp, index) => {
            const tpAlert = tpAlerts.find(ta => ta.tpOrder === tp.order);
            const targetPrice = tp.targetType === 'percentage'
              ? holding.averagePrice * (1 + tp.targetValue / 100)
              : tp.targetValue;
            const isReached = currentPrice >= targetPrice;
            const distanceFromAverage = ((targetPrice - currentPrice) / holding.averagePrice) * 100;
            const remainingPercentage = distanceFromAverage > 0 ? distanceFromAverage : 0;

            return (
              <div
                key={tp.order}
                className={`p-2 rounded-lg border transition-all duration-200 ${
                  isReached
                    ? isDarkMode
                      ? 'bg-green-500/10 border-green-500/30'
                      : 'bg-green-50 border-green-200'
                    : isDarkMode
                    ? 'bg-gray-700/30 border-gray-600/50'
                    : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      isReached
                        ? 'bg-green-500 text-white'
                        : isDarkMode
                        ? 'bg-gray-600 text-gray-300'
                        : 'bg-gray-200 text-gray-700'
                    }`}>
                      {tp.order}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-semibold text-xs truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(targetPrice, '€', 2)}
                      </div>
                      <div className={`text-xs truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {formatPercentage(tp.sellPercentage)} • {formatCurrency((tpAlert?.projectedAmount || 0), '€', 0)}
                      </div>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {isReached ? (
                      <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                        isDarkMode
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-green-100 text-green-700'
                      }`}>
                        ✓
                      </div>
                    ) : (
                      <div className={`px-2 py-0.5 rounded text-xs font-medium ${
                        isDarkMode
                          ? 'bg-gray-600/50 text-gray-400'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {formatPercentage(remainingPercentage)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Graphique du cours du token compact */}
      {priceChartData.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <h4 className={`text-xs font-bold uppercase tracking-wider mb-2 ${
            isDarkMode ? 'text-gray-300' : 'text-gray-700'
          }`}>
            {language === 'fr' ? `Cours ${holding.token.symbol}` : `${holding.token.symbol} Price`}
          </h4>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceChartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke={isDarkMode ? '#374151' : '#e5e7eb'} 
                  opacity={0.4}
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke={isDarkMode ? '#6b7280' : '#9ca3af'}
                  tick={{ 
                    fill: isDarkMode ? '#9ca3af' : '#6b7280',
                    fontSize: 9,
                    fontWeight: 500
                  }}
                  tickLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
                  axisLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
                  }}
                  height={30}
                />
                <YAxis
                  stroke={isDarkMode ? '#6b7280' : '#9ca3af'}
                  tick={{ 
                    fill: isDarkMode ? '#9ca3af' : '#6b7280',
                    fontSize: 9,
                    fontWeight: 500
                  }}
                  tickLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
                  axisLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
                  tickFormatter={(value) => {
                    if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
                    if (value >= 1000) return `€${(value / 1000).toFixed(1)}k`;
                    return `€${value.toFixed(0)}`;
                  }}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  fill="url(#colorPrice)"
                  animationDuration={300}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#3b82f6"
                  strokeWidth={1.5}
                  dot={false}
                  activeDot={{ 
                    r: 4, 
                    fill: '#3b82f6',
                    strokeWidth: 1.5,
                    stroke: isDarkMode ? '#1e293b' : '#ffffff'
                  }}
                  animationDuration={300}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className={`mt-2 flex items-center justify-between text-xs ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
            <span>
              {language === 'fr' ? 'Actuel' : 'Current'}: <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(currentPrice, '€', 2)}
              </span>
            </span>
            <span>
              {language === 'fr' ? 'Moyen' : 'Avg'}: <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {formatCurrency(holding.averagePrice, '€', 2)}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

