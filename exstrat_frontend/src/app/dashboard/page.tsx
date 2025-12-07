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
import { useRouter } from "next/navigation";

import { usePortfolio } from "@/contexts/PortfolioContext";
import { QuickStats } from "@/components/dashboard/portfolio/quick-stats";
import { GainsLossesChart } from "@/components/dashboard/portfolio/gains-losses-chart";
import { TokenDistribution } from "@/components/dashboard/portfolio/token-distribution";
import { TokensTable } from "@/components/dashboard/portfolio/tokens-table";
import { TokenStrategySidebar } from "@/components/dashboard/portfolio/token-strategy-sidebar";
import type { Holding } from "@/types/portfolio";
import * as portfoliosApi from "@/lib/portfolios-api";


export default function Page(): React.JSX.Element {
	const router = useRouter();
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
	const loadingRef = React.useRef(false);

	// Stabilize portfolio IDs to avoid unnecessary reloads
	const portfoliosIds = React.useMemo(() => portfolios.map((p) => p.id).join(","), [portfolios]);

	// Load global holdings when in global view
	React.useEffect(() => {
		const loadGlobalHoldings = async () => {
			if (!isGlobalView || portfoliosLoading || portfolios.length === 0) {
				if (!isGlobalView) {
					setGlobalHoldings([]);
				}
				return;
			}

			// Prevent multiple simultaneous loads
			if (loadingRef.current) {
				return;
			}

			loadingRef.current = true;
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
				loadingRef.current = false;
			}
		};

		loadGlobalHoldings();
	}, [isGlobalView, portfoliosIds, portfoliosLoading]);

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
						<Button variant="contained" onClick={() => router.push("/dashboard/investissements")}>
							Manage Portfolios
						</Button>
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
						<Typography color="text.secondary" variant="body1">
							{isGlobalView
								? "No investments found in your portfolios. Add transactions to get started."
								: "This portfolio contains no tokens. Add transactions to get started."}
						</Typography>
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
						<Typography variant="h4">Overview</Typography>
						<Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
							Overview of your portfolio performance
						</Typography>
					</Box>
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
				</Stack>

				{/* Quick Stats */}
				<QuickStats
					capitalInvesti={portfolioStats.capitalInvesti}
					valeurActuelle={portfolioStats.valeurActuelle}
					pnlAbsolu={portfolioStats.pnlAbsolu}
					pnlRelatif={portfolioStats.pnlRelatif}
				/>

				{/* Gains and Losses Chart and Token Distribution */}
				<Grid container spacing={3}>
					<Grid size={{ xs: 12, lg: 8 }}>
						<GainsLossesChart holdings={displayHoldings} />
					</Grid>
					<Grid size={{ xs: 12, lg: 4 }}>
						<TokenDistribution holdings={displayHoldings} />
					</Grid>
				</Grid>

				{/* Tokens Table */}
				<TokensTable
					holdings={displayHoldings}
					portfolioId={isGlobalView ? undefined : currentPortfolio?.id}
					onTokenClick={setSelectedToken}
				/>

				{/* Token Strategy Sidebar */}
				<TokenStrategySidebar
					open={selectedToken !== null}
					onClose={() => setSelectedToken(null)}
					holding={selectedToken}
					portfolioId={isGlobalView ? undefined : currentPortfolio?.id}
				/>

			</Stack>
		</Box>
	);
}
