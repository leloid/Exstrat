'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  PencilIcon,
  CogIcon,
  ChartBarIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Logo } from '@/components/ui/Logo';

export default function LandingPage() {
  const router = useRouter();

  const features = [
    {
      icon: PencilIcon,
      title: "Renseignez vos données d'investissements",
      description: "Connectez vos exchanges et importez vos positions crypto de manière sécurisée."
    },
    {
      icon: CogIcon,
      title: "Créez vos stratégies de prise de profit pour chaque token",
      description: "Définissez des stratégies personnalisées avec des niveaux de sortie intelligents."
    },
    {
      icon: ChartBarIcon,
      title: "Simulez et comparez vos stratégies de portfolio",
      description: "Testez vos stratégies sur des données historiques pour optimiser vos rendements."
    }
  ];

  const handleLoginClick = () => {
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          {/* Version Badge */}
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mb-8">
            Version bêta
          </div>

          {/* Main Description */}
          <div className="max-w-3xl mx-auto mb-12">
            <p className="text-lg text-gray-600 leading-relaxed">
              exStrat est un support conçu pour les investisseurs crypto permettant de créer, 
              simuler et comparer des stratégies de prise de profit dans le but d'optimiser 
              ses rendements et rationnaliser ses investissements.
            </p>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 border-blue-100 hover:border-blue-200 transition-colors">
                <CardContent className="p-6 text-center">
                  <div className="flex justify-center mb-4">
                    <feature.icon className="h-12 w-12 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Call to Action */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Contribuez au développement d'exStrat tout en préparant votre bullrun 2025
            </h2>
            <Button
              onClick={handleLoginClick}
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg"
            >
              Accéder à la bêta
            </Button>
          </div>

          {/* Warning */}
          <div className="max-w-2xl mx-auto">
            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="p-6">
                <div className="flex items-start space-x-3">
                  <ExclamationTriangleIcon className="h-6 w-6 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="text-left">
                    <p className="text-orange-800 text-sm">
                      <strong>exStrat est pour le moment une application desktop uniquement,</strong> veuillez 
                      suivre le process de création de compte sur un ordinateur pour une expérience optimale.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-500 text-sm">
            <p>&copy; 2024 ExStrat. Tous droits réservés.</p>
            <p className="mt-2">
              Développé pour la communauté crypto
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}