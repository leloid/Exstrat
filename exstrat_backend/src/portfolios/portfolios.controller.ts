import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { PortfoliosService } from './portfolios.service';
import { CreatePortfolioDto, UpdatePortfolioDto } from './dto/portfolio.dto';
import { CreateHoldingDto, UpdateHoldingDto } from './dto/holding.dto';
import { CreateUserStrategyDto, UpdateUserStrategyDto, TokenStrategyConfigDto } from './dto/user-strategy.dto';

@Controller('portfolios')
@UseGuards(JwtAuthGuard)
export class PortfoliosController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  // ===== PORTFOLIOS =====

  @Post()
  async createPortfolio(@Request() req, @Body() createPortfolioDto: CreatePortfolioDto) {
    return this.portfoliosService.createPortfolio(req.user.id, createPortfolioDto);
  }

  @Get()
  async getUserPortfolios(@Request() req) {
    return this.portfoliosService.getUserPortfolios(req.user.id);
  }

  @Get(':id')
  async getPortfolioById(@Request() req, @Param('id') id: string) {
    return this.portfoliosService.getPortfolioById(req.user.id, id);
  }

  @Put(':id')
  async updatePortfolio(
    @Request() req,
    @Param('id') id: string,
    @Body() updatePortfolioDto: UpdatePortfolioDto,
  ) {
    return this.portfoliosService.updatePortfolio(req.user.id, id, updatePortfolioDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePortfolio(@Request() req, @Param('id') id: string) {
    await this.portfoliosService.deletePortfolio(req.user.id, id);
  }

  // ===== HOLDINGS =====

  @Get(':portfolioId/holdings')
  async getPortfolioHoldings(@Request() req, @Param('portfolioId') portfolioId: string) {
    return this.portfoliosService.getPortfolioHoldings(req.user.id, portfolioId);
  }

  @Post(':portfolioId/holdings')
  async addHolding(
    @Request() req,
    @Param('portfolioId') portfolioId: string,
    @Body() createHoldingDto: CreateHoldingDto,
  ) {
    return this.portfoliosService.addHolding(req.user.id, portfolioId, createHoldingDto);
  }

  @Put(':portfolioId/holdings/:holdingId')
  async updateHolding(
    @Request() req,
    @Param('portfolioId') portfolioId: string,
    @Param('holdingId') holdingId: string,
    @Body() updateHoldingDto: UpdateHoldingDto,
  ) {
    return this.portfoliosService.updateHolding(req.user.id, portfolioId, holdingId, updateHoldingDto);
  }

  @Delete(':portfolioId/holdings/:holdingId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteHolding(
    @Request() req,
    @Param('portfolioId') portfolioId: string,
    @Param('holdingId') holdingId: string,
  ) {
    await this.portfoliosService.deleteHolding(req.user.id, portfolioId, holdingId);
  }

  // ===== USER STRATEGIES =====

  @Post('strategies')
  async createUserStrategy(@Request() req, @Body() createUserStrategyDto: CreateUserStrategyDto) {
    return this.portfoliosService.createUserStrategy(req.user.id, createUserStrategyDto);
  }

  @Get('strategies')
  async getUserStrategies(@Request() req) {
    return this.portfoliosService.getUserStrategies(req.user.id);
  }

  @Post('sync')
  async syncPortfolios(@Request() req) {
    return this.portfoliosService.syncAllPortfolios(req.user.id);
  }

  @Get('strategies/:id')
  async getUserStrategyById(@Request() req, @Param('id') id: string) {
    return this.portfoliosService.getUserStrategyById(req.user.id, id);
  }

  @Put('strategies/:id')
  async updateUserStrategy(
    @Request() req,
    @Param('id') id: string,
    @Body() updateUserStrategyDto: UpdateUserStrategyDto,
  ) {
    return this.portfoliosService.updateUserStrategy(req.user.id, id, updateUserStrategyDto);
  }

  @Delete('strategies/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUserStrategy(@Request() req, @Param('id') id: string) {
    await this.portfoliosService.deleteUserStrategy(req.user.id, id);
  }

  // ===== TOKEN STRATEGY CONFIGURATIONS =====

  @Post('strategies/:strategyId/token-configs')
  async configureTokenStrategy(
    @Request() req,
    @Param('strategyId') strategyId: string,
    @Body() tokenConfigDto: TokenStrategyConfigDto,
  ) {
    return this.portfoliosService.configureTokenStrategy(req.user.id, strategyId, tokenConfigDto);
  }

  @Get('strategies/:strategyId/token-configs')
  async getTokenStrategyConfigs(@Request() req, @Param('strategyId') strategyId: string) {
    return this.portfoliosService.getTokenStrategyConfigs(req.user.id, strategyId);
  }

  // ===== TEMPLATES =====
  // Les templates sont gérés par TemplatesController

  // ===== SIMULATION =====

  @Post('strategies/:strategyId/simulate')
  async simulateStrategy(@Request() req, @Param('strategyId') strategyId: string) {
    return this.portfoliosService.simulateStrategy(req.user.id, strategyId);
  }
}
