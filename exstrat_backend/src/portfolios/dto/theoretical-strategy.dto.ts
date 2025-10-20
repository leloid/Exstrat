import { IsString, IsNumber, IsOptional, IsEnum, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum StrategyStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  PAUSED = 'paused',
  COMPLETED = 'completed',
}

export enum TargetType {
  PERCENTAGE = 'percentage',
  PRICE = 'price',
}

export class ProfitTargetDto {
  @IsNumber()
  order: number;

  @IsEnum(TargetType)
  targetType: TargetType;

  @IsNumber()
  targetValue: number;

  @IsNumber()
  sellPercentage: number;
}

export class CreateTheoreticalStrategyDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  tokenSymbol: string;

  @IsString()
  tokenName: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  averagePrice: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfitTargetDto)
  profitTargets: ProfitTargetDto[];

  @IsOptional()
  @IsEnum(StrategyStatus)
  status?: StrategyStatus;
}

export class UpdateTheoreticalStrategyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsNumber()
  averagePrice?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProfitTargetDto)
  profitTargets?: ProfitTargetDto[];

  @IsOptional()
  @IsEnum(StrategyStatus)
  status?: StrategyStatus;
}

export class TheoreticalStrategyResponseDto {
  id: string;
  userId: string;
  name: string;
  description?: string;
  tokenSymbol: string;
  tokenName: string;
  quantity: number;
  averagePrice: number;
  profitTargets: ProfitTargetDto[];
  status: StrategyStatus;
  createdAt: Date;
  updatedAt: Date;
  
  // Champs calculés
  totalInvested?: number;
  expectedProfit?: number;
  returnPercentage?: number;
}

