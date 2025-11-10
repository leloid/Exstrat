import api from './api';

export interface Strategy {
  id: string;
  name: string;
  portfolioId: string;
  tokenSymbol: string;
  tokenName: string;
  quantity: number;
  averagePrice: number;
  profitTargets: ProfitTarget[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface ProfitTarget {
  id: string;
  order: number;
  targetType: 'percentage' | 'price';
  targetValue: number;
  sellPercentage: number;
}

export interface CreateStrategyDto {
  name: string;
  portfolioId: string;
  tokenSymbol: string;
  tokenName: string;
  quantity: number;
  averagePrice: number;
  profitTargets: Omit<ProfitTarget, 'id'>[];
}

export interface UpdateStrategyDto {
  name?: string;
  quantity?: number;
  averagePrice?: number;
  profitTargets?: Omit<ProfitTarget, 'id'>[];
  status?: 'draft' | 'active' | 'paused' | 'completed';
}

export const strategiesApi = {
  getStrategies: async (portfolioId?: string): Promise<Strategy[]> => {
    const url = portfolioId ? `/strategies?portfolioId=${portfolioId}` : '/strategies';
    const response = await api.get(url);
    return response.data;
  },

  getStrategyById: async (id: string): Promise<Strategy> => {
    const response = await api.get(`/strategies/${id}`);
    return response.data;
  },

  createStrategy: async (data: CreateStrategyDto): Promise<Strategy> => {
    const response = await api.post('/strategies', data);
    return response.data;
  },

  updateStrategy: async (id: string, data: UpdateStrategyDto): Promise<Strategy> => {
    const response = await api.put(`/strategies/${id}`, data);
    return response.data;
  },

  deleteStrategy: async (id: string): Promise<void> => {
    await api.delete(`/strategies/${id}`);
  },
};

