import { IsString, IsNotEmpty, IsObject, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateForecastDto {
  @ApiProperty({ description: 'ID du portfolio' })
  @IsString()
  @IsNotEmpty()
  portfolioId: string;

  @ApiProperty({ description: 'Nom de la prévision' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Stratégies appliquées (mapping holdingId -> strategyId)' })
  @IsObject()
  appliedStrategies: Record<string, string>;

  @ApiProperty({ description: 'Résumé de la prévision' })
  @IsObject()
  summary: {
    totalInvested: number;
    totalCollected: number;
    totalProfit: number;
    returnPercentage: number;
    remainingTokensValue: number;
    tokenCount: number;
  };
}

export class UpdateForecastDto {
  @ApiProperty({ description: 'Nom de la prévision', required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ description: 'Stratégies appliquées', required: false })
  @IsObject()
  @IsOptional()
  appliedStrategies?: Record<string, string>;

  @ApiProperty({ description: 'Résumé de la prévision', required: false })
  @IsObject()
  @IsOptional()
  summary?: {
    totalInvested: number;
    totalCollected: number;
    totalProfit: number;
    returnPercentage: number;
    remainingTokensValue: number;
    tokenCount: number;
  };
}

export class ForecastResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  portfolioId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  appliedStrategies: Record<string, string>;

  @ApiProperty()
  summary: {
    totalInvested: number;
    totalCollected: number;
    totalProfit: number;
    returnPercentage: number;
    remainingTokensValue: number;
    tokenCount: number;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

