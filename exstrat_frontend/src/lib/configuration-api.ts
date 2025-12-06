/**
 * Configuration API
 * API client for alert configuration and notification settings
 */

import api from "./api";
import type {
	AlertConfiguration,
	CreateAlertConfigurationDto,
	UpdateAlertConfigurationDto,
	TokenAlert,
	CreateTokenAlertDto,
	UpdateTokenAlertDto,
	TPAlert,
	CreateTPAlertDto,
	UpdateTPAlertDto,
} from "@/types/configuration";

// ===== ALERT CONFIGURATIONS =====

export const getAlertConfigurations = async (): Promise<AlertConfiguration[]> => {
	const response = await api.get<AlertConfiguration[]>("/configuration/alerts");
	return response.data;
};

export const getAlertConfigurationById = async (id: string): Promise<AlertConfiguration> => {
	const allConfigs = await getAlertConfigurations();
	const config = allConfigs.find((c) => c.id === id);
	if (!config) {
		throw new Error("Configuration not found");
	}
	return config;
};

export const getAlertConfigurationByForecastId = async (forecastId: string): Promise<AlertConfiguration | null> => {
	try {
		const response = await api.get<AlertConfiguration>(`/configuration/alerts/forecast/${forecastId}`);
		return response.data;
	} catch (error: unknown) {
		const axiosError = error as { response?: { status?: number } };
		if (axiosError.response?.status === 404) {
			return null;
		}
		throw error;
	}
};

export const createAlertConfiguration = async (data: CreateAlertConfigurationDto): Promise<AlertConfiguration> => {
	const response = await api.post<AlertConfiguration>("/configuration/alerts", data);
	return response.data;
};

export const updateAlertConfiguration = async (
	id: string,
	data: UpdateAlertConfigurationDto
): Promise<AlertConfiguration> => {
	const response = await api.put<AlertConfiguration>(`/configuration/alerts/${id}`, data);
	return response.data;
};

export const deleteAlertConfiguration = async (id: string): Promise<void> => {
	await api.delete(`/configuration/alerts/${id}`);
};

// ===== TOKEN ALERTS =====

export const getTokenAlerts = async (configurationId: string): Promise<TokenAlert[]> => {
	const config = await getAlertConfigurationById(configurationId);
	return config.tokenAlerts || [];
};

export const getTokenAlertById = async (id: string): Promise<TokenAlert> => {
	const allConfigs = await getAlertConfigurations();
	for (const config of allConfigs) {
		const tokenAlert = config.tokenAlerts.find((ta) => ta.id === id);
		if (tokenAlert) {
			return tokenAlert;
		}
	}
	throw new Error("Token alert not found");
};

export const createTokenAlert = async (configurationId: string, data: CreateTokenAlertDto): Promise<TokenAlert> => {
	const response = await api.post<TokenAlert>(`/configuration/alerts/${configurationId}/tokens`, data);
	return response.data;
};

export const updateTokenAlert = async (id: string, data: UpdateTokenAlertDto): Promise<TokenAlert> => {
	const response = await api.put<TokenAlert>(`/configuration/alerts/tokens/${id}`, data);
	return response.data;
};

export const deleteTokenAlert = async (id: string): Promise<void> => {
	await api.delete(`/configuration/alerts/tokens/${id}`);
};

// ===== TP ALERTS =====

export const getTPAlerts = async (tokenAlertId: string): Promise<TPAlert[]> => {
	const tokenAlert = await getTokenAlertById(tokenAlertId);
	return tokenAlert.tpAlerts || [];
};

export const getTPAlertById = async (id: string): Promise<TPAlert> => {
	const allConfigs = await getAlertConfigurations();
	for (const config of allConfigs) {
		for (const tokenAlert of config.tokenAlerts) {
			const tpAlert = tokenAlert.tpAlerts.find((tpa) => tpa.id === id);
			if (tpAlert) {
				return tpAlert;
			}
		}
	}
	throw new Error("TP alert not found");
};

export const createTPAlert = async (tokenAlertId: string, data: CreateTPAlertDto): Promise<TPAlert> => {
	const response = await api.post<TPAlert>(`/configuration/alerts/tokens/${tokenAlertId}/tp`, data);
	return response.data;
};

export const updateTPAlert = async (id: string, data: UpdateTPAlertDto): Promise<TPAlert> => {
	const response = await api.put<TPAlert>(`/configuration/alerts/tp/${id}`, data);
	return response.data;
};

export const deleteTPAlert = async (id: string): Promise<void> => {
	await api.delete(`/configuration/alerts/tp/${id}`);
};

