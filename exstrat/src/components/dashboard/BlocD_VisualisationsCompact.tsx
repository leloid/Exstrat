'use client';

import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';
import { formatCurrency, formatPercentage } from '@/lib/format';
import { Holding } from '@/types/portfolio';

interface BlocDCompactProps {
  holdings: Holding[];
}

// Couleurs harmonisées pour les graphiques
const CHART_COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#84cc16', // lime
  '#6366f1', // indigo
];

export const BlocD_VisualisationsCompact: React.FC<BlocDCompactProps> = ({ holdings }) => {
  const { isDarkMode, language } = useTheme();

  // Préparer les données pour le camembert (répartition)
  const pieData = useMemo(() => {
    // Calculer la valeur actuelle pour chaque holding de manière cohérente
    const holdingsWithValue = holdings.map((holding) => {
      // Priorité: currentValue > currentPrice * quantity > averagePrice * quantity
      let currentValue = 0;
      
      if (holding.currentValue && holding.currentValue > 0) {
        currentValue = Number(holding.currentValue);
      } else if (holding.currentPrice && holding.currentPrice > 0) {
        currentValue = Number(holding.currentPrice) * Number(holding.quantity);
      } else if (holding.averagePrice && holding.averagePrice > 0) {
        currentValue = Number(holding.averagePrice) * Number(holding.quantity);
      }
      
      return {
        holding,
        currentValue,
      };
    });

    const totalValue = holdingsWithValue.reduce((sum, h) => sum + h.currentValue, 0);

    if (totalValue === 0) {
      return [];
    }

    return holdingsWithValue
      .map(({ holding, currentValue }, index) => {
        const percentage = (currentValue / totalValue) * 100;
        
        return {
          name: holding.token.symbol,
          value: currentValue,
          percentage,
          color: CHART_COLORS[index % CHART_COLORS.length],
        };
      })
      .filter(item => item.value > 0) // Filtrer uniquement les valeurs strictement positives
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Limiter à 8 tokens pour la version compacte
  }, [holdings]);

  // Préparer les données pour l'histogramme gains/pertes (top 5)
  const pnlData = useMemo(() => {
    return holdings
      .map((holding) => {
        const currentValue = holding.currentValue || (holding.currentPrice || holding.averagePrice) * holding.quantity;
        const pnl = currentValue - holding.investedAmount;
        const pnlPercentage = holding.investedAmount > 0 ? (pnl / holding.investedAmount) * 100 : 0;
        
        return {
          symbol: holding.token.symbol,
          pnlPercentage,
          pnl,
          color: pnlPercentage >= 0 ? '#10b981' : '#ef4444',
        };
      })
      .sort((a, b) => Math.abs(b.pnlPercentage) - Math.abs(a.pnlPercentage))
      .slice(0, 5); // Top 5 seulement
  }, [holdings]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={`rounded-lg p-3 shadow-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="mb-1">
              <span
                className="inline-block w-3 h-3 rounded-full mr-2"
                style={{ backgroundColor: entry.color }}
              />
              <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {entry.name}: {formatCurrency(entry.value)}
                {entry.payload?.percentage && ` (${entry.payload.percentage.toFixed(2)}%)`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    if (percent < 0.08) return null; // Ne pas afficher les labels trop petits
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={isDarkMode ? '#e5e7eb' : '#1f2937'}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-medium"
      >
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (holdings.length === 0) {
    return (
      <div className={`rounded-2xl p-5 shadow-lg ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-sm border border-gray-700/50' : 'bg-white border border-gray-200/80 shadow-sm'}`}>
        <h2 className={`text-sm font-bold mb-4 uppercase tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {language === 'fr' ? 'Visualisations' : 'Visualizations'}
        </h2>
        <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {language === 'fr' ? 'Aucune donnée disponible' : 'No data available'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* 1. Diagramme camembert - Répartition du portefeuille */}
      <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <h3 className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {language === 'fr' ? 'Répartition par Crypto' : 'Distribution by Crypto'}
        </h3>
        <ResponsiveContainer width="100%" height={140}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={CustomLabel}
              outerRadius={60}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Légende pour tous les tokens */}
        {pieData.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2 justify-center">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center gap-1.5">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {entry.name} {entry.percentage.toFixed(2)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Histogramme gains / pertes par token (top 5) */}
      <div className={`rounded-lg p-3 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
        <h3 className={`text-xs font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {language === 'fr' ? 'Top 5 Gains/Pertes' : 'Top 5 Gains/Losses'}
        </h3>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={pnlData} layout="vertical" margin={{ top: 5, right: 10, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
            <XAxis
              type="number"
              stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
              tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
              tickFormatter={(value) => formatPercentage(value)}
            />
            <YAxis
              type="category"
              dataKey="symbol"
              stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
              tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: 12 }}
              width={45}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className={`rounded-lg p-3 shadow-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div className="font-semibold">{data.symbol}</div>
                        <div>{formatPercentage(data.pnlPercentage)}</div>
                        <div>{formatCurrency(data.pnl)}</div>
                      </div>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="pnlPercentage" radius={[0, 4, 4, 0]}>
              {pnlData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

