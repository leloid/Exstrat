import api from './api';

export interface Transaction {
  id: string;
  portfolioId: string;
  cmcId: string;
  symbol: string;
  name: string;
  quantity: number;
  amountInvested: number;
  averagePrice: number;
  type: 'BUY' | 'SELL';
  transactionDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTransactionDto {
  portfolioId: string;
  cmcId: string;
  symbol: string;
  name: string;
  quantity: number;
  amountInvested: number;
  averagePrice: number;
  type?: 'BUY' | 'SELL';
  transactionDate: string;
  notes?: string;
}

export interface UpdateTransactionDto {
  quantity?: number;
  amountInvested?: number;
  averagePrice?: number;
  type?: 'BUY' | 'SELL';
  transactionDate?: string;
  notes?: string;
}

export interface TokenSearchResult {
  id: string;
  name: string;
  symbol: string;
  slug: string;
  cmc_rank: number;
  quote: {
    USD: {
      price: number | null;
      volume_24h: number | null;
      percent_change_24h: number | null;
      market_cap: number | null;
    };
  };
}

export const transactionsApi = {
  getTransactions: async (portfolioId?: string): Promise<Transaction[]> => {
    const url = portfolioId ? `/transactions?portfolioId=${portfolioId}` : '/transactions';
    const response = await api.get(url);
    return response.data;
  },

  getTransactionById: async (id: string): Promise<Transaction> => {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  },

  createTransaction: async (data: CreateTransactionDto): Promise<Transaction> => {
    const response = await api.post('/transactions', data);
    return response.data;
  },

  updateTransaction: async (id: string, data: UpdateTransactionDto): Promise<Transaction> => {
    const response = await api.put(`/transactions/${id}`, data);
    return response.data;
  },

  deleteTransaction: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },

  searchTokens: async (query: string): Promise<TokenSearchResult[]> => {
    const response = await api.get(`/tokens/search?query=${encodeURIComponent(query)}`);
    return response.data;
  },
};

