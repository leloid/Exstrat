export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
  holdingsCount?: number;
}

export interface Token {
  id: string;
  symbol: string;
  name: string;
  cmcId?: number;
  logoUrl?: string;
}

export interface Holding {
  id: string;
  quantity: number;
  investedAmount: number;
  averagePrice: number;
  currentPrice?: number;
  lastUpdated: Date;
  token: Token;
  currentValue?: number;
  profitLoss?: number;
  profitLossPercentage?: number;
}

export interface StrategyTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'no_tp' | 'percentage' | 'dca' | 'custom';
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfitTakingTemplate {
  id: string;
  name: string;
  description?: string;
  rules: Record<string, unknown>;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserStrategy {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  portfolio: {
    id: string;
    name: string;
  };
  tokenConfigsCount?: number;
}

export interface TokenStrategyConfiguration {
  id: string;
  holdingId: string;
  strategyTemplateId?: string;
  profitTakingTemplateId?: string;
  customProfitTakingRules?: Record<string, unknown>;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  holding: {
    id: string;
    quantity: number;
    investedAmount: number;
    averagePrice: number;
    token: {
      id: string;
      symbol: string;
      name: string;
    };
  };
  strategyTemplate?: {
    id: string;
    name: string;
    type: string;
  };
  profitTakingTemplate?: {
    id: string;
    name: string;
    rules: Record<string, unknown>;
  };
}

export interface SimulationResult {
  id: string;
  projectedValue: number;
  return: number;
  remainingTokens: number;
  simulationDate: Date;
  tokenStrategyConfig: {
    id: string;
    holding: {
      token: {
        symbol: string;
        name: string;
      };
    };
  };
}

// DTOs pour les requêtes
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

export interface CreateHoldingDto {
  tokenId: string;
  quantity: number;
  investedAmount: number;
  averagePrice: number;
  currentPrice?: number;
}

export interface UpdateHoldingDto {
  quantity?: number;
  investedAmount?: number;
  averagePrice?: number;
  currentPrice?: number;
}

export interface CreateUserStrategyDto {
  portfolioId: string;
  name: string;
  description?: string;
  status?: 'draft' | 'active' | 'paused' | 'completed';
}

export interface UpdateUserStrategyDto {
  name?: string;
  description?: string;
  status?: 'draft' | 'active' | 'paused' | 'completed';
}

export interface TokenStrategyConfigDto {
  holdingId: string;
  strategyTemplateId?: string;
  profitTakingTemplateId?: string;
  customProfitTakingRules?: Record<string, unknown>;
}

// Types pour le contexte
export interface PortfolioContextType {
  portfolios: Portfolio[];
  currentPortfolio: Portfolio | null;
  holdings: Holding[];
  isLoading: boolean;
  error: string | null;
  createPortfolio: (data: CreatePortfolioDto) => Promise<void>;
  updatePortfolio: (id: string, data: UpdatePortfolioDto) => Promise<void>;
  deletePortfolio: (id: string) => Promise<void>;
  setCurrentPortfolio: (portfolio: Portfolio | null) => void;
  selectPortfolio: (portfolioId: string | null) => void;
  refreshPortfolios: () => Promise<void>;
  refreshHoldings: (portfolioId: string) => Promise<void>;
  syncPortfolios: () => Promise<void>;
}
