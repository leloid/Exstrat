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
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  NotFoundException
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam } from '@nestjs/swagger';
import { StrategiesService } from './strategies.service';
import { 
  CreateStrategyDto, 
  UpdateStrategyDto, 
  UpdateStrategyStepDto,
  StrategyResponseDto,
  StrategyStepResponseDto,
  StrategySearchDto,
  StrategySummaryDto
} from './dto/strategy.dto';
import {
  CreateStrategyAlertDto,
  UpdateStrategyAlertDto,
  CreateStepAlertDto,
  UpdateStepAlertDto,
  StrategyAlertResponseDto,
  StepAlertResponseDto,
} from '../configuration/dto/strategy-alert.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Strategies')
@ApiBearerAuth('bearer')
@UseGuards(JwtAuthGuard)
@Controller('strategies')
export class StrategiesController {
  constructor(private readonly strategiesService: StrategiesService) {}

  @Post()
  @ApiOperation({ summary: 'Créer une nouvelle stratégie de prise de profit' })
  @ApiResponse({ status: 201, description: 'Stratégie créée avec succès', type: StrategyResponseDto })
  @ApiResponse({ status: 400, description: 'Données invalides ou token non détenu' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() createStrategyDto: CreateStrategyDto
  ): Promise<StrategyResponseDto> {
    console.log('POST /strategies - userId:', userId);
    console.log('Données reçues:', createStrategyDto);
    return this.strategiesService.createStrategy(userId, createStrategyDto);
  }

  @Get()
  @ApiOperation({ summary: 'Récupérer toutes les stratégies de l\'utilisateur' })
  @ApiQuery({ name: 'symbol', required: false, description: 'Filtrer par symbole de token' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrer par statut (active, paused, completed)' })
  @ApiQuery({ name: 'page', required: false, description: 'Numéro de page (défaut: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Limite par page (défaut: 20)' })
  @ApiResponse({ status: 200, description: 'Liste des stratégies', type: [StrategyResponseDto] })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async findAll(
    @CurrentUser('id') userId: string,
    @Query() searchDto: StrategySearchDto
  ): Promise<{ strategies: StrategyResponseDto[], total: number, page: number, limit: number }> {
    console.log('🎯 [StrategiesController] findAll called');
    console.log('🎯 [StrategiesController] userId:', userId);
    console.log('🎯 [StrategiesController] searchDto:', searchDto);
    
    try {
      const result = await this.strategiesService.findAll(userId, searchDto);
      console.log('✅ [StrategiesController] Success, returning result');
      return result;
    } catch (error) {
      console.log('❌ [StrategiesController] Error:', error);
      throw error;
    }
  }

  @Get('token/:symbol')
  @ApiOperation({ summary: 'Récupérer les stratégies actives pour un token spécifique' })
  @ApiParam({ name: 'symbol', description: 'Symbole du token (ex: BTC, ETH)' })
  @ApiResponse({ status: 200, description: 'Liste des stratégies pour le token', type: [StrategyResponseDto] })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async findByToken(
    @CurrentUser('id') userId: string,
    @Param('symbol') symbol: string
  ): Promise<StrategyResponseDto[]> {
    return this.strategiesService.getStrategiesByToken(userId, symbol.toUpperCase());
  }

  // ===== GESTION DES ALERTES DE STRATÉGIE (doit être avant :id pour éviter les conflits de routes) =====

  @Post(':strategyId/alerts')
  @ApiOperation({ summary: 'Créer ou mettre à jour une configuration d\'alertes pour une stratégie' })
  @ApiParam({ name: 'strategyId', description: 'ID de la stratégie' })
  @ApiResponse({ status: 201, type: StrategyAlertResponseDto })
  @ApiResponse({ status: 404, description: 'Stratégie non trouvée' })
  async createOrUpdateStrategyAlert(
    @CurrentUser('id') userId: string,
    @Param('strategyId', ParseUUIDPipe) strategyId: string,
    @Body() createDto: CreateStrategyAlertDto,
  ): Promise<StrategyAlertResponseDto> {
    return this.strategiesService.createOrUpdateStrategyAlert(userId, strategyId, createDto);
  }

  @Get(':strategyId/alerts')
  @ApiOperation({ summary: 'Récupérer la configuration d\'alertes d\'une stratégie' })
  @ApiParam({ name: 'strategyId', description: 'ID de la stratégie' })
  @ApiResponse({ status: 200, type: StrategyAlertResponseDto })
  @ApiResponse({ status: 404, description: 'Stratégie non trouvée ou pas d\'alerte configurée' })
  async getStrategyAlert(
    @CurrentUser('id') userId: string,
    @Param('strategyId') strategyId: string,
  ): Promise<StrategyAlertResponseDto | null> {
    console.log('🔔 [StrategiesController] getStrategyAlert called with strategyId:', strategyId, 'userId:', userId);
    try {
      const alert = await this.strategiesService.getStrategyAlert(userId, strategyId);
      console.log('🔔 [StrategiesController] getStrategyAlert result:', alert ? 'found' : 'not found');
      return alert;
    } catch (error) {
      console.error('🔔 [StrategiesController] getStrategyAlert error:', error);
      throw error;
    }
  }

  @Patch(':strategyId/alerts')
  @ApiOperation({ summary: 'Mettre à jour une configuration d\'alertes' })
  @ApiParam({ name: 'strategyId', description: 'ID de la stratégie' })
  @ApiResponse({ status: 200, type: StrategyAlertResponseDto })
  @ApiResponse({ status: 404, description: 'Configuration non trouvée' })
  async updateStrategyAlert(
    @CurrentUser('id') userId: string,
    @Param('strategyId', ParseUUIDPipe) strategyId: string,
    @Body() updateDto: UpdateStrategyAlertDto,
  ): Promise<StrategyAlertResponseDto> {
    return this.strategiesService.updateStrategyAlert(userId, strategyId, updateDto);
  }

  @Delete(':strategyId/alerts')
  @ApiOperation({ summary: 'Supprimer une configuration d\'alertes' })
  @ApiParam({ name: 'strategyId', description: 'ID de la stratégie' })
  @ApiResponse({ status: 200 })
  async deleteStrategyAlert(
    @CurrentUser('id') userId: string,
    @Param('strategyId', ParseUUIDPipe) strategyId: string,
  ): Promise<{ message: string }> {
    await this.strategiesService.deleteStrategyAlert(userId, strategyId);
    return { message: 'Configuration d\'alertes supprimée avec succès' };
  }

  // ===== GESTION DES ALERTES DE STEP =====

  @Post('steps/:stepId/alerts')
  @ApiOperation({ summary: 'Créer ou mettre à jour une alerte pour un step' })
  @ApiParam({ name: 'stepId', description: 'ID du step' })
  @ApiResponse({ status: 201, type: StepAlertResponseDto })
  @ApiResponse({ status: 404, description: 'Step non trouvé' })
  async createOrUpdateStepAlert(
    @CurrentUser('id') userId: string,
    @Param('stepId') stepId: string, // Retirer ParseUUIDPipe temporairement pour debug
    @Body() createDto: CreateStepAlertDto,
  ): Promise<StepAlertResponseDto> {
    console.log('🔔 [StrategiesController] createOrUpdateStepAlert called:', { userId, stepId, createDto });
    try {
      const result = await this.strategiesService.createOrUpdateStepAlert(userId, stepId, createDto);
      console.log('✅ [StrategiesController] createOrUpdateStepAlert success:', result);
      return result;
    } catch (error) {
      console.error('❌ [StrategiesController] createOrUpdateStepAlert error:', error);
      throw error;
    }
  }

  @Get('steps/:stepId/alerts')
  @ApiOperation({ summary: 'Récupérer une alerte de step' })
  @ApiParam({ name: 'stepId', description: 'ID du step' })
  @ApiResponse({ status: 200, type: StepAlertResponseDto })
  @ApiResponse({ status: 404, description: 'Step non trouvé ou pas d\'alerte configurée' })
  async getStepAlert(
    @CurrentUser('id') userId: string,
    @Param('stepId') stepId: string, // Retirer ParseUUIDPipe temporairement pour debug
  ): Promise<StepAlertResponseDto | null> {
    console.log('🔔 [StrategiesController] getStepAlert called with stepId:', stepId);
    const alert = await this.strategiesService.getStepAlert(userId, stepId);
    console.log('🔔 [StrategiesController] getStepAlert result:', alert ? 'found' : 'not found');
    return alert;
  }

  @Patch('steps/:stepId/alerts')
  @ApiOperation({ summary: 'Mettre à jour une alerte de step' })
  @ApiParam({ name: 'stepId', description: 'ID du step' })
  @ApiResponse({ status: 200, type: StepAlertResponseDto })
  @ApiResponse({ status: 404, description: 'Alerte non trouvée' })
  async updateStepAlert(
    @CurrentUser('id') userId: string,
    @Param('stepId') stepId: string, // Retirer ParseUUIDPipe temporairement pour debug
    @Body() updateDto: UpdateStepAlertDto,
  ): Promise<StepAlertResponseDto> {
    console.log('🔔 [StrategiesController] updateStepAlert called:', { userId, stepId, updateDto });
    try {
      const result = await this.strategiesService.updateStepAlert(userId, stepId, updateDto);
      console.log('✅ [StrategiesController] updateStepAlert success:', result);
      return result;
    } catch (error) {
      console.error('❌ [StrategiesController] updateStepAlert error:', error);
      throw error;
    }
  }

  @Delete('steps/:stepId/alerts')
  @ApiOperation({ summary: 'Supprimer une alerte de step' })
  @ApiParam({ name: 'stepId', description: 'ID du step' })
  @ApiResponse({ status: 200 })
  async deleteStepAlert(
    @CurrentUser('id') userId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
  ): Promise<{ message: string }> {
    await this.strategiesService.deleteStepAlert(userId, stepId);
    return { message: 'Alerte de step supprimée avec succès' };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Récupérer une stratégie par son ID' })
  @ApiParam({ name: 'id', description: 'ID de la stratégie' })
  @ApiResponse({ status: 200, description: 'Détails de la stratégie', type: StrategyResponseDto })
  @ApiResponse({ status: 404, description: 'Stratégie non trouvée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async findOne(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<StrategyResponseDto> {
    return this.strategiesService.findOne(userId, id);
  }

  @Get(':id/summary')
  @ApiOperation({ summary: 'Récupérer le résumé d\'une stratégie' })
  @ApiParam({ name: 'id', description: 'ID de la stratégie' })
  @ApiResponse({ status: 200, description: 'Résumé de la stratégie', type: StrategySummaryDto })
  @ApiResponse({ status: 404, description: 'Stratégie non trouvée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async getSummary(
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string
  ): Promise<StrategySummaryDto> {
    return this.strategiesService.getStrategySummary(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Mettre à jour une stratégie' })
  @ApiParam({ name: 'id', description: 'ID de la stratégie' })
  @ApiResponse({ status: 200, description: 'Stratégie mise à jour', type: StrategyResponseDto })
  @ApiResponse({ status: 404, description: 'Stratégie non trouvée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') id: string,
    @Body() updateStrategyDto: UpdateStrategyDto
  ): Promise<StrategyResponseDto> {
    console.log('PATCH /strategies/:id - userId:', userId, 'id:', id);
    console.log('Données de mise à jour reçues:', updateStrategyDto);
    return this.strategiesService.update(userId, id, updateStrategyDto);
  }

  @Patch(':strategyId/steps/:stepId')
  @ApiOperation({ summary: 'Mettre à jour une étape de stratégie' })
  @ApiParam({ name: 'strategyId', description: 'ID de la stratégie' })
  @ApiParam({ name: 'stepId', description: 'ID de l\'étape' })
  @ApiResponse({ status: 200, description: 'Étape mise à jour', type: StrategyStepResponseDto })
  @ApiResponse({ status: 404, description: 'Stratégie ou étape non trouvée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async updateStep(
    @CurrentUser('id') userId: string,
    @Param('strategyId', ParseUUIDPipe) strategyId: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Body() updateStepDto: UpdateStrategyStepDto
  ): Promise<StrategyStepResponseDto> {
    return this.strategiesService.updateStep(userId, strategyId, stepId, updateStepDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Supprimer une stratégie' })
  @ApiParam({ name: 'id', description: 'ID de la stratégie' })
  @ApiResponse({ status: 200, description: 'Stratégie supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Stratégie non trouvée' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé' })
  async remove(
    @CurrentUser('id') userId: string,
    @Param('id') id: string
  ): Promise<{ message: string }> {
    console.log('DELETE /strategies/:id - userId:', userId, 'id:', id);
    await this.strategiesService.remove(userId, id);
    console.log('Stratégie supprimée avec succès');
    return { message: 'Stratégie supprimée avec succès' };
  }
}
