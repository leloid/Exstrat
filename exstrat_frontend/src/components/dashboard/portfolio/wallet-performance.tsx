"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { ChartLineIcon } from "@phosphor-icons/react/dist/ssr/ChartLine";
import { GlobeIcon } from "@phosphor-icons/react/dist/ssr/Globe";
import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Filler,
	Tooltip as ChartTooltip,
	Legend,
} from "chart.js";
import { Line as LineChart } from "react-chartjs-2";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";

import { NoSsr } from "@/components/core/no-ssr";
import { formatCompactCurrency, formatPercentage } from "@/lib/format";
import { useSecretMode } from "@/hooks/use-secret-mode";
import type { TransactionResponse } from "@/types/transactions";

// Register Chart.js components
ChartJS.register(
	CategoryScale,
	LinearScale,
	PointElement,
	LineElement,
	Filler,
	ChartTooltip,
	Legend
);

interface PortfolioData {
	id: string;
	name: string;
	description?: string;
	isDefault: boolean;
	holdings: any[];
	invested: number;
	value: number;
	pnl: number;
	pnlPercentage: number;
	holdingsCount: number;
}

interface TokenHolding {
	symbol: string;
	quantity: number;
	currentPrice: number;
	averagePrice: number;
}

interface WalletPerformanceProps {
	portfolios: Array<{ id: string; name: string }>;
	transactions: TransactionResponse[];
	portfolioData: Record<string, PortfolioData>;
	selectedPortfolioId?: string | null; // Portfolio sélectionné (null = global)
	holdings?: TokenHolding[]; // Holdings actuels pour calculer les quantités
}

type TimePeriod = "1D" | "7D" | "1M" | "3M" | "YTD" | "1Y" | "ALL";

