import { IsString, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export enum StrategyTemplateType {
  NO_TP = 'no_tp',
  PERCENTAGE = 'percentage',
  DCA = 'dca',
  CUSTOM = 'custom',
}

export class StrategyTemplateResponseDto {
  id: string;
  name: string;
  description?: string;
  type: StrategyTemplateType;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class ProfitTakingTemplateResponseDto {
  id: string;
  name: string;
  description?: string;
  rules: any;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SimulationResultDto {
  id: string;
  projectedValue: number;
  return: number;
  remainingTokens: number;
  simulationDate: Date;
  tokenStrategyConfig: {
    id: string;
    holding: {
      token: {
        symbol: string;
        name: string;
      };
    };
  };
}
