// Types pour le module Configuration

export interface NotificationChannels {
  email: boolean;
  push: boolean;
}

export interface BeforeTPAlert {
  enabled: boolean;
  value?: number;
  type?: 'percentage' | 'absolute';
}

export interface TPReachedAlert {
  enabled: boolean;
}

export interface TPAlert {
  id: string;
  tokenAlertId: string;
  tpOrder: number;
  targetPrice: number;
  sellQuantity: number;
  projectedAmount: number;
  remainingValue: number;
  beforeTPEnabled: boolean;
  beforeTPValue?: number;
  beforeTPType: string;
  tpReachedEnabled: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TokenAlert {
  id: string;
  alertConfigurationId: string;
  holdingId: string;
  tokenSymbol: string;
  strategyId?: string;
  numberOfTargets: number;
  isActive: boolean;
  tpAlerts: TPAlert[];
  createdAt: string;
  updatedAt: string;
}

export interface AlertConfiguration {
  id: string;
  userId: string;
  forecastId: string;
  isActive: boolean;
  notificationChannels: NotificationChannels;
  tokenAlerts: TokenAlert[];
  createdAt: string;
  updatedAt: string;
}

// DTOs pour créer/modifier
export interface CreateTPAlertDto {
  tpOrder: number;
  targetPrice: number;
  sellQuantity: number;
  projectedAmount: number;
  remainingValue: number;
  beforeTP: BeforeTPAlert;
  tpReached: TPReachedAlert;
  isActive?: boolean;
}

export interface UpdateTPAlertDto {
  beforeTP?: BeforeTPAlert;
  tpReached?: TPReachedAlert;
  isActive?: boolean;
}

export interface CreateTokenAlertDto {
  holdingId: string;
  tokenSymbol: string;
  strategyId?: string;
  numberOfTargets: number;
  tpAlerts: CreateTPAlertDto[];
  isActive?: boolean;
}

export interface UpdateTokenAlertDto {
  strategyId?: string;
  numberOfTargets?: number;
  isActive?: boolean;
}

export interface CreateAlertConfigurationDto {
  forecastId: string;
  notificationChannels: NotificationChannels;
  isActive?: boolean;
  tokenAlerts?: CreateTokenAlertDto[];
}

export interface UpdateAlertConfigurationDto {
  notificationChannels?: NotificationChannels;
  isActive?: boolean;
}

