"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { User, AuthContextType, SignInData, SignUpData, AuthResponse } from "@/types/auth";
import api from "@/lib/api";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
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
				const token = localStorage.getItem("accessToken");
				const storedUser = localStorage.getItem("user");

				if (token && storedUser) {
					try {
						// Vérifier si le token est encore valide
						const response = await api.get("/auth/profile");
						setUser(response.data);
					} catch (error: any) {
						// Si le token est expiré, essayer de le renouveler
						if (error.response?.status === 401) {
							console.log("🔄 Token expiré, tentative de renouvellement...");
							try {
								await refreshToken();
								// Réessayer la requête avec le nouveau token
								const response = await api.get("/auth/profile");
								setUser(response.data);
							} catch (refreshError) {
								// Si le refresh échoue, déconnecter l'utilisateur
								console.log("❌ Impossible de renouveler le token, déconnexion...");
								localStorage.removeItem("accessToken");
								localStorage.removeItem("user");
								setUser(null);
							}
						} else {
							throw error;
						}
					}
				} else {
					// Nettoyer le localStorage si pas de token
					localStorage.removeItem("accessToken");
					localStorage.removeItem("user");
				}
			} catch (error) {
				// Token invalide ou expiré
				localStorage.removeItem("accessToken");
				localStorage.removeItem("user");
				setUser(null);
			} finally {
				setIsLoading(false);
			}
		};

		checkAuth();
	}, []);

	const signIn = async (data: SignInData) => {
		try {
			const response = await api.post<AuthResponse>("/auth/signin", data);
			const { user: userData, accessToken } = response.data;

			setUser(userData);
			localStorage.setItem("accessToken", accessToken);
			localStorage.setItem("user", JSON.stringify(userData));
		} catch (error: unknown) {
			// Extraire le message d'erreur de manière plus robuste
			const axiosError = error as { response?: { data?: { message?: string }; status?: number }; message?: string };

			// Messages d'erreur spécifiques selon le code de statut
			if (axiosError.response?.status === 401) {
				// Si le message contient "vérifier votre email", on le garde tel quel
				const errorMessage = axiosError.response.data?.message || "";
				if (errorMessage.includes("vérifier votre email") || errorMessage.includes("email")) {
					throw new Error(errorMessage);
				}
				throw new Error("Incorrect email or password");
			} else if (axiosError.response?.status === 404) {
				throw new Error("User not found");
			} else if (axiosError.response?.status === 400) {
				throw new Error(axiosError.response.data?.message || "Invalid data");
			} else if (axiosError.response?.status === 500) {
				throw new Error("Server error. Please try again later.");
			} else if (axiosError.message) {
				throw new Error(axiosError.message);
			} else {
				throw new Error(axiosError.response?.data?.message || "Connection error. Please try again.");
			}
		}
	};

	const signUp = async (data: SignUpData) => {
		try {
			const response = await api.post<AuthResponse>("/auth/signup", data);
			const { user: userData, accessToken, message } = response.data;

			// Ne pas stocker le token et l'utilisateur si l'email n'est pas vérifié
			// Le message du backend est : "Inscription réussie. Veuillez vérifier votre email pour activer votre compte."
			// On vérifie si le message contient "vérifier" (français) ou "verify" (anglais)
			const messageLower = (message || "").toLowerCase();
			const needsVerification = messageLower.includes("vérifier") || messageLower.includes("verify");
			
			if (needsVerification) {
				// Ne pas stocker le token, l'utilisateur doit d'abord vérifier son email
				// On retourne sans stocker pour éviter la redirection automatique
				// L'utilisateur verra le message de vérification sur la page sign-up
				return;
			}

			// Si l'email est déjà vérifié (cas improbable mais possible), on stocke le token
			setUser(userData);
			localStorage.setItem("accessToken", accessToken);
			localStorage.setItem("user", JSON.stringify(userData));
		} catch (error: unknown) {
			// Extraire le message d'erreur de manière plus robuste
			const axiosError = error as { response?: { data?: { message?: string }; status?: number }; message?: string };

			// Messages d'erreur spécifiques selon le code de statut
			if (axiosError.response?.status === 409) {
				throw new Error("An account already exists with this email");
			} else if (axiosError.response?.status === 400) {
				throw new Error(axiosError.response.data?.message || "Invalid data");
			} else if (axiosError.response?.status === 500) {
				throw new Error("Server error. Please try again later.");
			} else if (axiosError.message) {
				throw new Error(axiosError.message);
			} else {
				throw new Error(axiosError.response?.data?.message || "Sign up error. Please try again.");
			}
		}
	};

	const signOut = async () => {
		try {
			await api.post("/auth/logout");
		} catch (error) {
			// Ignorer les erreurs de déconnexion
			console.error("Erreur lors de la déconnexion:", error);
		} finally {
			setUser(null);
			localStorage.removeItem("accessToken");
			localStorage.removeItem("user");
		}
	};

	const refreshToken = async () => {
		try {
			const response = await api.post<{ accessToken: string }>("/auth/refresh");
			const { accessToken } = response.data;
			localStorage.setItem("accessToken", accessToken);
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

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

