'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

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
      router.push('/');
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
      router.push('/');
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-2xl">E</span>
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          {isSignUp ? 'Créer un compte' : 'Se connecter'}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
          {isSignUp ? 'Rejoignez ExStrat pour gérer vos stratégies de trading' : 'Accédez à votre dashboard ExStrat'}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>
              {isSignUp ? 'Inscription' : 'Connexion'}
            </CardTitle>
            <CardDescription>
              {isSignUp 
                ? 'Remplissez le formulaire ci-dessous pour créer votre compte'
                : 'Entrez vos identifiants pour accéder à votre compte'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {isSignUp ? (
              <form onSubmit={signUpForm.handleSubmit(handleSignUp)} className="space-y-4">
                <Input
                  {...signUpForm.register('email')}
                  type="email"
                  label="Adresse email"
                  placeholder="votre@email.com"
                  error={signUpForm.formState.errors.email?.message}
                />

                <Input
                  {...signUpForm.register('password')}
                  type="password"
                  label="Mot de passe"
                  placeholder="••••••••"
                  error={signUpForm.formState.errors.password?.message}
                  helperText="Au moins 8 caractères avec majuscule, minuscule, chiffre et caractère spécial"
                />

                <Input
                  {...signUpForm.register('confirmPassword')}
                  type="password"
                  label="Confirmer le mot de passe"
                  placeholder="••••••••"
                  error={signUpForm.formState.errors.confirmPassword?.message}
                />

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? 'Création du compte...' : 'Créer mon compte'}
                </Button>
              </form>
            ) : (
              <form onSubmit={signInForm.handleSubmit(handleSignIn)} className="space-y-4">
                <Input
                  {...signInForm.register('email')}
                  type="email"
                  label="Adresse email"
                  placeholder="votre@email.com"
                  error={signInForm.formState.errors.email?.message}
                />

                <Input
                  {...signInForm.register('password')}
                  type="password"
                  label="Mot de passe"
                  placeholder="••••••••"
                  error={signInForm.formState.errors.password?.message}
                />

                <Button
                  type="submit"
                  className="w-full"
                  isLoading={isLoading}
                  disabled={isLoading}
                >
                  {isLoading ? 'Connexion...' : 'Se connecter'}
                </Button>
              </form>
            )}

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500 dark:bg-gray-900 dark:text-gray-400">
                    {isSignUp ? 'Déjà un compte ?' : 'Pas encore de compte ?'}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={toggleMode}
                  disabled={isLoading}
                >
                  {isSignUp ? 'Se connecter' : 'Créer un compte'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            En continuant, vous acceptez nos{' '}
            <a href="/terms" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
              conditions d'utilisation
            </a>{' '}
            et notre{' '}
            <a href="/privacy" className="text-blue-600 hover:text-blue-500 dark:text-blue-400">
              politique de confidentialité
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
