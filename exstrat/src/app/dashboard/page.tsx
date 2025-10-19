'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  ChartBarIcon, 
  CurrencyDollarIcon, 
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  ClockIcon,
  UserGroupIcon,
  PlusIcon
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

  const features = [
    {
      title: 'Gestion de Portfolio',
      description: 'Suivez vos investissements crypto en temps réel avec des données consolidées de tous vos exchanges.',
      icon: ChartBarIcon,
      href: '/portfolio',
    },
    {
      title: 'Stratégies Automatisées',
      description: 'Créez des stratégies de prise de profit personnalisées avec des alertes intelligentes.',
      icon: ArrowTrendingUpIcon,
      href: '/strategies',
    },
    {
      title: 'Sécurité Avancée',
      description: 'Vos clés API sont chiffrées et stockées de manière sécurisée. Accès en lecture seule uniquement.',
      icon: ShieldCheckIcon,
      href: '/security',
    },
    {
      title: 'Notifications Temps Réel',
      description: 'Recevez des alertes instantanées quand vos objectifs de prix sont atteints.',
      icon: ClockIcon,
      href: '/notifications',
    },
  ];

  return (
    <ProtectedRoute>
      <div className="py-6">
        <main className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className="px-4 sm:px-0">
          {/* En-tête de bienvenue */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Bienvenue, {user?.email?.split('@')[0]} !
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Gérez vos stratégies de trading crypto avec ExStrat
            </p>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
            {stats.map((stat) => (
              <Card key={stat.name}>
                <CardContent className="p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <stat.icon className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">
                          {stat.name}
                        </dt>
                        <dd className="flex items-baseline">
                          <div className="text-2xl font-semibold text-gray-900 dark:text-white">
                            {stat.value}
                          </div>
                          <div className={`ml-2 flex items-baseline text-sm font-semibold ${
                            stat.changeType === 'positive' 
                              ? 'text-green-600' 
                              : stat.changeType === 'negative'
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`}>
                            {stat.change}
                          </div>
                        </dd>
                      </dl>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Actions rapides */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Actions Rapides
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Button
                onClick={() => router.push('/transactions')}
                className="h-20 flex flex-col items-center justify-center space-y-2 bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-8 w-8" />
                <span>Ajouter une Transaction</span>
              </Button>
              <Button
                onClick={() => router.push('/portfolio')}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <CurrencyDollarIcon className="h-8 w-8" />
                <span>Voir le Portfolio</span>
              </Button>
              <Button
                onClick={() => router.push('/strategies')}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <ArrowTrendingUpIcon className="h-8 w-8" />
                <span>Gérer les Stratégies</span>
              </Button>
              <Button
                onClick={() => router.push('/exchanges')}
                variant="outline"
                className="h-20 flex flex-col items-center justify-center space-y-2"
              >
                <ShieldCheckIcon className="h-8 w-8" />
                <span>Connecter un Exchange</span>
              </Button>
            </div>
          </div>

          {/* Fonctionnalités */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Fonctionnalités Principales
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {features.map((feature) => (
                <Card key={feature.title} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center space-x-3">
                      <feature.icon className="h-6 w-6 text-blue-600" />
                      <CardTitle className="text-lg">{feature.title}</CardTitle>
                    </div>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push(feature.href)}
                    >
                      En savoir plus
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Section d'aide */}
          <div className="mt-12">
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="p-6">
                <div className="flex items-start">
                  <UserGroupIcon className="h-6 w-6 text-blue-600 mt-1" />
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-blue-900 dark:text-blue-100">
                      Besoin d'aide ?
                    </h3>
                    <p className="mt-1 text-blue-700 dark:text-blue-200">
                      Consultez notre documentation ou contactez notre support pour vous aider à démarrer.
                    </p>
                    <div className="mt-4 flex space-x-3">
                      <Button size="sm" variant="outline">
                        Documentation
                      </Button>
                      <Button size="sm" variant="outline">
                        Support
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
