'use client';

import React, { useMemo, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';
import { formatCurrency, formatPercentage } from '@/lib/format';
import { Holding } from '@/types/portfolio';

interface BlocDHistogrammeProps {
  holdings: Holding[];
  compact?: boolean;
}

export const BlocD_HistogrammeValorisation: React.FC<BlocDHistogrammeProps> = ({ holdings, compact = false }) => {
  const { isDarkMode, language } = useTheme();
  const [chartType, setChartType] = useState<'valuation' | 'pnl'>('pnl');

  // Préparer les données pour l'histogramme valorisation
  const valuationData = useMemo(() => {
    return holdings
      .map((holding) => {
        const currentValue = holding.currentValue || (holding.currentPrice || holding.averagePrice) * holding.quantity;
        
        return {
          symbol: holding.token.symbol,
          valAchat: holding.investedAmount,
          valMarche: currentValue,
        };
      })
      .sort((a, b) => b.valMarche - a.valMarche)
      .slice(0, compact ? 5 : holdings.length); // Limiter à 5 si compact
  }, [holdings, compact]);

  // Préparer les données pour le graphique Gains et Pertes
  const pnlData = useMemo(() => {
    return holdings
      .map((holding) => {
        const currentValue = holding.currentValue || (holding.currentPrice || holding.averagePrice) * holding.quantity;
        const pnl = currentValue - holding.investedAmount;
        const pnlPercentage = holding.investedAmount > 0 
          ? ((currentValue - holding.investedAmount) / holding.investedAmount) * 100 
          : 0;
        
        return {
          symbol: holding.token.symbol,
          pnlPercentage: pnlPercentage,
          pnl: pnl,
          currentValue: currentValue,
          investedAmount: holding.investedAmount,
          color: pnlPercentage >= 0 ? '#10b981' : '#ef4444', // Vert pour gains, rouge pour pertes
        };
      })
      .sort((a, b) => b.pnlPercentage - a.pnlPercentage)
      .slice(0, compact ? 8 : holdings.length);
  }, [holdings, compact]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      const data = entry.payload;
      
      if (chartType === 'pnl' && data) {
        return (
          <div className={`rounded-xl p-4 shadow-2xl border backdrop-blur-sm ${
            isDarkMode 
              ? 'bg-gray-800/95 border-gray-700/50' 
              : 'bg-white/95 border-gray-200/80'
          }`}>
            <div className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              {label}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-4 min-w-[200px]">
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {language === 'fr' ? 'Gain/Perte' : 'Gain/Loss'}
                </span>
                <span className={`text-sm font-semibold ${
                  data.pnlPercentage >= 0 
                    ? 'text-green-500' 
                    : 'text-red-500'
                }`}>
                  {formatPercentage(data.pnlPercentage)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-2 border-t border-gray-200 dark:border-gray-700">
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {language === 'fr' ? 'Montant' : 'Amount'}
                </span>
                <span className={`text-sm font-bold ${
                  data.pnl >= 0 
                    ? 'text-green-500' 
                    : 'text-red-500'
                }`}>
                  {data.pnl >= 0 ? '+' : ''}{formatCurrency(data.pnl)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {language === 'fr' ? 'Valeur actuelle' : 'Current Value'}
                </span>
                <span className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {formatCurrency(data.currentValue)}
                </span>
              </div>
            </div>
          </div>
        );
      }
      
      // Tooltip pour le graphique de valorisation
      return (
        <div className={`rounded-xl p-4 shadow-2xl border backdrop-blur-sm ${
          isDarkMode 
            ? 'bg-gray-800/95 border-gray-700/50' 
            : 'bg-white/95 border-gray-200/80'
        }`}>
          <div className={`text-sm font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {label}
          </div>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4 min-w-[180px]">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {entry.name}
                  </span>
                </div>
                <span className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  if (holdings.length === 0) {
    return (
      <div className={`rounded-2xl p-5 shadow-lg ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-sm border border-gray-700/50' : 'bg-white border border-gray-200/80 shadow-sm'}`}>
        <h3 className={`text-sm font-bold mb-4 uppercase tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {language === 'fr' ? 'Valorisation des actifs' : 'Asset Valuation'}
        </h3>
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {language === 'fr' ? 'Aucune donnée disponible' : 'No data available'}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg p-4 md:p-5 ${
      isDarkMode 
        ? 'bg-gray-800/95 backdrop-blur-sm border border-gray-700/50' 
        : 'bg-white border border-gray-200/80 shadow-sm'
    }`}>
      {/* En-tête amélioré avec switch */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div>
          <h3 className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {chartType === 'valuation' 
              ? (language === 'fr' ? 'Valorisation des actifs' : 'Asset Valuation')
              : (language === 'fr' ? 'Gains et Pertes par token' : 'Gains and Losses per token')
            }
          </h3>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {chartType === 'valuation'
              ? (language === 'fr' ? 'Comparaison valeur d\'achat vs valeur de marché' : 'Purchase value vs market value comparison')
              : (language === 'fr' ? 'Performance de chaque token en pourcentage' : 'Performance of each token in percentage')
            }
          </p>
        </div>
        {/* Switch entre les deux graphiques amélioré */}
        <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-700/50 p-1 rounded-lg">
          <button
            onClick={() => setChartType('pnl')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
              chartType === 'pnl'
                ? isDarkMode 
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-500/30' 
                  : 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-600 hover:text-gray-700'
            }`}
          >
            {language === 'fr' ? 'Gains/Pertes' : 'Gains/Losses'}
          </button>
          <button
            onClick={() => setChartType('valuation')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all duration-200 ${
              chartType === 'valuation'
                ? isDarkMode 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30' 
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : isDarkMode
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-600 hover:text-gray-700'
            }`}
          >
            {language === 'fr' ? 'Valorisation' : 'Valuation'}
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={compact ? 220 : 420}>
        {chartType === 'valuation' ? (
          <BarChart data={valuationData} margin={{ top: 10, right: 20, left: 10, bottom: compact ? 40 : 60 }}>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDarkMode ? '#374151' : '#e5e7eb'} 
              opacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="symbol"
              stroke={isDarkMode ? '#6b7280' : '#9ca3af'}
              tick={{ 
                fill: isDarkMode ? '#9ca3af' : '#6b7280', 
                fontSize: compact ? 11 : 12,
                fontWeight: 500
              }}
              tickLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
              axisLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
              angle={compact ? -45 : -45}
              textAnchor="end"
              height={compact ? 60 : 80}
            />
            <YAxis
              stroke={isDarkMode ? '#6b7280' : '#9ca3af'}
              tick={{ 
                fill: isDarkMode ? '#9ca3af' : '#6b7280', 
                fontSize: compact ? 11 : 12,
                fontWeight: 500
              }}
              tickLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
              axisLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
              tickFormatter={(value) => {
                if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
                if (value >= 1000) return `€${(value / 1000).toFixed(0)}k`;
                return `€${value.toFixed(0)}`;
              }}
              width={compact ? 60 : 80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ 
                color: isDarkMode ? '#d1d5db' : '#4b5563', 
                fontSize: compact ? 12 : 13,
                fontWeight: 500,
                paddingTop: '10px'
              }}
              iconSize={12}
            />
            <Bar
              dataKey="valAchat"
              name={language === 'fr' ? 'Valeur d\'achat' : 'Purchase Value'}
              fill="#3b82f6"
              radius={[6, 6, 0, 0]}
              animationDuration={300}
            />
            <Bar
              dataKey="valMarche"
              name={language === 'fr' ? 'Valeur de marché' : 'Market Value'}
              fill="#10b981"
              radius={[6, 6, 0, 0]}
              animationDuration={300}
            />
          </BarChart>
        ) : (
          <BarChart 
            data={pnlData} 
            margin={{ top: 10, right: 20, left: 10, bottom: compact ? 40 : 60 }}
          >
            <defs>
              {/* Gradients pour les barres */}
              <linearGradient id="colorGain" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.9}/>
                <stop offset="95%" stopColor="#059669" stopOpacity={0.9}/>
              </linearGradient>
              <linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.9}/>
                <stop offset="95%" stopColor="#dc2626" stopOpacity={0.9}/>
              </linearGradient>
            </defs>
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke={isDarkMode ? '#374151' : '#e5e7eb'} 
              opacity={0.5}
              vertical={false}
            />
            <XAxis
              dataKey="symbol"
              stroke={isDarkMode ? '#6b7280' : '#9ca3af'}
              tick={{ 
                fill: isDarkMode ? '#9ca3af' : '#6b7280', 
                fontSize: compact ? 11 : 12,
                fontWeight: 500
              }}
              tickLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
              axisLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
              angle={compact ? -45 : -45}
              textAnchor="end"
              height={compact ? 60 : 80}
            />
            <YAxis
              stroke={isDarkMode ? '#6b7280' : '#9ca3af'}
              tick={{ 
                fill: isDarkMode ? '#9ca3af' : '#6b7280', 
                fontSize: compact ? 11 : 12,
                fontWeight: 500
              }}
              tickLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
              axisLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
              tickFormatter={(value) => {
                const sign = value >= 0 ? '+' : '';
                return `${sign}${value.toFixed(0)}%`;
              }}
              width={compact ? 60 : 80}
              domain={['auto', 'auto']}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* Ligne de référence à 0% améliorée */}
            <ReferenceLine 
              y={0} 
              stroke={isDarkMode ? '#6b7280' : '#9ca3af'} 
              strokeWidth={2}
              strokeDasharray="4 4"
              opacity={0.7}
            />
            <Bar 
              dataKey="pnlPercentage" 
              radius={[6, 6, 6, 6]}
              animationDuration={400}
              animationEasing="ease-out"
            >
              {pnlData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.pnlPercentage >= 0 ? 'url(#colorGain)' : 'url(#colorLoss)'}
                  style={{
                    filter: `drop-shadow(0 2px 4px ${entry.color}40)`,
                    transition: 'opacity 0.2s',
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

