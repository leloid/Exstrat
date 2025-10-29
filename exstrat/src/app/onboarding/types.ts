import { TokenSearchResult } from '@/types/transactions';

export interface ProfitTarget {
  id: string;
  targetType: 'percentage' | 'price';
  targetValue: number;
  sellPercentage: number;
}

export interface CreatedData {
  portfolio: any;
  transaction: any;
  strategy: any;
}

export interface PortfolioFormData {
  name: string;
  description: string;
  isDefault: boolean;
}

export interface TransactionFormData {
  quantity: string;
  amountInvested: string;
  averagePrice: string;
  type: 'BUY';
  transactionDate: string;
  notes: string;
  portfolioId: string;
}

export interface StrategyFormData {
  name: string;
  token: TokenSearchResult | null;
  quantity: string;
  averagePrice: string;
  numberOfTargets: number;
  profitTargets: ProfitTarget[];
}

