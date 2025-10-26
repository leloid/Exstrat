'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ShieldCheckIcon,
  PlusIcon,
  EyeIcon,
  Cog6ToothIcon,
  ClockIcon,
  FireIcon,
  StarIcon,
  BoltIcon
} from '@heroicons/react/24/outline';

// SVG personnalisés pour le dashboard
const PortfolioChartSVG = () => (
  <svg className="w-full h-32" viewBox="0 0 400 120" fill="none">
    <defs>
      <linearGradient id="portfolioGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.8"/>
        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.2"/>
      </linearGradient>
    </defs>
    <path
      d="M20,100 L60,80 L100,60 L140,40 L180,50 L220,30 L260,45 L300,25 L340,35 L380,20"
      stroke="url(#portfolioGradient)"
      strokeWidth="3"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="380" cy="20" r="4" fill="#3B82F6"/>
    <text x="380" y="15" textAnchor="middle" className="text-xs fill-blue-600 font-semibold">€45.2K</text>
  </svg>
);

const CryptoPieChartSVG = () => (
  <svg className="w-32 h-32" viewBox="0 0 120 120" fill="none">
    <defs>
      <linearGradient id="btcGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F7931A"/>
        <stop offset="100%" stopColor="#FFB84D"/>
      </linearGradient>
      <linearGradient id="ethGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#627EEA"/>
        <stop offset="100%" stopColor="#8FA4F3"/>
      </linearGradient>
      <linearGradient id="otherGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#10B981"/>
        <stop offset="100%" stopColor="#34D399"/>
      </linearGradient>
    </defs>
    <circle cx="60" cy="60" r="50" fill="#E5E7EB"/>
    <path d="M60,10 A50,50 0 0,1 110,60 L60,60 Z" fill="url(#btcGradient)"/>
    <path d="M110,60 A50,50 0 0,1 60,110 L60,60 Z" fill="url(#ethGradient)"/>
    <path d="M60,110 A50,50 0 0,1 10,60 L60,60 Z" fill="url(#otherGradient)"/>
    <circle cx="60" cy="60" r="20" fill="white"/>
    <text x="60" y="65" textAnchor="middle" className="text-xs font-bold fill-gray-700">€45.2K</text>
  </svg>
);

const PerformanceChartSVG = () => (
  <svg className="w-full h-16" viewBox="0 0 300 64" fill="none">
    <defs>
      <linearGradient id="performanceGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.05"/>
      </linearGradient>
    </defs>
    <path
      d="M10,50 L50,40 L90,30 L130,20 L170,15 L210,10 L250,8 L290,5"
      stroke="#10B981"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10,50 L50,40 L90,30 L130,20 L170,15 L210,10 L250,8 L290,5 L290,64 L10,64 Z"
      fill="url(#performanceGradient)"
    />
  </svg>
);

const StrategyFlowSVG = () => (
  <svg className="w-full h-24" viewBox="0 0 400 96" fill="none">
    <defs>
      <linearGradient id="strategyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#8B5CF6"/>
        <stop offset="50%" stopColor="#3B82F6"/>
        <stop offset="100%" stopColor="#06B6D4"/>
      </linearGradient>
    </defs>
    <rect x="20" y="40" width="80" height="16" rx="8" fill="#8B5CF6"/>
    <text x="60" y="52" textAnchor="middle" className="text-xs font-semibold fill-white">Portfolio</text>
    <path d="M100,48 L120,48" stroke="#D1D5DB" strokeWidth="2" markerEnd="url(#arrowhead)"/>
    <rect x="130" y="40" width="80" height="16" rx="8" fill="#3B82F6"/>
    <text x="170" y="52" textAnchor="middle" className="text-xs font-semibold fill-white">Stratégie</text>
    <path d="M210,48 L230,48" stroke="#D1D5DB" strokeWidth="2" markerEnd="url(#arrowhead)"/>
    <rect x="240" y="40" width="80" height="16" rx="8" fill="#06B6D4"/>
    <text x="280" y="52" textAnchor="middle" className="text-xs font-semibold fill-white">Alertes</text>
    <defs>
      <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
        <polygon points="0 0, 10 3.5, 0 7" fill="#D1D5DB"/>
      </marker>
    </defs>
  </svg>
);

