'use client';

import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { useTheme } from '@/contexts/ThemeContext';
import { formatCurrency } from '@/lib/format';
import { Holding } from '@/types/portfolio';

interface BlocDCompactProps {
  holdings: Holding[];
}

// Couleurs harmonisées et modernes pour les graphiques
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

  // Calculer la valeur totale pour l'affichage au centre
  const totalValue = useMemo(() => {
    return pieData.reduce((sum, item) => sum + item.value, 0);
  }, [pieData]);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0];
      return (
        <div className={`rounded-xl p-4 shadow-2xl border backdrop-blur-sm ${
          isDarkMode 
            ? 'bg-gray-800/95 border-gray-700/50' 
            : 'bg-white/95 border-gray-200/80'
        }`}>
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-4 h-4 rounded-full flex-shrink-0 shadow-sm"
              style={{ backgroundColor: entry.color }}
            />
            <div>
              <div className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {entry.name}
              </div>
              <div className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {entry.payload?.percentage?.toFixed(2)}% {language === 'fr' ? 'du portefeuille' : 'of portfolio'}
              </div>
            </div>
          </div>
          <div className={`text-base font-semibold pt-2 border-t ${
            isDarkMode ? 'text-green-400 border-gray-700' : 'text-green-600 border-gray-200'
          }`}>
            {formatCurrency(entry.value)}
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    if (percent < 0.1) return null; // Ne pas afficher les labels trop petits
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill={isDarkMode ? '#f3f4f6' : '#111827'}
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-xs font-semibold"
        style={{ 
          filter: isDarkMode ? 'drop-shadow(0 1px 2px rgba(0,0,0,0.5))' : 'drop-shadow(0 1px 1px rgba(255,255,255,0.8))'
        }}
      >
        {`${name} ${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (holdings.length === 0) {
    return (
      <div className={`rounded-lg p-4 ${
        isDarkMode 
          ? 'bg-gray-800/95 backdrop-blur-sm border border-gray-700/50' 
          : 'bg-white border border-gray-200/80 shadow-sm'
      }`}>
        <h2 className={`text-sm font-bold mb-4 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
          {language === 'fr' ? 'Répartition par Crypto' : 'Distribution by Crypto'}
        </h2>
        <div className={`text-center py-8 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          {language === 'fr' ? 'Aucune donnée disponible' : 'No data available'}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Diagramme camembert - Répartition du portefeuille */}
      <div className={`rounded-lg p-4 md:p-5 ${
        isDarkMode 
          ? 'bg-gray-800/95 backdrop-blur-sm border border-gray-700/50' 
          : 'bg-white border border-gray-200/80 shadow-sm'
      }`}>
        {/* Header amélioré */}
        <div className="mb-4">
          <h3 className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {language === 'fr' ? 'Répartition par Crypto' : 'Distribution by Crypto'}
          </h3>
          <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            {language === 'fr' ? 'Répartition de votre portefeuille' : 'Your portfolio distribution'}
          </p>
        </div>

        {/* Graphique amélioré */}
        <div className="relative">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <defs>
                {/* Ajouter des ombres pour chaque couleur */}
                {CHART_COLORS.map((color, index) => (
                  <filter key={index} id={`shadow-${index}`}>
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                  </filter>
                ))}
              </defs>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={CustomLabel}
                outerRadius={75}
                innerRadius={35}
                fill="#8884d8"
                dataKey="value"
                animationBegin={0}
                animationDuration={600}
                animationEasing="ease-out"
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    style={{
                      filter: `drop-shadow(0 2px 4px ${entry.color}40)`,
                      transition: 'opacity 0.2s',
                    }}
                    onMouseEnter={(e: any) => {
                      e.target.style.opacity = 0.8;
                    }}
                    onMouseLeave={(e: any) => {
                      e.target.style.opacity = 1;
                    }}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          {/* Valeur totale au centre */}
          {totalValue > 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className={`text-xs font-medium mb-0.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {language === 'fr' ? 'Total' : 'Total'}
                </div>
                <div className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formatCurrency(totalValue, '€', 0)}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Légende améliorée */}
        {pieData.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-2 gap-2">
              {pieData.slice(0, 6).map((entry, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-2 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                    style={{ backgroundColor: entry.color }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs font-semibold truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      {entry.name}
                    </div>
                    <div className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {entry.percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {pieData.length > 6 && (
              <div className={`mt-2 text-center text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                +{pieData.length - 6} {language === 'fr' ? 'autres' : 'others'}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

