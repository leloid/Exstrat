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
  Legend,
} from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';
import { formatCurrency, formatPercentage } from '@/lib/format';
import { Holding } from '@/types/portfolio';

interface BlocDProps {
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

export const BlocD_Visualisations: React.FC<BlocDProps> = ({ holdings }) => {
  const { isDarkMode, language } = useTheme();

  // Préparer les données pour le camembert (répartition)
  const pieData = useMemo(() => {
    const totalValue = holdings.reduce((sum, h) => {
      const currentValue = h.currentValue || (h.currentPrice || h.averagePrice) * h.quantity;
      return sum + currentValue;
    }, 0);

    return holdings
      .map((holding, index) => {
        const currentValue = holding.currentValue || (holding.currentPrice || holding.averagePrice) * holding.quantity;
        const percentage = totalValue > 0 ? (currentValue / totalValue) * 100 : 0;
        
        return {
          name: holding.token.symbol,
          value: currentValue,
          percentage,
          color: CHART_COLORS[index % CHART_COLORS.length],
        };
      })
      .filter(item => item.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [holdings]);

  // Préparer les données pour l'histogramme gains/pertes
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
      .sort((a, b) => b.pnlPercentage - a.pnlPercentage);
  }, [holdings]);

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
      .sort((a, b) => b.valMarche - a.valMarche);
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
    if (percent < 0.05) return null; // Ne pas afficher les labels trop petits
    
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
        {`${name} ${(percent * 100).toFixed(1)}%`}
      </text>
    );
  };

  if (holdings.length === 0) {
    return (
      <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
        <h2 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {language === 'fr' ? 'Visualisations graphiques' : 'Visualizations'}
        </h2>
        <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {language === 'fr' ? 'Aucune donnée disponible' : 'No data available'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Titre */}
      <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
        {language === 'fr' ? 'Visualisations graphiques' : 'Visualizations'}
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Diagramme camembert - Répartition du portefeuille */}
        <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <h3 className={`text-md font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fr' ? 'Répartition du portefeuille par Crypto' : 'Portfolio Distribution by Crypto'}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={100}
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
        </div>

        {/* 2. Histogramme gains / pertes par token */}
        <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
          <h3 className={`text-md font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fr' ? 'Gains et Pertes par token' : 'Gains and Losses per token'}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pnlData} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
              <XAxis
                type="number"
                stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
                tickFormatter={(value) => formatPercentage(value)}
              />
              <YAxis
                type="category"
                dataKey="symbol"
                stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
                tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
                width={50}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className={`rounded-lg p-3 shadow-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}>
                        <div className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                          <div>{data.symbol}</div>
                          <div>{formatPercentage(data.pnlPercentage)}</div>
                          <div>{formatCurrency(data.pnl)}</div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="pnlPercentage">
                {pnlData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3. Histogramme valorisation des actifs */}
      <div className={`rounded-xl p-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
        <h3 className={`text-md font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {language === 'fr' ? 'Valorisation des actifs (en $)' : 'Asset Valuation (in $)'}
        </h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={valuationData} margin={{ top: 5, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
            <XAxis
              dataKey="symbol"
              stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
              tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
              tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
              tickFormatter={(value) => formatCurrency(value)}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}
            />
            <Bar
              dataKey="valAchat"
              name={language === 'fr' ? 'Val achat' : 'Purchase Value'}
              fill="#3b82f6"
            />
            <Bar
              dataKey="valMarche"
              name={language === 'fr' ? 'Val marché' : 'Market Value'}
              fill="#ef4444"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