const MarketTrendSVG = () => (
  <svg className="w-full h-16" viewBox="0 0 300 64" fill="none">
    <defs>
      <linearGradient id="marketGradient" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3"/>
        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.05"/>
      </linearGradient>
    </defs>
    <path
      d="M10,50 L50,45 L90,35 L130,25 L170,30 L210,20 L250,15 L290,10"
      stroke="#F59E0B"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M10,50 L50,45 L90,35 L130,25 L170,30 L210,20 L250,15 L290,10 L290,64 L10,64 Z"
      fill="url(#marketGradient)"
    />
  </svg>
);

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const stats = [
    {
      name: 'Portfolio Total',
      value: '€45,230',
      change: '+12.5%',
      changeType: 'positive',
      icon: CurrencyDollarIcon,
      trend: PortfolioChartSVG,
      color: 'blue',
    },
    {
      name: 'Stratégies Actives',
      value: '8',
      change: '+3 cette semaine',
      changeType: 'positive',
      icon: ChartBarIcon,
      trend: StrategyFlowSVG,
      color: 'purple',
    },
    {
      name: 'Gains du Mois',
      value: '€5,420',
      change: '+24.5%',
      changeType: 'positive',
      icon: ArrowTrendingUpIcon,
      trend: PerformanceChartSVG,
      color: 'green',
    },
    {
      name: 'Market Sentiment',
      value: 'Bullish',
      change: '+8.2%',
      changeType: 'positive',
      icon: FireIcon,
      trend: MarketTrendSVG,
      color: 'amber',
    },
  ];

  const topHoldings = [
    { symbol: 'BTC', name: 'Bitcoin', value: '€18,420', change: '+5.2%', percentage: 40.8 },
    { symbol: 'ETH', name: 'Ethereum', value: '€12,150', change: '+3.8%', percentage: 26.9 },
    { symbol: 'ADA', name: 'Cardano', value: '€4,230', change: '+7.1%', percentage: 9.4 },
    { symbol: 'SOL', name: 'Solana', value: '€3,890', change: '+12.3%', percentage: 8.6 },
    { symbol: 'DOT', name: 'Polkadot', value: '€2,540', change: '-2.1%', percentage: 5.6 },
  ];

  const recentActivities = [
    { action: 'Stratégie BTC activée', time: 'Il y a 2h', type: 'strategy', icon: BoltIcon },
    { action: 'Achat ETH +0.5', time: 'Il y a 4h', type: 'buy', icon: PlusIcon },
    { action: 'Alerte prix atteinte', time: 'Il y a 6h', type: 'alert', icon: StarIcon },
    { action: 'Vente ADA -100', time: 'Hier', type: 'sell', icon: ArrowTrendingDownIcon },
  ];

  const quickActions = [
    {
      title: 'Nouvelle Transaction',
      description: 'Ajouter un achat ou une vente',
      icon: PlusIcon,
      href: '/transactions',
      color: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
    },
    {
      title: 'Portfolio',
      description: 'Voir vos positions',
      icon: EyeIcon,
      href: '/portfolio',
      color: 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800',
    },
    {
      title: 'Stratégies',
      description: 'Gérer les stratégies',
      icon: ChartBarIcon,
      href: '/strategies',
      color: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800',
    },
    {
      title: 'Configuration',
      description: 'Paramètres',
      icon: Cog6ToothIcon,
      href: '/config',
      color: 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800',
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* En-tête avec horloge */}
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Vue d'ensemble
              </h1>
              <p className="text-gray-600">
                Bonjour {user?.email?.split('@')[0]}, voici un aperçu de votre portfolio crypto
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {currentTime.toLocaleTimeString('fr-FR', { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  second: '2-digit'
                })}
              </div>
              <div className="text-sm text-gray-500">
                {currentTime.toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
          </div>

          {/* Statistiques principales avec graphiques */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {stats.map((stat) => (
              <Card key={stat.name} className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${
                      stat.color === 'blue' ? 'from-blue-500 to-blue-600' :
                      stat.color === 'purple' ? 'from-purple-500 to-purple-600' :
                      stat.color === 'green' ? 'from-green-500 to-green-600' :
                      'from-amber-500 to-amber-600'
                    }`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                    <Badge variant="secondary" className={`${
                      stat.changeType === 'positive' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm font-medium text-gray-600 mb-1">
                      {stat.name}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div className="h-16">
                    <stat.trend />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Top Holdings avec graphique en camembert */}
            <Card className="lg:col-span-2 hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                    <CurrencyDollarIcon className="h-5 w-5 text-white" />
                  </div>
                  Top Holdings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-8">
                  <div className="flex-1">
                    {topHoldings.map((holding, index) => (
                      <div key={holding.symbol} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${
                            index === 0 ? 'bg-orange-500' :
                            index === 1 ? 'bg-blue-500' :
                            index === 2 ? 'bg-blue-600' :
                            index === 3 ? 'bg-purple-500' :
                            'bg-pink-500'
                          }`}></div>
                          <div>
                            <div className="font-semibold text-gray-900">{holding.symbol}</div>
                            <div className="text-sm text-gray-500">{holding.name}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">{holding.value}</div>
                          <div className={`text-sm ${
                            holding.change.startsWith('+') ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {holding.change}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex-shrink-0">
                    <CryptoPieChartSVG />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Activités récentes */}
            <Card className="hover:shadow-xl transition-all duration-300 border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                    <ClockIcon className="h-5 w-5 text-white" />
                  </div>
                  Activités Récentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className={`p-2 rounded-lg ${
                        activity.type === 'strategy' ? 'bg-purple-100' :
                        activity.type === 'buy' ? 'bg-green-100' :
                        activity.type === 'sell' ? 'bg-red-100' :
                        'bg-yellow-100'
                      }`}>
                        <activity.icon className={`h-4 w-4 ${
                          activity.type === 'strategy' ? 'text-purple-600' :
                          activity.type === 'buy' ? 'text-green-600' :
                          activity.type === 'sell' ? 'text-red-600' :
                          'text-yellow-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">{activity.action}</div>
                        <div className="text-xs text-gray-500">{activity.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Actions rapides */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Actions Rapides
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => (
                <Card 
                  key={action.title} 
                  className="group cursor-pointer hover:shadow-xl transition-all duration-300 border-0 shadow-lg hover:scale-105"
                  onClick={() => router.push(action.href)}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-20 h-20 mx-auto mb-4 rounded-2xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                      <action.icon className="h-10 w-10 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {action.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
