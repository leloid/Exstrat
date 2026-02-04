import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokensService } from '../tokens/tokens.service';
import { CreatePortfolioDto, UpdatePortfolioDto, PortfolioResponseDto } from './dto/portfolio.dto';
import { CreateHoldingDto, UpdateHoldingDto, HoldingResponseDto } from './dto/holding.dto';
import { CreateUserStrategyDto, UpdateUserStrategyDto, UserStrategyResponseDto, TokenStrategyConfigDto, TokenStrategyConfigResponseDto } from './dto/user-strategy.dto';
import { StrategyTemplateResponseDto, ProfitTakingTemplateResponseDto, SimulationResultDto } from './dto/template.dto';
import { CreateForecastDto, UpdateForecastDto } from './dto/forecast.dto';

@Injectable()
export class PortfoliosService {
  private readonly logger = new Logger(PortfoliosService.name);

  constructor(
    private prisma: PrismaService,
    private tokensService: TokensService,
  ) {}

  // ===== PORTFOLIOS =====

  async createPortfolio(userId: string, createPortfolioDto: CreatePortfolioDto): Promise<PortfolioResponseDto> {
    const { name, description, isDefault } = createPortfolioDto;

    // Si c'est le portfolio par défaut, désactiver les autres
    if (isDefault) {
      await this.prisma.portfolio.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const portfolio = await this.prisma.portfolio.create({
      data: {
        userId,
        name,
        description,
        isDefault: isDefault || false,
      },
    });

    // Synchroniser les transactions existantes avec ce nouveau portfolio
    await this.syncTransactionsWithPortfolio(userId, portfolio.id);

    return this.formatPortfolioResponse(portfolio);
  }

  async getUserPortfolios(userId: string): Promise<PortfolioResponseDto[]> {
    const portfolios = await this.prisma.portfolio.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
      include: {
        _count: {
          select: { holdings: true },
        },
      },
    });

