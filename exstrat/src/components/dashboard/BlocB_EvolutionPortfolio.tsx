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
  Area,
  AreaChart,
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

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const date = new Date(label);
      const formattedDate = timeRange === '24h' || timeRange === '7j'
        ? date.toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
        : date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

      return (
        <div className={`rounded-xl p-4 shadow-2xl border backdrop-blur-sm ${
          isDarkMode 
            ? 'bg-gray-800/95 border-gray-700/50' 
            : 'bg-white/95 border-gray-200/80'
        }`}>
          <div className={`text-xs font-semibold mb-3 pb-2 border-b ${
            isDarkMode ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'
          }`}>
            {formattedDate}
          </div>
          <div className="space-y-2">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4 min-w-[180px]">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-700'
                  }`}>
                    {entry.name}
                  </span>
                </div>
                <span className={`text-sm font-bold ${
                  entry.dataKey === 'valeurNette' 
                    ? 'text-green-500' 
                    : entry.dataKey === 'valeurBrute'
                    ? 'text-blue-500'
                    : isDarkMode ? 'text-gray-400' : 'text-gray-600'
                }`}>
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

  // Si pas de données, afficher un message
  if (!data || data.length === 0) {
    return (
      <div className={`rounded-t-lg rounded-b-none p-6 ${
        isDarkMode 
          ? 'bg-gray-800/95 backdrop-blur-sm border border-b-0 border-gray-700/50' 
          : 'bg-white border border-b-0 border-gray-200/80 shadow-sm'
      }`}>
        <h2 className={`text-lg font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          {language === 'fr' ? "Évolution du portefeuille" : "Portfolio Evolution"}
        </h2>
        <div className={`text-center py-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
          {language === 'fr' ? 'Aucune donnée disponible' : 'No data available'}
        </div>
      </div>
    );
  }

  // Calculer les valeurs min/max pour un meilleur affichage
  const maxValue = Math.max(
    ...filteredData.map(d => Math.max(d.valeurBrute, d.valeurNette, d.investi))
  );
  const minValue = Math.min(
    ...filteredData.map(d => Math.min(d.valeurBrute, d.valeurNette, d.investi))
  );
  const yAxisDomain = [Math.max(0, minValue * 0.95), maxValue * 1.05];

  return (
    <div className={`rounded-t-lg rounded-b-none p-4 md:p-6 ${
      isDarkMode 
        ? 'bg-gray-800/95 backdrop-blur-sm border border-b-0 border-gray-700/50' 
        : 'bg-white border border-b-0 border-gray-200/80 shadow-sm'
    }`}>
      {/* Header amélioré */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className={`text-lg font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fr' ? "Évolution du portefeuille" : "Portfolio Evolution"}
          </h2>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {language === 'fr' ? 'Performance de votre portefeuille dans le temps' : 'Your portfolio performance over time'}
          </p>
        </div>
        
        {/* Sélecteur de période amélioré */}
        <div className="flex gap-1.5 flex-wrap">
          {timeRangeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                timeRange === option.value
                  ? isDarkMode
                    ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md'
                  : isDarkMode
                  ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700 border border-gray-600/50'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Graphique amélioré */}
      <ResponsiveContainer width="100%" height={320}>
        <LineChart 
          data={filteredData} 
          margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
        >
          <defs>
            {/* Gradient pour la valeur nette */}
            <linearGradient id="colorValeurNette" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
            </linearGradient>
            {/* Gradient pour la valeur brute */}
            <linearGradient id="colorValeurBrute" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke={isDarkMode ? '#374151' : '#e5e7eb'} 
            opacity={0.5}
            vertical={false}
          />
          
          <XAxis
            dataKey="date"
            stroke={isDarkMode ? '#6b7280' : '#9ca3af'}
            tick={{ 
              fill: isDarkMode ? '#9ca3af' : '#6b7280',
              fontSize: 11,
              fontWeight: 500
            }}
            tickLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
            axisLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
            tickFormatter={(value) => {
              const date = new Date(value);
              if (timeRange === '24h' || timeRange === '7j') {
                return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
              }
              return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
            }}
          />
          
          <YAxis
            stroke={isDarkMode ? '#6b7280' : '#9ca3af'}
            tick={{ 
              fill: isDarkMode ? '#9ca3af' : '#6b7280',
              fontSize: 11,
              fontWeight: 500
            }}
            tickLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
            axisLine={{ stroke: isDarkMode ? '#4b5563' : '#d1d5db' }}
            tickFormatter={(value) => {
              if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
              if (value >= 1000) return `€${(value / 1000).toFixed(0)}k`;
              return `€${value.toFixed(0)}`;
            }}
            domain={yAxisDomain}
            width={60}
          />
          
          <Tooltip 
            content={<CustomTooltip />}
            cursor={{ 
              stroke: isDarkMode ? '#6b7280' : '#9ca3af',
              strokeWidth: 1,
              strokeDasharray: '5 5',
              opacity: 0.5
            }}
            animationDuration={200}
          />
          
          <Legend
            wrapperStyle={{ 
              paddingTop: '20px',
              fontSize: '12px',
              fontWeight: 500
            }}
            iconType="line"
            iconSize={12}
            formatter={(value) => (
              <span style={{ 
                color: isDarkMode ? '#d1d5db' : '#4b5563',
                fontSize: '12px',
                fontWeight: 500
              }}>
                {value}
              </span>
            )}
          />
          
          {/* Zone sous la valeur nette */}
          <Area
            type="monotone"
            dataKey="valeurNette"
            stroke="none"
            fill="url(#colorValeurNette)"
            fillOpacity={0.6}
          />
          
          {/* Zone sous la valeur brute */}
          <Area
            type="monotone"
            dataKey="valeurBrute"
            stroke="none"
            fill="url(#colorValeurBrute)"
            fillOpacity={0.4}
          />
          
          {/* Ligne valeur brute */}
          <Line
            type="monotone"
            dataKey="valeurBrute"
            name={language === 'fr' ? 'Valeur brute' : 'Gross Value'}
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ 
              r: 6, 
              fill: '#3b82f6',
              strokeWidth: 2,
              stroke: isDarkMode ? '#1e293b' : '#ffffff'
            }}
            animationDuration={300}
          />
          
          {/* Ligne valeur nette */}
          <Line
            type="monotone"
            dataKey="valeurNette"
            name={language === 'fr' ? 'Valeur nette' : 'Net Value'}
            stroke="#10b981"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ 
              r: 6, 
              fill: '#10b981',
              strokeWidth: 2,
              stroke: isDarkMode ? '#1e293b' : '#ffffff'
            }}
            animationDuration={300}
          />
          
          {/* Ligne investi (ligne pointillée) */}
          <Line
            type="monotone"
            dataKey="investi"
            name={language === 'fr' ? 'Investi' : 'Invested'}
            stroke={isDarkMode ? '#6b7280' : '#9ca3af'}
            strokeWidth={1.5}
            strokeDasharray="6 4"
            dot={false}
            activeDot={{ 
              r: 5, 
              fill: isDarkMode ? '#6b7280' : '#9ca3af',
              strokeWidth: 2,
              stroke: isDarkMode ? '#1e293b' : '#ffffff'
            }}
            animationDuration={300}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

