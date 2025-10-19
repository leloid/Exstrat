import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTransactionDto, UpdateTransactionDto, TransactionSearchDto, TransactionResponseDto } from './dto/transaction.dto';
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
        type: createTransactionDto.type,
        transactionDate: createTransactionDto.transactionDate ? new Date(createTransactionDto.transactionDate) : new Date(),
        notes: createTransactionDto.notes,
        exchangeId: createTransactionDto.exchangeId,
      },
    });

    return this.mapToResponseDto(transaction);
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

    return this.mapToResponseDto(transaction);
  }

  async remove(userId: string, id: string): Promise<void> {
    await this.findOne(userId, id); // Vérifie l'existence et les permissions

    await this.prisma.transaction.delete({
      where: { id },
    });
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
      createdAt: transaction.createdAt,
      updatedAt: transaction.updatedAt,
    };
  }
}
