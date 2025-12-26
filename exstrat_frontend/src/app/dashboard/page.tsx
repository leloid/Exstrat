"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import Grid from "@mui/material/Grid";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
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
		isLoadingHoldings,
		selectPortfolio,
	} = usePortfolio();
	const [isGlobalView, setIsGlobalView] = React.useState(true);
	const [globalHoldings, setGlobalHoldings] = React.useState<Holding[]>([]);
	const [loadingGlobal, setLoadingGlobal] = React.useState(false);
	const [selectedToken, setSelectedToken] = React.useState<Holding | null>(null);
	const loadingRef = React.useRef(false);
	const abortControllerRef = React.useRef<AbortController | null>(null);

	// Stabilize portfolio IDs to avoid unnecessary reloads
	const portfoliosIds = React.useMemo(() => portfolios.map((p) => p.id).join(","), [portfolios]);

	// Load global holdings when in global view - OPTIMIZED with parallel loading
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

			// Cancel previous request if still pending
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			loadingRef.current = true;
			setLoadingGlobal(true);

			// Create new AbortController for this request
			const abortController = new AbortController();
			abortControllerRef.current = abortController;

			try {
				// OPTIMIZATION: Use batch endpoint for better performance
				const portfolioIds = portfolios.map((p) => p.id);
				const allHoldings = await portfoliosApi.getBatchHoldings(portfolioIds).catch((error) => {
					console.error("Error loading batch holdings:", error);
					// Fallback to individual requests if batch fails
					return Promise.all(
						portfolios.map((portfolio) =>
							portfoliosApi.getPortfolioHoldings(portfolio.id).catch(() => [] as Holding[])
						)
					).then((arrays) => arrays.flat());
				});

				// Check if request was aborted
				if (abortController.signal.aborted) {
					return;
				}

				// Aggregate holdings by token - OPTIMIZED with Map
				const holdingsMap = new Map<string, Holding>();

				for (const holding of allHoldings) {
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
				}

				// Check if request was aborted before setting state
				if (!abortController.signal.aborted) {
					setGlobalHoldings(Array.from(holdingsMap.values()));
				}
			} catch (error) {
				if (!abortController.signal.aborted) {
					console.error("Error loading global holdings:", error);
					setGlobalHoldings([]);
				}
			} finally {
				if (!abortController.signal.aborted) {
					setLoadingGlobal(false);
					loadingRef.current = false;
				}
			}
		};

		loadGlobalHoldings();

		// Cleanup function to abort request if component unmounts or dependencies change
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, [isGlobalView, portfoliosIds, portfoliosLoading, portfolios]);

	// Determine which holdings to display - MEMOIZED
	const displayHoldings = React.useMemo(() => {
		return isGlobalView ? globalHoldings : holdings;
	}, [isGlobalView, globalHoldings, holdings]);

	// Calculate portfolio statistics - MEMOIZED with optimized calculations
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

		// Single pass calculation for better performance
		let capitalInvesti = 0;
		let valeurActuelle = 0;

		for (const h of holdingsToUse) {
			capitalInvesti += h.investedAmount || 0;
			// IMPORTANT: Utiliser currentValue du backend qui est calculé avec currentPrice (prix actuel du marché)
			// currentValue = quantity * currentPrice (ou quantity * averagePrice si currentPrice n'est pas disponible)
			valeurActuelle += h.currentValue || 0;
		}

		const pnlAbsolu = valeurActuelle - capitalInvesti;
		const pnlRelatif = capitalInvesti > 0 ? (pnlAbsolu / capitalInvesti) * 100 : 0;

		return {
			capitalInvesti,
			valeurActuelle,
			pnlAbsolu,
			pnlRelatif,
		};
	}, [displayHoldings]);

	// If no portfolio is selected and not in global view, switch to global view
	React.useEffect(() => {
		if (!isGlobalView && !currentPortfolio && portfolios.length > 0) {
			setIsGlobalView(true);
		}
	}, [isGlobalView, currentPortfolio, portfolios.length]);

	// Memoize handlers to prevent unnecessary re-renders
	const handlePortfolioChange = React.useCallback(
		(e: SelectChangeEvent<string>) => {
			const value = e.target.value;
			if (value === "global") {
				setIsGlobalView(true);
			} else {
				setIsGlobalView(false);
				selectPortfolio(value);
			}
		},
		[selectPortfolio]
	);

	const handleTokenClick = React.useCallback((token: Holding) => {
		setSelectedToken(token);
	}, []);

	const handleCloseSidebar = React.useCallback(() => {
		setSelectedToken(null);
	}, []);

	if (portfoliosLoading || loadingGlobal || (!isGlobalView && isLoadingHoldings)) {
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
					<FormControl size="small" sx={{ minWidth: 200 }}>
						<Select value={isGlobalView ? "global" : currentPortfolio?.id || ""} onChange={handlePortfolioChange}>
							<MenuItem value="global">🌐 Portefeuille Global</MenuItem>
							{portfolios.map((portfolio) => (
								<MenuItem key={portfolio.id} value={portfolio.id}>
									{portfolio.name}
									{portfolio.isDefault && " (par défaut)"}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Stack>

				{/* Empty State */}
				{displayHoldings.length === 0 ? (
					<Box sx={{ py: 8, textAlign: "center" }}>
						<Typography color="text.secondary" variant="body1">
							{isGlobalView
								? "Aucun investissement trouvé dans vos portefeuilles. Ajoutez des transactions pour commencer."
								: "Ce portefeuille ne contient aucun token. Ajoutez des transactions pour commencer."}
						</Typography>
						{!isGlobalView && (
							<Button
								variant="contained"
								sx={{ mt: 2 }}
								onClick={() => router.push("/dashboard/investissements")}
							>
								Ajouter des transactions
							</Button>
						)}
					</Box>
				) : (
					<>
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
							onTokenClick={handleTokenClick}
						/>
					</>
				)}

				{/* Token Strategy Sidebar */}
				<TokenStrategySidebar
					open={selectedToken !== null}
					onClose={handleCloseSidebar}
					holding={selectedToken}
					portfolioId={isGlobalView ? undefined : currentPortfolio?.id}
				/>
			</Stack>
		</Box>
	);
}
