'use client';

import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';
import { formatCurrency } from '@/lib/format';

interface DataPoint {
  date: string;
  valeurBrute: number;
  valeurNette: number;
  investi: number;
}

interface BlocBProps {
  data: DataPoint[];
}

type TimeRange = '24h' | '7j' | '30j' | 'YTD' | 'All';

export const BlocB_EvolutionPortfolio: React.FC<BlocBProps> = ({ data }) => {
  const { isDarkMode, language } = useTheme();
  const [timeRange, setTimeRange] = useState<TimeRange>('All');

  // Filtrer les données selon la période sélectionnée
  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const now = new Date();
    let cutoffDate: Date;

    switch (timeRange) {
      case '24h':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7j':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30j':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'YTD':
        cutoffDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'All':
      default:
        return data;
    }

    return data.filter(point => new Date(point.date) >= cutoffDate);
  }, [data, timeRange]);

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: '24h', label: language === 'fr' ? '24h' : '24h' },
    { value: '7j', label: language === 'fr' ? '7j' : '7d' },
    { value: '30j', label: language === 'fr' ? '30j' : '30d' },
    { value: 'YTD', label: language === 'fr' ? 'YTD' : 'YTD' },
    { value: 'All', label: language === 'fr' ? 'Tout' : 'All' },
  ];

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

  // Si pas de données, afficher un message
  if (!data || data.length === 0) {
    return (
      <div className={`rounded-2xl p-6 shadow-lg ${isDarkMode ? 'bg-gray-800/95 backdrop-blur-sm border border-gray-700/50' : 'bg-white border border-gray-200/80 shadow-sm'}`}>
        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {language === 'fr' ? "Évolution du portefeuille" : "Portfolio Evolution"}
        </h2>
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {language === 'fr' ? 'Aucune donnée disponible' : 'No data available'}
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-t-lg rounded-b-none p-3 ${isDarkMode ? 'bg-gray-800 border border-b-0 border-gray-700' : 'bg-white border border-b-0 border-gray-200'}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 gap-2">
        <h2 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {language === 'fr' ? "Évolution du portefeuille" : "Portfolio Evolution"}
        </h2>
        
        {/* Sélecteur de période */}
        <div className="flex gap-1 flex-wrap">
          {timeRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                timeRange === option.value
                  ? isDarkMode
                    ? 'bg-purple-600 text-white'
                    : 'bg-purple-600 text-white'
                  : isDarkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={filteredData} margin={{ top: 5, right: 15, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? '#374151' : '#e5e7eb'} />
          <XAxis
            dataKey="date"
            stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
            tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
            tickFormatter={(value) => {
              const date = new Date(value);
              if (timeRange === '24h' || timeRange === '7j') {
                return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              }
              return date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
            }}
          />
          <YAxis
            stroke={isDarkMode ? '#9ca3af' : '#6b7280'}
            tick={{ fill: isDarkMode ? '#9ca3af' : '#6b7280' }}
            tickFormatter={(value) => formatCurrency(value)}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ color: isDarkMode ? '#9ca3af' : '#6b7280' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="valeurBrute"
            name={language === 'fr' ? 'Valeur brute' : 'Gross Value'}
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="valeurNette"
            name={language === 'fr' ? 'Valeur nette' : 'Net Value'}
            stroke="#10b981"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="investi"
            name={language === 'fr' ? 'Investi' : 'Invested'}
            stroke="#6b7280"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

