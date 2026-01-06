import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailService } from './email.service';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  /**
   * Endpoint de test pour envoyer un email d'alerte de stratégie
   * POST /email/test/strategy-alert
   * 
   * ⚠️ Pour les tests, le guard est désactivé. Réactivez-le en production.
   */
  @Post('test/strategy-alert')
  // @UseGuards(JwtAuthGuard) // Décommenter en production
  async testStrategyAlert(@Body() body?: { email?: string }) {
    const testEmail = body?.email || 'delivered@resend.dev';

    await this.emailService.sendStrategyAlert({
      to: testEmail,
      userName: 'Test User',
      strategyName: 'Test Strategy',
      tokenSymbol: 'BTC',
      currentPrice: 50000,
      targetPrice: 48000,
      stepOrder: 'TP1',
    });

    return {
      success: true,
      message: `Test email sent to ${testEmail}`,
    };
  }

  /**
   * Endpoint de test pour envoyer un email d'alerte de TP
   * POST /email/test/tp-alert
   * 
   * ⚠️ Pour les tests, le guard est désactivé. Réactivez-le en production.
   */
  @Post('test/tp-alert')
  // @UseGuards(JwtAuthGuard) // Décommenter en production
  async testTPAlert(@Body() body?: { email?: string }) {
    const testEmail = body?.email || 'delivered@resend.dev';

    await this.emailService.sendTPAlert({
      to: testEmail,
      userName: 'Test User',
      tokenSymbol: 'ETH',
      currentPrice: 3500,
      targetPrice: 3400,
      tpOrder: 1,
    });

    return {
      success: true,
      message: `Test email sent to ${testEmail}`,
    };
  }
}

