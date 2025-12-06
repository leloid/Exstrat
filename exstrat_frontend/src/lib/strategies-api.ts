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
};

