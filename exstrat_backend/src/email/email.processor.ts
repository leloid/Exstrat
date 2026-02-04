import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { EmailService } from './email.service';
import { PrismaService } from '../prisma/prisma.service';

interface StrategyAlertJob {
  userId: string;
  strategyId: string;
  stepId: string;
  tokenSymbol: string;
  currentPrice: number;
  targetPrice: number;
  stepOrder: string;
}

interface TPAlertJob {
  userId: string;
  tpAlertId: string;
  tokenSymbol: string;
  currentPrice: number;
  targetPrice: number;
  tpOrder: number;
}

@Processor('send-email')
export class EmailProcessor {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService,
  ) {}

  @Process('send-alert')
  async handleStrategyAlert(job: Job<StrategyAlertJob>) {
    const { userId, strategyId, stepId, tokenSymbol, currentPrice, targetPrice, stepOrder } =
      job.data;

    this.logger.log(`Processing strategy alert email for user ${userId}, strategy ${strategyId}`);

    try {
      // Récupérer l'utilisateur pour obtenir l'email
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        this.logger.error(`User ${userId} not found`);
        return;
      }

      // Récupérer la stratégie pour obtenir le nom
      const strategy = await this.prisma.strategy.findUnique({
        where: { id: strategyId },
        select: { name: true },
      });

      if (!strategy) {
        this.logger.error(`Strategy ${strategyId} not found`);
        return;
      }

      // Envoyer l'email
      await this.emailService.sendStrategyAlert({
        to: user.email,
        userName: user.email.split('@')[0], // Utiliser la partie avant @ comme nom
        strategyName: strategy.name,
        tokenSymbol,
        currentPrice,
        targetPrice,
        stepOrder,
      });

      // Marquer le step comme "triggered" pour éviter les renvois
      await this.prisma.strategyStep.update({
        where: { id: stepId },
        data: {
          state: 'triggered',
          triggeredAt: new Date(),
        },
      });

      this.logger.log(`Strategy alert email sent successfully to ${user.email}. Step ${stepId} marked as triggered.`);
    } catch (error) {
      this.logger.error(`Error processing strategy alert email:`, error);
      throw error; // BullMQ va retry automatiquement
    }
  }

  @Process('send-tp-alert')
  async handleTPAlert(job: Job<TPAlertJob>) {
    const { userId, tpAlertId, tokenSymbol, currentPrice, targetPrice, tpOrder } = job.data;

    this.logger.log(`Processing TP alert email for user ${userId}, TP alert ${tpAlertId}`);

    try {
      // Récupérer l'utilisateur pour obtenir l'email
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { email: true },
      });

      if (!user) {
        this.logger.error(`User ${userId} not found`);
        return;
      }

      // Envoyer l'email
      await this.emailService.sendTPAlert({
        to: user.email,
        userName: user.email.split('@')[0],
        tokenSymbol,
        currentPrice,
        targetPrice,
        tpOrder,
      });

      // Note: Les alertes sont maintenant gérées via StepAlert, pas TPAlert
      // La désactivation de l'alerte sera gérée par le service d'alertes
      this.logger.log(`TP alert email sent successfully to ${user.email}.`);
    } catch (error) {
      this.logger.error(`Error processing TP alert email:`, error);
      throw error; // BullMQ va retry automatiquement
    }
  }
}

