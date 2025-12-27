import { Module } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { TransactionsController } from './transactions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { CsvParserService } from './csv-parser.service';
import { TokensModule } from '../tokens/tokens.module';

@Module({
  imports: [PrismaModule, TokensModule],
  controllers: [TransactionsController],
  providers: [TransactionsService, CsvParserService],
  exports: [TransactionsService],
})
export class TransactionsModule {}
