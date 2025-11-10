/**
 * AuthContext pour l'application mobile
 * Similaire au contexte web mais adapté pour React Native
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, AuthContextType, SignInData, SignUpData, AuthResponse } from '@/types/auth';
import api from '@/lib/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // Vérifier l'authentification au chargement
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const storedUser = await AsyncStorage.getItem('user');
        
        if (token && storedUser) {
          try {
            // Vérifier si le token est encore valide
            const response = await api.get('/auth/profile');
            setUser(response.data);
          } catch (error: unknown) {
            // Si le token est expiré, essayer de le renouveler
            const axiosError = error as { response?: { status?: number } };
            if (axiosError.response?.status === 401) {
              console.log('🔄 Token expiré, tentative de renouvellement...');
              try {
                await refreshToken();
                // Réessayer la requête avec le nouveau token
                const response = await api.get('/auth/profile');
                setUser(response.data);
              } catch (refreshError) {
                // Si le refresh échoue, déconnecter l'utilisateur
                console.log('❌ Impossible de renouveler le token, déconnexion...');
                await AsyncStorage.removeItem('accessToken');
                await AsyncStorage.removeItem('user');
                setUser(null);
              }
            } else {
              throw error;
            }
          }
        } else {
          // Nettoyer le AsyncStorage si pas de token
          await AsyncStorage.removeItem('accessToken');
          await AsyncStorage.removeItem('user');
        }
      } catch (error) {
        // Token invalide ou expiré
        await AsyncStorage.removeItem('accessToken');
        await AsyncStorage.removeItem('user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  const signIn = async (data: SignInData) => {
    try {
      const response = await api.post<AuthResponse>('/auth/signin', data);
      const { user: userData, accessToken } = response.data;
      
      setUser(userData);
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error: unknown) {
      // Extraire le message d'erreur de manière plus robuste
      const axiosError = error as { response?: { data?: { message?: string }; status?: number }; message?: string };
      
      // Messages d'erreur spécifiques selon le code de statut
      if (axiosError.response?.status === 401) {
        throw new Error('Email ou mot de passe incorrect');
      } else if (axiosError.response?.status === 404) {
        throw new Error('Utilisateur non trouvé');
      } else if (axiosError.response?.status === 400) {
        throw new Error(axiosError.response.data?.message || 'Données invalides');
      } else if (axiosError.response?.status === 500) {
        throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
      } else if (axiosError.message) {
        throw new Error(axiosError.message);
      } else {
        throw new Error(axiosError.response?.data?.message || 'Erreur de connexion. Veuillez réessayer.');
      }
    }
  };

  const signUp = async (data: SignUpData) => {
    try {
      const response = await api.post<AuthResponse>('/auth/signup', data);
      const { user: userData, accessToken } = response.data;
      
      setUser(userData);
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(userData));
    } catch (error: unknown) {
      // Extraire le message d'erreur de manière plus robuste
      const axiosError = error as { response?: { data?: { message?: string }; status?: number }; message?: string };
      
      // Messages d'erreur spécifiques selon le code de statut
      if (axiosError.response?.status === 409) {
        throw new Error('Un compte existe déjà avec cet email');
      } else if (axiosError.response?.status === 400) {
        throw new Error(axiosError.response.data?.message || 'Données invalides');
      } else if (axiosError.response?.status === 500) {
        throw new Error('Erreur serveur. Veuillez réessayer plus tard.');
      } else if (axiosError.message) {
        throw new Error(axiosError.message);
      } else {
        throw new Error(axiosError.response?.data?.message || 'Erreur d\'inscription. Veuillez réessayer.');
      }
    }
  };

  const signOut = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      // Ignorer les erreurs de déconnexion
      console.error('Erreur lors de la déconnexion:', error);
    } finally {
      setUser(null);
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('user');
    }
  };

  const refreshToken = async () => {
    try {
      const response = await api.post<{ accessToken: string }>('/auth/refresh');
      const { accessToken } = response.data;
      await AsyncStorage.setItem('accessToken', accessToken);
    } catch (error) {
      // Si le refresh échoue, déconnecter l'utilisateur
      signOut();
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

