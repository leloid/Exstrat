import { Injectable, NotFoundException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TokensService } from '../tokens/tokens.service';
import { CreatePortfolioDto, UpdatePortfolioDto, PortfolioResponseDto } from './dto/portfolio.dto';
import { CreateHoldingDto, UpdateHoldingDto, HoldingResponseDto } from './dto/holding.dto';
import { CreateUserStrategyDto, UpdateUserStrategyDto, UserStrategyResponseDto, TokenStrategyConfigDto, TokenStrategyConfigResponseDto } from './dto/user-strategy.dto';
import { StrategyTemplateResponseDto, ProfitTakingTemplateResponseDto, SimulationResultDto } from './dto/template.dto';

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

    // Supprimer dans l'ordre pour respecter les contraintes de clés étrangères
    // 1. Supprimer les holdings associés
    await this.prisma.holding.deleteMany({
      where: { portfolioId },
    });

    // 2. Supprimer les transactions associées (ou les réassigner à null)
    // Option 1: Supprimer les transactions
    await this.prisma.transaction.deleteMany({
      where: { portfolioId },
    });
    
    // Option 2 (alternative): Réassigner les transactions à null
    // await this.prisma.transaction.updateMany({
    //   where: { portfolioId },
    //   data: { portfolioId: null },
    // });

    // 3. Supprimer le portfolio
    await this.prisma.portfolio.delete({
      where: { id: portfolioId },
    });
  }

  // ===== HOLDINGS =====

  async getPortfolioHoldings(userId: string, portfolioId: string): Promise<HoldingResponseDto[]> {
    // Vérifier que le portfolio appartient à l'utilisateur
    const portfolio = await this.prisma.portfolio.findFirst({
      where: { id: portfolioId, userId },
    });

    if (!portfolio) {
      throw new NotFoundException('Portfolio non trouvé');
    }

    const holdings = await this.prisma.holding.findMany({
      where: { portfolioId },
      include: {
        token: true,
      },
      orderBy: { token: { symbol: 'asc' } },
    });

    // Mettre à jour les prix actuels depuis CoinMarketCap
    await this.updateHoldingsPrices(holdings);

    return holdings.map(holding => this.formatHoldingResponse(holding));
  }

  /**
   * Met à jour les prix actuels des holdings depuis CoinMarketCap
   */
  private async updateHoldingsPrices(holdings: any[]): Promise<void> {
    // Mettre à jour les prix en parallèle pour améliorer les performances
    const updatePromises = holdings.map(async (holding) => {
      if (!holding.token?.cmcId) {
        this.logger.warn(`Token ${holding.token?.symbol} n'a pas de cmcId, impossible de mettre à jour le prix`);
        return;
      }

      try {
        // Récupérer le prix actuel depuis CoinMarketCap
        const tokenData = await this.tokensService.getTokenById(holding.token.cmcId);
        const currentPrice = tokenData.quote?.USD?.price;

        if (currentPrice && currentPrice > 0) {
          // Mettre à jour le prix actuel dans la base de données
          await this.prisma.holding.update({
            where: { id: holding.id },
            data: {
              currentPrice: currentPrice,
              lastUpdated: new Date(),
            },
          });

          // Mettre à jour l'objet holding en mémoire pour la réponse
          holding.currentPrice = currentPrice.toString(); // Convertir en string pour correspondre au type Decimal de Prisma
          holding.lastUpdated = new Date();
        }
      } catch (error) {
        // Ne pas faire échouer la requête si la mise à jour du prix échoue
        this.logger.warn(`Erreur lors de la mise à jour du prix pour ${holding.token?.symbol}: ${error.message}`);
      }
    });

    // Attendre que toutes les mises à jour soient terminées
    await Promise.all(updatePromises);
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
    const currentPrice = holding.currentPrice || holding.averagePrice;
    const currentValue = Number(holding.quantity) * Number(currentPrice);
    const profitLoss = currentValue - Number(holding.investedAmount);
    const profitLossPercentage = (profitLoss / Number(holding.investedAmount)) * 100;

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
}
