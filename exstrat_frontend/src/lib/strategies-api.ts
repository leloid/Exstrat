/**
 * Strategies API
 * API client for strategy management
 */

import api from "./api";
import type {
	CreateStrategyDto,
	UpdateStrategyDto,
	UpdateStrategyStepDto,
	StrategyResponse,
	StrategySearchResponse,
	StrategySummary,
	StrategySearchDto,
} from "@/types/strategies";
import type {
	StrategyAlert,
	StepAlert,
	CreateStrategyAlertDto,
	UpdateStrategyAlertDto,
	CreateStepAlertDto,
	UpdateStepAlertDto,
} from "@/types/configuration";

const BASE_URL = "/strategies";

export const strategiesApi = {
	/**
	 * Create a new strategy
	 */
	async createStrategy(data: CreateStrategyDto): Promise<StrategyResponse> {
		const response = await api.post<StrategyResponse>(BASE_URL, data);
		return response.data;
	},

	/**
	 * Get all strategies with optional filters
	 */
	async getStrategies(searchDto: StrategySearchDto = {}): Promise<StrategySearchResponse> {
		const response = await api.get<StrategySearchResponse>(BASE_URL, {
			params: searchDto,
		});
		return response.data;
	},

	/**
	 * Get strategies for a specific token
	 */
	async getStrategiesByToken(symbol: string): Promise<StrategyResponse[]> {
		const response = await api.get<StrategyResponse[]>(`${BASE_URL}/token/${symbol}`);
		return response.data;
	},

	/**
	 * Get a strategy by ID
	 */
	async getStrategyById(id: string): Promise<StrategyResponse> {
		const response = await api.get<StrategyResponse>(`${BASE_URL}/${id}`);
		return response.data;
	},

	/**
	 * Get strategy summary
	 */
	async getStrategySummary(id: string): Promise<StrategySummary> {
		const response = await api.get<StrategySummary>(`${BASE_URL}/${id}/summary`);
		return response.data;
	},

	/**
	 * Update a strategy
	 */
	async updateStrategy(id: string, data: UpdateStrategyDto): Promise<StrategyResponse> {
		const response = await api.patch<StrategyResponse>(`${BASE_URL}/${id}`, data);
		return response.data;
	},

	/**
	 * Update a strategy step
	 */
	async updateStrategyStep(strategyId: string, stepId: string, data: UpdateStrategyStepDto): Promise<StrategyResponse> {
		const response = await api.patch<StrategyResponse>(`${BASE_URL}/${strategyId}/steps/${stepId}`, data);
		return response.data;
	},

	/**
	 * Delete a strategy
	 */
	async deleteStrategy(id: string): Promise<void> {
		await api.delete(`${BASE_URL}/${id}`);
	},

	// ===== STRATEGY ALERTS =====

	/**
	 * Create or update strategy alert
	 */
	async createOrUpdateStrategyAlert(strategyId: string, data: CreateStrategyAlertDto): Promise<StrategyAlert> {
		const response = await api.post<StrategyAlert>(`${BASE_URL}/${strategyId}/alerts`, data);
		return response.data;
	},

	/**
	 * Get strategy alert
	 */
	async getStrategyAlert(strategyId: string): Promise<StrategyAlert | null> {
		try {
			const response = await api.get<StrategyAlert | null>(`${BASE_URL}/${strategyId}/alerts`);
			return response.data;
		} catch (error: any) {
			// Si 404 ou 400, c'est normal (pas d'alerte configurée)
			if (error.response?.status === 404 || error.response?.status === 400) {
				return null;
			}
			throw error;
		}
	},

	/**
	 * Update strategy alert
	 */
	async updateStrategyAlert(strategyId: string, data: UpdateStrategyAlertDto): Promise<StrategyAlert> {
		console.log("🔔 [strategies-api] updateStrategyAlert called:", { strategyId, data });
		console.log("🔔 [strategies-api] data type:", typeof data);
		console.log("🔔 [strategies-api] data.isActive:", data?.isActive, "type:", typeof data?.isActive);
		console.log("🔔 [strategies-api] data.notificationChannels:", data?.notificationChannels);
		console.log("🔔 [strategies-api] JSON.stringify(data):", JSON.stringify(data));
		
		try {
			const response = await api.patch<StrategyAlert>(`${BASE_URL}/${strategyId}/alerts`, data);
			console.log("✅ [strategies-api] updateStrategyAlert success:", response.data);
			return response.data;
		} catch (error: any) {
			console.error("❌ [strategies-api] updateStrategyAlert error:", error);
			console.error("❌ [strategies-api] Error response data:", error.response?.data);
			console.error("❌ [strategies-api] Error response status:", error.response?.status);
			console.error("❌ [strategies-api] Error response headers:", error.response?.headers);
			throw error;
		}
	},

	/**
	 * Delete strategy alert
	 */
	async deleteStrategyAlert(strategyId: string): Promise<void> {
		await api.delete(`${BASE_URL}/${strategyId}/alerts`);
	},

	// ===== STEP ALERTS =====

	/**
	 * Create or update step alert
	 */
	async createOrUpdateStepAlert(stepId: string, data: CreateStepAlertDto): Promise<StepAlert> {
		const response = await api.post<StepAlert>(`${BASE_URL}/steps/${stepId}/alerts`, data);
		return response.data;
	},

	/**
	 * Get step alert
	 */
	async getStepAlert(stepId: string): Promise<StepAlert | null> {
		try {
			const response = await api.get<StepAlert | null>(`${BASE_URL}/steps/${stepId}/alerts`);
			return response.data;
		} catch (error: any) {
			// Si 404 ou 400, c'est normal (pas d'alerte configurée)
			if (error.response?.status === 404 || error.response?.status === 400) {
				return null;
			}
			throw error;
		}
	},

	/**
	 * Update step alert
	 */
	async updateStepAlert(stepId: string, data: UpdateStepAlertDto): Promise<StepAlert> {
		const response = await api.patch<StepAlert>(`${BASE_URL}/steps/${stepId}/alerts`, data);
		return response.data;
	},

	/**
	 * Delete step alert
	 */
	async deleteStepAlert(stepId: string): Promise<void> {
		await api.delete(`${BASE_URL}/steps/${stepId}/alerts`);
	},
};

