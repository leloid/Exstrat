export interface User {
	id: string;
	email: string;
	firstName?: string | null;
	lastName?: string | null;
	createdAt: string;
}

export interface AuthResponse {
	message: string;
	user: User;
	accessToken: string;
}

export interface SignUpData {
	firstName?: string;
	lastName?: string;
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

