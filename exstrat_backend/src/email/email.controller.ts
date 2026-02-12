import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, BadRequestException, UseInterceptors, UploadedFiles } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { IsEmail, IsString, IsOptional, MaxLength, ValidateIf } from 'class-validator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { EmailService } from './email.service';
import { Public } from '../auth/decorators/public.decorator';
import { memoryStorage } from 'multer';

type MulterFile = Express.Multer.File;

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_FILES = 5;
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

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
   * Endpoint de test pour les alertes step (before TP et TP reached).
   * POST /email/test/step-alert
   * Body: { "email": "optional@email.com", "type": "beforeTP" | "tpReached" }
   * 
   * En local: configure RESEND_API_KEY puis appelle cet endpoint pour recevoir
   * un email identique à celui envoyé par les alertes réelles.
   */
  @Post('test/step-alert')
  async testStepAlert(@Body() body?: { email?: string; type?: 'beforeTP' | 'tpReached' }) {
    const testEmail = body?.email || 'delivered@resend.dev';
    const type = body?.type || 'tpReached';

    const stepOrder = type === 'beforeTP'
      ? 'TP 2 (2% avant)'
      : 'TP 2';

    await this.emailService.sendStrategyAlert({
      to: testEmail,
      userName: 'Test User',
      strategyName: 'Ma Stratégie BTC',
      tokenSymbol: 'BTC',
      currentPrice: type === 'beforeTP' ? 49000 : 50000,
      targetPrice: 50000,
      stepOrder,
    });

    return {
      success: true,
      message: `Test step alert (${type}) sent to ${testEmail}`,
    };
  }

  /**
   * Endpoint pour envoyer un feedback utilisateur
   * POST /email/feedback
   */
  @Public()
  @Post('feedback')
  @UseInterceptors(
    FilesInterceptor('images', MAX_FILES, {
      storage: memoryStorage(),
      limits: {
        fileSize: MAX_FILE_SIZE,
        files: MAX_FILES,
      },
      fileFilter: (req, file, cb) => {
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          return cb(
            new BadRequestException(
              `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
            ),
            false
          );
        }
        cb(null, true);
      },
    })
  )
  @HttpCode(HttpStatus.OK)
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ 
    summary: 'Send user feedback',
    description: 'Sends a feedback email from the user to contact@exstrat.io with optional images'
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        name: { type: 'string' },
        message: { type: 'string' },
        images: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
      required: ['email', 'message'],
    },
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
  async sendFeedback(
    @Body() feedbackDto: FeedbackDto,
    @UploadedFiles() files?: MulterFile[]
  ) {
    // Extract and validate data (FormData values are strings)
    const email = typeof feedbackDto.email === 'string' ? feedbackDto.email : String(feedbackDto.email || '');
    const name = feedbackDto.name ? (typeof feedbackDto.name === 'string' ? feedbackDto.name : String(feedbackDto.name)) : undefined;
    const message = typeof feedbackDto.message === 'string' ? feedbackDto.message : String(feedbackDto.message || '');

    // Validate email format
    if (!email || !email.includes('@')) {
      throw new BadRequestException('Valid email is required');
    }

    // Validate minimum 20 characters
    const charCount = message.trim().length;
    if (charCount < 20) {
      throw new BadRequestException(`Message must contain at least 20 characters. Current: ${charCount} characters.`);
    }

    // Validate files
    if (files && files.length > MAX_FILES) {
      throw new BadRequestException(`Maximum ${MAX_FILES} images allowed`);
    }

    if (files) {
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
          throw new BadRequestException(`File ${file.originalname} exceeds maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
        }
        if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
          throw new BadRequestException(`File ${file.originalname} has invalid type. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`);
        }
      }
    }

    await this.emailService.sendFeedbackEmail({
      from: email.trim(),
      userName: name?.trim(),
      message: message.trim(),
      images: files || [],
    });

    return {
      success: true,
      message: 'Feedback sent successfully',
    };
  }
}

