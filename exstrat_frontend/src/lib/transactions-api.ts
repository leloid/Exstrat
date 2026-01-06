/**
 * Transactions API
 * API client for transaction management and token search
 */

import api from "./api";
import type {
	TokenSearchResult,
	CreateTransactionDto,
	TransactionResponse,
	TransactionSearchResponse,
	PortfolioSummary,
} from "@/types/transactions";

export const transactionsApi = {
	/**
	 * Search for tokens
	 */
	async searchTokens(symbol: string): Promise<TokenSearchResult[]> {
		const response = await api.get<TokenSearchResult[]>(`/tokens/search?symbol=${encodeURIComponent(symbol)}`);
		return response.data;
	},

	/**
	 * Create a new transaction
	 */
	async createTransaction(data: CreateTransactionDto): Promise<TransactionResponse> {
		const response = await api.post<TransactionResponse>("/transactions", data);
		return response.data;
	},

	/**
	 * Get all transactions with optional filters
	 */
	async getTransactions(params?: {
		symbol?: string;
		type?: string;
		startDate?: string;
		endDate?: string;
		page?: number;
		limit?: number;
	}): Promise<TransactionSearchResponse> {
		const queryParams = new URLSearchParams();
		if (params?.symbol) queryParams.append("symbol", params.symbol);
		if (params?.type) queryParams.append("type", params.type);
		if (params?.startDate) queryParams.append("startDate", params.startDate);
		if (params?.endDate) queryParams.append("endDate", params.endDate);
		if (params?.page) queryParams.append("page", params.page.toString());
		if (params?.limit) queryParams.append("limit", params.limit.toString());

		const queryString = queryParams.toString();
		const url = queryString ? `/transactions?${queryString}` : "/transactions";
		const response = await api.get<TransactionSearchResponse>(url);
		return response.data;
	},

	/**
	 * Get a transaction by ID
	 */
	async getTransaction(id: string): Promise<TransactionResponse> {
		const response = await api.get<TransactionResponse>(`/transactions/${id}`);
		return response.data;
	},

	/**
	 * Update a transaction
	 */
	async updateTransaction(id: string, data: Partial<CreateTransactionDto>): Promise<TransactionResponse> {
		const response = await api.patch<TransactionResponse>(`/transactions/${id}`, data);
		return response.data;
	},

	/**
	 * Delete a transaction
	 */
	async deleteTransaction(id: string): Promise<void> {
		await api.delete(`/transactions/${id}`);
	},

	/**
	 * Get portfolio summary
	 */
	async getPortfolio(): Promise<PortfolioSummary> {
		const response = await api.get<PortfolioSummary>("/transactions/portfolio");
		return response.data;
	},

	/**
	 * Parse CSV file content
	 */
	async parseCsv(data: {
		exchange: "coinbase" | "crypto.com" | "exstrat";
		csvContent: string;
		portfolioId?: string;
	}): Promise<{
		validTransactions: Array<{
			symbol: string;
			name?: string;
			cmcId?: number;
			quantity: number;
			amountInvested: number;
			averagePrice: number;
			type: string;
			transactionDate: string;
			notes?: string;
			exchangeId: string;
		}>;
		invalidTransactions: Array<{
			row: number;
			data: any;
			errors: string[];
		}>;
		totalRows: number;
		validCount: number;
		invalidCount: number;
	}> {
		const response = await api.post("/transactions/parse-csv", data);
		return response.data;
	},

	/**
	 * Create transactions in batch
	 */
	async createBatchTransactions(data: {
		transactions: Array<{
			symbol: string;
			name: string;
			cmcId: number;
			quantity: number;
			amountInvested: number;
			averagePrice: number;
			type: string;
			transactionDate: string;
			notes?: string;
			exchangeId?: string;
			portfolioId?: string;
		}>;
		defaultPortfolioId?: string;
	}): Promise<{
		created: Array<{
			id: string;
			symbol: string;
			name: string;
		}>;
		failed: Array<{
			index: number;
			transaction: any;
			error: string;
		}>;
		total: number;
		successCount: number;
		failedCount: number;
	}> {
		const response = await api.post("/transactions/batch", data);
		return response.data;
	},
};

