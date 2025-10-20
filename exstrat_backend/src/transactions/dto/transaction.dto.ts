import { IsString, IsNumber, IsOptional, IsDateString, IsEnum, Min, IsNotEmpty } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum TransactionType {
  BUY = 'BUY',
  SELL = 'SELL',
  TRANSFER_IN = 'TRANSFER_IN',
  TRANSFER_OUT = 'TRANSFER_OUT',
  STAKING = 'STAKING',
  REWARD = 'REWARD',
}

export class CreateTransactionDto {
  @ApiProperty({ 
    description: 'Symbole du token (ex: BTC, ETH)',
    example: 'BTC'
  })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({ 
    description: 'Nom du token',
    example: 'Bitcoin'
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    description: 'ID CoinMarketCap du token',
    example: 1
  })
  @IsNumber()
  @Min(1)
  cmcId: number;

  @ApiProperty({ 
    description: 'Quantité de tokens',
    example: 0.5
  })
  @IsNumber()
  @Min(0)
  quantity: number;

  @ApiProperty({ 
    description: 'Montant investi en USD',
    example: 25000
  })
  @IsNumber()
  @Min(0)
  amountInvested: number;

  @ApiProperty({ 
    description: 'Prix moyen d\'achat en USD',
    example: 50000
  })
  @IsNumber()
  @Min(0)
  averagePrice: number;

  @ApiProperty({ 
    enum: TransactionType,
    description: 'Type de transaction',
    example: TransactionType.BUY
  })
  @IsEnum(TransactionType)
  type: TransactionType;

  @ApiPropertyOptional({ 
    description: 'Date de la transaction',
    example: '2024-01-15T10:30:00Z'
  })
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @ApiPropertyOptional({ 
    description: 'Notes additionnelles',
    example: 'Achat lors du dip'
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ 
    description: 'ID de l\'exchange (si applicable)',
    example: 'binance'
  })
  @IsOptional()
  @IsString()
  exchangeId?: string;

  @ApiPropertyOptional({ 
    description: 'ID du portefeuille cible',
    example: 'cmgxik0zz000027gx4ab4now4'
  })
  @IsOptional()
  @IsString()
  portfolioId?: string;
}

export class UpdateTransactionDto {
  @ApiPropertyOptional({ 
    description: 'Quantité de tokens',
    example: 0.75
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  quantity?: number;

  @ApiPropertyOptional({ 
    description: 'Montant investi en USD',
    example: 30000
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  amountInvested?: number;

  @ApiPropertyOptional({ 
    description: 'Prix moyen d\'achat en USD',
    example: 40000
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  averagePrice?: number;

  @ApiPropertyOptional({ 
    enum: TransactionType,
    description: 'Type de transaction',
    example: TransactionType.SELL
  })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ 
    description: 'Date de la transaction',
    example: '2024-01-20T14:30:00Z'
  })
  @IsOptional()
  @IsDateString()
  transactionDate?: string;

  @ApiPropertyOptional({ 
    description: 'Notes additionnelles',
    example: 'Vente partielle pour prendre des profits'
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ 
    description: 'ID de l\'exchange (si applicable)',
    example: 'coinbase'
  })
  @IsOptional()
  @IsString()
  exchangeId?: string;
}

export class TransactionResponseDto {
  @ApiProperty({ description: 'ID de la transaction' })
  id: string;

  @ApiProperty({ description: 'ID de l\'utilisateur' })
  userId: string;

  @ApiProperty({ description: 'Symbole du token' })
  symbol: string;

  @ApiProperty({ description: 'Nom du token' })
  name: string;

  @ApiProperty({ description: 'ID CoinMarketCap du token' })
  cmcId: number;

  @ApiProperty({ description: 'Quantité de tokens' })
  quantity: number;

  @ApiProperty({ description: 'Montant investi en USD' })
  amountInvested: number;

  @ApiProperty({ description: 'Prix moyen d\'achat en USD' })
  averagePrice: number;

  @ApiProperty({ enum: TransactionType, description: 'Type de transaction' })
  type: TransactionType;

  @ApiProperty({ description: 'Date de la transaction' })
  transactionDate: Date;

  @ApiPropertyOptional({ description: 'Notes additionnelles' })
  notes?: string;

  @ApiPropertyOptional({ description: 'ID de l\'exchange' })
  exchangeId?: string;

  @ApiProperty({ description: 'Date de création' })
  createdAt: Date;

  @ApiProperty({ description: 'Date de mise à jour' })
  updatedAt: Date;

  @ApiPropertyOptional({ 
    description: 'ID du portefeuille associé',
    example: 'cmgxik0zz000027gx4ab4now4'
  })
  portfolioId?: string;

  @ApiPropertyOptional({ 
    description: 'Détails du portefeuille associé',
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      isDefault: { type: 'boolean' }
    }
  })
  portfolio?: {
    id: string;
    name: string;
    isDefault: boolean;
  };
}

export class TransactionSearchDto {
  @ApiPropertyOptional({ 
    description: 'Symbole du token à filtrer',
    example: 'BTC'
  })
  @IsOptional()
  @IsString()
  symbol?: string;

  @ApiPropertyOptional({ 
    enum: TransactionType,
    description: 'Type de transaction à filtrer',
    example: TransactionType.BUY
  })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ 
    description: 'Date de début (ISO string)',
    example: '2024-01-01T00:00:00Z'
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ 
    description: 'Date de fin (ISO string)',
    example: '2024-12-31T23:59:59Z'
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ 
    description: 'Page (pour la pagination)',
    example: 1,
    default: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Nombre d\'éléments par page',
    example: 20,
    default: 20
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 20;
}
