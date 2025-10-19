import { Controller, Get } from '@nestjs/common';
import { PortfoliosService } from './portfolios.service';

@Controller('portfolios/templates')
export class TemplatesController {
  constructor(private readonly portfoliosService: PortfoliosService) {}

  @Get('strategies')
  async getStrategyTemplates() {
    return this.portfoliosService.getStrategyTemplates();
  }

  @Get('profit-taking')
  async getProfitTakingTemplates() {
    return this.portfoliosService.getProfitTakingTemplates();
  }
}
