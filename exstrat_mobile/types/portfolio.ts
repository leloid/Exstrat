export interface Portfolio {
  id: string;
  name: string;
  description: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Holding {
  tokenSymbol: string;
  tokenName: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number | null;
  totalInvested: number;
  currentValue: number | null;
  profitLoss: number | null;
  profitLossPercentage: number | null;
}

export interface PortfolioHoldings {
  portfolioId: string;
  portfolioName: string;
  holdings: Holding[];
  totalValue: number | null;
  totalInvested: number;
  totalProfitLoss: number | null;
  totalProfitLossPercentage: number | null;
}

