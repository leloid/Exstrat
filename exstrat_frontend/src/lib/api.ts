import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

export const api = axios.create({
	baseURL: API_BASE_URL,
	withCredentials: false, // Désactivé car nous utilisons localStorage pour le token
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
	},
});

// Intercepteur pour ajouter le token JWT automatiquement
api.interceptors.request.use(
	(config) => {
		if (typeof globalThis.window !== "undefined") {
			const token = localStorage.getItem("accessToken");
			if (token) {
				config.headers.Authorization = `Bearer ${token}`;
			}
		}
		return config;
	},
	(error) => {
		throw error;
	}
);

// Variable pour éviter les boucles infinies de refresh
let isRefreshing = false;
let failedQueue: Array<{
	resolve: (value?: string | null) => void;
	reject: (error?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
	for (const { resolve, reject } of failedQueue) {
		if (error) {
			reject(error);
		} else {
			resolve(token);
		}
	}

	failedQueue = [];
};

// Intercepteur pour gérer les erreurs de réponse
api.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		// Ne pas logger les erreurs 404 pour l'endpoint csv-template (fallback côté client)
		if (error.response?.status === 404 && originalRequest.url?.includes("/transactions/csv-template")) {
			// Silencieusement ignorer cette erreur car on utilise un fallback
			return Promise.reject(error);
		}

		console.error("API Error:", error);

		if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
			console.error("Network error - Backend might be down");
			throw new Error("Impossible de se connecter au serveur. Vérifiez que le backend est démarré.");
		}

		if (error.response?.status === 429) {
			console.error("Rate limit exceeded - Too many requests");
			const retryAfter = error.response.headers["retry-after"];
			const message = retryAfter
				? `Trop de requêtes. Veuillez réessayer dans ${retryAfter} secondes.`
				: "Trop de requêtes. Veuillez patienter quelques instants avant de réessayer.";
			throw new Error(message);
		}

		if (error.response?.status === 502 || error.response?.status === 503 || error.response?.status === 504) {
			console.error("Gateway error - Backend might be down or unreachable");
			const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";
			throw new Error(
				`Backend server is not accessible at ${apiUrl}. Please ensure the backend is running on port 3000.`
			);
		}

		// Ne pas essayer de rafraîchir le token pour les endpoints d'authentification (login/signup)
		// car une erreur 401 sur ces endpoints signifie simplement que les identifiants sont incorrects
		const isAuthEndpoint =
			originalRequest.url?.includes("/auth/signin") ||
			originalRequest.url?.includes("/auth/signup") ||
			originalRequest.url?.includes("/auth/login");

		if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
			if (isRefreshing) {
				// Si on est déjà en train de rafraîchir, ajouter à la queue
				return new Promise((resolve, reject) => {
					failedQueue.push({ resolve, reject });
				})
					.then((token) => {
						originalRequest.headers.Authorization = `Bearer ${token}`;
						return api(originalRequest);
					})
					.catch((error_) => {
						throw error_;
					});
			}

			originalRequest._retry = true;
			isRefreshing = true;

			try {
				// Essayer de renouveler le token
				const refreshResponse = await api.post("/auth/refresh");
				const { accessToken } = refreshResponse.data;

				if (typeof globalThis.window !== "undefined") {
					localStorage.setItem("accessToken", accessToken);
				}

				processQueue(null, accessToken);

				// Retry la requête originale avec le nouveau token
				originalRequest.headers.Authorization = `Bearer ${accessToken}`;
				return api(originalRequest);
			} catch (refreshError) {
				// Si le refresh échoue, déconnecter l'utilisateur
				processQueue(refreshError, null);
				if (typeof globalThis.window !== "undefined") {
					localStorage.removeItem("accessToken");
					localStorage.removeItem("user");
					globalThis.window.location.href = "/auth/sign-in";
				}
				throw refreshError;
			} finally {
				isRefreshing = false;
			}
		}

		if (error.response?.status === 0) {
			throw new Error("Erreur de connexion. Vérifiez que le backend est démarré sur le port 3000.");
		}

		throw error;
	}
);

export default api;

