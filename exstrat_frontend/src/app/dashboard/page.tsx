"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";

import { appConfig } from "@/config/app";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { PortfolioSummary } from "@/components/dashboard/portfolio/portfolio-summary";
import { TokenCard } from "@/components/dashboard/portfolio/token-card";
import { PortfolioEvolutionChart } from "@/components/dashboard/portfolio/portfolio-evolution-chart";
import { HoldingsTable } from "@/components/dashboard/portfolio/holdings-table";
import type { Holding } from "@/types/portfolio";
import * as portfoliosApi from "@/lib/portfolios-api";

interface EvolutionDataPoint {
	date: string;
	valeurBrute: number;
	valeurNette: number;
	investi: number;
}

export default function Page(): React.JSX.Element {
	const {
		portfolios,
		currentPortfolio,
		holdings,
		isLoading: portfoliosLoading,
		selectPortfolio,
	} = usePortfolio();
	const [isGlobalView, setIsGlobalView] = React.useState(false);
	const [globalHoldings, setGlobalHoldings] = React.useState<Holding[]>([]);
	const [loadingGlobal, setLoadingGlobal] = React.useState(false);
	const [selectedToken, setSelectedToken] = React.useState<Holding | null>(null);

	// Load global holdings when in global view
	React.useEffect(() => {
		const loadGlobalHoldings = async () => {
			if (!isGlobalView || portfoliosLoading || portfolios.length === 0) {
				if (!isGlobalView) {
					setGlobalHoldings([]);
				}
				return;
			}

			if (loadingGlobal) {
				return;
			}

			setLoadingGlobal(true);
			try {
				const allHoldings: Holding[] = [];

				for (const portfolio of portfolios) {
					try {
						const portfolioHoldings = await portfoliosApi.getPortfolioHoldings(portfolio.id);
						allHoldings.push(...portfolioHoldings);
					} catch (error) {
						console.error(`Error loading holdings for ${portfolio.name}:`, error);
					}
				}

				// Aggregate holdings by token
				const holdingsMap = new Map<string, Holding>();

				allHoldings.forEach((holding) => {
					const tokenId = holding.token.id;
					const existing = holdingsMap.get(tokenId);

					if (existing) {
						const totalQuantity = existing.quantity + holding.quantity;
						const totalInvested = existing.investedAmount + holding.investedAmount;
						const weightedAveragePrice = totalInvested / totalQuantity;
						const currentPrice = holding.currentPrice || existing.currentPrice || holding.averagePrice;
						const currentValue = currentPrice * totalQuantity;

						holdingsMap.set(tokenId, {
							...existing,
							quantity: totalQuantity,
							investedAmount: totalInvested,
							averagePrice: weightedAveragePrice,
							currentPrice: currentPrice,
							currentValue: currentValue,
							profitLoss: currentValue - totalInvested,
							profitLossPercentage:
								totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0,
						});
					} else {
						const currentPrice = holding.currentPrice || holding.averagePrice;
						const currentValue = currentPrice * holding.quantity;
						holdingsMap.set(tokenId, {
							...holding,
							currentPrice: currentPrice,
							currentValue: currentValue,
							profitLoss: currentValue - holding.investedAmount,
							profitLossPercentage:
								holding.investedAmount > 0
									? ((currentValue - holding.investedAmount) / holding.investedAmount) * 100
									: 0,
						});
					}
				});

				setGlobalHoldings(Array.from(holdingsMap.values()));
			} catch (error) {
				console.error("Error loading global holdings:", error);
				setGlobalHoldings([]);
			} finally {
				setLoadingGlobal(false);
			}
		};

		loadGlobalHoldings();
	}, [isGlobalView, portfolios, portfoliosLoading, loadingGlobal]);

	// Determine which holdings to display
	const displayHoldings = React.useMemo(() => {
		return isGlobalView ? globalHoldings : holdings;
	}, [isGlobalView, globalHoldings, holdings]);

	// Calculate portfolio statistics
	const portfolioStats = React.useMemo(() => {
		const holdingsToUse = displayHoldings;

		if (!holdingsToUse || holdingsToUse.length === 0) {
			return {
				capitalInvesti: 0,
				valeurActuelle: 0,
				pnlAbsolu: 0,
				pnlRelatif: 0,
			};
		}

		const capitalInvesti = holdingsToUse.reduce((sum, h) => sum + (h.investedAmount || 0), 0);
		const valeurActuelle = holdingsToUse.reduce((sum, h) => {
			const currentValue = h.currentValue || (h.currentPrice || h.averagePrice) * h.quantity;
			return sum + currentValue;
		}, 0);
		const pnlAbsolu = valeurActuelle - capitalInvesti;
		const pnlRelatif = capitalInvesti > 0 ? (pnlAbsolu / capitalInvesti) * 100 : 0;

		return {
			capitalInvesti,
			valeurActuelle,
			pnlAbsolu,
			pnlRelatif,
		};
	}, [displayHoldings]);

	// Generate evolution data (simulated - replace with real historical data)
	const evolutionData = React.useMemo<EvolutionDataPoint[]>(() => {
		if (!displayHoldings || displayHoldings.length === 0) return [];

		const now = new Date();
		const data: EvolutionDataPoint[] = [];
		const days = 30;

		const currentInvested = portfolioStats.capitalInvesti;
		const currentValue = portfolioStats.valeurActuelle;

		for (let i = days; i >= 0; i--) {
			const date = new Date(now);
			date.setDate(date.getDate() - i);

			const progress = i / days;
			const simulatedInvested = currentInvested * (0.7 + 0.3 * progress);
			const simulatedValue = simulatedInvested * (1 + (portfolioStats.pnlRelatif / 100) * progress);

			data.push({
				date: date.toISOString(),
				valeurBrute: simulatedValue,
				valeurNette: simulatedValue - simulatedInvested,
				investi: simulatedInvested,
			});
		}

		return data;
	}, [displayHoldings, portfolioStats]);

	// Get top 3 holdings for token cards
	const topHoldings = React.useMemo(() => {
		return [...displayHoldings]
			.sort((a, b) => {
				const valueA = a.currentValue || (a.currentPrice || a.averagePrice) * a.quantity;
				const valueB = b.currentValue || (b.currentPrice || b.averagePrice) * b.quantity;
				return valueB - valueA;
			})
			.slice(0, 3);
	}, [displayHoldings]);

	// Generate chart data for token cards (simulated)
	const generateChartData = React.useCallback(() => {
		return Array.from({ length: 30 }, () => Math.floor(Math.random() * 100) + 50);
	}, []);

	if (portfoliosLoading || loadingGlobal) {
		return (
			<Box
				sx={{
					alignItems: "center",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					minHeight: "400px",
				}}
			>
				<CircularProgress />
				<Typography color="text.secondary" sx={{ mt: 2 }} variant="body2">
					Loading portfolio data...
				</Typography>
			</Box>
		);
	}

	if (!isGlobalView && !currentPortfolio) {
		return (
			<Box
				sx={{
					maxWidth: "var(--Content-maxWidth)",
					m: "var(--Content-margin)",
					p: "var(--Content-padding)",
					width: "var(--Content-width)",
				}}
			>
				<Stack spacing={4}>
					<Box sx={{ py: 8, textAlign: "center" }}>
						<Typography color="text.secondary" variant="body1" sx={{ mb: 2 }}>
							No portfolio selected. Please create a portfolio or select one.
						</Typography>
						<Button variant="contained">Manage Portfolios</Button>
					</Box>
				</Stack>
			</Box>
		);
	}

	if (displayHoldings.length === 0) {
		return (
			<Box
				sx={{
					maxWidth: "var(--Content-maxWidth)",
					m: "var(--Content-margin)",
					p: "var(--Content-padding)",
					width: "var(--Content-width)",
				}}
			>
				<Stack spacing={4}>
					<Box sx={{ py: 8, textAlign: "center" }}>
						<Typography color="text.secondary" variant="body1" sx={{ mb: 2 }}>
							{isGlobalView
								? "No investments found in your portfolios. Add transactions to get started."
								: "This portfolio contains no tokens. Add transactions to get started."}
						</Typography>
						<Button startIcon={<PlusIcon />} variant="contained">
							Add Transaction
						</Button>
					</Box>
				</Stack>
			</Box>
		);
	}

	return (
		<Box
			sx={{
				maxWidth: "var(--Content-maxWidth)",
				m: "var(--Content-margin)",
				p: "var(--Content-padding)",
				width: "var(--Content-width)",
			}}
		>
			<Stack spacing={4}>
				{/* Header */}
				<Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ alignItems: "flex-start" }}>
					<Box sx={{ flex: "1 1 auto" }}>
						<Typography variant="h4">Dashboard</Typography>
					</Box>
					<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
						{portfolios.length > 0 && (
							<FormControl size="small" sx={{ minWidth: 200 }}>
								<Select
									value={isGlobalView ? "global" : currentPortfolio?.id || ""}
									onChange={(e) => {
										if (e.target.value === "global") {
											setIsGlobalView(true);
										} else {
											setIsGlobalView(false);
											selectPortfolio(e.target.value);
										}
									}}
								>
									<MenuItem value="global">🌐 Global (All Portfolios)</MenuItem>
									{portfolios.map((portfolio) => (
										<MenuItem key={portfolio.id} value={portfolio.id}>
											{portfolio.name}
											{portfolio.isDefault && " (default)"}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						)}
						<Button startIcon={<PlusIcon />} variant="contained">
							Add Transaction
						</Button>
					</Stack>
				</Stack>

				{/* Portfolio Summary */}
				<PortfolioSummary
					capitalInvesti={portfolioStats.capitalInvesti}
					valeurActuelle={portfolioStats.valeurActuelle}
					pnlAbsolu={portfolioStats.pnlAbsolu}
					pnlRelatif={portfolioStats.pnlRelatif}
				/>

				{/* Top Token Cards */}
				{topHoldings.length > 0 && (
					<Box
						sx={{
							display: "grid",
							gap: 3,
							gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", lg: "repeat(3, 1fr)" },
						}}
					>
						{topHoldings.map((holding) => (
							<TokenCard key={holding.id} holding={holding} data={generateChartData()} />
						))}
					</Box>
				)}

				{/* Main Content Grid */}
				<Grid container spacing={4}>
					{/* Portfolio Evolution Chart */}
					<Grid
						size={{
							lg: 8,
							xs: 12,
						}}
					>
						<PortfolioEvolutionChart data={evolutionData} />
					</Grid>

					{/* Holdings Table */}
					<Grid
						size={{
							lg: 4,
							xs: 12,
						}}
					>
						<HoldingsTable holdings={displayHoldings} onTokenClick={setSelectedToken} />
					</Grid>
				</Grid>
			</Stack>
		</Box>
	);
}
