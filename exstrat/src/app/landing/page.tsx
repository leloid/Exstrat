'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  ChartBarIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  CpuChipIcon,
  GlobeAltIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

// Icônes SVG personnalisées pour EXSTRAT
const CryptoIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" fill="none"/>
  </svg>
);

const StrategyIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3H21V21H3V3Z" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M9 9H15V15H9V9Z" fill="currentColor"/>
    <path d="M3 9H9M15 9H21M9 3V9M15 15V21" stroke="currentColor" strokeWidth="2"/>
  </svg>
);

const AnalyticsIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 17L9 11L13 15L21 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="9" cy="11" r="2" fill="currentColor"/>
    <circle cx="13" cy="15" r="2" fill="currentColor"/>
    <circle cx="21" cy="7" r="2" fill="currentColor"/>
  </svg>
);

const PortfolioIcon = () => (
  <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" fill="none"/>
    <path d="M7 8H17M7 12H15M7 16H13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      icon: CryptoIcon,
      title: "Gestion Crypto Intelligente",
      description: "Connectez vos exchanges et synchronisez automatiquement vos positions crypto avec une sécurité maximale.",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: StrategyIcon,
      title: "Stratégies Personnalisées",
      description: "Créez des stratégies de prise de profit sur mesure pour chaque token avec des niveaux de sortie intelligents.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: AnalyticsIcon,
      title: "Simulation Avancée",
      description: "Testez vos stratégies sur des données historiques pour optimiser vos rendements avant de les appliquer.",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: PortfolioIcon,
      title: "Portfolio Optimisé",
      description: "Analysez et comparez vos stratégies pour maximiser vos gains et rationaliser vos investissements.",
      color: "from-orange-500 to-red-500"
    }
  ];

  const stats = [
    { label: "Stratégies Créées", value: "500+" },
    { label: "Utilisateurs Actifs", value: "1.2K+" },
    { label: "Exchanges Supportés", value: "15+" },
    { label: "Tokens Suivis", value: "2.5K+" }
  ];

  const handleLoginClick = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Navigation */}
      <nav className="relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <img 
                src="/Full_logo.svg" 
                alt="exStrat Logo" 
                className="h-10 w-auto"
              />
            </div>
            <Button
              onClick={handleLoginClick}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2"
            >
              Accéder à la bêta
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          {/* Hero Content */}
          <div className="text-center mb-16">
            {/* Badge */}
            <div className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 mb-8 border border-blue-200">
              <RocketLaunchIcon className="w-4 h-4 mr-2" />
              Version bêta - Préparez votre bullrun 2025
            </div>

            {/* Main Title */}
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Optimisez vos
              <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent"> stratégies crypto</span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-12 leading-relaxed">
              exStrat est la plateforme professionnelle qui vous permet de créer, simuler et comparer 
              des stratégies de prise de profit pour maximiser vos rendements crypto.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button
                onClick={handleLoginClick}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <RocketLaunchIcon className="w-5 h-5 mr-2" />
                Commencer maintenant
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg font-semibold"
              >
                <GlobeAltIcon className="w-5 h-5 mr-2" />
                Voir la démo
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Pourquoi choisir exStrat ?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="group hover:shadow-xl transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-8 text-center">
                    <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                      <feature.icon />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-gray-600 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Process Section */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              Comment ça marche ?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Connectez vos exchanges</h3>
                <p className="text-gray-600">Importez vos positions crypto de manière sécurisée depuis vos plateformes préférées.</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Créez vos stratégies</h3>
                <p className="text-gray-600">Définissez des stratégies personnalisées avec des niveaux de sortie intelligents.</p>
              </div>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Optimisez vos gains</h3>
                <p className="text-gray-600">Simulez et comparez vos stratégies pour maximiser vos rendements.</p>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">
              Prêt à optimiser vos stratégies crypto ?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Rejoignez la communauté exStrat et préparez votre bullrun 2025
            </p>
            <Button
              onClick={handleLoginClick}
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold shadow-lg"
            >
              <UserGroupIcon className="w-5 h-5 mr-2" />
              Rejoindre la bêta
            </Button>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <img 
                  src="/logo_light.svg" 
                  alt="exStrat Logo" 
                  className="h-8 w-auto"
                />
                <span className="text-xl font-bold">exStrat</span>
              </div>
              <p className="text-gray-400">
                La plateforme professionnelle pour optimiser vos stratégies crypto.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Produit</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Fonctionnalités</li>
                <li>Tarifs</li>
                <li>API</li>
                <li>Documentation</li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-gray-400">
                <li>Centre d'aide</li>
                <li>Contact</li>
                <li>Communauté</li>
                <li>Statut</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 exStrat. Tous droits réservés.</p>
            <p className="mt-2">Développé pour la communauté crypto</p>
          </div>
        </div>
      </footer>
    </div>
  );
}