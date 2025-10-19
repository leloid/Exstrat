import { IsString, IsNumber, IsOptional, IsArray, ValidateNested, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

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

export enum TargetType {
  EXACT_PRICE = 'exact_price',
  PERCENTAGE_OF_AVERAGE = 'percentage_of_average',
}

export class CreateStrategyStepDto {
  @ApiProperty({ 
    description: 'Type de cible (exact_price ou percentage_of_average)',
    example: 'percentage_of_average',
    enum: TargetType
  })
  @IsEnum(TargetType)
  targetType: TargetType;

  @ApiProperty({ 
    description: 'Prix cible exact ou pourcentage du prix moyen',
    example: 25.0
  })
  @IsNumber()
  @Min(0)
  targetValue: number;

  @ApiProperty({ 
    description: 'Pourcentage de tokens à vendre (0-100)',
    example: 20.0
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  sellPercentage: number;

  @ApiPropertyOptional({ 
    description: 'Notes optionnelles pour cette étape',
    example: 'Première sortie à +25%'
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateStrategyDto {
  @ApiProperty({ 
    description: 'Nom de la stratégie',
    example: 'Stratégie BTC 2025'
  })
  @IsString()
  name: string;

  @ApiProperty({ 
    description: 'Symbole du token (ex: BTC, ETH)',
    example: 'BTC'
  })
  @IsString()
  symbol: string;

  @ApiProperty({ 
    description: 'Nom du token',
    example: 'Bitcoin'
  })
  @IsString()
  tokenName: string;

  @ApiProperty({ 
    description: 'ID CoinMarketCap du token',
    example: 1
  })
  @IsNumber()
  cmcId: number;

  @ApiProperty({ 
    description: 'Quantité de référence pour la stratégie',
    example: 1.0
  })
  @IsNumber()
  @Min(0)
  baseQuantity: number;

  @ApiProperty({ 
    description: 'Prix de référence (prix moyen d\'achat ou prix personnalisé)',
    example: 50000.0
  })
  @IsNumber()
  @Min(0)
  referencePrice: number;

  @ApiProperty({ 
    description: 'Étapes de la stratégie', 
    type: [CreateStrategyStepDto],
    example: [
      {
        targetType: 'percentage_of_average',
        targetValue: 25.0,
        sellPercentage: 20.0,
        notes: 'Première sortie à +25%'
      },
      {
        targetType: 'percentage_of_average',
        targetValue: 50.0,
        sellPercentage: 30.0,
        notes: 'Deuxième sortie à +50%'
      }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStrategyStepDto)
  steps: CreateStrategyStepDto[];

  @ApiPropertyOptional({ 
    description: 'Notes sur la stratégie',
    example: 'Stratégie de prise de profit progressive pour BTC - Bullrun 2025'
  })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateStrategyDto {
  @ApiPropertyOptional({ description: 'Nom de la stratégie' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Symbole du token (ex: BTC, ETH)' })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiPropertyOptional({ description: 'Nom du token' })
  @IsOptional()
  @IsString()
  tokenName?: string;

  @ApiPropertyOptional({ description: 'ID CoinMarketCap du token' })
  @IsOptional()
  @IsNumber()
  cmcId?: number;

  @ApiPropertyOptional({ description: 'Quantité de référence pour la stratégie' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseQuantity?: number;

  @ApiPropertyOptional({ description: 'Prix de référence (prix moyen d\'achat ou prix personnalisé)' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  referencePrice?: number;

  @ApiPropertyOptional({ description: 'Étapes de la stratégie', type: [CreateStrategyStepDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateStrategyStepDto)
  steps?: CreateStrategyStepDto[];

  @ApiPropertyOptional({ description: 'Statut de la stratégie' })
  @IsOptional()
  @IsEnum(StrategyStatus)
  status?: StrategyStatus;

  @ApiPropertyOptional({ description: 'Notes sur la stratégie' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateStrategyStepDto {
  @ApiPropertyOptional({ description: 'Type de cible' })
  @IsOptional()
  @IsEnum(TargetType)
  targetType?: TargetType;

  @ApiPropertyOptional({ description: 'Prix cible exact ou pourcentage' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  targetValue?: number;

  @ApiPropertyOptional({ description: 'Pourcentage de tokens à vendre' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  sellPercentage?: number;

  @ApiPropertyOptional({ description: 'État de l\'étape' })
  @IsOptional()
  @IsEnum(StepState)
  state?: StepState;

  @ApiPropertyOptional({ description: 'Notes optionnelles' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class StrategyStepResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  strategyId: string;

  @ApiProperty()
  targetType: TargetType;

  @ApiProperty()
  targetValue: number;

  @ApiProperty()
  targetPrice: number;

  @ApiProperty()
  sellPercentage: number;

  @ApiProperty()
  sellQuantity: number;

  @ApiProperty()
  state: StepState;

  @ApiPropertyOptional()
  triggeredAt?: Date;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class StrategyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  symbol: string;

  @ApiProperty()
  tokenName: string;

  @ApiProperty()
  cmcId: number;

  @ApiProperty()
  baseQuantity: number;

  @ApiProperty()
  referencePrice: number;

  @ApiProperty()
  status: StrategyStatus;

  @ApiPropertyOptional()
  notes?: string;

  @ApiProperty({ type: [StrategyStepResponseDto] })
  steps: StrategyStepResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class StrategySummaryDto {
  @ApiProperty()
  totalSteps: number;

  @ApiProperty()
  activeSteps: number;

  @ApiProperty()
  completedSteps: number;

  @ApiProperty()
  totalTokensToSell: number;

  @ApiProperty()
  remainingTokens: number;

  @ApiProperty()
  estimatedTotalProfit: number;
}

export class StrategySearchDto {
  @ApiPropertyOptional({ description: 'Filtrer par symbole de token' })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiPropertyOptional({ description: 'Filtrer par statut' })
  @IsOptional()
  @IsEnum(StrategyStatus)
  status?: StrategyStatus;

  @ApiPropertyOptional({ description: 'Page (défaut: 1)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Limite par page (défaut: 20)' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
