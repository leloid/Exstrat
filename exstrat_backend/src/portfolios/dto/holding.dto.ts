import { IsString, IsNumber, IsOptional, IsDecimal } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateHoldingDto {
  @IsString()
  tokenId: string;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  quantity: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  investedAmount: number;

  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  averagePrice: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  currentPrice?: number;
}

export class UpdateHoldingDto {
  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  investedAmount?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  averagePrice?: number;

  @IsOptional()
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  currentPrice?: number;
}

export class HoldingResponseDto {
  id: string;
  quantity: number;
  investedAmount: number;
  averagePrice: number;
  currentPrice?: number;
  lastUpdated: Date;
  token: {
    id: string;
    symbol: string;
    name: string;
    logoUrl?: string;
  };
  currentValue?: number;
  profitLoss?: number;
  profitLossPercentage?: number;
}