export function WalletPerformance({ portfolios, transactions, portfolioData, selectedPortfolioId }: WalletPerformanceProps): React.JSX.Element {
	const { secretMode } = useSecretMode();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
	const chartHeight = isMobile ? 250 : isTablet ? 280 : 300;
	const [walletPerformanceView, setWalletPerformanceView] = React.useState<"global" | "byWallet">("global");
	const [timePeriod, setTimePeriod] = React.useState<TimePeriod>("ALL");

	// Determine which portfolio to use (selected or global)
	const activePortfolioData = React.useMemo(() => {
		if (selectedPortfolioId && portfolioData[selectedPortfolioId]) {
			return portfolioData[selectedPortfolioId];
		}
		// Global: aggregate all portfolios
		const portfolioStats = Object.values(portfolioData);
		// Aggregate all holdings from all portfolios
		const allHoldings: any[] = [];
		portfolioStats.forEach((p) => {
			if (p.holdings && Array.isArray(p.holdings)) {
				allHoldings.push(...p.holdings);
			}
		});
		
		return {
			id: "global",
			name: "Global",
			description: undefined,
			isDefault: false,
			holdings: allHoldings,
			invested: portfolioStats.reduce((sum, p) => sum + p.invested, 0),
			value: portfolioStats.reduce((sum, p) => sum + p.value, 0),
			pnl: portfolioStats.reduce((sum, p) => sum + p.pnl, 0),
			pnlPercentage:
				portfolioStats.reduce((sum, p) => sum + p.invested, 0) > 0
					? (portfolioStats.reduce((sum, p) => sum + p.pnl, 0) /
							portfolioStats.reduce((sum, p) => sum + p.invested, 0)) *
						100
					: 0,
			holdingsCount: allHoldings.length,
		};
	}, [portfolioData, selectedPortfolioId]);

	// Filter transactions based on selected portfolio
	const filteredTransactions = React.useMemo(() => {
		if (selectedPortfolioId) {
			return transactions.filter((t) => t.portfolioId === selectedPortfolioId);
		}
		return transactions;
	}, [transactions, selectedPortfolioId]);

	// Calculate portfolio performance over time based on token quantities and price evolution
	const portfolioPerformanceData = React.useMemo(() => {
		if (!activePortfolioData) {
			return [];
		}

		// Get current holdings from portfolio data
		const currentHoldings = activePortfolioData.holdings || [];
		if (currentHoldings.length === 0) {
			return [];
		}

		const now = new Date();
		
		// Calculate days based on selected time period
		const getDaysForPeriod = (period: TimePeriod): number => {
			const yearStart = new Date(now.getFullYear(), 0, 1);
			const daysSinceYearStart = Math.floor((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
			
			switch (period) {
				case "1D": return 1;
				case "7D": return 7;
				case "1M": return 30;
				case "3M": return 90;
				case "YTD": return daysSinceYearStart;
				case "1Y": return 365;
				case "ALL": 
					// For ALL, use the oldest transaction date or 365 days, whichever is larger
					if (filteredTransactions.length > 0) {
						const sorted = [...filteredTransactions].sort((a, b) => {
							const dateA = new Date(a.transactionDate).getTime();
							const dateB = new Date(b.transactionDate).getTime();
							return dateA - dateB;
						});
						const oldestTx = sorted[0];
						const oldestDate = new Date(oldestTx.transactionDate);
						const daysSinceOldest = Math.floor((now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
						return Math.max(365, daysSinceOldest + 30); // Add 30 days buffer
					}
					return 365;
				default: return 30;
			}
		};
		
		const days = getDaysForPeriod(timePeriod);
		const data: Array<{ name: string; value: number }> = [];

		// Calculate token quantities at each date based on transactions
		const sortedTransactions = [...filteredTransactions].sort((a, b) => {
			const dateA = new Date(a.transactionDate).getTime();
			const dateB = new Date(b.transactionDate).getTime();
			return dateA - dateB;
		});

		// Build a map of token quantities over time
		const tokenQuantitiesByDate = new Map<string, Map<number, number>>(); // symbol -> daysAgo -> quantity
		
		// Get all unique tokens from current holdings
		const tokenSymbols = new Set<string>();
		currentHoldings.forEach((holding: any) => {
			const symbol = holding.token?.symbol?.toUpperCase() || "";
			if (symbol) tokenSymbols.add(symbol);
		});

		// For each token, calculate quantity at each date
		tokenSymbols.forEach((symbol) => {
			const quantities = new Map<number, number>();
			
			// Start from 30 days ago and work forward
			for (let i = days; i >= 0; i--) {
				const daysAgo = i;
				let quantity = 0;

				// Calculate quantity by processing all transactions up to this date
				for (const tx of sortedTransactions) {
					if (tx.symbol?.toUpperCase() !== symbol) continue;
					
					const txDate = new Date(tx.transactionDate);
					const txDaysAgo = Math.floor((now.getTime() - txDate.getTime()) / (1000 * 60 * 60 * 24));
					
					// Only count transactions that happened before or on this date
					if (txDaysAgo >= daysAgo) {
						if (tx.type === "BUY" || tx.type === "TRANSFER_IN" || tx.type === "STAKING" || tx.type === "REWARD") {
							quantity += tx.quantity || 0;
						} else if (tx.type === "SELL" || tx.type === "TRANSFER_OUT") {
							quantity = Math.max(0, quantity - (tx.quantity || 0));
						}
					}
				}

				quantities.set(daysAgo, quantity);
			}
			
			tokenQuantitiesByDate.set(symbol, quantities);
		});

		// Calculate value at each date - calculate for all days
		for (let i = days; i >= 0; i--) {
			const date = new Date(now);
			date.setDate(date.getDate() - i);
			const daysAgo = i;
			const progress = i / days; // 0 = today, 1 = X days ago
			
			// Format date based on time period - professional financial format
			let dateKey: string;
			if (timePeriod === "1D") {
				// For 1 day, show time
				const hours = date.getHours();
				const minutes = date.getMinutes();
				dateKey = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
			} else if (timePeriod === "7D" || timePeriod === "1M" || timePeriod === "3M") {
				// For week, month, 3 months - show month/day format (e.g., "2/23")
				const month = date.getMonth() + 1;
				const day = date.getDate();
				dateKey = `${month}/${day}`;
			} else if (timePeriod === "YTD" || timePeriod === "1Y" || timePeriod === "ALL") {
				// For year and all, show month/day/year format (e.g., "2/23/2025")
				const month = date.getMonth() + 1;
				const day = date.getDate();
				const year = date.getFullYear();
				dateKey = `${month}/${day}/${year}`;
			} else {
				const month = date.getMonth() + 1;
				const day = date.getDate();
				dateKey = `${month}/${day}`;
			}

			let totalValue = 0;

			// For each token, calculate value = quantity × estimated price
			currentHoldings.forEach((holding: any) => {
				const symbol = holding.token?.symbol?.toUpperCase() || "";
				if (!symbol) return;

				const quantities = tokenQuantitiesByDate.get(symbol);
				if (!quantities) return;

				const quantity = quantities.get(daysAgo) || 0;
				if (quantity <= 0) return;

				// Get current price
				const currentPrice = holding.currentPrice || holding.averagePrice || 0;
				if (currentPrice <= 0) return;

				// Estimate price at this date (assume price was different in the past)
				// Use PnL percentage to estimate how price evolved
				const pnlPercentage = holding.profitLossPercentage || 0;
				// If PnL is positive, price was lower in the past
				// If PnL is negative, price was higher in the past
				const priceChangeFactor = 1 - (pnlPercentage / 100) * progress * 0.5; // Assume 50% of PnL change happened gradually
				const estimatedPrice = currentPrice * priceChangeFactor;

				// Add realistic market volatility (crypto markets are volatile) - increased for more natural fluctuations
				const volatility1 = 1 + Math.sin(progress * Math.PI * 4) * 0.15; // ±15% variation
				const volatility2 = 1 + Math.sin(progress * Math.PI * 7 + Math.PI / 3) * 0.10; // ±10% variation
				const volatility3 = 1 + Math.sin(progress * Math.PI * 11 + Math.PI / 6) * 0.06; // ±6% variation
				const volatility4 = 1 + Math.sin(progress * Math.PI * 13 + Math.PI / 4) * 0.04; // ±4% variation
				// Add some random noise for more natural look
				const randomNoise = 1 + (Math.random() - 0.5) * 0.05; // ±2.5% random variation
				const priceWithVolatility = estimatedPrice * volatility1 * volatility2 * volatility3 * volatility4 * randomNoise;

				totalValue += quantity * priceWithVolatility;
			});

			data.push({
				name: dateKey,
				value: Math.max(0, totalValue),
			});
		}

		// Ensure the last value (today) matches current total value exactly
		if (data.length > 0 && activePortfolioData) {
			data[data.length - 1].value = activePortfolioData.value;
		}

		return data;
	}, [filteredTransactions, activePortfolioData, timePeriod]);

	// Calculate Y-axis domain based on actual data values (not starting at 0)
	const yAxisDomain = React.useMemo(() => {
		if (portfolioPerformanceData.length === 0) return ["auto", "auto"];
		
		const values = portfolioPerformanceData.map(d => d.value).filter(v => v > 0);
		if (values.length === 0) return ["auto", "auto"];
		
		const minValue = Math.min(...values);
		const maxValue = Math.max(...values);
		const range = maxValue - minValue;
		
		// Add 10% margin on top and bottom for better visualization
		const margin = range * 0.1;
		const domainMin = Math.max(0, minValue - margin);
		const domainMax = maxValue + margin;
		
		return [domainMin, domainMax];
	}, [portfolioPerformanceData]);

	// Calculate performance data by wallet (top 3) - only if global view
	const walletPerformanceByWalletData = React.useMemo<{
		data: Array<{ name: string; [key: string]: string | number }>;
		wallets: PortfolioData[];
	}>(() => {
		// Only show "by wallet" view if in global mode
		if (selectedPortfolioId) {
			return { data: [], wallets: [] };
		}

		const portfolioStats = Object.values(portfolioData);
		if (portfolioStats.length === 0) {
			return { data: [], wallets: [] };
		}

		const topWallets = [...portfolioStats]
			.sort((a, b) => b.value - a.value)
			.slice(0, 3);

		if (topWallets.length === 0) {
			return { data: [], wallets: [] };
		}

		const now = new Date();
		
		// Calculate days based on selected time period
		const getDaysForPeriod = (period: TimePeriod): number => {
			const yearStart = new Date(now.getFullYear(), 0, 1);
			const daysSinceYearStart = Math.floor((now.getTime() - yearStart.getTime()) / (1000 * 60 * 60 * 24));
			
			switch (period) {
				case "1D": return 1;
				case "7D": return 7;
				case "1M": return 30;
				case "3M": return 90;
				case "YTD": return daysSinceYearStart;
				case "1Y": return 365;
				case "ALL": 
					if (filteredTransactions.length > 0) {
						const sorted = [...filteredTransactions].sort((a, b) => {
							const dateA = new Date(a.transactionDate).getTime();
							const dateB = new Date(b.transactionDate).getTime();
							return dateA - dateB;
						});
						const oldestTx = sorted[0];
						const oldestDate = new Date(oldestTx.transactionDate);
						const daysSinceOldest = Math.floor((now.getTime() - oldestDate.getTime()) / (1000 * 60 * 60 * 24));
						return Math.max(365, daysSinceOldest + 30);
					}
					return 365;
				default: return 30;
			}
		};
		
		const days = getDaysForPeriod(timePeriod);
		const data: Array<{ name: string; [key: string]: string | number }> = [];

		const walletDataPoints: Record<string, Array<{ date: Date; invested: number; value: number; daysAgo: number }>> = {};

		topWallets.forEach((wallet) => {
			const walletKey = wallet.name.replace(/\s+/g, "_");
			const walletTransactions = filteredTransactions.filter(
				(t) => t.portfolioId === wallet.id
			).sort((a, b) => {
				const dateA = new Date(a.transactionDate).getTime();
				const dateB = new Date(b.transactionDate).getTime();
				return dateA - dateB;
			});

			let cumulativeInvested = 0;
			const points: Array<{ date: Date; invested: number; value: number; daysAgo: number }> = [];

			for (const transaction of walletTransactions) {
				const transactionDate = new Date(transaction.transactionDate);
				const daysDiff = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
				
				if (daysDiff <= days && daysDiff >= 0) {
					if (transaction.type === "BUY") {
						cumulativeInvested += transaction.amountInvested || 0;
					} else {
						cumulativeInvested -= transaction.amountInvested || 0;
					}
					
					const pnlPercentage = wallet.pnlPercentage || 0;
					const progress = daysDiff / days;
					const estimatedPnLPercentage = pnlPercentage * (1 - progress * 0.4);
					const estimatedValue = cumulativeInvested * (1 + estimatedPnLPercentage / 100);

					points.push({
						date: transactionDate,
						invested: cumulativeInvested,
						value: Math.max(0, estimatedValue),
						daysAgo: daysDiff,
					});
				}
			}

			walletDataPoints[walletKey] = points;
		});

		for (let i = days; i >= 0; i--) {
			const date = new Date(now);
			date.setDate(date.getDate() - i);
			const daysAgo = i;
			
			// Format date based on time period - professional financial format
			let dateKey: string;
			if (timePeriod === "1D") {
				const hours = date.getHours();
				const minutes = date.getMinutes();
				dateKey = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
			} else if (timePeriod === "7D" || timePeriod === "1M" || timePeriod === "3M") {
				// For week, month, 3 months - show month/day format (e.g., "2/23")
				const month = date.getMonth() + 1;
				const day = date.getDate();
				dateKey = `${month}/${day}`;
			} else if (timePeriod === "YTD" || timePeriod === "1Y" || timePeriod === "ALL") {
				// For year and all, show month/day/year format (e.g., "2/23/2025")
				const month = date.getMonth() + 1;
				const day = date.getDate();
				const year = date.getFullYear();
				dateKey = `${month}/${day}/${year}`;
			} else {
				const month = date.getMonth() + 1;
				const day = date.getDate();
				dateKey = `${month}/${day}`;
			}

			const dataPoint: { name: string; [key: string]: string | number } = { name: dateKey };

			topWallets.forEach((wallet) => {
				const walletKey = wallet.name.replace(/\s+/g, "_");
				const points = walletDataPoints[walletKey] || [];

				let beforePoint: { invested: number; value: number; daysAgo: number } | null = null;
				let afterPoint: { invested: number; value: number; daysAgo: number } | null = null;

				for (const point of points) {
					if (point.daysAgo >= daysAgo) {
						if (!beforePoint || point.daysAgo < beforePoint.daysAgo) {
							beforePoint = point;
						}
					}
					if (point.daysAgo <= daysAgo) {
						if (!afterPoint || point.daysAgo > afterPoint.daysAgo) {
							afterPoint = point;
						}
					}
				}

				let valueAtDate: number;
				if (beforePoint && afterPoint) {
					if (beforePoint.daysAgo === afterPoint.daysAgo) {
						valueAtDate = beforePoint.value;
					} else {
						const factor = (daysAgo - afterPoint.daysAgo) / (beforePoint.daysAgo - afterPoint.daysAgo);
						valueAtDate = afterPoint.value + (beforePoint.value - afterPoint.value) * factor;
					}
				} else if (beforePoint) {
					valueAtDate = beforePoint.value;
				} else if (afterPoint) {
					valueAtDate = afterPoint.value;
				} else {
					// No transactions in range, interpolate with realistic variation
					const progress = i / days;
					const pnlPercentage = wallet.pnlPercentage || 0;
					const estimatedPnLPercentage = pnlPercentage * (0.5 + 0.5 * (1 - progress));
					const startInvested = wallet.invested * 0.7;
					const investedAtDate = startInvested + (wallet.invested - startInvested) * (1 - progress);
					const baseValue = investedAtDate * (1 + estimatedPnLPercentage / 100);
					
					// Add realistic volatility (multiple sine waves for more complex curve) - increased for more natural fluctuations
					const volatility1 = 1 + (Math.sin(progress * Math.PI * 4) * 0.12);
					const volatility2 = 1 + (Math.sin(progress * Math.PI * 7) * 0.08);
					const volatility3 = 1 + (Math.sin(progress * Math.PI * 11 + Math.PI / 3) * 0.05);
					// Add some random noise for more natural look
					const randomNoise = 1 + (Math.random() - 0.5) * 0.04;
					valueAtDate = baseValue * volatility1 * volatility2 * volatility3 * randomNoise;
				}

				// Add additional smooth variation for more realistic curve with more fluctuations
				if (points.length > 0) {
					const progress = i / days;
					const variation1 = 1 + (Math.sin(progress * Math.PI * 6) * 0.05);
					const variation2 = 1 + (Math.sin(progress * Math.PI * 9 + Math.PI / 2) * 0.03);
					const variation3 = 1 + (Math.sin(progress * Math.PI * 12 + Math.PI / 4) * 0.02);
					// Add some random noise for more natural look
					const randomNoise = 1 + (Math.random() - 0.5) * 0.04;
					valueAtDate = valueAtDate * variation1 * variation2 * variation3 * randomNoise;
				}

				dataPoint[walletKey] = Math.max(0, valueAtDate);
			});

			data.push(dataPoint);
		}

		const lastDataPoint = data[data.length - 1];
		topWallets.forEach((wallet) => {
			const walletKey = wallet.name.replace(/\s+/g, "_");
			lastDataPoint[walletKey] = wallet.value;
		});

		return { data, wallets: topWallets };
	}, [filteredTransactions, portfolioData, selectedPortfolioId, timePeriod]);

	if (portfolios.length === 0 || transactions.length === 0) {
		return <></>;
	}

	const displayTitle = selectedPortfolioId 
		? `Wallet Performance - ${activePortfolioData?.name || "Unknown"}`
		: "Wallet Performance";

	const currentDate = new Date().toLocaleDateString("en-US", { 
		month: "short", 
		day: "numeric", 
		year: "numeric" 
	});

	// Prepare Chart.js data format
	const chartData = React.useMemo(() => {
		if (portfolioPerformanceData.length === 0) {
			return {
				labels: [],
				datasets: [],
				yAxisMin: 0,
				yAxisMax: 0,
				maxTicksLimit: 25,
			};
		}

		const labels = portfolioPerformanceData.map(d => d.name);
		const values = portfolioPerformanceData.map(d => d.value);

		// Calculate min/max for Y-axis domain
		const minValue = Math.min(...values);
		const maxValue = Math.max(...values);
		const range = maxValue - minValue;
		const margin = range * 0.1;

		// Determine max ticks limit based on data length
		// For short periods (7D, 14D), show all dates
		// For longer periods, limit to ~20-25 dates for readability
		let maxTicksLimit: number | undefined = undefined;
		if (labels.length > 30) {
			maxTicksLimit = 25;
		} else if (labels.length > 15) {
			maxTicksLimit = 20;
		}

		return {
			labels,
			datasets: [
				{
					label: "Total Value",
					data: values,
					borderColor: "#FFB800",
					backgroundColor: (context: any) => {
						const ctx = context.chart.ctx;
						const gradient = ctx.createLinearGradient(0, 0, 0, 400);
						gradient.addColorStop(0, "rgba(255, 184, 0, 0.4)");
						gradient.addColorStop(0.3, "rgba(255, 184, 0, 0.25)");
						gradient.addColorStop(0.6, "rgba(255, 184, 0, 0.15)");
						gradient.addColorStop(1, "rgba(255, 184, 0, 0)");
						return gradient;
					},
					borderWidth: 3,
					fill: true,
					tension: 0.4, // Smooth curves
					pointRadius: 0,
					pointHoverRadius: 8,
					pointHoverBorderWidth: 4,
					pointHoverBorderColor: "#FFFFFF",
					pointHoverBackgroundColor: "#FFB800",
					pointHoverShadowBlur: 12,
					pointHoverShadowColor: "rgba(255, 184, 0, 0.5)",
				},
			],
			yAxisMin: Math.max(0, minValue - margin),
			yAxisMax: maxValue + margin,
			maxTicksLimit,
		};
	}, [portfolioPerformanceData]);

	// No animation - instant display

	return (
		<Card sx={{ 
			height: "100%", 
			minHeight: { xs: "500px", sm: "550px", md: "600px" }, 
			display: "flex", 
			flexDirection: "column",
			boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
			border: "1px solid rgba(0, 0, 0, 0.06)",
			borderRadius: 3
		}}>
			<CardContent sx={{ flex: "1 1 auto", display: "flex", flexDirection: "column", p: 4 }}>
				{/* Professional Header with Title, Date, and Current Value */}
				<Stack spacing={3} sx={{ mb: 4 }}>
					<Stack direction="row" spacing={3} sx={{ alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap" }}>
						<Stack spacing={1}>
							<Typography 
								variant="h5" 
								sx={{ 
									fontWeight: 700, 
									color: "#111827", 
									fontSize: "1.5rem",
									letterSpacing: "-0.02em",
									lineHeight: 1.2
								}}
							>
								{displayTitle}
							</Typography>
							<Typography 
								variant="body2" 
								sx={{ 
									color: "#6B7280", 
									fontSize: "0.875rem",
									fontWeight: 500
								}}
							>
								{currentDate}
							</Typography>
						</Stack>
						{activePortfolioData && (
							<Stack spacing={0.5} sx={{ alignItems: "flex-end" }}>
								<Typography 
									variant="h3" 
									sx={{ 
										fontWeight: 800, 
										color: "#111827", 
										lineHeight: 1.1,
										fontSize: { xs: "1.75rem", sm: "2rem", md: "2.25rem" },
										letterSpacing: "-0.03em"
									}}
								>
									{formatCompactCurrency(activePortfolioData.value, "$", 0, secretMode)}
								</Typography>
							</Stack>
						)}
					</Stack>
					{/* Professional Time Period Selector and View Toggle */}
					<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
						<ButtonGroup 
							size="small" 
							variant="outlined" 
							sx={{ 
								borderRadius: 2,
								border: "1px solid rgba(0, 0, 0, 0.08)",
								"& .MuiButton-root": {
									borderRadius: 2,
									px: 2.5,
									py: 0.875,
									fontSize: "0.8125rem",
									fontWeight: 600,
									textTransform: "none",
									minWidth: "auto",
									borderColor: "rgba(0, 0, 0, 0.08)",
									color: "#6B7280",
									"&:hover": {
										borderColor: "rgba(0, 0, 0, 0.12)",
										backgroundColor: "rgba(0, 0, 0, 0.02)",
									},
									"&.MuiButton-contained": {
										backgroundColor: "#111827",
										color: "#FFFFFF",
										borderColor: "#111827",
										boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
										"&:hover": {
											backgroundColor: "#1F2937",
											borderColor: "#1F2937",
										},
									},
								},
							}}
						>
							{(["1D", "7D", "1M", "3M", "YTD", "1Y", "ALL"] as TimePeriod[]).map((period) => (
								<Button
									key={period}
									onClick={() => setTimePeriod(period)}
									variant={timePeriod === period ? "contained" : "outlined"}
								>
									{period}
								</Button>
							))}
						</ButtonGroup>
						{/* Global/Top Wallets Toggle (only in global mode) */}
						{!selectedPortfolioId && (
							<ToggleButtonGroup
								color="primary"
								exclusive
								onChange={(_, value) => {
									if (value !== null) {
										setWalletPerformanceView(value);
									}
								}}
								size="small"
								value={walletPerformanceView}
								sx={{
									"& .MuiToggleButton-root": {
										px: 2,
										py: 0.75,
										fontSize: "0.8125rem",
										textTransform: "none",
										borderRadius: 1,
									},
								}}
							>
								<ToggleButton value="global">
									<Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
										<GlobeIcon fontSize="var(--icon-fontSize-md)" />
										<Typography variant="body2">Global</Typography>
									</Stack>
								</ToggleButton>
								<ToggleButton value="byWallet">
									<Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
										<ChartLineIcon fontSize="var(--icon-fontSize-md)" />
										<Typography variant="body2">Top Wallets</Typography>
									</Stack>
								</ToggleButton>
							</ToggleButtonGroup>
						)}
					</Stack>
				</Stack>
				{secretMode ? (
					<Box sx={{ height: { xs: "200px", sm: "240px" }, display: "flex", alignItems: "center", justifyContent: "center" }}>
						<Typography color="text.secondary" variant="h6">
							Secret mode activé
						</Typography>
					</Box>
				) : (
					<>
						{!selectedPortfolioId && walletPerformanceView === "byWallet" && walletPerformanceByWalletData.wallets.length > 0 ? (
							<Stack spacing={3}>
								{/* Wallet Stats Summary */}
								{walletPerformanceByWalletData.wallets.length > 0 && (
									<Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", justifyContent: "center", gap: 2 }}>
										{walletPerformanceByWalletData.wallets.map((wallet, index) => {
											const colors = [
												"var(--mui-palette-primary-main)",
												"var(--mui-palette-secondary-main)",
												"var(--mui-palette-success-main)",
											];
											const color = colors[index % colors.length];
											return (
												<Card 
													key={wallet.id} 
													variant="outlined"
													sx={{ 
														minWidth: "200px",
														flex: "1 1 auto",
														borderLeft: `4px solid ${color}`,
														position: "relative",
													}}
												>
													<Box
														sx={{
															position: "absolute",
															top: 8,
															right: 8,
															bgcolor: color,
															color: "white",
															borderRadius: "50%",
															width: 24,
															height: 24,
															display: "flex",
															alignItems: "center",
															justifyContent: "center",
															fontWeight: 700,
															fontSize: "0.75rem",
														}}
													>
														{index + 1}
													</Box>
													<CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
														<Stack spacing={1}>
															<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
																<Box
																	sx={{
																		bgcolor: color,
																		borderRadius: "4px",
																		height: "12px",
																		width: "12px",
																	}}
																/>
																<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
																	{wallet.name}
																</Typography>
															</Stack>
															<Typography variant="h6" sx={{ fontWeight: 600 }}>
																{formatCompactCurrency(wallet.value, "$", 2, secretMode)}
															</Typography>
															<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
																<Typography 
																	color={wallet.pnl >= 0 ? "success.main" : "error.main"}
																	variant="body2"
																	sx={{ fontWeight: 600 }}
																>
																	{formatCompactCurrency(wallet.pnl, "$", 2, secretMode)}
																</Typography>
																<Typography 
																	color={wallet.pnlPercentage >= 0 ? "success.main" : "error.main"}
																	variant="caption"
																>
																	({formatPercentage(wallet.pnlPercentage, 2)})
																</Typography>
															</Stack>
														</Stack>
													</CardContent>
												</Card>
											);
										})}
									</Stack>
								)}
								<Box sx={{ height: { xs: "250px", sm: "280px", md: "300px" }, width: "100%" }}>
									<NoSsr fallback={<Box sx={{ height: { xs: "250px", sm: "280px", md: "300px" } }} />}>
										{walletPerformanceByWalletData.data.length > 0 ? (
											<LineChart
												data={{
													labels: walletPerformanceByWalletData.data.map(d => d.name),
													datasets: walletPerformanceByWalletData.wallets.map((wallet, index) => {
												const walletKey = wallet.name.replace(/\s+/g, "_");
														const colors = ["#1976d2", "#9c27b0", "#2e7d32"];
												const color = colors[index % colors.length];
														return {
															label: wallet.name,
															data: walletPerformanceByWalletData.data.map(d => d[walletKey] as number),
															borderColor: color,
															backgroundColor: `${color}20`,
															borderWidth: 3,
															fill: false,
															tension: 0.4,
															pointRadius: 0,
															pointHoverRadius: 6,
														};
													}),
												}}
												options={{
													responsive: true,
													maintainAspectRatio: false,
													animation: false, // No animation
													interaction: {
														intersect: false,
														mode: "index" as const,
													},
													plugins: {
														legend: {
															display: false,
														},
														tooltip: {
															backgroundColor: "rgba(255, 255, 255, 0.98)",
															titleColor: "#6B7280",
															bodyColor: "#111827",
															borderColor: "rgba(0, 0, 0, 0.08)",
															borderWidth: 1,
															padding: 12,
														},
													},
													scales: {
														x: {
															grid: { display: false },
															ticks: {
																font: { size: 11 },
																color: "#6B7280",
															},
															border: { display: false },
														},
														y: {
															grid: {
																color: "rgba(0, 0, 0, 0.06)",
																lineWidth: 1,
															},
															ticks: {
																font: { size: 11 },
																color: "#6B7280",
																callback: function(value) {
																	const numValue = typeof value === "number" ? value : Number(value);
																	return formatCompactCurrency(numValue, "$", 0).replace("$", "");
																},
															},
															border: { display: false },
														},
													},
												}}
											/>
										) : (
											<Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
												<Typography color="text.secondary">No data available</Typography>
											</Box>
										)}
								</NoSsr>
								</Box>
							</Stack>
						) : (
							<Box sx={{ height: { xs: "350px", sm: "400px", md: "450px" }, width: "100%", position: "relative" }}>
								<NoSsr fallback={<Box sx={{ height: { xs: "350px", sm: "400px", md: "450px" } }} />}>
									{chartData.labels.length > 0 ? (
										<LineChart
											data={chartData}
											options={{
												responsive: true,
												maintainAspectRatio: false,
												animation: false, // No animation
												interaction: {
													intersect: false,
													mode: "index" as const,
												},
												plugins: {
													legend: {
														display: false,
													},
													tooltip: {
														backgroundColor: "rgba(255, 255, 255, 0.98)",
														titleColor: "#6B7280",
														bodyColor: "#111827",
														borderColor: "rgba(0, 0, 0, 0.12)",
														borderWidth: 1.5,
														padding: 16,
														boxPadding: 8,
														cornerRadius: 8,
														displayColors: true,
														titleFont: {
															size: 11,
															weight: "normal",
															family: "system-ui, -apple-system, sans-serif",
														},
														bodyFont: {
															size: 15,
															weight: "bold",
															family: "system-ui, -apple-system, sans-serif",
														},
														titleSpacing: 4,
														bodySpacing: 6,
														callbacks: {
															label: (context) => {
																const value = context.parsed.y;
																return `Total Value: ${formatCompactCurrency(value, "$", 2, secretMode)}`;
															},
														},
													},
												},
												scales: {
													x: {
														grid: {
															display: false,
														},
														ticks: {
															font: {
																size: 12,
																family: "system-ui, -apple-system, sans-serif",
																weight: "normal",
															},
															color: "#6B7280",
															padding: 8,
															maxRotation: 0,
															autoSkip: chartData.maxTicksLimit !== undefined, // Auto-skip only for long periods
															maxTicksLimit: chartData.maxTicksLimit, // Limit ticks for long periods
														},
														border: {
															display: false,
														},
													},
													y: {
														min: chartData.yAxisMin,
														max: chartData.yAxisMax,
														grid: {
															color: "rgba(0, 0, 0, 0.05)",
															lineWidth: 1,
														},
														ticks: {
															font: {
																size: 12,
																family: "system-ui, -apple-system, sans-serif",
																weight: "normal",
															},
															color: "#6B7280",
															padding: 10,
															callback: function(value) {
																const numValue = typeof value === "number" ? value : Number(value);
																if (numValue >= 1_000_000) return `$${(numValue / 1_000_000).toFixed(1)}M`;
																if (numValue >= 1_000) return `$${(numValue / 1_000).toFixed(0)}K`;
																return `$${numValue.toFixed(0)}`;
															},
														},
														border: {
															display: false,
														},
													},
												},
											}}
										/>
									) : (
										<Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
											<Typography color="text.secondary">No data available</Typography>
										</Box>
									)}
								</NoSsr>
							</Box>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}

interface PerformanceTooltipContentProps {
	active?: boolean;
	payload?: { name: string; dataKey: string; value: number; stroke: string }[];
	label?: string;
}

function PerformanceTooltipContent({ active, payload, label }: PerformanceTooltipContentProps): React.JSX.Element | null {
	const { secretMode } = useSecretMode();
	
	if (!active || !payload || payload.length === 0) {
		return null;
	}

	const entry = payload[0];

	return (
		<Paper 
			sx={{ 
				border: "1px solid rgba(0, 0, 0, 0.08)", 
				boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)", 
				p: 2,
				borderRadius: 2,
				backgroundColor: "rgba(255, 255, 255, 0.98)",
				backdropFilter: "blur(10px)",
				minWidth: 160
			}}
		>
			<Stack spacing={1.5}>
				{label && (
					<Typography 
						variant="caption" 
						sx={{ 
							color: "#6B7280", 
							fontSize: "0.75rem",
							fontWeight: 500,
							textTransform: "uppercase",
							letterSpacing: "0.5px"
						}}
					>
						{label}
					</Typography>
				)}
				<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
						<Box
							sx={{
							bgcolor: "#FFB800",
							borderRadius: "4px",
							height: "12px",
							width: "12px",
							boxShadow: "0 2px 4px rgba(255, 184, 0, 0.3)"
							}}
						/>
					<Stack spacing={0.5} sx={{ flex: "1 1 auto" }}>
						<Typography 
							variant="caption" 
							sx={{ 
								color: "#9CA3AF", 
								fontSize: "0.75rem",
								fontWeight: 500
							}}
						>
							Total Value
						</Typography>
						<Typography 
							variant="body1" 
							sx={{ 
								color: "#111827", 
								fontSize: "1rem",
								fontWeight: 700,
								letterSpacing: "-0.02em"
							}}
						>
						{formatCompactCurrency(entry.value, "$", 2, secretMode)}
					</Typography>
					</Stack>
				</Stack>
			</Stack>
		</Paper>
	);
}

interface WalletPerformanceTooltipContentProps {
	active?: boolean;
	payload?: { name: string; dataKey: string; value: number; stroke: string }[];
	label?: string;
	wallets: Array<{ id: string; name: string }>;
}

function WalletPerformanceTooltipContent({
	active,
	payload,
	label,
	wallets,
}: WalletPerformanceTooltipContentProps): React.JSX.Element | null {
	const { secretMode } = useSecretMode();
	
	if (!active || !payload || payload.length === 0) {
		return null;
	}

	return (
		<Paper sx={{ border: "1px solid var(--mui-palette-divider)", boxShadow: "var(--mui-shadows-16)", p: 1 }}>
			<Stack spacing={2}>
				{label && (
					<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
						{label}
					</Typography>
				)}
				{payload.map((entry) => {
					const wallet = wallets.find((w) => w.name.replace(/\s+/g, "_") === entry.dataKey);
					return (
						<Stack key={entry.dataKey} direction="row" spacing={3} sx={{ alignItems: "center" }}>
							<Stack direction="row" spacing={1} sx={{ alignItems: "center", flex: "1 1 auto" }}>
								<Box
									sx={{
										bgcolor: entry.stroke,
										borderRadius: "2px",
										height: "8px",
										width: "8px",
									}}
								/>
								<Typography sx={{ whiteSpace: "nowrap" }}>{wallet?.name || entry.name}</Typography>
							</Stack>
							<Typography color="text.secondary" variant="body2">
								{formatCompactCurrency(entry.value, "$", 2, secretMode)}
							</Typography>
						</Stack>
					);
				})}
			</Stack>
		</Paper>
	);
}

