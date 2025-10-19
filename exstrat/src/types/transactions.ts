export interface TokenSearchResult {
  id: number;
  name: string;
  symbol: string;
  slug: string;
  num_market_pairs: number;
  date_added: string;
  tags: string[];
  max_supply: number;
  circulating_supply: number;
  total_supply: number;
  is_active: number;
  infinite_supply: boolean;
  platform: any;
  cmc_rank: number;
  is_fiat: number;
  self_reported_circulating_supply: any;
  self_reported_market_cap: any;
  tvl_ratio: any;
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
      tvl: any;
      last_updated: string;
    };
  };
}

export interface CreateTransactionDto {
  symbol: string;
  name: string;
  cmcId: number;
  quantity: number;
  amountInvested: number;
  averagePrice: number;
  type: 'BUY' | 'SELL' | 'TRANSFER_IN' | 'TRANSFER_OUT' | 'STAKING' | 'REWARD';
  transactionDate: string;
  notes?: string;
  exchangeId?: string;
  portfolioId?: string;
}

export interface TransactionResponse {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  cmcId: number;
  quantity: number;
  amountInvested: number;
  averagePrice: number;
  type: string;
  transactionDate: string;
  notes?: string;
  exchangeId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionSearchResponse {
  transactions: TransactionResponse[];
  total: number;
  page: number;
  limit: number;
}

export interface PortfolioItem {
  symbol: string;
  name: string;
  cmcId: number;
  totalQuantity: number;
  totalInvested: number;
  averagePrice: number;
  transactions: {
    id: string;
    type: string;
    quantity: number;
    amountInvested: number;
    averagePrice: number;
    transactionDate: string;
    notes?: string;
  }[];
}

export interface PortfolioSummary {
  totalPositions: number;
  totalInvested: number;
  positions: PortfolioItem[];
}
