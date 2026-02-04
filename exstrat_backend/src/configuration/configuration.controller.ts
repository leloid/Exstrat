import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { ConfigurationService } from './configuration.service';

@ApiTags('Configuration')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('configuration')
export class ConfigurationController {
  constructor(private readonly configurationService: ConfigurationService) {}

  // ===== CONFIGURATION D'ALERTES (DEPRECATED) =====
  // Les alertes sont maintenant gérées directement dans le module Strategies
  // Utiliser les endpoints /strategies/:strategyId/alerts et /strategies/steps/:stepId/alerts
}
