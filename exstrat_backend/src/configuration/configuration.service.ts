import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ConfigurationService {
  constructor(private prisma: PrismaService) {}

  // ===== CONFIGURATION D'ALERTES (DEPRECATED) =====
  // Les méthodes d'alertes ont été déplacées dans StrategiesService
  // Ce service est conservé pour d'éventuelles futures fonctionnalités de configuration
}
