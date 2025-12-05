export interface User {
	id: string;
	email: string;
	createdAt: string;
}

export interface AuthResponse {
	message: string;
	user: User;
	accessToken: string;
}

export interface SignUpData {
	email: string;
	password: string;
}

export interface SignInData {
	email: string;
	password: string;
}

export interface AuthContextType {
	user: User | null;
	isLoading: boolean;
	isAuthenticated: boolean;
	signIn: (data: SignInData) => Promise<void>;
	signUp: (data: SignUpData) => Promise<void>;
	signOut: () => Promise<void>;
	refreshToken: () => Promise<void>;
}

