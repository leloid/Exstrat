import { IsString, IsOptional, IsEnum } from 'class-validator';

export enum StrategyStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export class CreateUserStrategyDto {
  @IsString()
  portfolioId: string;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(StrategyStatus)
  status?: StrategyStatus;
}

export class UpdateUserStrategyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(StrategyStatus)
  status?: StrategyStatus;
}

export class UserStrategyResponseDto {
  id: string;
  name: string;
  description?: string;
  status: StrategyStatus;
  createdAt: Date;
  updatedAt: Date;
  portfolio: {
    id: string;
    name: string;
  };
  tokenConfigsCount?: number;
}

export class TokenStrategyConfigDto {
  @IsString()
  holdingId: string;

  @IsOptional()
  @IsString()
  strategyTemplateId?: string;

  @IsOptional()
  @IsString()
  profitTakingTemplateId?: string;

  @IsOptional()
  customProfitTakingRules?: any;
}

export class TokenStrategyConfigResponseDto {
  id: string;
  holdingId: string;
  strategyTemplateId?: string;
  profitTakingTemplateId?: string;
  customProfitTakingRules?: any;
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
    rules: any;
  };
}
