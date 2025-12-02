import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConfigurationService } from './configuration.service';
import {
  CreateAlertConfigurationDto,
  UpdateAlertConfigurationDto,
  CreateTokenAlertDto,
  UpdateTokenAlertDto,
  CreateTPAlertDto,
  UpdateTPAlertDto,
  AlertConfigurationResponseDto,
  TokenAlertResponseDto,
  TPAlertResponseDto,
} from './dto/alert.dto';

@ApiTags('Configuration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('configuration')
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  // ===== CONFIGURATION D'ALERTES =====

  @Post('alerts')
  @ApiOperation({ summary: 'Créer une configuration d\'alertes pour une prévision' })
  @ApiResponse({ status: 201, type: AlertConfigurationResponseDto })
  @ApiResponse({ status: 404, description: 'Prévision non trouvée' })
  @ApiResponse({ status: 400, description: 'Une configuration existe déjà pour cette prévision' })
  async createAlertConfiguration(
    @CurrentUser('id') userId: string,
    @Body() createDto: CreateAlertConfigurationDto,
  ): Promise<AlertConfigurationResponseDto> {
    return this.configurationService.createAlertConfiguration(userId, createDto);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Récupérer toutes les configurations d\'alertes de l\'utilisateur' })
  @ApiResponse({ status: 200, type: [AlertConfigurationResponseDto] })
  async getAllAlertConfigurations(
    @CurrentUser('id') userId: string,
  ): Promise<AlertConfigurationResponseDto[]> {
    return this.configurationService.getAllAlertConfigurations(userId);
  }

  @Get('alerts/forecast/:forecastId')
  @ApiOperation({ summary: 'Récupérer la configuration d\'alertes d\'une prévision' })
  @ApiResponse({ status: 200, type: AlertConfigurationResponseDto })
  @ApiResponse({ status: 404, description: 'Configuration non trouvée' })
  async getAlertConfigurationByForecast(
    @CurrentUser('id') userId: string,
    @Param('forecastId') forecastId: string,
  ): Promise<AlertConfigurationResponseDto | null> {
    return this.configurationService.getAlertConfigurationByForecast(userId, forecastId);
  }

  @Put('alerts/:configurationId')
  @ApiOperation({ summary: 'Mettre à jour une configuration d\'alertes' })
  @ApiResponse({ status: 200, type: AlertConfigurationResponseDto })
  @ApiResponse({ status: 404, description: 'Configuration non trouvée' })
  async updateAlertConfiguration(
    @CurrentUser('id') userId: string,
    @Param('configurationId') configurationId: string,
    @Body() updateDto: UpdateAlertConfigurationDto,
  ): Promise<AlertConfigurationResponseDto> {
    return this.configurationService.updateAlertConfiguration(userId, configurationId, updateDto);
  }

  @Delete('alerts/:configurationId')
  @ApiOperation({ summary: 'Supprimer une configuration d\'alertes' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Configuration non trouvée' })
  async deleteAlertConfiguration(
    @CurrentUser('id') userId: string,
    @Param('configurationId') configurationId: string,
  ): Promise<{ message: string }> {
    await this.configurationService.deleteAlertConfiguration(userId, configurationId);
    return { message: 'Configuration d\'alertes supprimée avec succès' };
  }

  // ===== ALERTES TOKEN =====

  @Post('alerts/:configurationId/tokens')
  @ApiOperation({ summary: 'Ajouter une alerte token à une configuration' })
  @ApiResponse({ status: 201, type: TokenAlertResponseDto })
  @ApiResponse({ status: 404, description: 'Configuration non trouvée' })
  @ApiResponse({ status: 400, description: 'Une alerte existe déjà pour ce token' })
  async addTokenAlert(
    @CurrentUser('id') userId: string,
    @Param('configurationId') configurationId: string,
    @Body() createDto: CreateTokenAlertDto,
  ): Promise<TokenAlertResponseDto> {
    return this.configurationService.addTokenAlert(userId, configurationId, createDto);
  }

  @Put('alerts/tokens/:tokenAlertId')
  @ApiOperation({ summary: 'Mettre à jour une alerte token' })
  @ApiResponse({ status: 200, type: TokenAlertResponseDto })
  @ApiResponse({ status: 404, description: 'Alerte token non trouvée' })
  async updateTokenAlert(
    @CurrentUser('id') userId: string,
    @Param('tokenAlertId') tokenAlertId: string,
    @Body() updateDto: UpdateTokenAlertDto,
  ): Promise<TokenAlertResponseDto> {
    return this.configurationService.updateTokenAlert(userId, tokenAlertId, updateDto);
  }

  @Delete('alerts/tokens/:tokenAlertId')
  @ApiOperation({ summary: 'Supprimer une alerte token' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Alerte token non trouvée' })
  async deleteTokenAlert(
    @CurrentUser('id') userId: string,
    @Param('tokenAlertId') tokenAlertId: string,
  ): Promise<{ message: string }> {
    await this.configurationService.deleteTokenAlert(userId, tokenAlertId);
    return { message: 'Alerte token supprimée avec succès' };
  }

  @Put('alerts/tokens/:tokenAlertId/toggle')
  @ApiOperation({ summary: 'Activer/désactiver toutes les alertes d\'un token' })
  @ApiResponse({ status: 200, type: TokenAlertResponseDto })
  @ApiResponse({ status: 404, description: 'Alerte token non trouvée' })
  async toggleTokenAlert(
    @CurrentUser('id') userId: string,
    @Param('tokenAlertId') tokenAlertId: string,
    @Query('isActive') isActive: string,
  ): Promise<TokenAlertResponseDto> {
    const active = isActive === 'true';
    return this.configurationService.toggleTokenAlert(userId, tokenAlertId, active);
  }

  // ===== ALERTES TP =====

  @Post('alerts/tokens/:tokenAlertId/tp')
  @ApiOperation({ summary: 'Ajouter une alerte TP à une alerte token' })
  @ApiResponse({ status: 201, type: TPAlertResponseDto })
  @ApiResponse({ status: 404, description: 'Alerte token non trouvée' })
  @ApiResponse({ status: 400, description: 'Une alerte existe déjà pour ce TP' })
  async addTPAlert(
    @CurrentUser('id') userId: string,
    @Param('tokenAlertId') tokenAlertId: string,
    @Body() createDto: CreateTPAlertDto,
  ): Promise<TPAlertResponseDto> {
    return this.configurationService.addTPAlert(userId, tokenAlertId, createDto);
  }

  @Put('alerts/tp/:tpAlertId')
  @ApiOperation({ summary: 'Mettre à jour une alerte TP' })
  @ApiResponse({ status: 200, type: TPAlertResponseDto })
  @ApiResponse({ status: 404, description: 'Alerte TP non trouvée' })
  async updateTPAlert(
    @CurrentUser('id') userId: string,
    @Param('tpAlertId') tpAlertId: string,
    @Body() updateDto: UpdateTPAlertDto,
  ): Promise<TPAlertResponseDto> {
    return this.configurationService.updateTPAlert(userId, tpAlertId, updateDto);
  }

  @Delete('alerts/tp/:tpAlertId')
  @ApiOperation({ summary: 'Supprimer une alerte TP' })
  @ApiResponse({ status: 200 })
  @ApiResponse({ status: 404, description: 'Alerte TP non trouvée' })
  async deleteTPAlert(
    @CurrentUser('id') userId: string,
    @Param('tpAlertId') tpAlertId: string,
  ): Promise<{ message: string }> {
    await this.configurationService.deleteTPAlert(userId, tpAlertId);
    return { message: 'Alerte TP supprimée avec succès' };
  }
}

