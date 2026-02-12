import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { getQueueToken } from '@nestjs/bull';
import { AlertService } from './alert.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AlertService', () => {
  let service: AlertService;
  let prisma: PrismaService;
  let emailQueue: { add: jest.Mock };

  const mockRedis = {
    set: jest.fn().mockResolvedValue('OK'),
  };

  const createMockStepAlert = (overrides: Partial<{
    id: string;
    stepId: string;
    beforeTPEnabled: boolean;
    beforeTPPercentage: number | null;
    tpReachedEnabled: boolean;
    beforeTPEmailSentAt: Date | null;
    tpReachedEmailSentAt: Date | null;
    step: any;
  }> = {}) => ({
    id: 'step-alert-1',
    stepId: 'step-1',
    beforeTPEnabled: true,
    beforeTPPercentage: 2,
    tpReachedEnabled: true,
    beforeTPEmailSentAt: null,
    tpReachedEmailSentAt: null,
    step: {
      id: 'step-1',
      targetPrice: 100,
      targetType: 'exact_price',
      strategy: {
        id: 'strat-1',
        userId: 'user-1',
        asset: 'BTC',
        status: 'active',
        strategyAlert: { isActive: true, notificationChannels: { email: true } },
        steps: [{ id: 'step-1' }, { id: 'step-2' }],
      },
    },
    ...overrides,
  });

  beforeEach(async () => {
    emailQueue = { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AlertService,
        {
          provide: 'REDIS_CLIENT',
          useValue: mockRedis,
        },
        {
          provide: getQueueToken('send-email'),
          useValue: emailQueue,
        },
        {
          provide: PrismaService,
          useValue: {
            token: { findFirst: jest.fn() },
            stepAlert: { findMany: jest.fn() },
          },
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('300') },
        },
      ],
    }).compile();

    service = module.get<AlertService>(AlertService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('checkAlertsForToken', () => {
    it('should add beforeTP job when price is in before-TP zone and email not sent', async () => {
      const stepAlert = createMockStepAlert({
        beforeTPEnabled: true,
        beforeTPPercentage: 2,
        beforeTPEmailSentAt: null,
        tpReachedEmailSentAt: null,
      });
      // step.targetPrice = 100, beforeTPPrice = 98. Price 99 is in zone [98, 100).
      (prisma.token.findFirst as jest.Mock).mockResolvedValue({ symbol: 'BTC' });
      (prisma.stepAlert.findMany as jest.Mock).mockResolvedValue([stepAlert]);

      await service.checkAlertsForToken(1, 99);

      expect(emailQueue.add).toHaveBeenCalledWith(
        'send-step-alert',
        expect.objectContaining({
          userId: 'user-1',
          stepAlertId: 'step-alert-1',
          alertType: 'beforeTP',
          currentPrice: 99,
          targetPrice: 100,
        }),
      );
    });

    it('should NOT add beforeTP job when beforeTPEmailSentAt is set', async () => {
      const stepAlert = createMockStepAlert({
        beforeTPEnabled: true,
        beforeTPPercentage: 2,
        beforeTPEmailSentAt: new Date(),
        tpReachedEmailSentAt: null,
      });
      (prisma.token.findFirst as jest.Mock).mockResolvedValue({ symbol: 'BTC' });
      (prisma.stepAlert.findMany as jest.Mock).mockResolvedValue([stepAlert]);

      await service.checkAlertsForToken(1, 99);

      const beforeTPCalls = (emailQueue.add as jest.Mock).mock.calls.filter(
        (c) => c[1]?.alertType === 'beforeTP',
      );
      expect(beforeTPCalls).toHaveLength(0);
    });

    it('should add tpReached job when price >= target and email not sent', async () => {
      const stepAlert = createMockStepAlert({
        beforeTPEnabled: false,
        tpReachedEnabled: true,
        beforeTPEmailSentAt: null,
        tpReachedEmailSentAt: null,
      });
      (prisma.token.findFirst as jest.Mock).mockResolvedValue({ symbol: 'BTC' });
      (prisma.stepAlert.findMany as jest.Mock).mockResolvedValue([stepAlert]);

      await service.checkAlertsForToken(1, 100);

      expect(emailQueue.add).toHaveBeenCalledWith(
        'send-step-alert',
        expect.objectContaining({
          userId: 'user-1',
          stepAlertId: 'step-alert-1',
          alertType: 'tpReached',
          currentPrice: 100,
          targetPrice: 100,
        }),
      );
    });

    it('should NOT add tpReached job when tpReachedEmailSentAt is set', async () => {
      const stepAlert = createMockStepAlert({
        tpReachedEnabled: true,
        tpReachedEmailSentAt: new Date(),
      });
      (prisma.token.findFirst as jest.Mock).mockResolvedValue({ symbol: 'BTC' });
      (prisma.stepAlert.findMany as jest.Mock).mockResolvedValue([stepAlert]);

      await service.checkAlertsForToken(1, 100);

      const tpReachedCalls = (emailQueue.add as jest.Mock).mock.calls.filter(
        (c) => c[1]?.alertType === 'tpReached',
      );
      expect(tpReachedCalls).toHaveLength(0);
    });

    it('should not add beforeTP when price is below before-TP zone', async () => {
      const stepAlert = createMockStepAlert({
        beforeTPPercentage: 2,
        beforeTPEmailSentAt: null,
      });
      // beforeTPPrice = 98. Price 97 is below zone.
      (prisma.token.findFirst as jest.Mock).mockResolvedValue({ symbol: 'BTC' });
      (prisma.stepAlert.findMany as jest.Mock).mockResolvedValue([stepAlert]);

      await service.checkAlertsForToken(1, 97);

      const beforeTPCalls = (emailQueue.add as jest.Mock).mock.calls.filter(
        (c) => c[1]?.alertType === 'beforeTP',
      );
      expect(beforeTPCalls).toHaveLength(0);
    });

    it('should not add tpReached when price is below target', async () => {
      const stepAlert = createMockStepAlert({
        tpReachedEnabled: true,
        tpReachedEmailSentAt: null,
      });
      (prisma.token.findFirst as jest.Mock).mockResolvedValue({ symbol: 'BTC' });
      (prisma.stepAlert.findMany as jest.Mock).mockResolvedValue([stepAlert]);

      await service.checkAlertsForToken(1, 99);

      const tpReachedCalls = (emailQueue.add as jest.Mock).mock.calls.filter(
        (c) => c[1]?.alertType === 'tpReached',
      );
      expect(tpReachedCalls).toHaveLength(0);
    });
  });
});
