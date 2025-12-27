import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto, UpdateTransactionDto, TransactionSearchDto, TransactionResponseDto } from './dto/transaction.dto';
import { CreateBatchTransactionsResponseDto } from './dto/csv-import.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class TransactionsService {
  constructor(private prisma: PrismaService) {}

  async createTransaction(userId: string, createTransactionDto: CreateTransactionDto): Promise<TransactionResponseDto> {
    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        symbol: createTransactionDto.symbol,
        name: createTransactionDto.name,
        cmcId: createTransactionDto.cmcId,
        quantity: createTransactionDto.quantity,
        amountInvested: createTransactionDto.amountInvested,
        averagePrice: createTransactionDto.averagePrice,
        type: createTransactionDto.type || 'BUY', // BUY par défaut
        transactionDate: createTransactionDto.transactionDate ? new Date(createTransactionDto.transactionDate) : new Date(),
        notes: createTransactionDto.notes,
        exchangeId: createTransactionDto.exchangeId,
        portfolioId: createTransactionDto.portfolioId,
      },
    });

    // Synchroniser avec le système de portfolios
    await this.syncTransactionWithPortfolio(userId, transaction, createTransactionDto.portfolioId);

    // Recharger la transaction avec son portfolio pour la réponse
    const txWithPortfolio = await this.prisma.transaction.findUnique({
      where: { id: transaction.id },
      include: { portfolio: { select: { id: true, name: true, isDefault: true } } },
    });
    return this.mapToResponseDto(txWithPortfolio);
  }

  async createBatchTransactions(
    userId: string,
    transactions: CreateTransactionDto[],
    defaultPortfolioId?: string
  ): Promise<CreateBatchTransactionsResponseDto> {
    if (!transactions || transactions.length === 0) {
      throw new BadRequestException('Aucune transaction à créer');
    }

    if (transactions.length > 1000) {
      throw new BadRequestException('Le nombre maximum de transactions par batch est de 1000');
    }

    const created: Array<{ id: string; symbol: string; name: string }> = [];
    const failed: Array<{ index: number; transaction: any; error: string }> = [];

    // Traiter chaque transaction
    for (let i = 0; i < transactions.length; i++) {
      const txDto = transactions[i];
      
      try {
        // Utiliser le portfolioId de la transaction ou le defaultPortfolioId
        const portfolioId = txDto.portfolioId || defaultPortfolioId;

        // Valider les champs requis
        if (!txDto.symbol || !txDto.name || !txDto.cmcId) {
          throw new BadRequestException('Champs requis manquants: symbol, name, cmcId');
        }

        if (!txDto.quantity || txDto.quantity <= 0) {
          throw new BadRequestException('La quantité doit être supérieure à 0');
        }

        if (!txDto.amountInvested || txDto.amountInvested <= 0) {
          throw new BadRequestException('Le montant investi doit être supérieur à 0');
        }

        // Créer la transaction
        const transaction = await this.prisma.transaction.create({
          data: {
            userId,
            symbol: txDto.symbol,
            name: txDto.name,
            cmcId: txDto.cmcId,
            quantity: txDto.quantity,
            amountInvested: txDto.amountInvested,
            averagePrice: txDto.averagePrice || (txDto.amountInvested / txDto.quantity),
            type: txDto.type || 'BUY',
            transactionDate: txDto.transactionDate ? new Date(txDto.transactionDate) : new Date(),
            notes: txDto.notes,
            exchangeId: txDto.exchangeId,
            portfolioId: portfolioId,
          },
        });

        // Synchroniser avec le système de portfolios (en arrière-plan, ne pas bloquer)
        this.syncTransactionWithPortfolio(userId, transaction, portfolioId).catch(error => {
          console.error(`Erreur lors de la synchronisation du portfolio pour la transaction ${transaction.id}:`, error);
        });

        created.push({
          id: transaction.id,
          symbol: transaction.symbol,
          name: transaction.name,
        });
      } catch (error) {
        failed.push({
          index: i,
          transaction: txDto,
          error: error.message || 'Erreur inconnue lors de la création de la transaction',
        });
      }
    }

    return {
      created,
      failed,
      total: transactions.length,
      successCount: created.length,
      failedCount: failed.length,
    };
  }

  async findAll(userId: string, searchDto: TransactionSearchDto): Promise<{ transactions: TransactionResponseDto[], total: number, page: number, limit: number }> {
    const { symbol, type, startDate, endDate, page = 1, limit = 20 } = searchDto;
    
    const where: any = {
      userId,
    };

    if (symbol) {
      where.symbol = {
        contains: symbol,
        mode: 'insensitive',
      };
    }

    if (type) {
      where.type = type;
    }

    if (startDate || endDate) {
      where.transactionDate = {};
      if (startDate) {
        where.transactionDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.transactionDate.lte = new Date(endDate);
      }
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: { portfolio: { select: { id: true, name: true, isDefault: true } } },
        orderBy: {
          transactionDate: 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      transactions: transactions.map(transaction => this.mapToResponseDto(transaction)),
      total,
      page,
      limit,
    };
  }

  async findOne(userId: string, id: string): Promise<TransactionResponseDto> {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: { portfolio: { select: { id: true, name: true, isDefault: true } } },
    });

    if (!transaction) {
      throw new NotFoundException('Transaction non trouvée');
    }

    if (transaction.userId !== userId) {
      throw new ForbiddenException('Accès non autorisé à cette transaction');
    }

    return this.mapToResponseDto(transaction);
  }

  async update(userId: string, id: string, updateTransactionDto: UpdateTransactionDto): Promise<TransactionResponseDto> {
    const existingTransaction = await this.findOne(userId, id);

    const updateData: any = {};
    
    if (updateTransactionDto.quantity !== undefined) {
      updateData.quantity = updateTransactionDto.quantity;
    }
    if (updateTransactionDto.amountInvested !== undefined) {
      updateData.amountInvested = updateTransactionDto.amountInvested;
    }
    if (updateTransactionDto.averagePrice !== undefined) {
      updateData.averagePrice = updateTransactionDto.averagePrice;
    }
    if (updateTransactionDto.type !== undefined) {
      updateData.type = updateTransactionDto.type;
    }
    if (updateTransactionDto.transactionDate !== undefined) {
      updateData.transactionDate = new Date(updateTransactionDto.transactionDate);
    }
    if (updateTransactionDto.notes !== undefined) {
      updateData.notes = updateTransactionDto.notes;
    }
    if (updateTransactionDto.exchangeId !== undefined) {
      updateData.exchangeId = updateTransactionDto.exchangeId;
    }

    const transaction = await this.prisma.transaction.update({
      where: { id },
      data: updateData,
    });

    // Re-synchroniser avec le système de portfolios (recalculer les holdings)
    const portfolioId = existingTransaction.portfolioId;
    const symbol = existingTransaction.symbol;
    
    if (portfolioId) {
      try {
        // Récupérer le token
        const token = await this.prisma.token.findUnique({
          where: { symbol },
        });

        if (token) {
          // Recalculer le holding pour ce token dans ce portfolio
          await this.recalculateHolding(userId, portfolioId, token.id, symbol);
        }
      } catch (error) {
        console.error('Erreur lors de la synchronisation après modification:', error);
        // Ne pas faire échouer la modification si la sync échoue
      }
    }

    const txWithPortfolio = await this.prisma.transaction.findUnique({
      where: { id: transaction.id },
      include: { portfolio: { select: { id: true, name: true, isDefault: true } } },
    });
    return this.mapToResponseDto(txWithPortfolio);
  }

  async remove(userId: string, id: string): Promise<void> {
    const transaction = await this.findOne(userId, id); // Vérifie l'existence et les permissions

    // Sauvegarder les infos nécessaires avant suppression
    const portfolioId = transaction.portfolioId;
    const symbol = transaction.symbol;
    const userId_copy = userId;

    // Supprimer la transaction
    await this.prisma.transaction.delete({
      where: { id },
    });

    // Re-synchroniser le portfolio après suppression (recalculer les holdings)
    if (portfolioId) {
      try {
        // Récupérer le token
        const token = await this.prisma.token.findUnique({
          where: { symbol },
        });

        if (token) {
          // Recalculer le holding pour ce token dans ce portfolio
          await this.recalculateHolding(userId_copy, portfolioId, token.id, symbol);
        }
      } catch (error) {
        console.error('Erreur lors de la synchronisation après suppression:', error);
        // Ne pas faire échouer la suppression si la sync échoue
      }
    }
  }

  async getPortfolioSummary(userId: string): Promise<any> {
    const transactions = await this.prisma.transaction.findMany({
      where: { userId },
      orderBy: { transactionDate: 'asc' },
    });

    const portfolio: { [key: string]: any } = {};

    transactions.forEach(transaction => {
      const key = `${transaction.symbol}-${transaction.cmcId}`;
      
      if (!portfolio[key]) {
        portfolio[key] = {
          symbol: transaction.symbol,
          name: transaction.name,
          cmcId: transaction.cmcId,
          totalQuantity: 0,
          totalInvested: 0,
          averagePrice: 0,
          transactions: [],
        };
      }

      const portfolioItem = portfolio[key];

      if (transaction.type === 'BUY' || transaction.type === 'TRANSFER_IN' || transaction.type === 'STAKING' || transaction.type === 'REWARD') {
        // Achat ou entrée
        const newTotalQuantity = Number(portfolioItem.totalQuantity) + Number(transaction.quantity);
        const newTotalInvested = Number(portfolioItem.totalInvested) + Number(transaction.amountInvested);
        
        portfolioItem.totalQuantity = newTotalQuantity;
        portfolioItem.totalInvested = newTotalInvested;
        portfolioItem.averagePrice = newTotalQuantity > 0 ? newTotalInvested / newTotalQuantity : 0;
      } else if (transaction.type === 'SELL' || transaction.type === 'TRANSFER_OUT') {
        // Vente ou sortie
        const sellValue = Number(transaction.quantity) * Number(transaction.averagePrice);
        portfolioItem.totalQuantity = Math.max(0, Number(portfolioItem.totalQuantity) - Number(transaction.quantity));
        portfolioItem.totalInvested = Math.max(0, Number(portfolioItem.totalInvested) - (Number(transaction.amountInvested) || sellValue));
        portfolioItem.averagePrice = portfolioItem.totalQuantity > 0 ? portfolioItem.totalInvested / portfolioItem.totalQuantity : 0;
      }

      portfolioItem.transactions.push({
        id: transaction.id,
        type: transaction.type,
        quantity: Number(transaction.quantity),
        amountInvested: Number(transaction.amountInvested),
        averagePrice: Number(transaction.averagePrice),
        transactionDate: transaction.transactionDate,
        notes: transaction.notes,
      });
    });

    // Filtrer les positions avec quantité > 0
    const activePositions = Object.values(portfolio).filter((position: any) => position.totalQuantity > 0);

    return {
      totalPositions: activePositions.length,
      totalInvested: activePositions.reduce((sum: number, position: any) => sum + position.totalInvested, 0),
      positions: activePositions,
    };
  }

  /**
   * Synchronise tous les portfolios avec les transactions existantes
   * Utile pour migrer les données existantes
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

      // 3. Récupérer tous les tokens uniques des transactions
      const transactions = await this.prisma.transaction.findMany({
        where: { userId },
        select: { symbol: true, name: true, cmcId: true },
        distinct: ['symbol'],
      });

      // 4. Pour chaque token, créer le token et synchroniser le holding
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

        // Synchroniser le holding
        await this.recalculateHolding(userId, defaultPortfolio.id, token.id, tx.symbol);
        holdingsUpdated++;
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

  private mapToResponseDto(transaction: any): TransactionResponseDto {
    return {
      id: transaction.id,
      userId: transaction.userId,
      symbol: transaction.symbol,
      name: transaction.name,
      cmcId: transaction.cmcId,
      quantity: Number(transaction.quantity),
      amountInvested: Number(transaction.amountInvested),
      averagePrice: Number(transaction.averagePrice),
      type: transaction.type,
      transactionDate: transaction.transactionDate,
      notes: transaction.notes,
      exchangeId: transaction.exchangeId,
      portfolioId: transaction.portfolioId ?? undefined,
      portfolio: transaction.portfolio
        ? { id: transaction.portfolio.id, name: transaction.portfolio.name, isDefault: transaction.portfolio.isDefault }
        : undefined,
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }

  /**
   * Synchronise une transaction avec le système de portfolios
   * Utilise le portfolio spécifié ou crée un portfolio par défaut
   */
  private async syncTransactionWithPortfolio(userId: string, transaction: any, portfolioId?: string): Promise<void> {
    try {
      let targetPortfolio;

      if (portfolioId) {
        // Utiliser le portfolio spécifié
        targetPortfolio = await this.prisma.portfolio.findFirst({
          where: { id: portfolioId, userId },
        });

        if (!targetPortfolio) {
          throw new Error(`Portfolio ${portfolioId} non trouvé ou n'appartient pas à l'utilisateur`);
        }
      } else {
        // Utiliser le portfolio par défaut ou en créer un
        targetPortfolio = await this.prisma.portfolio.findFirst({
          where: { userId, isDefault: true },
        });

        if (!targetPortfolio) {
          targetPortfolio = await this.prisma.portfolio.create({
            data: {
              userId,
              name: 'Portfolio Principal',
              description: 'Portfolio créé automatiquement à partir des transactions',
              isDefault: true,
            },
          });
        }
      }

      // 2. S'assurer que le token existe
      let token = await this.prisma.token.findUnique({
        where: { symbol: transaction.symbol },
      });

      if (!token) {
        token = await this.prisma.token.create({
          data: {
            symbol: transaction.symbol,
            name: transaction.name,
            cmcId: transaction.cmcId,
          },
        });
      }

      // 3. Calculer le nouveau holding basé sur toutes les transactions
      await this.recalculateHolding(userId, targetPortfolio.id, token.id, transaction.symbol);
    } catch (error) {
      console.error('Erreur lors de la synchronisation avec le portfolio:', error);
      // Ne pas faire échouer la transaction si la sync échoue
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
          lastUpdated: new Date(),
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
}
