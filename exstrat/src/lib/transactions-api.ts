import { api } from './api';
import { 
  TokenSearchResult, 
  CreateTransactionDto, 
  TransactionResponse, 
  TransactionSearchResponse,
  PortfolioSummary 
} from '@/types/transactions';

export const transactionsApi = {
  // Recherche de tokens
  searchTokens: async (symbol: string): Promise<TokenSearchResult[]> => {
    const response = await api.get<TokenSearchResult[]>(`/tokens/search?symbol=${symbol}`);
    return response.data;
  },

  // Créer une transaction
  createTransaction: async (data: CreateTransactionDto): Promise<TransactionResponse> => {
    const response = await api.post<TransactionResponse>('/transactions', data);
    return response.data;
  },

  // Récupérer toutes les transactions
  getTransactions: async (params?: {
    symbol?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<TransactionSearchResponse> => {
    const queryParams = new URLSearchParams();
    if (params?.symbol) queryParams.append('symbol', params.symbol);
    if (params?.type) queryParams.append('type', params.type);
    if (params?.startDate) queryParams.append('startDate', params.startDate);
    if (params?.endDate) queryParams.append('endDate', params.endDate);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const response = await api.get<TransactionSearchResponse>(`/transactions?${queryParams.toString()}`);
    return response.data;
  },

  // Récupérer une transaction par ID
  getTransaction: async (id: string): Promise<TransactionResponse> => {
    const response = await api.get<TransactionResponse>(`/transactions/${id}`);
    return response.data;
  },

  // Mettre à jour une transaction
  updateTransaction: async (id: string, data: Partial<CreateTransactionDto>): Promise<TransactionResponse> => {
    const response = await api.patch<TransactionResponse>(`/transactions/${id}`, data);
    return response.data;
  },

  // Supprimer une transaction
  deleteTransaction: async (id: string): Promise<void> => {
    await api.delete(`/transactions/${id}`);
  },

  // Récupérer le portfolio
  getPortfolio: async (): Promise<PortfolioSummary> => {
    const response = await api.get<PortfolioSummary>('/transactions/portfolio');
    return response.data;
  },
};