    return portfolios.map(portfolio => ({
      ...this.formatPortfolioResponse(portfolio),
      holdingsCount: portfolio._count.holdings,
    }));
  }

  async getPortfolioById(userId: string, portfolioId: string): Promise<PortfolioResponseDto> {
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
      include: {
        _count: {
          select: { holdings: true },
        },
      },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio non trouvé');
    }

    return {
      ...this.formatPortfolioResponse(portfolio),
      holdingsCount: portfolio._count.holdings,
    };
  }

  async updatePortfolio(userId: string, portfolioId: string, updatePortfolioDto: UpdatePortfolioDto): Promise<PortfolioResponseDto> {
    const { name, description, isDefault } = updatePortfolioDto;

    // Vérifier que le portfolio existe
    const existingPortfolio = await this.prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });

    if (!existingPortfolio) {
      throw new NotFoundException('Portfolio non trouvé');
    }

    // Si c'est le portfolio par défaut, désactiver les autres
    if (isDefault) {
      await this.prisma.portfolio.updateMany({
        where: { userId, isDefault: true, id: { not: portfolioId } },
        data: { isDefault: false },
      });
    }

    const portfolio = await this.prisma.portfolio.update({
      where: { id: portfolioId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isDefault !== undefined && { isDefault }),
      },
    });

    return this.formatPortfolioResponse(portfolio);
  }

  async deletePortfolio(userId: string, portfolioId: string): Promise<void> {
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio non trouvé');
    }

    // Utiliser une transaction pour garantir l'atomicité
    await this.prisma.$transaction(async (tx) => {
      // 1. Récupérer les Forecast associés pour vérifier et supprimer leurs AlertConfiguration
      const forecasts = await tx.forecast.findMany({
        where: { portfolioId },
        select: {
          id: true,
        },
      });

      this.logger.log(`Found ${forecasts.length} forecast(s) for portfolio ${portfolioId}`);

      // 2. Note: Les AlertConfiguration n'existent plus, les alertes sont maintenant liées aux Strategies
      // Aucune action nécessaire ici car les alertes ne sont plus liées aux Forecasts

      // 3. Supprimer les Forecast associés
      const deletedForecasts = await tx.forecast.deleteMany({
        where: { portfolioId },
      });
      this.logger.log(`Deleted ${deletedForecasts.count} forecast(s)`);

      // 4. Supprimer les UserStrategy associés
      await tx.userStrategy.deleteMany({
        where: { portfolioId },
      });

      // 5. Supprimer les holdings associés
      await tx.holding.deleteMany({
        where: { portfolioId },
      });

      // 6. Supprimer les transactions associées
      await tx.transaction.deleteMany({
        where: { portfolioId },
      });

      // 7. Supprimer le portfolio
      await tx.portfolio.delete({
        where: { id: portfolioId },
      });

      this.logger.log(`Portfolio ${portfolioId} deleted successfully`);
    });
  }

  // ===== HOLDINGS =====

  /**
   * Get holdings for multiple portfolios in a single optimized query
   * OPTIMIZED for high load (10k+ concurrent users)
   */
  async getBatchHoldings(userId: string, portfolioIds?: string[]): Promise<HoldingResponseDto[]> {
    // Get all user portfolios if no specific IDs provided
    let targetPortfolioIds = portfolioIds;
    
    if (!targetPortfolioIds || targetPortfolioIds.length === 0) {
      const userPortfolios = await this.prisma.portfolio.findMany({
        where: { userId },
        select: { id: true },
      });
      targetPortfolioIds = userPortfolios.map(p => p.id);
    }

    if (targetPortfolioIds.length === 0) {
      return [];
    }

    // OPTIMIZATION: Single query with optimized select to reduce data transfer
    const holdings = await this.prisma.holding.findMany({
      where: {
        portfolioId: { in: targetPortfolioIds },
        portfolio: { userId }, // Ensure user owns the portfolios
      },
      include: {
        token: {
          select: {
            id: true,
            symbol: true,
            name: true,
            cmcId: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { token: { symbol: 'asc' } },
    });

    // Batch update prices only for holdings that need it (last updated > 5 min ago)
    // IMPORTANT: Forcer la mise à jour si currentPrice n'est pas disponible
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    
    const holdingsToUpdate = holdings.filter(holding => {
      // Si currentPrice n'est pas disponible, forcer la mise à jour
      if (!holding.currentPrice) return true;
      // Si le prix n'a pas été mis à jour récemment, mettre à jour
      if (!holding.lastUpdated) return true;
      return new Date(holding.lastUpdated) < fiveMinutesAgo;
    });

    if (holdingsToUpdate.length > 0) {
      // IMPORTANT: Mettre à jour les prix de manière synchrone pour garantir
      // que currentValue est calculé avec le prix actuel du marché
      try {
        await this.updateHoldingsPrices(holdingsToUpdate);
        // Recharger les holdings après la mise à jour pour avoir les prix à jour
        const updatedHoldings = await this.prisma.holding.findMany({
          where: {
            portfolioId: { in: targetPortfolioIds },
            portfolio: { userId },
          },
          include: {
            token: {
              select: {
                id: true,
                symbol: true,
                name: true,
                cmcId: true,
                logoUrl: true,
              },
            },
          },
          orderBy: { token: { symbol: 'asc' } },
        });
        return updatedHoldings.map(holding => this.formatHoldingResponse(holding));
      } catch (error) {
        // Si la mise à jour échoue, logger l'erreur mais continuer avec les prix existants
        this.logger.warn('Batch price update failed, using existing prices:', error);
      }
    }

    return holdings.map(holding => this.formatHoldingResponse(holding));
  }

  async getPortfolioHoldings(userId: string, portfolioId: string, skipPriceUpdate: boolean = false): Promise<HoldingResponseDto[]> {
    // Vérifier que le portfolio appartient à l'utilisateur
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
      select: { id: true }, // OPTIMIZATION: Only select needed field
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio non trouvé');
    }

    // OPTIMIZATION: Optimized select to reduce data transfer
    const holdings = await this.prisma.holding.findMany({
      where: { portfolioId },
      include: {
        token: {
          select: {
            id: true,
            symbol: true,
            name: true,
            cmcId: true,
            logoUrl: true,
          },
        },
      },
      orderBy: { token: { symbol: 'asc' } },
    });

    // Mettre à jour les prix actuels depuis CoinMarketCap seulement si nécessaire
    // et seulement si le prix n'a pas été mis à jour récemment (dans les 5 dernières minutes)
    if (!skipPriceUpdate) {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      // Filtrer les holdings qui ont besoin d'une mise à jour de prix
      // IMPORTANT: Forcer la mise à jour si currentPrice n'est pas disponible
      const holdingsToUpdate = holdings.filter(holding => {
        // Si currentPrice n'est pas disponible, forcer la mise à jour
        if (!holding.currentPrice) return true;
        // Si le prix n'a pas été mis à jour récemment, mettre à jour
        if (!holding.lastUpdated) return true;
        return new Date(holding.lastUpdated) < fiveMinutesAgo;
      });

      if (holdingsToUpdate.length > 0) {
        // IMPORTANT: Mettre à jour les prix de manière synchrone pour garantir
        // que currentValue est calculé avec le prix actuel du marché
        // Si la mise à jour échoue, on utilisera averagePrice comme fallback
        try {
          await this.updateHoldingsPrices(holdingsToUpdate);
          // Recharger les holdings après la mise à jour pour avoir les prix à jour
          const updatedHoldings = await this.prisma.holding.findMany({
            where: { portfolioId },
            include: {
              token: {
                select: {
                  id: true,
                  symbol: true,
                  name: true,
                  cmcId: true,
                  logoUrl: true,
                },
              },
            },
            orderBy: { token: { symbol: 'asc' } },
          });
          return updatedHoldings.map(holding => this.formatHoldingResponse(holding));
        } catch (error) {
          // Si la mise à jour échoue, logger l'erreur mais continuer avec les prix existants
          this.logger.warn('Price update failed, using existing prices:', error);
        }
      }
    }

    return holdings.map(holding => this.formatHoldingResponse(holding));
  }

  /**
   * Met à jour les prix actuels des holdings depuis CoinMarketCap
   * OPTIMIZED: Batch updates and rate limiting for high load
   */
  private async updateHoldingsPrices(holdings: any[]): Promise<void> {
    if (holdings.length === 0) return;

    // OPTIMIZATION: Group holdings by cmcId to reduce API calls
    const holdingsByCmcId = new Map<number, any[]>();
    
    for (const holding of holdings) {
      if (!holding.token?.cmcId) {
        this.logger.warn(`Token ${holding.token?.symbol} n'a pas de cmcId, impossible de mettre à jour le prix`);
        continue;
      }
      
      const cmcId = holding.token.cmcId;
      if (!holdingsByCmcId.has(cmcId)) {
        holdingsByCmcId.set(cmcId, []);
      }
      holdingsByCmcId.get(cmcId)!.push(holding);
    }

    // OPTIMIZATION: Process in batches to avoid overwhelming the API
    const BATCH_SIZE = 10; // Process 10 tokens at a time
    const cmcIds = Array.from(holdingsByCmcId.keys());
    
    for (let i = 0; i < cmcIds.length; i += BATCH_SIZE) {
      const batch = cmcIds.slice(i, i + BATCH_SIZE);
      
      const updatePromises = batch.map(async (cmcId) => {
        const holdingsForToken = holdingsByCmcId.get(cmcId)!;
        
        try {
          // Single API call for all holdings of the same token
          const tokenData = await this.tokensService.getTokenById(cmcId);
          const currentPrice = tokenData.quote?.USD?.price;

          if (currentPrice && currentPrice > 0) {
            // OPTIMIZATION: Batch update all holdings for this token in a single transaction
            const holdingIds = holdingsForToken.map(h => h.id);
            
            await this.prisma.holding.updateMany({
              where: { id: { in: holdingIds } },
              data: {
                currentPrice: currentPrice,
                lastUpdated: new Date(),
              },
            });

            // Update in-memory objects
            holdingsForToken.forEach(holding => {
              holding.currentPrice = currentPrice.toString();
              holding.lastUpdated = new Date();
            });
          }
        } catch (error) {
          // Ne pas faire échouer la requête si la mise à jour du prix échoue
          this.logger.warn(`Erreur lors de la mise à jour du prix pour cmcId ${cmcId}: ${error.message}`);
        }
      });

      // Wait for batch to complete before processing next batch
      await Promise.all(updatePromises);
      
      // OPTIMIZATION: Small delay between batches to respect rate limits
      if (i + BATCH_SIZE < cmcIds.length) {
        await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
      }
    }
  }

  async addHolding(userId: string, portfolioId: string, createHoldingDto: CreateHoldingDto): Promise<HoldingResponseDto> {
    // Vérifier que le portfolio appartient à l'utilisateur
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio non trouvé');
    }

    // Vérifier que le token existe
    const token = await this.prisma.token.findUnique({
      where: { id: createHoldingDto.tokenId },
    });

    if (!token) {
      throw new NotFoundException('Token non trouvé');
    }

    // Vérifier qu'il n'y a pas déjà un holding pour ce token dans ce portfolio
    const existingHolding = await this.prisma.holding.findUnique({
      where: {
        portfolioId_tokenId: {
          portfolioId,
          tokenId: createHoldingDto.tokenId,
        },
      },
    });

    if (existingHolding) {
      throw new ConflictException('Ce token existe déjà dans ce portfolio');
    }

    const holding = await this.prisma.holding.create({
      data: {
        portfolioId,
        tokenId: createHoldingDto.tokenId,
        quantity: createHoldingDto.quantity,
        investedAmount: createHoldingDto.investedAmount,
        averagePrice: createHoldingDto.averagePrice,
        currentPrice: createHoldingDto.currentPrice,
      },
      include: {
        token: true,
      },
    });

    return this.formatHoldingResponse(holding);
  }

  async updateHolding(userId: string, portfolioId: string, holdingId: string, updateHoldingDto: UpdateHoldingDto): Promise<HoldingResponseDto> {
    // Vérifier que le holding appartient au portfolio de l'utilisateur
    const holding = await this.prisma.holding.findFirst({
      where: {
        id: holdingId,
        portfolio: { userId, id: portfolioId },
      },
      include: {
        token: true,
      },
    });

    if (!holding) {
      throw new NotFoundException('Holding non trouvé');
    }

    const updatedHolding = await this.prisma.holding.update({
      where: { id: holdingId },
      data: {
        ...(updateHoldingDto.quantity !== undefined && { quantity: updateHoldingDto.quantity }),
        ...(updateHoldingDto.investedAmount !== undefined && { investedAmount: updateHoldingDto.investedAmount }),
        ...(updateHoldingDto.averagePrice !== undefined && { averagePrice: updateHoldingDto.averagePrice }),
        ...(updateHoldingDto.currentPrice !== undefined && { currentPrice: updateHoldingDto.currentPrice }),
      },
      include: {
        token: true,
      },
    });

    return this.formatHoldingResponse(updatedHolding);
  }

  async deleteHolding(userId: string, portfolioId: string, holdingId: string): Promise<void> {
    // Vérifier que le holding appartient au portfolio de l'utilisateur
    const holding = await this.prisma.holding.findFirst({
      where: {
        id: holdingId,
        portfolio: { userId, id: portfolioId },
      },
    });

    if (!holding) {
      throw new NotFoundException('Holding non trouvé');
    }

    await this.prisma.holding.delete({
      where: { id: holdingId },
    });
  }

  // ===== USER STRATEGIES =====

  async createUserStrategy(userId: string, createUserStrategyDto: CreateUserStrategyDto): Promise<UserStrategyResponseDto> {
    const { portfolioId, name, description, status } = createUserStrategyDto;

    // Vérifier que le portfolio appartient à l'utilisateur
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio non trouvé');
    }

    const userStrategy = await this.prisma.userStrategy.create({
      data: {
        userId,
        portfolioId,
        name,
        description,
        status: status || 'draft',
      },
      include: {
        portfolio: true,
        _count: {
          select: { tokenConfigs: true },
        },
      },
    });

    return {
      ...this.formatUserStrategyResponse(userStrategy),
      tokenConfigsCount: userStrategy._count.tokenConfigs,
    };
  }

  async getUserStrategies(userId: string): Promise<UserStrategyResponseDto[]> {
    const strategies = await this.prisma.userStrategy.findMany({
      where: { userId },
      include: {
        portfolio: true,
        _count: {
          select: { tokenConfigs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return strategies.map(strategy => ({
      ...this.formatUserStrategyResponse(strategy),
      tokenConfigsCount: strategy._count.tokenConfigs,
    }));
  }

  async getUserStrategyById(userId: string, strategyId: string): Promise<UserStrategyResponseDto> {
    const strategy = await this.prisma.userStrategy.findFirst({
      where: { id: strategyId, userId },
      include: {
        portfolio: true,
        _count: {
          select: { tokenConfigs: true },
        },
      },
    });

    if (!strategy) {
      throw new NotFoundException('Stratégie non trouvée');
    }

    return {
      ...this.formatUserStrategyResponse(strategy),
      tokenConfigsCount: strategy._count.tokenConfigs,
    };
  }

  async updateUserStrategy(userId: string, strategyId: string, updateUserStrategyDto: UpdateUserStrategyDto): Promise<UserStrategyResponseDto> {
    const strategy = await this.prisma.userStrategy.findFirst({
      where: { id: strategyId, userId },
    });

    if (!strategy) {
      throw new NotFoundException('Stratégie non trouvée');
    }

    const updatedStrategy = await this.prisma.userStrategy.update({
      where: { id: strategyId },
      data: {
        ...(updateUserStrategyDto.name && { name: updateUserStrategyDto.name }),
        ...(updateUserStrategyDto.description !== undefined && { description: updateUserStrategyDto.description }),
        ...(updateUserStrategyDto.status && { status: updateUserStrategyDto.status }),
      },
      include: {
        portfolio: true,
        _count: {
          select: { tokenConfigs: true },
        },
      },
    });

    return {
      ...this.formatUserStrategyResponse(updatedStrategy),
      tokenConfigsCount: updatedStrategy._count.tokenConfigs,
    };
  }

  async deleteUserStrategy(userId: string, strategyId: string): Promise<void> {
    console.log(`🗑️ Tentative de suppression de la stratégie ${strategyId} pour l'utilisateur ${userId}`);
    
    const strategy = await this.prisma.userStrategy.findFirst({
      where: { id: strategyId, userId },
    });

    if (!strategy) {
      console.log(`❌ Stratégie non trouvée: ${strategyId}`);
      throw new NotFoundException('Stratégie non trouvée');
    }

    console.log(`✅ Stratégie trouvée: ${strategy.name}`);

    try {
      // Supprimer dans l'ordre pour respecter les contraintes de clés étrangères
      // 1. Supprimer les résultats de simulation
      console.log(`🔄 Suppression des résultats de simulation...`);
      const simResults = await this.prisma.simulationResult.deleteMany({
        where: { userStrategyId: strategyId },
      });
      console.log(`✅ ${simResults.count} résultats de simulation supprimés`);

      // 2. Supprimer les configurations de tokens
      console.log(`🔄 Suppression des configurations de tokens...`);
      const tokenConfigs = await this.prisma.tokenStrategyConfiguration.deleteMany({
        where: { userStrategyId: strategyId },
      });
      console.log(`✅ ${tokenConfigs.count} configurations de tokens supprimées`);

      // 3. Supprimer la stratégie
      console.log(`🔄 Suppression de la stratégie...`);
      await this.prisma.userStrategy.delete({
        where: { id: strategyId },
      });
      console.log(`✅ Stratégie ${strategyId} supprimée avec succès`);
    } catch (error) {
      console.error(`❌ Erreur lors de la suppression:`, error);
      throw error;
    }
  }

  // ===== TOKEN STRATEGY CONFIGURATIONS =====

  async configureTokenStrategy(userId: string, strategyId: string, tokenConfigDto: TokenStrategyConfigDto): Promise<TokenStrategyConfigResponseDto> {
    // Vérifier que la stratégie appartient à l'utilisateur
    const strategy = await this.prisma.userStrategy.findFirst({
      where: { id: strategyId, userId },
    });

    if (!strategy) {
      throw new NotFoundException('Stratégie non trouvée');
    }

    // Vérifier que le holding existe et appartient au portfolio de la stratégie
    const holding = await this.prisma.holding.findFirst({
      where: {
        id: tokenConfigDto.holdingId,
        portfolioId: strategy.portfolioId,
      },
      include: {
        token: true,
      },
    });

    if (!holding) {
      throw new NotFoundException('Holding non trouvé');
    }

    // Créer ou mettre à jour la configuration
    const config = await this.prisma.tokenStrategyConfiguration.upsert({
      where: {
        userStrategyId_holdingId: {
          userStrategyId: strategyId,
          holdingId: tokenConfigDto.holdingId,
        },
      },
      update: {
        strategyTemplateId: tokenConfigDto.strategyTemplateId,
        profitTakingTemplateId: tokenConfigDto.profitTakingTemplateId,
        customProfitTakingRules: tokenConfigDto.customProfitTakingRules,
      },
      create: {
        userStrategyId: strategyId,
        holdingId: tokenConfigDto.holdingId,
        strategyTemplateId: tokenConfigDto.strategyTemplateId,
        profitTakingTemplateId: tokenConfigDto.profitTakingTemplateId,
        customProfitTakingRules: tokenConfigDto.customProfitTakingRules,
      },
      include: {
        holding: {
          include: {
            token: true,
          },
        },
        strategyTemplate: true,
        profitTakingTemplate: true,
      },
    });

    return this.formatTokenStrategyConfigResponse(config);
  }

  async getTokenStrategyConfigs(userId: string, strategyId: string): Promise<TokenStrategyConfigResponseDto[]> {
    // Vérifier que la stratégie appartient à l'utilisateur
    const strategy = await this.prisma.userStrategy.findFirst({
      where: { id: strategyId, userId },
    });

    if (!strategy) {
      throw new NotFoundException('Stratégie non trouvée');
    }

    const configs = await this.prisma.tokenStrategyConfiguration.findMany({
      where: { userStrategyId: strategyId },
      include: {
        holding: {
          include: {
            token: true,
          },
        },
        strategyTemplate: true,
        profitTakingTemplate: true,
      },
    });

    return configs.map(config => this.formatTokenStrategyConfigResponse(config));
  }

  // ===== TEMPLATES =====

  async getStrategyTemplates(): Promise<StrategyTemplateResponseDto[]> {
    const templates = await this.prisma.strategyTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return templates.map(template => this.formatStrategyTemplateResponse(template));
  }

  async getProfitTakingTemplates(): Promise<ProfitTakingTemplateResponseDto[]> {
    const templates = await this.prisma.profitTakingTemplate.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return templates.map(template => this.formatProfitTakingTemplateResponse(template));
  }

  // ===== SIMULATION =====

  async simulateStrategy(userId: string, strategyId: string): Promise<SimulationResultDto[]> {
    // Vérifier que la stratégie appartient à l'utilisateur
    const strategy = await this.prisma.userStrategy.findFirst({
      where: { id: strategyId, userId },
    });

    if (!strategy) {
      throw new NotFoundException('Stratégie non trouvée');
    }

    // Récupérer les configurations de tokens
    const configs = await this.prisma.tokenStrategyConfiguration.findMany({
      where: { userStrategyId: strategyId, isActive: true },
      include: {
        holding: {
          include: {
            token: true,
          },
        },
        strategyTemplate: true,
        profitTakingTemplate: true,
      },
    });

    if (configs.length === 0) {
      throw new BadRequestException('Aucune configuration de token trouvée pour cette stratégie');
    }

    // Simuler les résultats (logique simplifiée pour l'instant)
    const simulationResults = await Promise.all(
      configs.map(async (config) => {
        const { holding } = config;
        const currentPrice = holding.currentPrice || holding.averagePrice;
        const projectedValue = Number(holding.quantity) * Number(currentPrice);
        const returnPercentage = ((Number(currentPrice) - Number(holding.averagePrice)) / Number(holding.averagePrice)) * 100;
        const remainingTokens = Number(holding.quantity); // Simplifié pour l'instant

        // Sauvegarder le résultat de simulation
        const simulationResult = await this.prisma.simulationResult.create({
          data: {
            userStrategyId: strategyId,
            tokenStrategyConfigId: config.id,
            projectedValue,
            return: returnPercentage,
            remainingTokens,
          },
          include: {
            tokenStrategyConfig: {
              include: {
                holding: {
                  include: {
                    token: true,
                  },
                },
              },
            },
          },
        });

        return this.formatSimulationResultResponse(simulationResult);
      })
    );

    return simulationResults;
  }

  // ===== HELPER METHODS =====

  private formatPortfolioResponse(portfolio: any): PortfolioResponseDto {
    return {
      id: portfolio.id,
      name: portfolio.name,
      description: portfolio.description,
      isDefault: portfolio.isDefault,
      createdAt: portfolio.createdAt,
      updatedAt: portfolio.updatedAt,
    };
  }

  private formatHoldingResponse(holding: any): HoldingResponseDto {
    // IMPORTANT: currentValue doit être calculé avec currentPrice (prix actuel du marché)
    // Si currentPrice n'est pas disponible, on utilise averagePrice uniquement pour l'affichage,
    // mais cela ne représente pas la vraie valeur actuelle du marché
    const currentPrice = holding.currentPrice ? Number(holding.currentPrice) : undefined;
    const priceForCalculation = currentPrice || Number(holding.averagePrice);
    const currentValue = Number(holding.quantity) * priceForCalculation;
    const profitLoss = currentValue - Number(holding.investedAmount);
    const profitLossPercentage = Number(holding.investedAmount) > 0 ? (profitLoss / Number(holding.investedAmount)) * 100 : 0;

    return {
      id: holding.id,
      quantity: Number(holding.quantity),
      investedAmount: Number(holding.investedAmount),
      averagePrice: Number(holding.averagePrice),
      currentPrice: currentPrice,
      lastUpdated: holding.lastUpdated,
      token: {
        id: holding.token.id,
        symbol: holding.token.symbol,
        name: holding.token.name,
        logoUrl: holding.token.logoUrl,
      },
      currentValue,
      profitLoss,
      profitLossPercentage,
    };
  }

  private formatUserStrategyResponse(strategy: any): UserStrategyResponseDto {
    return {
      id: strategy.id,
      name: strategy.name,
      description: strategy.description,
      status: strategy.status,
      createdAt: strategy.createdAt,
      updatedAt: strategy.updatedAt,
      portfolio: {
        id: strategy.portfolio.id,
        name: strategy.portfolio.name,
      },
    };
  }

  private formatTokenStrategyConfigResponse(config: any): TokenStrategyConfigResponseDto {
    return {
      id: config.id,
      holdingId: config.holdingId,
      strategyTemplateId: config.strategyTemplateId,
      profitTakingTemplateId: config.profitTakingTemplateId,
      customProfitTakingRules: config.customProfitTakingRules,
      isActive: config.isActive,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt,
      holding: {
        id: config.holding.id,
        quantity: Number(config.holding.quantity),
        investedAmount: Number(config.holding.investedAmount),
        averagePrice: Number(config.holding.averagePrice),
        token: {
          id: config.holding.token.id,
          symbol: config.holding.token.symbol,
          name: config.holding.token.name,
        },
      },
      strategyTemplate: config.strategyTemplate ? {
        id: config.strategyTemplate.id,
        name: config.strategyTemplate.name,
        type: config.strategyTemplate.type,
      } : undefined,
      profitTakingTemplate: config.profitTakingTemplate ? {
        id: config.profitTakingTemplate.id,
        name: config.profitTakingTemplate.name,
        rules: config.profitTakingTemplate.rules,
      } : undefined,
    };
  }

  private formatStrategyTemplateResponse(template: any): StrategyTemplateResponseDto {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      type: template.type,
      isDefault: template.isDefault,
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  private formatProfitTakingTemplateResponse(template: any): ProfitTakingTemplateResponseDto {
    return {
      id: template.id,
      name: template.name,
      description: template.description,
      rules: template.rules,
      isDefault: template.isDefault,
      isActive: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };
  }

  private formatSimulationResultResponse(result: any): SimulationResultDto {
    return {
      id: result.id,
      projectedValue: Number(result.projectedValue),
      return: Number(result.return),
      remainingTokens: Number(result.remainingTokens),
      simulationDate: result.simulationDate,
      tokenStrategyConfig: {
        id: result.tokenStrategyConfig.id,
        holding: {
          token: {
            symbol: result.tokenStrategyConfig.holding.token.symbol,
            name: result.tokenStrategyConfig.holding.token.name,
          },
        },
      },
    };
  }

  /**
   * Synchronise tous les portfolios avec les transactions existantes
   */
  async syncAllPortfolios(userId: string): Promise<{ message: string; portfoliosCreated: number; holdingsUpdated: number }> {
    let portfoliosCreated = 0;
    let holdingsUpdated = 0;

    try {
      // 1. S'assurer qu'un portfolio par défaut existe
      let defaultPortfolio = await this.prisma.portfolio.findFirst({
        where: { userId, isDefault: true },
      });

      if (!defaultPortfolio) {
        defaultPortfolio = await this.prisma.portfolio.create({
          data: {
            userId,
            name: 'Portfolio Principal',
            description: 'Portfolio créé automatiquement à partir des transactions',
            isDefault: true,
          },
        });
        portfoliosCreated = 1;
      }

      // 2. Mettre à jour toutes les transactions existantes pour leur assigner le portfolio par défaut
      await this.prisma.transaction.updateMany({
        where: { 
          userId,
          portfolioId: null // Seulement les transactions sans portfolioId
        },
        data: {
          portfolioId: defaultPortfolio.id,
        },
      });

      // 3. Supprimer tous les holdings existants pour recalculer
      await this.prisma.holding.deleteMany({
        where: { portfolio: { userId } }
      });

      // 4. Récupérer tous les portfolios de l'utilisateur
      const userPortfolios = await this.prisma.portfolio.findMany({
        where: { userId },
        include: {
          transactions: {
            select: { symbol: true, name: true, cmcId: true },
            distinct: ['symbol']
          }
        }
      });

      // 5. Pour chaque portfolio, recalculer les holdings
      for (const portfolio of userPortfolios) {
        for (const tx of portfolio.transactions) {
          // Créer le token s'il n'existe pas
          let token = await this.prisma.token.findUnique({
            where: { symbol: tx.symbol },
          });

          if (!token) {
            token = await this.prisma.token.create({
              data: {
                symbol: tx.symbol,
                name: tx.name,
                cmcId: tx.cmcId,
              },
            });
          }

          // Recalculer le holding pour ce portfolio spécifique
          await this.recalculateHolding(userId, portfolio.id, token.id, tx.symbol);
          holdingsUpdated++;
        }
      }

      return {
        message: 'Portfolios synchronisés avec succès',
        portfoliosCreated,
        holdingsUpdated,
      };
    } catch (error) {
      console.error('Erreur lors de la synchronisation des portfolios:', error);
      throw error;
    }
  }

  /**
   * Synchronise les transactions existantes avec un portfolio
   */
  private async syncTransactionsWithPortfolio(userId: string, portfolioId: string): Promise<void> {
    try {
      // Récupérer le portfolio par défaut
      const defaultPortfolio = await this.prisma.portfolio.findFirst({
        where: { userId, isDefault: true }
      });

      if (!defaultPortfolio) {
        console.log('Aucun portfolio par défaut trouvé, création ignorée');
        return;
      }

      // Assigner toutes les transactions sans portfolioId au portfolio par défaut
      await this.prisma.transaction.updateMany({
        where: {
          userId,
          portfolioId: null
        },
        data: {
          portfolioId: defaultPortfolio.id
        }
      });

      // Recalculer tous les holdings pour le portfolio par défaut
      const transactions = await this.prisma.transaction.findMany({
        where: { userId, portfolioId: defaultPortfolio.id },
        select: { symbol: true, name: true, cmcId: true },
        distinct: ['symbol']
      });

      for (const tx of transactions) {
        // Créer le token s'il n'existe pas
        let token = await this.prisma.token.findUnique({
          where: { symbol: tx.symbol },
        });

        if (!token) {
          token = await this.prisma.token.create({
            data: {
              symbol: tx.symbol,
              name: tx.name,
              cmcId: tx.cmcId,
            },
          });
        }

        // Recalculer le holding pour ce token dans le portfolio par défaut
        await this.recalculateHolding(userId, defaultPortfolio.id, token.id, tx.symbol);
      }
    } catch (error) {
      console.error('Erreur lors de la synchronisation des transactions avec le portfolio:', error);
    }
  }

  /**
   * Recalcule le holding d'un token basé sur les transactions du portfolio spécifique
   */
  private async recalculateHolding(userId: string, portfolioId: string, tokenId: string, symbol: string): Promise<void> {
    // Récupérer toutes les transactions pour ce token dans ce portfolio spécifique
    const transactions = await this.prisma.transaction.findMany({
      where: { 
        userId, 
        symbol,
        portfolioId: portfolioId // Seulement les transactions de ce portfolio
      },
      orderBy: { transactionDate: 'asc' },
    });

    let totalQuantity = 0;
    let totalInvested = 0;

    // Calculer les totaux
    for (const tx of transactions) {
      if (tx.type === 'BUY' || tx.type === 'TRANSFER_IN' || tx.type === 'STAKING' || tx.type === 'REWARD') {
        totalQuantity += Number(tx.quantity);
        totalInvested += Number(tx.amountInvested);
      } else if (tx.type === 'SELL' || tx.type === 'TRANSFER_OUT') {
        const sellValue = Number(tx.quantity) * Number(tx.averagePrice);
        totalQuantity = Math.max(0, totalQuantity - Number(tx.quantity));
        totalInvested = Math.max(0, totalInvested - (Number(tx.amountInvested) || sellValue));
      }
    }

    const averagePrice = totalQuantity > 0 ? totalInvested / totalQuantity : 0;

    // Mettre à jour ou créer le holding
    if (totalQuantity > 0) {
      await this.prisma.holding.upsert({
        where: {
          portfolioId_tokenId: {
            portfolioId,
            tokenId,
          },
        },
        update: {
          quantity: totalQuantity,
          investedAmount: totalInvested,
          averagePrice: averagePrice,
        },
        create: {
          portfolioId,
          tokenId,
          quantity: totalQuantity,
          investedAmount: totalInvested,
          averagePrice: averagePrice,
        },
      });
    } else {
      // Supprimer le holding si la quantité est 0
      await this.prisma.holding.deleteMany({
        where: {
          portfolioId,
          tokenId,
        },
      });
    }
  }

  // ===== STRATÉGIES THÉORIQUES =====

  async createTheoreticalStrategy(userId: string, data: any): Promise<any> {
    const strategy = await this.prisma.theoreticalStrategy.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        tokenSymbol: data.tokenSymbol,
        tokenName: data.tokenName,
        quantity: data.quantity,
        averagePrice: data.averagePrice,
        profitTargets: data.profitTargets,
        status: data.status || 'active',
      },
    });

    return this.formatTheoreticalStrategyResponse(strategy);
  }

  async getTheoreticalStrategies(userId: string): Promise<any[]> {
    const strategies = await this.prisma.theoreticalStrategy.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return strategies.map(strategy => this.formatTheoreticalStrategyResponse(strategy));
  }

  async getTheoreticalStrategyById(userId: string, id: string): Promise<any> {
    const strategy = await this.prisma.theoreticalStrategy.findFirst({
      where: { id, userId },
    });

    if (!strategy) {
      throw new NotFoundException('Stratégie non trouvée');
    }

    return this.formatTheoreticalStrategyResponse(strategy);
  }

  async updateTheoreticalStrategy(userId: string, id: string, data: any): Promise<any> {
    const strategy = await this.prisma.theoreticalStrategy.findFirst({
      where: { id, userId },
    });

    if (!strategy) {
      throw new NotFoundException('Stratégie non trouvée');
    }

    const updated = await this.prisma.theoreticalStrategy.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.quantity !== undefined && { quantity: data.quantity }),
        ...(data.averagePrice !== undefined && { averagePrice: data.averagePrice }),
        ...(data.profitTargets && { profitTargets: data.profitTargets }),
        ...(data.status && { status: data.status }),
      },
    });

    return this.formatTheoreticalStrategyResponse(updated);
  }

  async deleteTheoreticalStrategy(userId: string, id: string): Promise<void> {
    const strategy = await this.prisma.theoreticalStrategy.findFirst({
      where: { id, userId },
    });

    if (!strategy) {
      throw new NotFoundException('Stratégie non trouvée');
    }

    await this.prisma.theoreticalStrategy.delete({
      where: { id },
    });
  }

  private formatTheoreticalStrategyResponse(strategy: any): any {
    const quantity = Number(strategy.quantity);
    const averagePrice = Number(strategy.averagePrice);
    const totalInvested = quantity * averagePrice;

    // Calculer le profit attendu
    let expectedProfit = 0;
    const profitTargets = strategy.profitTargets as any[];
    
    profitTargets.forEach((target: any) => {
      const tokensToSell = (quantity * target.sellPercentage) / 100;
      let targetPrice = 0;
      
      if (target.targetType === 'percentage') {
        targetPrice = averagePrice * (1 + target.targetValue / 100);
      } else {
        targetPrice = target.targetValue;
      }
      
      const profit = tokensToSell * (targetPrice - averagePrice);
      expectedProfit += profit;
    });

    const returnPercentage = totalInvested > 0 ? (expectedProfit / totalInvested) * 100 : 0;

    return {
      id: strategy.id,
      userId: strategy.userId,
      name: strategy.name,
      description: strategy.description,
      tokenSymbol: strategy.tokenSymbol,
      tokenName: strategy.tokenName,
      quantity,
      averagePrice,
      profitTargets: strategy.profitTargets,
      status: strategy.status,
      createdAt: strategy.createdAt,
      updatedAt: strategy.updatedAt,
      totalInvested,
      expectedProfit,
      returnPercentage,
      numberOfTargets: profitTargets.length,
    };
  }

  // ===== FORECASTS (PRÉVISIONS) =====

  async createForecast(userId: string, createForecastDto: CreateForecastDto) {
    const forecast = await this.prisma.forecast.create({
      data: {
        userId,
        portfolioId: createForecastDto.portfolioId,
        name: createForecastDto.name,
        appliedStrategies: createForecastDto.appliedStrategies as any,
        summary: createForecastDto.summary as any,
        notes: createForecastDto.notes || null,
      },
    });

    const summary = forecast.summary as any;
    const parsedSummary = typeof summary === 'string' ? JSON.parse(summary) : summary;

    return {
      id: forecast.id,
      portfolioId: forecast.portfolioId,
      name: forecast.name,
      appliedStrategies: forecast.appliedStrategies as Record<string, string>,
      summary: {
        tokenCount: parsedSummary?.tokenCount ? Number(parsedSummary.tokenCount) : 0,
        totalInvested: parsedSummary?.totalInvested ? Number(parsedSummary.totalInvested) : 0,
        totalCollected: parsedSummary?.totalCollected ? Number(parsedSummary.totalCollected) : 0,
        totalProfit: parsedSummary?.totalProfit ? Number(parsedSummary.totalProfit) : 0,
        returnPercentage: parsedSummary?.returnPercentage ? Number(parsedSummary.returnPercentage) : 0,
        remainingTokensValue: parsedSummary?.remainingTokensValue ? Number(parsedSummary.remainingTokensValue) : 0,
      },
      notes: forecast.notes || undefined,
      createdAt: forecast.createdAt.toISOString(),
      updatedAt: forecast.updatedAt.toISOString(),
    };
  }

  async getUserForecasts(userId: string) {
    const forecasts = await this.prisma.forecast.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    // Récupérer les noms des portfolios
    const portfolioIds = [...new Set(forecasts.map(f => f.portfolioId))];
    const portfolios = await this.prisma.portfolio.findMany({
      where: {
        id: { in: portfolioIds },
        userId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    const portfolioMap = new Map(portfolios.map(p => [p.id, p.name]));

    return forecasts.map(forecast => {
      const summary = forecast.summary as any;
      // S'assurer que le summary est bien parsé (Prisma peut retourner un JSON string)
      const parsedSummary = typeof summary === 'string' ? JSON.parse(summary) : summary;
      
      return {
        id: forecast.id,
        name: forecast.name,
        portfolioId: forecast.portfolioId,
        portfolioName: portfolioMap.get(forecast.portfolioId) || '',
        createdAt: forecast.createdAt.toISOString(),
        summary: {
          tokenCount: parsedSummary?.tokenCount ? Number(parsedSummary.tokenCount) : 0,
          totalInvested: parsedSummary?.totalInvested ? Number(parsedSummary.totalInvested) : 0,
          totalCollected: parsedSummary?.totalCollected ? Number(parsedSummary.totalCollected) : 0,
          totalProfit: parsedSummary?.totalProfit ? Number(parsedSummary.totalProfit) : 0,
          returnPercentage: parsedSummary?.returnPercentage ? Number(parsedSummary.returnPercentage) : 0,
          remainingTokensValue: parsedSummary?.remainingTokensValue ? Number(parsedSummary.remainingTokensValue) : 0,
        },
        appliedStrategies: forecast.appliedStrategies as Record<string, string>,
        notes: forecast.notes || undefined,
      };
    });
  }

  async getForecastById(userId: string, id: string) {
    const forecast = await this.prisma.forecast.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!forecast) {
      throw new Error('Forecast not found');
    }

    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id: forecast.portfolioId },
      select: { name: true },
    });

    const summary = forecast.summary as any;
    const parsedSummary = typeof summary === 'string' ? JSON.parse(summary) : summary;

    return {
      id: forecast.id,
      name: forecast.name,
      portfolioId: forecast.portfolioId,
      portfolioName: portfolio?.name || '',
      appliedStrategies: forecast.appliedStrategies as Record<string, string>,
      summary: {
        tokenCount: parsedSummary?.tokenCount ? Number(parsedSummary.tokenCount) : 0,
        totalInvested: parsedSummary?.totalInvested ? Number(parsedSummary.totalInvested) : 0,
        totalCollected: parsedSummary?.totalCollected ? Number(parsedSummary.totalCollected) : 0,
        totalProfit: parsedSummary?.totalProfit ? Number(parsedSummary.totalProfit) : 0,
        returnPercentage: parsedSummary?.returnPercentage ? Number(parsedSummary.returnPercentage) : 0,
        remainingTokensValue: parsedSummary?.remainingTokensValue ? Number(parsedSummary.remainingTokensValue) : 0,
      },
      notes: forecast.notes || undefined,
      createdAt: forecast.createdAt.toISOString(),
      updatedAt: forecast.updatedAt.toISOString(),
    };
  }

  async updateForecast(userId: string, id: string, updateForecastDto: UpdateForecastDto) {
    // Handle notes: if notes is an empty string, set it to null
    const notesValue = updateForecastDto.notes !== undefined 
      ? (updateForecastDto.notes.trim() === '' ? null : updateForecastDto.notes.trim())
      : undefined;
    const forecast = await this.prisma.forecast.findFirst({
      where: { id, userId },
    });

    if (!forecast) {
      throw new Error('Forecast not found');
    }

    const updated = await this.prisma.forecast.update({
      where: { id },
      data: {
        ...(updateForecastDto.name && { name: updateForecastDto.name }),
        ...(updateForecastDto.appliedStrategies && {
          appliedStrategies: updateForecastDto.appliedStrategies as any,
        }),
        ...(updateForecastDto.summary && {
          summary: updateForecastDto.summary as any,
        }),
        ...(notesValue !== undefined && { notes: notesValue }),
      },
    });

    const summary = updated.summary as any;
    const parsedSummary = typeof summary === 'string' ? JSON.parse(summary) : summary;

    return {
      id: updated.id,
      portfolioId: updated.portfolioId,
      name: updated.name,
      appliedStrategies: updated.appliedStrategies as Record<string, string>,
      summary: {
        tokenCount: parsedSummary?.tokenCount ? Number(parsedSummary.tokenCount) : 0,
        totalInvested: parsedSummary?.totalInvested ? Number(parsedSummary.totalInvested) : 0,
        totalCollected: parsedSummary?.totalCollected ? Number(parsedSummary.totalCollected) : 0,
        totalProfit: parsedSummary?.totalProfit ? Number(parsedSummary.totalProfit) : 0,
        returnPercentage: parsedSummary?.returnPercentage ? Number(parsedSummary.returnPercentage) : 0,
        remainingTokensValue: parsedSummary?.remainingTokensValue ? Number(parsedSummary.remainingTokensValue) : 0,
      },
      notes: updated.notes || undefined,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  async deleteForecast(userId: string, id: string) {
    const forecast = await this.prisma.forecast.findFirst({
      where: { id, userId },
    });

    if (!forecast) {
      throw new Error('Forecast not found');
    }

    await this.prisma.forecast.delete({
      where: { id },
    });
  }

  /**
   * Récupère les détails optimisés d'un forecast avec holdings et stratégies
   * Cette méthode évite de charger toutes les données inutiles
   */
  async getForecastDetails(userId: string, forecastId: string) {
    // 1. Récupérer le forecast
    const forecast = await this.prisma.forecast.findFirst({
      where: {
        id: forecastId,
        userId,
      },
    });

    if (!forecast) {
      throw new NotFoundException('Forecast non trouvé');
    }

    const appliedStrategies = forecast.appliedStrategies as Record<string, string>;
    const holdingIds = Object.keys(appliedStrategies).filter(id => appliedStrategies[id] !== 'none');
    const strategyIds = [...new Set(Object.values(appliedStrategies).filter(id => id !== 'none'))];

    // 2. Récupérer uniquement les holdings qui ont une stratégie appliquée
    // On ne met pas à jour les prix ici car c'est coûteux et pas nécessaire pour l'affichage des détails
    const holdings = await this.prisma.holding.findMany({
      where: {
        id: { in: holdingIds },
        portfolioId: forecast.portfolioId,
      },
      include: {
        token: true,
      },
    });

    // 3. Récupérer uniquement les stratégies théoriques utilisées
    const theoreticalStrategies = strategyIds.length > 0
      ? await this.prisma.theoreticalStrategy.findMany({
          where: {
            id: { in: strategyIds },
            userId,
          },
        })
      : [];

    // 4. Récupérer uniquement les stratégies réelles utilisées
    const realStrategies = strategyIds.length > 0
      ? await this.prisma.strategy.findMany({
          where: {
            id: { in: strategyIds },
            userId,
          },
          include: {
            steps: {
              orderBy: { targetPrice: 'asc' },
            },
          },
        })
      : [];

    // 5. Formater les stratégies théoriques
    const formattedTheoreticalStrategies = theoreticalStrategies.map(strategy => {
      const profitTargets = (strategy.profitTargets as any[]).map((target: any, index: number) => ({
        order: index + 1,
        targetType: target.targetType === 'exact_price' ? 'price' : 'percentage',
        targetValue: Number(target.targetValue),
        sellPercentage: Number(target.sellPercentage),
      }));

      return {
        id: strategy.id,
        userId: strategy.userId,
        name: strategy.name,
        tokenSymbol: strategy.tokenSymbol,
        tokenName: strategy.tokenName,
        quantity: Number(strategy.quantity),
        averagePrice: Number(strategy.averagePrice),
        profitTargets,
        status: strategy.status,
        createdAt: strategy.createdAt.toISOString(),
        updatedAt: strategy.updatedAt.toISOString(),
        numberOfTargets: profitTargets.length,
      };
    });

    // 6. Formater les stratégies réelles
    const formattedRealStrategies = realStrategies.map(strategy => {
      const profitTargets = strategy.steps.map((step, index) => ({
        order: index + 1,
        targetType: step.targetType === 'exact_price' ? 'price' : 'percentage',
        targetValue: step.targetType === 'exact_price' 
          ? Number(step.targetPrice)
          : Number(step.targetPct),
        sellPercentage: Number(step.sellPct),
      }));

      return {
        id: strategy.id,
        userId: strategy.userId,
        name: strategy.name,
        tokenSymbol: strategy.asset,
        tokenName: strategy.asset, // On n'a pas le nom complet dans Strategy
        quantity: Number(strategy.baseQty),
        averagePrice: Number(strategy.refPrice),
        profitTargets,
        status: strategy.status,
        createdAt: strategy.createdAt.toISOString(),
        updatedAt: strategy.updatedAt.toISOString(),
        numberOfTargets: profitTargets.length,
      };
    });

    // 7. Combiner toutes les stratégies
    const allStrategies = [...formattedTheoreticalStrategies, ...formattedRealStrategies];
    const strategyMap = new Map(allStrategies.map(s => [s.id, s]));

    // 8. Mapper les holdings avec leurs stratégies appliquées
    const holdingsWithStrategies = holdings.map(holding => {
      const strategyId = appliedStrategies[holding.id];
      const strategy = strategyId && strategyId !== 'none' ? strategyMap.get(strategyId) : null;

      return {
        id: holding.id,
        quantity: Number(holding.quantity),
        investedAmount: Number(holding.investedAmount),
        averagePrice: Number(holding.averagePrice),
        currentPrice: holding.currentPrice ? Number(holding.currentPrice) : undefined,
        lastUpdated: holding.lastUpdated,
        token: {
          id: holding.token.id,
          symbol: holding.token.symbol,
          name: holding.token.name,
          logoUrl: holding.token.logoUrl,
        },
        strategy,
        strategyId: strategyId || null,
      };
    });

    return {
      holdings: holdingsWithStrategies,
      strategies: allStrategies,
    };
  }
}
