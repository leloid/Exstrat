import { Module } from '@nestjs/common';
import { PortfoliosController } from './portfolios.controller';
import { TemplatesController } from './templates.controller';
import { PortfoliosService } from './portfolios.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PortfoliosController, TemplatesController],
  providers: [PortfoliosService],
  exports: [PortfoliosService],
})
export class PortfoliosModule {}
