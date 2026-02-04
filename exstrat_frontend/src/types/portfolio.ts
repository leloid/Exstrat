/**
 * Portfolio Types
 * Types for portfolio management, holdings, and strategies
 */

export interface Portfolio {
	id: string;
	name: string;
	description?: string;
	isDefault: boolean;
	createdAt: Date | string;
	updatedAt: Date | string;
	holdingsCount?: number;
}

export interface Token {
	id: string;
	symbol: string;
	name: string;
	cmcId?: number;
	logoUrl?: string;
}

export interface Holding {
	id: string;
	quantity: number;
	investedAmount: number;
	averagePrice: number;
	currentPrice?: number;
	lastUpdated: Date | string;
	token: Token;
	currentValue?: number;
	profitLoss?: number;
	profitLossPercentage?: number;
}

export interface StrategyTemplate {
	id: string;
	name: string;
	description?: string;
	type: "no_tp" | "percentage" | "dca" | "custom";
	isDefault: boolean;
	isActive: boolean;
	createdAt: Date | string;
	updatedAt: Date | string;
}

export interface ProfitTakingTemplate {
	id: string;
	name: string;
	description?: string;
	rules: Record<string, unknown>;
	isDefault: boolean;
	isActive: boolean;
	createdAt: Date | string;
	updatedAt: Date | string;
}

export interface UserStrategy {
	id: string;
	name: string;
	description?: string;
	status: "draft" | "active" | "paused" | "completed";
	createdAt: Date | string;
	updatedAt: Date | string;
	portfolio: {
		id: string;
		name: string;
	};
	tokenConfigsCount?: number;
}

export interface TokenStrategyConfiguration {
	id: string;
	holdingId: string;
	strategyTemplateId?: string;
	profitTakingTemplateId?: string;
	customProfitTakingRules?: Record<string, unknown>;
	isActive: boolean;
	createdAt: Date | string;
	updatedAt: Date | string;
	holding: {
		id: string;
		quantity: number;
		investedAmount: number;
		averagePrice: number;
		token: {
			id: string;
			symbol: string;
			name: string;
		};
	};
	strategyTemplate?: {
		id: string;
		name: string;
		type: string;
	};
	profitTakingTemplate?: {
		id: string;
		name: string;
		rules: Record<string, unknown>;
	};
}

export interface SimulationResult {
	id: string;
	projectedValue: number;
	return: number;
	remainingTokens: number;
	simulationDate: Date | string;
	tokenStrategyConfig: {
		id: string;
		holding: {
			token: {
				symbol: string;
				name: string;
			};
		};
	};
}

// DTOs for API requests
export interface CreatePortfolioDto {
	name: string;
	description?: string;
	isDefault?: boolean;
}

export interface UpdatePortfolioDto {
	name?: string;
	description?: string;
	isDefault?: boolean;
}

export interface CreateHoldingDto {
	tokenId: string;
	quantity: number;
	investedAmount: number;
	averagePrice: number;
	currentPrice?: number;
}

export interface UpdateHoldingDto {
	quantity?: number;
	investedAmount?: number;
	averagePrice?: number;
	currentPrice?: number;
}

export interface CreateUserStrategyDto {
	portfolioId: string;
	name: string;
	description?: string;
	status?: "draft" | "active" | "paused" | "completed";
}

export interface UpdateUserStrategyDto {
	name?: string;
	description?: string;
	status?: "draft" | "active" | "paused" | "completed";
}

export interface TokenStrategyConfigDto {
	holdingId: string;
	strategyTemplateId?: string;
	profitTakingTemplateId?: string;
	customProfitTakingRules?: Record<string, unknown>;
}

// Context types
export interface PortfolioContextType {
	portfolios: Portfolio[];
	currentPortfolio: Portfolio | null;
	holdings: Holding[];
	isLoading: boolean;
	isLoadingHoldings: boolean;
	error: string | null;
	createPortfolio: (data: CreatePortfolioDto) => Promise<void>;
	updatePortfolio: (id: string, data: UpdatePortfolioDto) => Promise<void>;
	deletePortfolio: (id: string) => Promise<void>;
	setCurrentPortfolio: (portfolio: Portfolio | null) => void;
	selectPortfolio: (portfolioId: string | null) => void;
	refreshPortfolios: () => Promise<void>;
	refreshHoldings: (portfolioId: string) => Promise<void>;
	syncPortfolios: () => Promise<void>;
}

// Forecast types
export interface CreateForecastDto {
	portfolioId: string;
	name: string;
	appliedStrategies: Record<string, string>;
	summary: {
		totalInvested: number;
		totalCollected: number;
		totalProfit: number;
		returnPercentage: number;
		remainingTokensValue: number;
		tokenCount: number;
	};
	notes?: string;
}

export interface ForecastResponse {
	id: string;
	portfolioId: string;
	portfolioName?: string;
	name: string;
	appliedStrategies: Record<string, string>;
	summary: {
		totalInvested: number;
		totalCollected: number;
		totalProfit: number;
		returnPercentage: number;
		remainingTokensValue: number;
		tokenCount: number;
	};
	notes?: string;
	createdAt: string;
	updatedAt: string;
}

