import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  Query, 
  UseGuards,
  Res
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, UpdateTransactionDto, TransactionSearchDto, TransactionResponseDto } from './dto/transaction.dto';
import { ParseCsvDto, ParseCsvResponseDto, CreateBatchTransactionsDto, CreateBatchTransactionsResponseDto } from './dto/csv-import.dto';
import { CsvParserService } from './csv-parser.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Transactions')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly csvParserService: CsvParserService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle transaction' })
  @ApiResponse({ 
    status: 201, 
    description: 'Transaction créée avec succès',
    type: TransactionResponseDto
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createTransactionDto: CreateTransactionDto
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.createTransaction(userId, createTransactionDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les transactions de l\'utilisateur' })
  @ApiQuery({ name: 'symbol', required: false, description: 'Filtrer par symbole de token' })
  @ApiQuery({ name: 'type', required: false, description: 'Filtrer par type de transaction' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Date de début (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Date de fin (ISO string)' })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: 'Nombre d\'éléments par page', type: Number })
  @ApiResponse({ 
    status: 200, 
    description: 'Liste des transactions avec pagination',
    schema: {
      type: 'object',
      properties: {
        transactions: {
          type: 'array',
          items: { $ref: '#/components/schemas/TransactionResponseDto' }
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() searchDto: TransactionSearchDto
  ) {
    return this.transactionsService.findAll(userId, searchDto);
  }

  @Get('portfolio')
  @ApiOperation({ summary: 'Récupérer le résumé du portfolio' })
  @ApiResponse({ 
    status: 200, 
    description: 'Résumé du portfolio',
    schema: {
      type: 'object',
      properties: {
        totalPositions: { type: 'number' },
        totalInvested: { type: 'number' },
        positions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              symbol: { type: 'string' },
              name: { type: 'string' },
              cmcId: { type: 'number' },
              totalQuantity: { type: 'number' },
              totalInvested: { type: 'number' },
              averagePrice: { type: 'number' },
              transactions: { type: 'array' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getPortfolioSummary(@CurrentUser('id') userId: string) {
    return this.transactionsService.getPortfolioSummary(userId);
  }

  @Post('sync-portfolios')
  @ApiOperation({ summary: 'Synchroniser tous les portfolios avec les transactions existantes' })
  @ApiResponse({ 
    status: 200, 
    description: 'Portfolios synchronisés avec succès',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        portfoliosCreated: { type: 'number' },
        holdingsUpdated: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async syncPortfolios(@CurrentUser('id') userId: string) {
    return this.transactionsService.syncAllPortfolios(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une transaction par son ID' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transaction trouvée',
    type: TransactionResponseDto
  })
  @ApiResponse({ status: 404, description: 'Transaction non trouvée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id') id: string
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.findOne(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une transaction' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transaction mise à jour avec succès',
    type: TransactionResponseDto
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiResponse({ status: 404, description: 'Transaction non trouvée' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateTransactionDto: UpdateTransactionDto
  ): Promise<TransactionResponseDto> {
    return this.transactionsService.update(userId, id, updateTransactionDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une transaction' })
  @ApiResponse({ status: 200, description: 'Transaction supprimée avec succès' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès non autorisé' })
  @ApiResponse({ status: 404, description: 'Transaction non trouvée' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string
  ): Promise<{ message: string }> {
    await this.transactionsService.remove(userId, id);
    return { message: 'Transaction supprimée avec succès' };
  }

  @Get('csv-template')
  @ApiOperation({ summary: 'Télécharger le template CSV ExStrat pour l\'import de transactions' })
  @ApiResponse({ 
    status: 200, 
    description: 'Template CSV téléchargé avec succès',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
          example: 'Date,Symbol,Type,Quantity,Price,Amount,Notes\n2024-01-15,BTC,BUY,0.5,50000,25000,Initial purchase'
        }
      }
    }
  })
  async downloadCsvTemplate(@Res() res: Response): Promise<void> {
    // Créer le template CSV avec les colonnes requises
    const csvHeader = 'Date,Symbol,Type,Quantity,Price,Amount,Notes\n';
    const csvExample = '2024-01-15,BTC,BUY,0.5,50000,25000,Initial purchase\n';
    const csvContent = csvHeader + csvExample;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="exstrat-transactions-template.csv"');
    res.send(csvContent);
  }

  @Post('parse-csv')
  @ApiOperation({ summary: 'Parser et valider un fichier CSV de transactions' })
  @ApiResponse({ 
    status: 200, 
    description: 'CSV parsé avec succès',
    type: ParseCsvResponseDto
  })
  @ApiResponse({ status: 400, description: 'Erreur lors du parsing du CSV' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async parseCsv(
    @CurrentUser('id') userId: string,
    @Body() parseCsvDto: ParseCsvDto
  ): Promise<ParseCsvResponseDto> {
    return this.csvParserService.parseCsv(parseCsvDto);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Créer plusieurs transactions en batch' })
  @ApiResponse({ 
    status: 200, 
    description: 'Transactions créées avec succès',
    type: CreateBatchTransactionsResponseDto
  })
  @ApiResponse({ status: 400, description: 'Données invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async createBatch(
    @CurrentUser('id') userId: string,
    @Body() createBatchDto: CreateBatchTransactionsDto
  ): Promise<CreateBatchTransactionsResponseDto> {
    // Convertir les transactions parsées en CreateTransactionDto
    const transactions: CreateTransactionDto[] = createBatchDto.transactions.map(tx => ({
      symbol: tx.symbol,
      name: tx.name,
      cmcId: tx.cmcId,
      quantity: tx.quantity,
      amountInvested: tx.amountInvested,
      averagePrice: tx.averagePrice,
      type: tx.type as any, // TransactionType
      transactionDate: tx.transactionDate,
      notes: tx.notes,
      exchangeId: tx.exchangeId,
      portfolioId: tx.portfolioId || createBatchDto.defaultPortfolioId,
    }));

    return this.transactionsService.createBatchTransactions(
      userId,
      transactions,
      createBatchDto.defaultPortfolioId
    );
  }
}
