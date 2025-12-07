"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import type {
	Portfolio,
	Holding,
	PortfolioContextType,
	CreatePortfolioDto,
	UpdatePortfolioDto,
} from "@/types/portfolio";
import * as portfoliosApi from "@/lib/portfolios-api";
import { useAuth } from "./AuthContext";

const PortfolioContext = React.createContext<PortfolioContextType | undefined>(undefined);

export const usePortfolio = () => {
	const context = React.useContext(PortfolioContext);
	if (context === undefined) {
		throw new Error("usePortfolio must be used within a PortfolioProvider");
	}
	return context;
};

interface PortfolioProviderProps {
	children: React.ReactNode;
}

export const PortfolioProvider: React.FC<PortfolioProviderProps> = ({ children }) => {
	const { isAuthenticated } = useAuth();
	const pathname = usePathname();
	const [portfolios, setPortfolios] = React.useState<Portfolio[]>([]);
	const [currentPortfolio, setCurrentPortfolio] = React.useState<Portfolio | null>(null);
	const [holdings, setHoldings] = React.useState<Holding[]>([]);
	const [isLoading, setIsLoading] = React.useState(true);
	const [isLoadingHoldings, setIsLoadingHoldings] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);

	// Load portfolios only if user is authenticated
	React.useEffect(() => {
		if (isAuthenticated) {
			loadPortfolios();
		} else {
			// Reset state if user is not authenticated
			setPortfolios([]);
			setCurrentPortfolio(null);
			setHoldings([]);
			setIsLoading(false);
			setError(null);
		}
	}, [isAuthenticated]);

	// Load holdings when current portfolio changes
	React.useEffect(() => {
		// Don't load holdings if on onboarding page
		if (pathname === "/onboarding") {
			setHoldings([]);
			return;
		}

		if (currentPortfolio) {
			loadHoldings(currentPortfolio.id);
		} else {
			setHoldings([]);
		}
	}, [currentPortfolio, pathname]);

	const loadPortfolios = React.useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			const data = await portfoliosApi.getPortfolios();

			setPortfolios(data);

			// Select default portfolio if it exists
			const defaultPortfolio = data.find((p) => p.isDefault);
			if (defaultPortfolio) {
				setCurrentPortfolio(defaultPortfolio);
			} else if (data.length > 0) {
				setCurrentPortfolio(data[0]);
			} else {
				setCurrentPortfolio(null);
			}
		} catch (error_: unknown) {
			const axiosError = error_ as { response?: { data?: { message?: string } }; message?: string };
			const errorMessage =
				axiosError.response?.data?.message || axiosError.message || "Error loading portfolios";
			setError(errorMessage);
			console.error("Error loading portfolios:", error_);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const loadHoldings = React.useCallback(async (portfolioId: string) => {
		try {
			setIsLoadingHoldings(true);
			setError(null);
			const data = await portfoliosApi.getPortfolioHoldings(portfolioId);
			setHoldings(data);
		} catch (error_: unknown) {
			// Silently ignore 404 errors (portfolio may not have holdings)
			const axiosError = error_ as { response?: { status?: number } };
			if (axiosError.response?.status === 404) {
				setHoldings([]);
				return;
			}
			// For other errors, log but don't block the interface
			console.error("Error loading holdings:", error_);
			setHoldings([]);
		} finally {
			setIsLoadingHoldings(false);
		}
	}, []);

	const createPortfolio = React.useCallback(async (data: CreatePortfolioDto) => {
		try {
			setError(null);
			const newPortfolio = await portfoliosApi.createPortfolio(data);
			setPortfolios((prev) => [...prev, newPortfolio]);

			// If it's the default portfolio, select it
			if (data.isDefault) {
				setCurrentPortfolio(newPortfolio);
			}
		} catch (error_: unknown) {
			const axiosError = error_ as { response?: { data?: { message?: string } }; message?: string };
			const errorMessage =
				axiosError.response?.data?.message || axiosError.message || "Error creating portfolio";
			setError(errorMessage);
			throw error_;
		}
	}, []);

	const updatePortfolio = React.useCallback(async (id: string, data: UpdatePortfolioDto) => {
		try {
			setError(null);
			const updatedPortfolio = await portfoliosApi.updatePortfolio(id, data);
			setPortfolios((prev) => prev.map((p) => (p.id === id ? updatedPortfolio : p)));

			// If it's the current portfolio being updated, update it
			if (currentPortfolio?.id === id) {
				setCurrentPortfolio(updatedPortfolio);
			}
		} catch (error_: unknown) {
			const axiosError = error_ as { response?: { data?: { message?: string } }; message?: string };
			const errorMessage =
				axiosError.response?.data?.message || axiosError.message || "Error updating portfolio";
			setError(errorMessage);
			throw error_;
		}
	}, [currentPortfolio]);

	const deletePortfolio = React.useCallback(async (id: string) => {
		try {
			setError(null);
			await portfoliosApi.deletePortfolio(id);
			setPortfolios((prev) => prev.filter((p) => p.id !== id));

			// If it's the current portfolio being deleted, select another
			if (currentPortfolio?.id === id) {
				const remainingPortfolios = portfolios.filter((p) => p.id !== id);
				if (remainingPortfolios.length > 0) {
					const defaultPortfolio = remainingPortfolios.find((p) => p.isDefault) || remainingPortfolios[0];
					setCurrentPortfolio(defaultPortfolio);
				} else {
					setCurrentPortfolio(null);
				}
			}
		} catch (error_: unknown) {
			const axiosError = error_ as { response?: { data?: { message?: string } }; message?: string };
			const errorMessage =
				axiosError.response?.data?.message || axiosError.message || "Error deleting portfolio";
			setError(errorMessage);
			throw error_;
		}
	}, [currentPortfolio, portfolios]);

	const refreshPortfolios = React.useCallback(async () => {
		await loadPortfolios();
	}, [loadPortfolios]);

	const refreshHoldings = React.useCallback(async (portfolioId: string) => {
		await loadHoldings(portfolioId);
	}, [loadHoldings]);

	const selectPortfolio = React.useCallback((portfolioId: string | null) => {
		if (portfolioId === null) {
			setCurrentPortfolio(null);
		} else {
			const portfolio = portfolios.find((p) => p.id === portfolioId);
			if (portfolio) {
				setCurrentPortfolio(portfolio);
			}
		}
	}, [portfolios]);

	const syncPortfolios = React.useCallback(async () => {
		try {
			setIsLoading(true);
			setError(null);
			await portfoliosApi.syncPortfolios();
			// Reload portfolios after synchronization
			await loadPortfolios();
		} catch (error_: unknown) {
			const axiosError = error_ as { response?: { data?: { message?: string } }; message?: string };
			const errorMessage =
				axiosError.response?.data?.message || axiosError.message || "Error synchronizing portfolios";
			setError(errorMessage);
			console.error("Error synchronizing portfolios:", error_);
		} finally {
			setIsLoading(false);
		}
	}, [loadPortfolios]);

	const value: PortfolioContextType = React.useMemo(
		() => ({
			portfolios,
			currentPortfolio,
			holdings,
			isLoading,
			isLoadingHoldings,
			error,
			createPortfolio,
			updatePortfolio,
			deletePortfolio,
			setCurrentPortfolio,
			selectPortfolio,
			refreshPortfolios,
			refreshHoldings,
			syncPortfolios,
		}),
		[
			portfolios,
			currentPortfolio,
			holdings,
			isLoading,
			isLoadingHoldings,
			error,
			createPortfolio,
			updatePortfolio,
			deletePortfolio,
			selectPortfolio,
			refreshPortfolios,
			refreshHoldings,
			syncPortfolios,
		]
	);

	return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
};

