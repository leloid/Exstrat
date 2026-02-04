import { IsString, IsNotEmpty, IsBoolean, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// DTO pour les canaux de notification
export class NotificationChannelsDto {
  @ApiProperty({ description: 'Activer les notifications par email', default: true })
  @IsBoolean()
  email: boolean;

  @ApiProperty({ description: 'Activer les notifications push', default: true })
  @IsBoolean()
  push: boolean;
}

// DTO pour créer/mettre à jour StrategyAlert
export class CreateStrategyAlertDto {
  @ApiProperty({ description: 'ID de la stratégie' })
  @IsString()
  @IsNotEmpty()
  strategyId: string;

  @ApiProperty({ description: 'Canaux de notification' })
  @ValidateNested()
  @Type(() => NotificationChannelsDto)
  notificationChannels: NotificationChannelsDto;

  @ApiProperty({ description: 'Activer la configuration', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateStrategyAlertDto {
  @ApiProperty({ description: 'Canaux de notification', required: false })
  @ValidateNested()
  @Type(() => NotificationChannelsDto)
  @IsOptional()
  notificationChannels?: NotificationChannelsDto;

  @ApiProperty({ description: 'Activer la configuration', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// DTO pour créer/mettre à jour StepAlert
export class CreateStepAlertDto {
  @ApiProperty({ description: 'ID du step (StrategyStep)', required: false })
  @IsString()
  @IsOptional()
  stepId?: string; // Optionnel car récupéré depuis les paramètres de route

  @ApiProperty({ description: 'Activer l\'alerte avant d\'atteindre le TP', default: true })
  @IsBoolean()
  @IsOptional()
  beforeTPEnabled?: boolean;

  @ApiProperty({ description: 'Activer l\'alerte quand le TP est atteint', default: true })
  @IsBoolean()
  @IsOptional()
  tpReachedEnabled?: boolean;
}

export class UpdateStepAlertDto {
  @ApiProperty({ description: 'Activer l\'alerte avant d\'atteindre le TP', required: false })
  @IsBoolean()
  @IsOptional()
  beforeTPEnabled?: boolean;

  @ApiProperty({ description: 'Activer l\'alerte quand le TP est atteint', required: false })
  @IsBoolean()
  @IsOptional()
  tpReachedEnabled?: boolean;
}

// DTOs de réponse
export class StrategyAlertResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  strategyId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  notificationChannels: {
    email: boolean;
    push: boolean;
  };

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class StepAlertResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  stepId: string;

  @ApiProperty()
  strategyId: string;

  @ApiProperty()
  beforeTPEnabled: boolean;

  @ApiProperty()
  tpReachedEnabled: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

