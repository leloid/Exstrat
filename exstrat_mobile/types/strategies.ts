export type TargetType = 'percentage' | 'price';
export type StrategyStatus = 'draft' | 'active' | 'paused' | 'completed';

export interface ProfitTarget {
  id: string;
  order: number;
  targetType: TargetType;
  targetValue: number;
  sellPercentage: number;
}

export interface Strategy {
  id: string;
  name: string;
  portfolioId: string;
  tokenSymbol: string;
  tokenName: string;
  quantity: number;
  averagePrice: number;
  profitTargets: ProfitTarget[];
  status: StrategyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStrategyDto {
  name: string;
  portfolioId: string;
  tokenSymbol: string;
  tokenName: string;
  quantity: number;
  averagePrice: number;
  profitTargets: Omit<ProfitTarget, 'id'>[];
  status?: StrategyStatus;
}

export interface UpdateStrategyDto {
  name?: string;
  quantity?: number;
  averagePrice?: number;
  profitTargets?: Omit<ProfitTarget, 'id'>[];
  status?: StrategyStatus;
}

export interface TheoreticalStrategyResponse {
  id: string;
  name: string;
  tokenSymbol: string;
  tokenName: string;
  quantity: number;
  averagePrice: number;
  profitTargets: ProfitTarget[];
  status: StrategyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTheoreticalStrategyDto {
  name: string;
  tokenSymbol: string;
  tokenName: string;
  quantity: number;
  averagePrice: number;
  profitTargets: Omit<ProfitTarget, 'id'>[];
  status?: StrategyStatus;
}

export interface UpdateTheoreticalStrategyDto {
  name?: string;
  quantity?: number;
  averagePrice?: number;
  profitTargets?: Omit<ProfitTarget, 'id'>[];
  status?: StrategyStatus;
}

