import api from './api';

export interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

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

export const portfoliosApi = {
  getPortfolios: async (): Promise<Portfolio[]> => {
    const response = await api.get('/portfolios');
    return response.data;
  },

  getPortfolioById: async (id: string): Promise<Portfolio> => {
    const response = await api.get(`/portfolios/${id}`);
    return response.data;
  },

  createPortfolio: async (data: CreatePortfolioDto): Promise<Portfolio> => {
    const response = await api.post('/portfolios', data);
    return response.data;
  },

  updatePortfolio: async (id: string, data: UpdatePortfolioDto): Promise<Portfolio> => {
    const response = await api.put(`/portfolios/${id}`, data);
    return response.data;
  },

  deletePortfolio: async (id: string): Promise<void> => {
    await api.delete(`/portfolios/${id}`);
  },
};

