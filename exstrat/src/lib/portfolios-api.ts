import api from './api';
import {
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
} from '@/types/portfolio';

// ===== PORTFOLIOS =====

export const getPortfolios = async (): Promise<Portfolio[]> => {
  console.log('🌐 Appel API: GET /portfolios');
  const response = await api.get('/portfolios');
  console.log('📡 Réponse API portfolios:', response.data);
  return response.data;
};

export const getPortfolioById = async (id: string): Promise<Portfolio> => {
  const response = await api.get(`/portfolios/${id}`);
  return response.data;
};

export const createPortfolio = async (data: CreatePortfolioDto): Promise<Portfolio> => {
  const response = await api.post('/portfolios', data);
  return response.data;
};

export const updatePortfolio = async (id: string, data: UpdatePortfolioDto): Promise<Portfolio> => {
  const response = await api.put(`/portfolios/${id}`, data);
  return response.data;
};

export const deletePortfolio = async (id: string): Promise<void> => {
  await api.delete(`/portfolios/${id}`);
};

// ===== HOLDINGS =====

export const getPortfolioHoldings = async (portfolioId: string): Promise<Holding[]> => {
  const response = await api.get(`/portfolios/${portfolioId}/holdings`);
  return response.data;
};

export const addHolding = async (portfolioId: string, data: CreateHoldingDto): Promise<Holding> => {
  const response = await api.post(`/portfolios/${portfolioId}/holdings`, data);
  return response.data;
};

export const updateHolding = async (
  portfolioId: string,
  holdingId: string,
  data: UpdateHoldingDto
): Promise<Holding> => {
  const response = await api.put(`/portfolios/${portfolioId}/holdings/${holdingId}`, data);
  return response.data;
};

export const deleteHolding = async (portfolioId: string, holdingId: string): Promise<void> => {
  await api.delete(`/portfolios/${portfolioId}/holdings/${holdingId}`);
};

// ===== USER STRATEGIES =====

export const getUserStrategies = async (): Promise<UserStrategy[]> => {
  const response = await api.get('/portfolios/strategies');
  return response.data;
};

export const getUserStrategyById = async (id: string): Promise<UserStrategy> => {
  const response = await api.get(`/portfolios/strategies/${id}`);
  return response.data;
};

export const createUserStrategy = async (data: CreateUserStrategyDto): Promise<UserStrategy> => {
  const response = await api.post('/portfolios/strategies', data);
  return response.data;
};

export const updateUserStrategy = async (id: string, data: UpdateUserStrategyDto): Promise<UserStrategy> => {
  const response = await api.put(`/portfolios/strategies/${id}`, data);
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
  const response = await api.post(`/portfolios/strategies/${strategyId}/token-configs`, data);
  return response.data;
};

export const getTokenStrategyConfigs = async (strategyId: string): Promise<TokenStrategyConfiguration[]> => {
  const response = await api.get(`/portfolios/strategies/${strategyId}/token-configs`);
  return response.data;
};

// ===== TEMPLATES =====

export const getStrategyTemplates = async (): Promise<StrategyTemplate[]> => {
  const response = await api.get('/portfolios/templates/strategies');
  return response.data;
};

export const getProfitTakingTemplates = async (): Promise<ProfitTakingTemplate[]> => {
  const response = await api.get('/portfolios/templates/profit-taking');
  return response.data;
};

// ===== SIMULATION =====

export const simulateStrategy = async (strategyId: string): Promise<SimulationResult[]> => {
  const response = await api.post(`/portfolios/strategies/${strategyId}/simulate`);
  return response.data;
};

// ===== SYNCHRONISATION =====

export const syncPortfolios = async (): Promise<{ message: string; portfoliosCreated: number; holdingsUpdated: number }> => {
  const response = await api.post('/portfolios/sync');
  return response.data;
};
