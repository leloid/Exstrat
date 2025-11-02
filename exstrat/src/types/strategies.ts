export enum TargetType {
  EXACT_PRICE = 'exact_price',
  PERCENTAGE_OF_AVERAGE = 'percentage_of_average',
}

export enum StrategyStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export enum StepState {
  PENDING = 'pending',
  TRIGGERED = 'triggered',
  DONE = 'done',
}

export interface CreateStrategyStepDto {
  targetType: TargetType;
  targetValue: number;
  sellPercentage: number;
  notes?: string;
}

export interface CreateStrategyDto {
  name: string;
  symbol: string;
  tokenName: string;
  cmcId: number;
  baseQuantity: number;
  referencePrice: number;
  steps: CreateStrategyStepDto[];
  notes?: string;
}

export interface UpdateStrategyDto {
  name?: string;
  status?: StrategyStatus;
  notes?: string;
}

export interface UpdateStrategyStepDto {
  targetType?: TargetType;
  targetValue?: number;
  sellPercentage?: number;
  state?: StepState;
  notes?: string;
}

export interface StrategyStepResponse {
  id: string;
  strategyId: string;
  targetType: TargetType;
  targetValue: number;
  targetPrice: number;
  sellPercentage: number;
  sellQuantity: number;
  state: StepState;
  triggeredAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StrategyResponse {
  id: string;
  userId: string;
  name: string;
  symbol: string;
  tokenName: string;
  cmcId: number;
  baseQuantity: number;
  referencePrice: number;
  status: StrategyStatus;
  notes?: string;
  steps: StrategyStepResponse[];
  createdAt: Date;
  updatedAt: Date;
}

export interface StrategySummary {
  totalSteps: number;
  activeSteps: number;
  completedSteps: number;
  totalTokensToSell: number;
  remainingTokens: number;
  estimatedTotalProfit: number;
}

export interface StrategySearchDto {
  symbol?: string;
  status?: StrategyStatus;
  page?: number;
  limit?: number;
}

export interface StrategySearchResponse {
  strategies: StrategyResponse[];
  total: number;
  page: number;
  limit: number;
}

// Types pour l'interface utilisateur
export interface StrategyFormData {
  name: string;
  symbol: string;
  tokenName: string;
  cmcId: number;
  baseQuantity: number;
  referencePrice: number;
  steps: StrategyStepFormData[];
  notes?: string;
}

export interface StrategyStepFormData {
  targetType: TargetType;
  targetValue: number;
  sellPercentage: number;
  notes?: string;
}

// Types pour l'affichage
export interface StrategyDisplayData extends StrategyResponse {
  currentPrice?: number;
  totalValue?: number;
  totalProfit?: number;
  profitPercentage?: number;
}

export interface StrategyStepDisplayData extends StrategyStepResponse {
  isTriggered?: boolean;
  daysUntilTarget?: number;
  profitIfTriggered?: number;
}

// ===== STRATÉGIES THÉORIQUES =====

export interface ProfitTarget {
  order: number;
  targetType: 'percentage' | 'price';
  targetValue: number;
  sellPercentage: number;
}

export interface CreateTheoreticalStrategyDto {
  name: string;
  description?: string;
  tokenSymbol: string;
  tokenName: string;
  quantity: number;
  averagePrice: number;
  profitTargets: ProfitTarget[];
  status?: 'draft' | 'active' | 'paused' | 'completed';
}

export interface UpdateTheoreticalStrategyDto {
  name?: string;
  description?: string;
  quantity?: number;
  averagePrice?: number;
  profitTargets?: ProfitTarget[];
  status?: 'draft' | 'active' | 'paused' | 'completed';
}

export interface TheoreticalStrategyResponse {
  id: string;
  userId: string;
  name: string;
  description?: string;
  tokenSymbol: string;
  tokenName: string;
  quantity: number;
  averagePrice: number;
  profitTargets: ProfitTarget[];
  status: 'draft' | 'active' | 'paused' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  // Champs calculés
  totalInvested?: number;
  expectedProfit?: number;
  returnPercentage?: number;
  numberOfTargets?: number;
}
