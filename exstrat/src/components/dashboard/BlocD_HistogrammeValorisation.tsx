'use client';

import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';
import { formatCurrency } from '@/lib/format';
import { Holding } from '@/types/portfolio';

interface BlocDHistogrammeProps {
  holdings: Holding[];
  compact?: boolean;
}

export const BlocD_HistogrammeValorisation: React.FC<BlocDHistogrammeProps> = ({ holdings, compact = false }) => {
  const { isDarkMode, language } = useTheme();

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
              </span>
            </div>
          ))}
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
    <div className={`rounded-2xl p-5 shadow-lg ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-sm border border-gray-700/50' : 'bg-white border border-gray-200/80 shadow-sm'}`}>
      <h3 className={`text-sm font-bold mb-4 uppercase tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
        {language === 'fr' ? 'Valorisation des actifs' : 'Asset Valuation'}
      </h3>
      <ResponsiveContainer width="100%" height={compact ? 300 : 400}>
        <BarChart data={valuationData} margin={{ top: 5, right: 20, left: 10, bottom: compact ? 40 : 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
          <XAxis
            dataKey="symbol"
            stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
            tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: compact ? 11 : 12 }}
            angle={compact ? -45 : -45}
            textAnchor="end"
            height={compact ? 60 : 80}
          />
          <YAxis
            stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
            tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: compact ? 11 : 12 }}
            tickFormatter={(value) => formatCurrency(value)}
            width={compact ? 60 : 80}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: isDarkMode ? '#9ca3af' : '#6b7280', fontSize: compact ? 12 : 14 }}
            iconSize={compact ? 12 : 14}
          />
          <Bar
            dataKey="valAchat"
            name={language === 'fr' ? 'Val achat' : 'Purchase Value'}
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="valMarche"
            name={language === 'fr' ? 'Val marché' : 'Market Value'}
            fill="#ef4444"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

