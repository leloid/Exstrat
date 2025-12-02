import { IsString, IsNotEmpty, IsObject, IsOptional, IsBoolean, IsNumber, IsInt, Min, Max, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

// DTO pour les canaux de notification
export class NotificationChannelsDto {
  @ApiProperty({ description: 'Activer les notifications email', default: true })
  @IsBoolean()
  email: boolean;

  @ApiProperty({ description: 'Activer les notifications push', default: false })
  @IsBoolean()
  push: boolean;
}

// DTO pour l'alerte "Avant le TP"
export class BeforeTPAlertDto {
  @ApiProperty({ description: 'Activer l\'alerte avant le TP', default: true })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ description: 'Valeur de l\'alerte (pourcentage ou valeur absolue)', required: false })
  @IsNumber()
  @IsOptional()
  value?: number;

  @ApiProperty({ description: 'Type de valeur (percentage ou absolute)', enum: ['percentage', 'absolute'], default: 'percentage' })
  @IsString()
  @IsOptional()
  type?: 'percentage' | 'absolute';
}

// DTO pour l'alerte "TP Atteint"
export class TPReachedAlertDto {
  @ApiProperty({ description: 'Activer l\'alerte quand le TP est atteint', default: true })
  @IsBoolean()
  enabled: boolean;
}

// DTO pour créer/modifier une alerte TP
export class CreateTPAlertDto {
  @ApiProperty({ description: 'Ordre du TP (1, 2, 3, etc.)' })
  @IsInt()
  @Min(1)
  tpOrder: number;

  @ApiProperty({ description: 'Prix cible du TP' })
  @IsNumber()
  targetPrice: number;

  @ApiProperty({ description: 'Quantité à vendre' })
  @IsNumber()
  sellQuantity: number;

  @ApiProperty({ description: 'Montant encaissé projeté' })
  @IsNumber()
  projectedAmount: number;

  @ApiProperty({ description: 'Valeur restante après la vente' })
  @IsNumber()
  remainingValue: number;

  @ApiProperty({ description: 'Configuration de l\'alerte "Avant le TP"' })
  @ValidateNested()
  @Type(() => BeforeTPAlertDto)
  beforeTP: BeforeTPAlertDto;

  @ApiProperty({ description: 'Configuration de l\'alerte "TP Atteint"' })
  @ValidateNested()
  @Type(() => TPReachedAlertDto)
  tpReached: TPReachedAlertDto;

  @ApiProperty({ description: 'Activer cette alerte', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateTPAlertDto {
  @ApiProperty({ description: 'Configuration de l\'alerte "Avant le TP"', required: false })
  @ValidateNested()
  @Type(() => BeforeTPAlertDto)
  @IsOptional()
  beforeTP?: BeforeTPAlertDto;

  @ApiProperty({ description: 'Configuration de l\'alerte "TP Atteint"', required: false })
  @ValidateNested()
  @Type(() => TPReachedAlertDto)
  @IsOptional()
  tpReached?: TPReachedAlertDto;

  @ApiProperty({ description: 'Activer cette alerte', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// DTO pour créer/modifier une alerte token
export class CreateTokenAlertDto {
  @ApiProperty({ description: 'ID du holding (token)' })
  @IsString()
  @IsNotEmpty()
  holdingId: string;

  @ApiProperty({ description: 'Symbole du token' })
  @IsString()
  @IsNotEmpty()
  tokenSymbol: string;

  @ApiProperty({ description: 'ID de la stratégie théorique associée', required: false })
  @IsString()
  @IsOptional()
  strategyId?: string;

  @ApiProperty({ description: 'Nombre de TP configurés' })
  @IsInt()
  @Min(1)
  numberOfTargets: number;

  @ApiProperty({ description: 'Liste des alertes TP' })
  @ValidateNested({ each: true })
  @Type(() => CreateTPAlertDto)
  tpAlerts: CreateTPAlertDto[];

  @ApiProperty({ description: 'Activer cette alerte token', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

export class UpdateTokenAlertDto {
  @ApiProperty({ description: 'ID de la stratégie théorique associée', required: false })
  @IsString()
  @IsOptional()
  strategyId?: string;

  @ApiProperty({ description: 'Nombre de TP configurés', required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  numberOfTargets?: number;

  @ApiProperty({ description: 'Activer cette alerte token', required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}

// DTO pour créer une configuration d'alertes
export class CreateAlertConfigurationDto {
  @ApiProperty({ description: 'ID de la prévision' })
  @IsString()
  @IsNotEmpty()
  forecastId: string;

  @ApiProperty({ description: 'Canaux de notification' })
  @ValidateNested()
  @Type(() => NotificationChannelsDto)
  notificationChannels: NotificationChannelsDto;

  @ApiProperty({ description: 'Activer la configuration', default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'Liste des alertes par token', required: false })
  @ValidateNested({ each: true })
  @Type(() => CreateTokenAlertDto)
  @IsOptional()
  tokenAlerts?: CreateTokenAlertDto[];
}

export class UpdateAlertConfigurationDto {
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

// DTOs de réponse
export class TPAlertResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tokenAlertId: string;

  @ApiProperty()
  tpOrder: number;

  @ApiProperty()
  targetPrice: number;

  @ApiProperty()
  sellQuantity: number;

  @ApiProperty()
  projectedAmount: number;

  @ApiProperty()
  remainingValue: number;

  @ApiProperty()
  beforeTPEnabled: boolean;

  @ApiProperty()
  beforeTPValue?: number;

  @ApiProperty()
  beforeTPType: string;

  @ApiProperty()
  tpReachedEnabled: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class TokenAlertResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  alertConfigurationId: string;

  @ApiProperty()
  holdingId: string;

  @ApiProperty()
  tokenSymbol: string;

  @ApiProperty()
  strategyId?: string;

  @ApiProperty()
  numberOfTargets: number;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: [TPAlertResponseDto] })
  tpAlerts: TPAlertResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

export class AlertConfigurationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  forecastId: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  notificationChannels: NotificationChannelsDto;

  @ApiProperty({ type: [TokenAlertResponseDto] })
  tokenAlerts: TokenAlertResponseDto[];

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

