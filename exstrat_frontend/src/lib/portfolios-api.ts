/**
 * Portfolios API
 * API client for portfolio, holdings, and strategy management
 */

import api from "./api";
import type {
	Portfolio,
	Holding,
	UserStrategy,
	StrategyTemplate,
	ProfitTakingTemplate,
	TokenStrategyConfiguration,
	SimulationResult,
	CreatePortfolioDto,
	UpdatePortfolioDto,
	CreateHoldingDto,
	UpdateHoldingDto,
	CreateUserStrategyDto,
	UpdateUserStrategyDto,
	TokenStrategyConfigDto,
	CreateForecastDto,
	ForecastResponse,
} from "@/types/portfolio";
import type {
	CreateTheoreticalStrategyDto,
	UpdateTheoreticalStrategyDto,
	TheoreticalStrategyResponse,
} from "@/types/strategies";

// ===== PORTFOLIOS =====

export const getPortfolios = async (): Promise<Portfolio[]> => {
	const response = await api.get<Portfolio[]>("/portfolios");
	return response.data;
};

export const getPortfolioById = async (id: string): Promise<Portfolio> => {
	const response = await api.get<Portfolio>(`/portfolios/${id}`);
	return response.data;
};

export const createPortfolio = async (data: CreatePortfolioDto): Promise<Portfolio> => {
	const response = await api.post<Portfolio>("/portfolios", data);
	return response.data;
};

export const updatePortfolio = async (id: string, data: UpdatePortfolioDto): Promise<Portfolio> => {
	const response = await api.put<Portfolio>(`/portfolios/${id}`, data);
	return response.data;
};

export const deletePortfolio = async (id: string): Promise<void> => {
	await api.delete(`/portfolios/${id}`);
};

// ===== HOLDINGS =====

export const getPortfolioHoldings = async (portfolioId: string): Promise<Holding[]> => {
	const response = await api.get<Holding[]>(`/portfolios/${portfolioId}/holdings`);
	return response.data;
};

export const addHolding = async (portfolioId: string, data: CreateHoldingDto): Promise<Holding> => {
	const response = await api.post<Holding>(`/portfolios/${portfolioId}/holdings`, data);
	return response.data;
};

export const updateHolding = async (portfolioId: string, holdingId: string, data: UpdateHoldingDto): Promise<Holding> => {
	const response = await api.put<Holding>(`/portfolios/${portfolioId}/holdings/${holdingId}`, data);
	return response.data;
};

export const deleteHolding = async (portfolioId: string, holdingId: string): Promise<void> => {
	await api.delete(`/portfolios/${portfolioId}/holdings/${holdingId}`);
};

// ===== USER STRATEGIES =====

export const getUserStrategies = async (): Promise<UserStrategy[]> => {
	const response = await api.get<UserStrategy[]>("/portfolios/strategies");
	return response.data;
};

export const getUserStrategyById = async (id: string): Promise<UserStrategy> => {
	const response = await api.get<UserStrategy>(`/portfolios/strategies/${id}`);
	return response.data;
};

export const createUserStrategy = async (data: CreateUserStrategyDto): Promise<UserStrategy> => {
	const response = await api.post<UserStrategy>("/portfolios/strategies", data);
	return response.data;
};

export const updateUserStrategy = async (id: string, data: UpdateUserStrategyDto): Promise<UserStrategy> => {
	const response = await api.put<UserStrategy>(`/portfolios/strategies/${id}`, data);
	return response.data;
};

export const deleteUserStrategy = async (id: string): Promise<void> => {
	await api.delete(`/portfolios/strategies/${id}`);
};

// ===== TOKEN STRATEGY CONFIGURATIONS =====

export const configureTokenStrategy = async (
	strategyId: string,
	data: TokenStrategyConfigDto
): Promise<TokenStrategyConfiguration> => {
	const response = await api.post<TokenStrategyConfiguration>(`/portfolios/strategies/${strategyId}/token-configs`, data);
	return response.data;
};

export const getTokenStrategyConfigs = async (strategyId: string): Promise<TokenStrategyConfiguration[]> => {
	const response = await api.get<TokenStrategyConfiguration[]>(`/portfolios/strategies/${strategyId}/token-configs`);
	return response.data;
};

// ===== TEMPLATES =====

export const getStrategyTemplates = async (): Promise<StrategyTemplate[]> => {
	const response = await api.get<StrategyTemplate[]>("/portfolios/templates/strategies");
	return response.data;
};

export const getProfitTakingTemplates = async (): Promise<ProfitTakingTemplate[]> => {
	const response = await api.get<ProfitTakingTemplate[]>("/portfolios/templates/profit-taking");
	return response.data;
};

// ===== SIMULATION =====

export const simulateStrategy = async (strategyId: string): Promise<SimulationResult[]> => {
	const response = await api.post<SimulationResult[]>(`/portfolios/strategies/${strategyId}/simulate`);
	return response.data;
};

// ===== THEORETICAL STRATEGIES =====

export const createTheoreticalStrategy = async (
	data: CreateTheoreticalStrategyDto
): Promise<TheoreticalStrategyResponse> => {
	const response = await api.post<TheoreticalStrategyResponse>("/portfolios/theoretical-strategies", data);
	return response.data;
};

export const getTheoreticalStrategies = async (): Promise<TheoreticalStrategyResponse[]> => {
	const response = await api.get<TheoreticalStrategyResponse[]>("/portfolios/theoretical-strategies");
	return response.data;
};

export const getTheoreticalStrategyById = async (id: string): Promise<TheoreticalStrategyResponse> => {
	const response = await api.get<TheoreticalStrategyResponse>(`/portfolios/theoretical-strategies/${id}`);
	return response.data;
};

export const updateTheoreticalStrategy = async (
	id: string,
	data: UpdateTheoreticalStrategyDto
): Promise<TheoreticalStrategyResponse> => {
	const response = await api.put<TheoreticalStrategyResponse>(`/portfolios/theoretical-strategies/${id}`, data);
	return response.data;
};

export const deleteTheoreticalStrategy = async (id: string): Promise<void> => {
	await api.delete(`/portfolios/theoretical-strategies/${id}`);
};

// ===== SYNCHRONIZATION =====

export const syncPortfolios = async (): Promise<{ message: string; portfoliosCreated: number; holdingsUpdated: number }> => {
	const response = await api.post<{ message: string; portfoliosCreated: number; holdingsUpdated: number }>("/portfolios/sync");
	return response.data;
};

// ===== FORECASTS =====

export const createForecast = async (data: CreateForecastDto): Promise<ForecastResponse> => {
	const response = await api.post<ForecastResponse>("/portfolios/forecasts", data);
	return response.data;
};

export const getForecasts = async (): Promise<ForecastResponse[]> => {
	const response = await api.get<ForecastResponse[]>("/portfolios/forecasts");
	return response.data;
};

export const getForecastById = async (id: string): Promise<ForecastResponse> => {
	const response = await api.get<ForecastResponse>(`/portfolios/forecasts/${id}`);
	return response.data;
};

export const updateForecast = async (id: string, data: Partial<CreateForecastDto>): Promise<ForecastResponse> => {
	const response = await api.put<ForecastResponse>(`/portfolios/forecasts/${id}`, data);
	return response.data;
};

export const deleteForecast = async (id: string): Promise<void> => {
	await api.delete(`/portfolios/forecasts/${id}`);
};

