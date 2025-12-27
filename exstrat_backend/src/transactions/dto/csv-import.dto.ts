import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsArray, ValidateNested, ArrayMinSize, ArrayMaxSize, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export enum ExchangeType {
  COINBASE = 'coinbase',
  CRYPTO_COM = 'crypto.com',
}

export class ParseCsvDto {
  @ApiProperty({
    description: 'Type d\'exchange (coinbase ou crypto.com)',
    enum: ExchangeType,
    example: ExchangeType.COINBASE,
  })
  @IsEnum(ExchangeType)
  @IsNotEmpty()
  exchange: ExchangeType;

  @ApiProperty({
    description: 'Contenu du fichier CSV en texte',
    example: 'ID,Timestamp,Transaction Type,Asset,Quantity Transacted...',
  })
  @IsString()
  @IsNotEmpty()
  csvContent: string;

  @ApiProperty({
    description: 'ID du portefeuille cible (optionnel)',
    required: false,
    example: 'cmgxik0zz000027gx4ab4now4',
  })
  @IsOptional()
  @IsString()
  portfolioId?: string;
}

export interface ParsedTransaction {
  symbol: string;
  name?: string;
  cmcId?: number;
  quantity: number;
  amountInvested: number;
  averagePrice: number;
  type: string;
  transactionDate: string;
  notes?: string;
  exchangeId: string;
  rawData?: any; // Données brutes pour le debug
  errors?: string[]; // Erreurs de parsing
}

export class ParseCsvResponseDto {
  @ApiProperty({
    description: 'Transactions parsées avec succès',
    type: 'array',
  })
  validTransactions: ParsedTransaction[];

  @ApiProperty({
    description: 'Transactions avec erreurs',
    type: 'array',
  })
  invalidTransactions: Array<{
    row: number;
    data: any;
    errors: string[];
  }>;

  @ApiProperty({
    description: 'Nombre total de lignes parsées',
    example: 100,
  })
  totalRows: number;

  @ApiProperty({
    description: 'Nombre de transactions valides',
    example: 95,
  })
  validCount: number;

  @ApiProperty({
    description: 'Nombre de transactions invalides',
    example: 5,
  })
  invalidCount: number;
}

class BatchTransactionItem {
  @ApiProperty({ description: 'Symbole du token', example: 'BTC' })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({ description: 'Nom du token', example: 'Bitcoin' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'ID CoinMarketCap', example: 1 })
  @IsNumber()
  cmcId: number;

  @ApiProperty({ description: 'Quantité', example: 0.5 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Montant investi', example: 25000 })
  @IsNumber()
  amountInvested: number;

  @ApiProperty({ description: 'Prix moyen', example: 50000 })
  @IsNumber()
  averagePrice: number;

  @ApiProperty({ description: 'Type de transaction', enum: ['BUY', 'SELL', 'TRANSFER_IN', 'TRANSFER_OUT', 'STAKING', 'REWARD'], example: 'BUY' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({ description: 'Date de la transaction (ISO string)', example: '2024-01-15T10:30:00Z' })
  @IsString()
  @IsNotEmpty()
  transactionDate: string;

  @ApiProperty({ description: 'Notes', required: false })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiProperty({ description: 'ID de l\'exchange', required: false })
  @IsOptional()
  @IsString()
  exchangeId?: string;

  @ApiProperty({ description: 'ID du portefeuille', required: false })
  @IsOptional()
  @IsString()
  portfolioId?: string;
}

export class CreateBatchTransactionsDto {
  @ApiProperty({
    description: 'Liste des transactions à créer',
    type: [BatchTransactionItem],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'Au moins une transaction est requise' })
  @ArrayMaxSize(1000, { message: 'Le nombre maximum de transactions par batch est de 1000' })
  @ValidateNested({ each: true })
  @Type(() => BatchTransactionItem)
  transactions: BatchTransactionItem[];

  @ApiProperty({
    description: 'ID du portefeuille par défaut (sera utilisé si portfolioId n\'est pas spécifié dans chaque transaction)',
    required: false,
    example: 'cmgxik0zz000027gx4ab4now4',
  })
  @IsOptional()
  @IsString()
  defaultPortfolioId?: string;
}

export class CreateBatchTransactionsResponseDto {
  @ApiProperty({
    description: 'Transactions créées avec succès',
    type: 'array',
  })
  created: Array<{
    id: string;
    symbol: string;
    name: string;
  }>;

  @ApiProperty({
    description: 'Transactions qui ont échoué',
    type: 'array',
  })
  failed: Array<{
    index: number;
    transaction: any;
    error: string;
  }>;

  @ApiProperty({
    description: 'Nombre total de transactions à créer',
    example: 100,
  })
  total: number;

  @ApiProperty({
    description: 'Nombre de transactions créées avec succès',
    example: 95,
  })
  successCount: number;

  @ApiProperty({
    description: 'Nombre de transactions échouées',
    example: 5,
  })
  failedCount: number;
}

