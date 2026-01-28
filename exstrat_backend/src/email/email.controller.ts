import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, MaxLength, ValidateIf } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailService } from './email.service';
import { Public } from '../auth/decorators/public.decorator';

class FeedbackDto {
  @IsEmail({}, { message: 'Email must be valid' })
  email: string;

  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  name?: string;

  @IsString({ message: 'Message must be a string' })
  @MaxLength(2000, { message: 'Message must not exceed 2000 characters' })
  message: string;
}

@ApiTags('Email')
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

  /**
   * Endpoint pour envoyer un feedback utilisateur
   * POST /email/feedback
   */
  @Public()
  @Post('feedback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Send user feedback',
    description: 'Sends a feedback email from the user to contact@exstrat.io'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Feedback email sent successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Feedback sent successfully' }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Invalid data',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: { type: 'array', items: { type: 'string' } },
        error: { type: 'string', example: 'Bad Request' }
      }
    }
  })
  async sendFeedback(@Body() feedbackDto: FeedbackDto) {
    const { email, name, message } = feedbackDto;

    // Validate minimum 20 characters
    const charCount = message.trim().length;
    if (charCount < 20) {
      throw new BadRequestException(`Message must contain at least 20 characters. Current: ${charCount} characters.`);
    }

    await this.emailService.sendFeedbackEmail({
      from: email,
      userName: name,
      message,
    });

    return {
      success: true,
      message: 'Feedback sent successfully',
    };
  }
}

