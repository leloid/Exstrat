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
  ParseUUIDPipe 
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TransactionsService } from './transactions.service';
import { CreateTransactionDto, UpdateTransactionDto, TransactionSearchDto, TransactionResponseDto } from './dto/transaction.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Transactions')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

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
    @Param('id', ParseUUIDPipe) id: string
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
    @Param('id', ParseUUIDPipe) id: string,
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
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<{ message: string }> {
    await this.transactionsService.remove(userId, id);
    return { message: 'Transaction supprimée avec succès' };
  }
}
