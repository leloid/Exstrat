'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { 
  ChartBarIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  ShieldCheckIcon,
  RocketLaunchIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

// Icônes pour les boutons sociaux
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
);

const AppleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
  </svg>
);

const signInSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis')
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

const signUpSchema = z.object({
  email: z
    .string()
    .min(1, 'L\'email est requis')
    .email('Format d\'email invalide'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial'
    ),
  confirmPassword: z.string().min(1, 'La confirmation du mot de passe est requise'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type SignInForm = z.infer<typeof signInSchema>;
type SignUpForm = z.infer<typeof signUpSchema>;

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, signUp, isAuthenticated } = useAuth();
  const router = useRouter();

  const signInForm = useForm<SignInForm>({
    resolver: zodResolver(signInSchema),
  });

  const signUpForm = useForm<SignUpForm>({
    resolver: zodResolver(signUpSchema),
  });

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  const handleSignIn = async (data: SignInForm) => {
    setIsLoading(true);
    setError('');
    
    try {
      await signIn(data);
      // Vérifier si c'est la première connexion (pas de portfolios)
      // Pour l'instant, on redirige toujours vers l'onboarding
      router.push('/onboarding');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (data: SignUpForm) => {
    setIsLoading(true);
    setError('');
    
    try {
      await signUp({
        email: data.email,
        password: data.password,
      });
      // Nouvel utilisateur, rediriger vers l'onboarding
      router.push('/onboarding');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    setError('');
    signInForm.reset();
    signUpForm.reset();
  };

  const handleGoogleAuth = () => {
    // TODO: Implémenter l'authentification Google
    console.log('Google Auth clicked');
  };

  const handleAppleAuth = () => {
    // TODO: Implémenter l'authentification Apple
    console.log('Apple Auth clicked');
  };

  const stats = [
    { label: "Stratégies Créées", value: "500+" },
    { label: "Utilisateurs Actifs", value: "1.2K+" },
    { label: "Exchanges Supportés", value: "15+" },
    { label: "Tokens Suivis", value: "2.5K+" }
  ];

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          {/* Logo */}
          <div className="flex items-center mb-8">
            <img 
              src="/Full_logo.svg" 
              alt="exStrat Logo" 
              className="h-10 w-auto"
            />
          </div>

          {/* Sign up prompt */}
          {!isSignUp && (
            <div className="mb-6">
              <p className="text-sm text-gray-600">
                Vous n'avez pas de compte ?{' '}
                <button
                  onClick={toggleMode}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  S'inscrire
                </button>
              </p>
            </div>
          )}

          {/* Social Login Buttons */}
          <div className="space-y-3 mb-6">
            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-gray-300 hover:bg-gray-50"
              onClick={handleGoogleAuth}
              disabled={isLoading}
            >
              <GoogleIcon />
              <span className="ml-3">Continuer avec Google</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full h-12 border-gray-300 hover:bg-gray-50"
              onClick={handleAppleAuth}
              disabled={isLoading}
            >
              <AppleIcon />
              <span className="ml-3">Continuer avec Apple</span>
            </Button>
          </div>

          {/* Divider */}
          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">ou</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Form */}
          {isSignUp ? (
            <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  {...signUpForm.register('email')}
                  type="email"
                  placeholder="Entrez votre adresse email"
                  error={signUpForm.formState.errors.email?.message}
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <Input
                  {...signUpForm.register('password')}
                  type="password"
                  placeholder="Entrez votre mot de passe"
                  error={signUpForm.formState.errors.password?.message}
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe
                </label>
                <Input
                  {...signUpForm.register('confirmPassword')}
                  type="password"
                  placeholder="Confirmez votre mot de passe"
                  error={signUpForm.formState.errors.confirmPassword?.message}
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Création du compte...' : 'Créer mon compte'}
              </Button>
            </form>
          ) : (
            <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <Input
                  {...signInForm.register('email')}
                  type="email"
                  placeholder="Entrez votre adresse email"
                  error={signInForm.formState.errors.email?.message}
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <Input
                  {...signInForm.register('password')}
                  type="password"
                  placeholder="Entrez votre mot de passe"
                  error={signInForm.formState.errors.password?.message}
                  className="h-12"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                isLoading={isLoading}
                disabled={isLoading}
              >
                {isLoading ? 'Connexion...' : 'Me connecter'}
              </Button>
            </form>
          )}

          {/* Forgot Password */}
          {!isSignUp && (
            <div className="mt-4 text-center">
              <button className="text-sm text-blue-600 hover:text-blue-500">
                Mot de passe oublié ?
              </button>
            </div>
          )}

          {/* Switch Mode */}
          {isSignUp && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Déjà un compte ?{' '}
                <button
                  onClick={toggleMode}
                  className="font-medium text-blue-600 hover:text-blue-500"
                >
                  Se connecter
                </button>
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Right Side - Promotional Content */}
      <div className="hidden lg:flex lg:flex-1 bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 relative overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0">
          <div className="absolute -top-40 -right-32 w-80 h-80 bg-white/10 rounded-full mix-blend-multiply filter blur-xl"></div>
          <div className="absolute -bottom-40 -left-32 w-80 h-80 bg-white/10 rounded-full mix-blend-multiply filter blur-xl"></div>
        </div>

        <div className="relative flex flex-col justify-center px-8 py-12">
          {/* Main Title */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              La plateforme de stratégies crypto la mieux notée du marché
            </h1>
            <p className="text-xl text-white/90">
              Créez, simulez et optimisez vos stratégies de trading crypto avec exStrat
            </p>
          </div>

          {/* Stats Card */}
          <Card className="mb-8 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <ArrowTrendingUpIcon className="w-6 h-6 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Gains du mois</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">+€2,450</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <CurrencyDollarIcon className="w-6 h-6 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-gray-600">Portfolio total</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">€15,230</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                <div>
                  <div className="text-lg font-bold text-gray-900">10</div>
                  <div className="text-sm text-gray-600">Exchanges connectés</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">550</div>
                  <div className="text-sm text-gray-600">Transactions/mois</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-900">25</div>
                  <div className="text-sm text-gray-600">Stratégies actives</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center text-sm">
                <div>
                  <div className="font-medium text-gray-900">Résidence fiscale</div>
                  <div className="text-gray-600">France</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Méthode</div>
                  <div className="text-gray-600">FIFO</div>
                </div>
                <div>
                  <div className="font-medium text-gray-900">Devise</div>
                  <div className="text-gray-600">EUR</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center text-white">
              <ShieldCheckIcon className="w-5 h-5 mr-2" />
              <span className="text-sm">+700 plateformes</span>
            </div>
            <div className="flex items-center text-white">
              <UserGroupIcon className="w-5 h-5 mr-2" />
              <span className="text-sm">+100 000 utilisateurs</span>
            </div>
            <div className="flex items-center text-white">
              <RocketLaunchIcon className="w-5 h-5 mr-2" />
              <span className="text-sm">Bullrun 2025</span>
            </div>
          </div>

          {/* Trustpilot Rating */}
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="text-4xl font-bold text-white mb-1">4.8</div>
              <div className="text-sm text-white/80 mb-2">Trustpilot</div>
              <div className="flex justify-center">
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
