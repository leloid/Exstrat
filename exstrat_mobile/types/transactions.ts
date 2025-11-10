export type TransactionType = 'BUY' | 'SELL';

export interface Transaction {
  id: string;
  portfolioId: string;
  cmcId: string;
  symbol: string;
  name: string;
  quantity: number;
  amountInvested: number;
  averagePrice: number;
  type: TransactionType;
  transactionDate: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionResponse extends Transaction {}

export interface CreateTransactionDto {
  portfolioId: string;
  cmcId: string;
  symbol: string;
  name: string;
  quantity: number;
  amountInvested: number;
  averagePrice: number;
  type?: TransactionType;
  transactionDate: string;
  notes?: string;
}

export interface UpdateTransactionDto {
  quantity?: number;
  amountInvested?: number;
  averagePrice?: number;
  type?: TransactionType;
  transactionDate?: string;
  notes?: string;
}

export interface TokenSearchResult {
  id: string;
  name: string;
  symbol: string;
  slug: string;
  num_market_pairs: number;
  date_added: string;
  tags: string[];
  max_supply: number | null;
  circulating_supply: number | null;
  total_supply: number | null;
  is_active: number;
  infinite_supply: boolean;
  platform: unknown | null;
  cmc_rank: number;
  is_fiat: number;
  self_reported_circulating_supply: number | null;
  self_reported_market_cap: number | null;
  tvl_ratio: number | null;
  tvl: number | null;
  last_updated: string;
  quote: {
    USD: {
      price: number | null;
      volume_24h: number | null;
      volume_change_24h: number | null;
      percent_change_1h: number | null;
      percent_change_24h: number | null;
      percent_change_7d: number | null;
      percent_change_30d: number | null;
      percent_change_60d: number | null;
      percent_change_90d: number | null;
      market_cap: number | null;
      market_cap_dominance: number | null;
      fully_diluted_market_cap: number | null;
      tvl: number | null;
      last_updated: string;
    };
  };
}

