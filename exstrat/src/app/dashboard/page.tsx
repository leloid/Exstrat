'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  PlusIcon,
  EyeIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

export default function DashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  const stats = [
    {
      name: 'Portfolio Total',
      value: '€0.00',
      change: '+0%',
      changeType: 'positive',
      icon: CurrencyDollarIcon,
    },
    {
      name: 'Stratégies Actives',
      value: '0',
      change: '+0',
      changeType: 'neutral',
      icon: ChartBarIcon,
    },
    {
      name: 'Gains du Mois',
      value: '€0.00',
      change: '+0%',
      changeType: 'positive',
      icon: ArrowTrendingUpIcon,
    },
    {
      name: 'Exchanges Connectés',
      value: '0',
      change: '+0',
      changeType: 'neutral',
      icon: ShieldCheckIcon,
    },
  ];

  const quickActions = [
    {
      title: 'Nouvelle Transaction',
      description: 'Ajouter un achat ou une vente',
      icon: PlusIcon,
      href: '/transactions',
      color: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Portfolio',
      description: 'Voir vos positions',
      icon: EyeIcon,
      href: '/portfolio',
      color: 'bg-green-600 hover:bg-green-700',
    },
    {
      title: 'Stratégies',
      description: 'Gérer les stratégies',
      icon: ChartBarIcon,
      href: '/strategies',
      color: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      title: 'Configuration',
      description: 'Paramètres',
      icon: Cog6ToothIcon,
      href: '/config',
      color: 'bg-gray-600 hover:bg-gray-700',
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* En-tête */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Bonjour {user?.email?.split('@')[0]}, voici un aperçu de votre portfolio crypto
            </p>
          </div>

          {/* Statistiques principales */}
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {stats.map((stat) => (
              <Card key={stat.name} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                        {stat.name}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stat.value}
                      </p>
                      <p className={`text-sm ${
                        stat.changeType === 'positive' 
                          ? 'text-green-600' 
                          : stat.changeType === 'negative'
                          ? 'text-red-600'
                          : 'text-gray-500'
                      }`}>
                        {stat.change}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <stat.icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions rapides */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Actions Rapides
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {quickActions.map((action) => (
                <Card 
                  key={action.title} 
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300"
                  onClick={() => router.push(action.href)}
                >
                  <CardContent className="p-6 text-center">
                    <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl ${action.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <action.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
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
