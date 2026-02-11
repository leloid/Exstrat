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

import Avatar from "@mui/material/Avatar";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import { WalletIcon } from "@phosphor-icons/react/dist/ssr/Wallet";
import { InfoIcon } from "@phosphor-icons/react/dist/ssr/Info";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut";
import { GlobeIcon } from "@phosphor-icons/react/dist/ssr/Globe";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { useTheme } from "@mui/material/styles";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip as RechartsTooltip } from "recharts";

import { usePortfolio } from "@/contexts/PortfolioContext";
import { QuickStats } from "@/components/dashboard/portfolio/quick-stats";
import { GainsLossesChart } from "@/components/dashboard/portfolio/gains-losses-chart";
import { WalletPerformance } from "@/components/dashboard/portfolio/wallet-performance";
import { TokensTable } from "@/components/dashboard/portfolio/tokens-table";
import { TokenStrategySidebar } from "@/components/dashboard/portfolio/token-strategy-sidebar";
import { NoSsr } from "@/components/core/no-ssr";
import { formatCurrency, formatQuantity, formatQuantityCompactWithK, formatCompactCurrency } from "@/lib/format";
import { getTokenLogoUrl } from "@/lib/utils";
import { useSecretMode } from "@/hooks/use-secret-mode";
import type { Holding } from "@/types/portfolio";
import * as portfoliosApi from "@/lib/portfolios-api";
import { transactionsApi } from "@/lib/transactions-api";
import type { TransactionResponse } from "@/types/transactions";

interface WalletFilterSelectorProps {
	portfolios: Array<{ id: string; name: string; isDefault?: boolean }>;
	isGlobalView: boolean;
	currentPortfolio: { id: string; name: string } | null;
	onPortfolioChange: (value: string) => void;
}

function WalletFilterSelector({
	portfolios,
	isGlobalView,
	currentPortfolio,
	onPortfolioChange,
}: WalletFilterSelectorProps): React.JSX.Element {
	const theme = useTheme();
	const isDarkMode = theme.palette.mode === "dark";
	const [open, setOpen] = React.useState(false);

	const selectedValue = isGlobalView ? "global" : currentPortfolio?.id || "";
	const selectedLabel = isGlobalView ? "Portefeuille Global" : currentPortfolio?.name || "Sélectionner un portefeuille";
	const primaryMain = theme.palette.primary.main;

	// Tokens: contrast fort en dark — texte blanc / gris clair lisible
	const tokens = {
		label: isDarkMode ? "#B8C4CE" : "#64748B",
		triggerBg: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "#FFFFFF",
		triggerBorder: isDarkMode ? "rgba(255, 255, 255, 0.25)" : "rgba(0, 0, 0, 0.12)",
		triggerText: isDarkMode ? "#FFFFFF" : "#0F172A",
		triggerSub: isDarkMode ? "#B8C4CE" : "#64748B",
		menuBg: isDarkMode ? "#1E293B" : "#FFFFFF",
		menuBorder: isDarkMode ? "rgba(255, 255, 255, 0.18)" : "rgba(0, 0, 0, 0.08)",
		itemText: isDarkMode ? "#F1F5F9" : "#334155",
		itemHover: isDarkMode ? "rgba(255, 255, 255, 0.08)" : "rgba(0, 0, 0, 0.04)",
		selectedBg: isDarkMode ? `${primaryMain}22` : `${primaryMain}12`,
		selectedText: primaryMain,
		badge: isDarkMode ? "#94A3B8" : "#94A3B8",
		chevron: isDarkMode ? "#E2E8F0" : "#64748B",
	};

	const handleChange = (e: SelectChangeEvent<string>) => {
		onPortfolioChange(e.target.value);
		setOpen(false);
	};

	return (
		<Box sx={{ width: "100%", maxWidth: { xs: "100%", sm: 360 } }}>
			<Typography
				variant="caption"
				sx={{
					display: "block",
					mb: 1,
					fontWeight: 600,
					fontSize: "0.75rem",
					letterSpacing: "0.04em",
					textTransform: "uppercase",
					color: tokens.label,
				}}
			>
				Vue du portefeuille
			</Typography>
			<FormControl fullWidth>
				<Select
					value={selectedValue}
					onChange={handleChange}
					onOpen={() => setOpen(true)}
					onClose={() => setOpen(false)}
					open={open}
					displayEmpty
					IconComponent={() => (
						<CaretDownIcon
							style={{
								color: tokens.chevron,
								fontSize: "1.25rem",
								marginRight: 12,
								transform: open ? "rotate(180deg)" : "none",
								transition: "transform 0.2s ease",
							}}
						/>
					)}
					sx={{
						height: 56,
						borderRadius: 2,
						bgcolor: tokens.triggerBg,
						border: `1px solid ${tokens.triggerBorder}`,
						transition: "border-color 0.2s, box-shadow 0.2s",
						"&:hover": {
							borderColor: isDarkMode ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
							boxShadow: isDarkMode ? "0 0 0 1px rgba(255,255,255,0.08)" : "0 0 0 1px rgba(0,0,0,0.06)",
						},
						"&.Mui-focused": {
							borderColor: primaryMain,
							boxShadow: `0 0 0 2px ${primaryMain}30`,
						},
						"& .MuiSelect-select": {
							py: 0,
							px: 2,
							height: "100%",
							display: "flex",
							alignItems: "center",
							boxSizing: "border-box",
						},
						"& .MuiOutlinedInput-notchedOutline": { display: "none" },
						"& fieldset": { display: "none" },
					}}
					renderValue={(value) => {
						if (value === "global" || value === "") {
							return (
								<Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flex: 1 }}>
									<Box
										sx={{
											width: 40,
											height: 40,
											borderRadius: 1.5,
											bgcolor: `${primaryMain}18`,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										<GlobeIcon fontSize="1.35rem" weight="fill" style={{ color: primaryMain }} />
									</Box>
									<Stack spacing={0}>
										<Typography variant="body1" sx={{ fontWeight: 600, color: tokens.triggerText, fontSize: "1rem", lineHeight: 1.3 }}>
											Portefeuille Global
										</Typography>
										<Typography variant="caption" sx={{ color: tokens.triggerSub, fontSize: "0.75rem" }}>
											Tous les portefeuilles
										</Typography>
									</Stack>
								</Stack>
							);
						}
						const portfolio = portfolios.find((p) => p.id === value);
						return (
							<Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flex: 1 }}>
								<Box
									sx={{
										width: 40,
										height: 40,
										borderRadius: 1.5,
										bgcolor: `${primaryMain}18`,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
									}}
								>
									<WalletIcon fontSize="1.35rem" weight="fill" style={{ color: primaryMain }} />
								</Box>
								<Stack spacing={0}>
									<Typography variant="body1" sx={{ fontWeight: 600, color: tokens.triggerText, fontSize: "1rem", lineHeight: 1.3 }}>
										{portfolio?.name || selectedLabel}
									</Typography>
									<Typography variant="caption" sx={{ color: tokens.triggerSub, fontSize: "0.75rem" }}>
										{portfolio?.isDefault ? "Portefeuille par défaut" : "Portefeuille individuel"}
									</Typography>
								</Stack>
							</Stack>
						);
					}}
					MenuProps={{
						PaperProps: {
							sx: {
								mt: 1.5,
								borderRadius: 2,
								boxShadow: isDarkMode ? "0 12px 40px rgba(0, 0, 0, 0.5)" : "0 12px 40px rgba(0, 0, 0, 0.12)",
								border: `1px solid ${tokens.menuBorder}`,
								bgcolor: tokens.menuBg,
								maxHeight: 380,
								py: 0.5,
								"& .MuiList-root": { py: 0 },
								"& .MuiMenuItem-root": {
									py: 1.5,
									px: 2,
									minHeight: 52,
									borderRadius: 1,
									mx: 0.5,
									color: tokens.itemText,
									"&:hover": { bgcolor: tokens.itemHover },
									"&.Mui-selected": {
										bgcolor: tokens.selectedBg,
										color: tokens.selectedText,
										fontWeight: 600,
										"&:hover": { bgcolor: isDarkMode ? `${primaryMain}28` : `${primaryMain}18` },
									},
								},
							},
						},
						MenuListProps: { disablePadding: true },
					}}
				>
					<MenuItem value="global">
						<Stack direction="row" spacing={1.5} sx={{ alignItems: "center", width: "100%" }}>
							<Box
								sx={{
									width: 36,
									height: 36,
									borderRadius: 1.25,
									bgcolor: isGlobalView ? `${primaryMain}22` : (isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"),
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
								}}
							>
								<GlobeIcon fontSize="1.2rem" weight="fill" style={{ color: isGlobalView ? primaryMain : tokens.chevron }} />
							</Box>
							<Typography variant="body1" sx={{ fontWeight: isGlobalView ? 600 : 500, color: "inherit", fontSize: "0.9375rem" }}>
								Portefeuille Global
							</Typography>
						</Stack>
					</MenuItem>
					{portfolios.map((portfolio) => {
						const selected = currentPortfolio?.id === portfolio.id;
						return (
							<MenuItem key={portfolio.id} value={portfolio.id}>
								<Stack direction="row" spacing={1.5} sx={{ alignItems: "center", width: "100%" }}>
									<Box
										sx={{
											width: 36,
											height: 36,
											borderRadius: 1.25,
											bgcolor: selected ? `${primaryMain}22` : (isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"),
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										<WalletIcon fontSize="1.2rem" weight="fill" style={{ color: selected ? primaryMain : tokens.chevron }} />
									</Box>
									<Stack direction="row" spacing={1} sx={{ alignItems: "center", flex: 1, minWidth: 0 }}>
										<Typography variant="body1" sx={{ fontWeight: selected ? 600 : 500, color: "inherit", fontSize: "0.9375rem" }} noWrap>
											{portfolio.name}
										</Typography>
										{portfolio.isDefault && (
											<Typography
												component="span"
												variant="caption"
												sx={{
													px: 1,
													py: 0.25,
													borderRadius: 1,
													bgcolor: isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)",
													color: tokens.badge,
													fontSize: "0.7rem",
													fontWeight: 500,
												}}
											>
												Défaut
											</Typography>
										)}
									</Stack>
								</Stack>
							</MenuItem>
						);
					})}
				</Select>
			</FormControl>
		</Box>
	);
}

export default function Page(): React.JSX.Element {
	const router = useRouter();
	const { secretMode } = useSecretMode();
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
	const [transactions, setTransactions] = React.useState<TransactionResponse[]>([]);
	const [portfolioData, setPortfolioData] = React.useState<Record<string, any>>({});

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

	// Calculate aggregated token data for chart (similar to investissements page)
	const allTokenData = React.useMemo(() => {
		const tokenMap = new Map<string, { symbol: string; name: string; quantity: number; value: number; color: string }>();

		displayHoldings.forEach((holding) => {
			const symbol = holding.token.symbol.toUpperCase();
			// IMPORTANT: Utiliser currentValue du backend qui est calculé avec currentPrice (prix actuel du marché)
			const currentValue = holding.currentValue || 0;

			if (tokenMap.has(symbol)) {
				const existing = tokenMap.get(symbol)!;
				existing.quantity += holding.quantity;
				existing.value += currentValue;
			} else {
				// Generate a color based on symbol using vibrant colors that work well in dark mode
				const colors = [
					"var(--mui-palette-primary-main)", // #047DD5 - Exstrat Blue
					"var(--mui-palette-secondary-main)", // #F6851B - Exstrat Orange
					"var(--mui-palette-success-main)", // Green
					"var(--mui-palette-warning-main)", // Yellow/Orange
					"var(--mui-palette-error-main)", // Red
					"var(--mui-palette-info-main)", // Cyan/Blue
					"#9C27B0", // Purple
					"#E91E63", // Pink
					"#00BCD4", // Cyan
					"#4CAF50", // Green
					"#FF9800", // Orange
					"#2196F3", // Blue
				];
				const colorIndex = symbol.charCodeAt(0) % colors.length;

				tokenMap.set(symbol, {
					symbol,
					name: holding.token.name,
					quantity: holding.quantity,
					value: currentValue,
					color: colors[colorIndex],
				});
			}
		});

		// Convert to array and sort by value (descending)
		return Array.from(tokenMap.values())
			.sort((a, b) => b.value - a.value)
			.map((item) => ({
				name: item.symbol,
				value: item.value,
				color: item.color,
				quantity: item.quantity,
				tokenName: item.name,
			}));
	}, [displayHoldings]);

	// Token data for chart (limited to top 10, with "Others" for the rest)
	const aggregatedTokenData = React.useMemo(() => {
		// Limit to top 10 for chart display, group the rest as "Others"
		const MAX_TOKENS_FOR_CHART = 10;
		if (allTokenData.length <= MAX_TOKENS_FOR_CHART) {
			return allTokenData;
		}

		const topTokens = allTokenData.slice(0, MAX_TOKENS_FOR_CHART);
		const othersValue = allTokenData.slice(MAX_TOKENS_FOR_CHART).reduce((sum, token) => sum + token.value, 0);
		const othersQuantity = allTokenData.slice(MAX_TOKENS_FOR_CHART).reduce((sum, token) => sum + token.quantity, 0);

		if (othersValue > 0) {
			topTokens.push({
				name: "Others",
				value: othersValue,
				color: "var(--mui-palette-text-secondary)",
				quantity: othersQuantity,
				tokenName: `+${allTokenData.length - MAX_TOKENS_FOR_CHART} more tokens`,
			});
		}

		return topTokens;
	}, [allTokenData]);

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

	// Load transactions
	React.useEffect(() => {
		const loadTransactions = async () => {
			try {
				const response = await transactionsApi.getTransactions({ limit: 100 });
				setTransactions(response.transactions);
			} catch (error) {
				console.error("Error loading transactions:", error);
			}
		};
		loadTransactions();
	}, []);

	// Load portfolio data
	React.useEffect(() => {
		const loadPortfolioData = async () => {
			if (portfolios.length === 0) {
				setPortfolioData({});
				return;
			}

			const data: Record<string, any> = {};
			for (const portfolio of portfolios) {
				try {
					const holdings = await portfoliosApi.getPortfolioHoldings(portfolio.id);
					const invested = holdings.reduce((sum, h) => sum + (h.investedAmount || 0), 0);
					const value = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
					const pnl = value - invested;
					const pnlPercentage = invested > 0 ? (pnl / invested) * 100 : 0;

					data[portfolio.id] = {
						id: portfolio.id,
						name: portfolio.name,
						description: portfolio.description,
						isDefault: portfolio.isDefault,
						holdings,
						invested,
						value,
						pnl,
						pnlPercentage,
						holdingsCount: holdings.length,
					};
				} catch (error) {
					console.error(`Error loading portfolio ${portfolio.id}:`, error);
				}
			}
			setPortfolioData(data);
		};

		if (!portfoliosLoading && portfolios.length > 0) {
			loadPortfolioData();
		}
	}, [portfolios, portfoliosLoading]);

	// Memoize handlers to prevent unnecessary re-renders
	const handlePortfolioChange = React.useCallback(
		(value: string) => {
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
				width: "100%",
				maxWidth: "100%",
				m: 0,
				p: { xs: 2, sm: 3, md: 4 },
			}}
		>
			<Stack spacing={{ xs: 2, sm: 3, md: 4 }}>
				{/* Header */}
				{portfolios.length > 0 && transactions.length > 0 && (
					<WalletFilterSelector
						portfolios={portfolios}
						isGlobalView={isGlobalView}
						currentPortfolio={currentPortfolio}
						onPortfolioChange={handlePortfolioChange}
					/>
				)}

				{/* Empty State */}
				{displayHoldings.length === 0 ? (
					<Card
						sx={{
							width: "100%",
							py: { xs: 6, sm: 8 },
							px: { xs: 3, sm: 4 },
							textAlign: "center",
							background: (theme) =>
								theme.palette.mode === "dark"
									? "linear-gradient(135deg, rgba(156, 39, 176, 0.1) 0%, rgba(25, 118, 210, 0.1) 100%)"
									: "linear-gradient(135deg, rgba(156, 39, 176, 0.05) 0%, rgba(25, 118, 210, 0.05) 100%)",
							border: (theme) =>
								theme.palette.mode === "dark"
									? "1px solid rgba(156, 39, 176, 0.2)"
									: "1px solid rgba(156, 39, 176, 0.1)",
							borderRadius: 3,
						}}
					>
						<Stack spacing={3} sx={{ alignItems: "center", maxWidth: 500, mx: "auto" }}>
							<Stack spacing={1}>
								<Typography variant="h5" sx={{ fontWeight: 600 }}>
									{portfolios.length === 0
										? "Start Managing Your Investments"
										: isGlobalView
											? "No Investments Yet"
											: "This Portfolio is Empty"}
								</Typography>
								<Typography color="text.secondary" variant="body1" sx={{ maxWidth: 400, mx: "auto" }}>
									{portfolios.length === 0
										? "Go to the Investments page to create your first wallet and start tracking your cryptocurrency investments."
										: isGlobalView
											? "No investments found in your portfolios. Go to the Investments page to add transactions and track your performance."
											: "This portfolio contains no tokens. Go to the Investments page to add transactions."}
								</Typography>
							</Stack>
							<Button
								variant="contained"
								size="large"
								startIcon={<WalletIcon />}
								endIcon={<ArrowSquareOutIcon />}
								onClick={() => router.push("/dashboard/investissements")}
								sx={{
									px: 4,
									py: 1.5,
									borderRadius: 2,
									textTransform: "none",
									fontSize: "1rem",
									fontWeight: 600,
									boxShadow: (theme) =>
										theme.palette.mode === "dark"
											? "0 4px 20px rgba(25, 118, 210, 0.4)"
											: "0 4px 20px rgba(25, 118, 210, 0.3)",
									"&:hover": {
										boxShadow: (theme) =>
											theme.palette.mode === "dark"
												? "0 6px 24px rgba(25, 118, 210, 0.5)"
												: "0 6px 24px rgba(25, 118, 210, 0.4)",
										transform: "translateY(-2px)",
									},
									transition: "all 0.3s ease",
								}}
							>
								{portfolios.length === 0 ? "Go to Investments Page" : "Go to Investments Page"}
							</Button>
						</Stack>
					</Card>
				) : (
					<>
						{/* Quick Stats */}
						<QuickStats
							capitalInvesti={portfolioStats.capitalInvesti}
							valeurActuelle={portfolioStats.valeurActuelle}
							pnlAbsolu={portfolioStats.pnlAbsolu}
							pnlRelatif={portfolioStats.pnlRelatif}
						/>

						{/* Wallet Performance, Gains and Losses Chart and Token Distribution */}
						<Grid container spacing={{ xs: 2, sm: 3 }} sx={{ alignItems: "stretch" }}>
							<Grid size={{ xs: 12, lg: 8 }}>
								<Stack spacing={{ xs: 2, sm: 3 }} sx={{ height: "100%" }}>
									{/* Wallet Performance */}
									{portfolios.length > 0 && transactions.length > 0 && (
										<Box sx={{ flex: "1 1 auto", minHeight: { xs: "300px", sm: "350px", md: "400px" }, display: "flex", flexDirection: "column" }}>
											<WalletPerformance 
												portfolios={portfolios} 
												transactions={transactions} 
												portfolioData={portfolioData}
												selectedPortfolioId={isGlobalView ? null : currentPortfolio?.id}
											/>
										</Box>
									)}
									{/* Gains and Losses Chart */}
									<Box sx={{ flex: "1 1 auto", minHeight: { xs: "300px", sm: "350px", md: "400px" }, display: "flex", flexDirection: "column" }}>
										<GainsLossesChart holdings={displayHoldings} />
									</Box>
								</Stack>
							</Grid>
							<Grid size={{ xs: 12, lg: 4 }}>
								{aggregatedTokenData.length > 0 ? (
									<Card sx={{ width: "100%", height: "100%", minHeight: { xs: "400px", sm: "500px", md: "600px" }, display: "flex", flexDirection: "column" }}>
										<CardHeader
											avatar={
												<Avatar>
													<WalletIcon fontSize="var(--Icon-fontSize)" />
												</Avatar>
											}
											subheader="Balance across all your wallets"
											title="Token Distribution"
										/>
										<CardContent>
											<Stack spacing={3}>
												{/* Centered Chart */}
												<Box
													sx={{
														display: "flex",
														justifyContent: "center",
														alignItems: "center",
														width: "100%",
													}}
												>
													<Box sx={{ height: { xs: "180px", sm: "200px", md: "220px" }, width: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
														<NoSsr fallback={<Box sx={{ height: "100%", aspectRatio: "1" }} />}>
															<ResponsiveContainer width="100%" height="100%">
																<PieChart>
																	<Pie
																		animationDuration={300}
																		cx="50%"
																		cy="50%"
																		data={aggregatedTokenData}
																		dataKey="value"
																		innerRadius="35%"
																		nameKey="name"
																		outerRadius="50%"
																		strokeWidth={0}
																	>
																{aggregatedTokenData.map(
																	(entry): React.JSX.Element => (
																		<Cell fill={entry.color} key={entry.name} />
																	)
																)}
																	</Pie>
																	<RechartsTooltip animationDuration={50} content={<TokenTooltipContent />} />
																</PieChart>
															</ResponsiveContainer>
														</NoSsr>
													</Box>
												</Box>
												{/* Text Content */}
												<Stack spacing={3}>
													{!secretMode && (
														<Stack spacing={1}>
															<Typography color="text.secondary" variant="overline">
																Total balance
															</Typography>
															<Typography variant="h4">
																{formatCompactCurrency(
																	allTokenData.reduce((sum, item) => sum + item.value, 0),
																	"$",
																	2
																)}
															</Typography>
														</Stack>
													)}
													<Stack spacing={1}>
														<Typography color="text.secondary" variant="overline">
															Available tokens {allTokenData.length > 6 && `(showing top 6 of ${allTokenData.length})`}
														</Typography>
														<Stack component="ul" spacing={2} sx={{ listStyle: "none", m: 0, p: 0 }}>
															{aggregatedTokenData.slice(0, 6).map((entry) => (
																<Stack component="li" direction="row" key={entry.name} spacing={1} sx={{ alignItems: "center" }}>
																	<Box sx={{ bgcolor: entry.color, borderRadius: "2px", height: "4px", width: "16px" }} />
																	<Typography sx={{ flex: "1 1 auto" }} variant="subtitle2">
																		{entry.name}
																	</Typography>
																	<Tooltip title={formatQuantity(entry.quantity, 8, secretMode)} arrow placement="top">
																		<Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "flex-end", minWidth: "80px" }}>
																			{(() => {
																				const { display, showInfo } = formatQuantityCompactWithK(entry.quantity, 8, secretMode);
																				return (
																					<>
																						<Typography color="text.secondary" variant="body2" sx={{ textAlign: "right" }}>
																							{display}
																						</Typography>
																						{showInfo && (
																							<InfoIcon fontSize="var(--icon-fontSize-xs)" style={{ opacity: 0.6 }} />
																						)}
																					</>
																				);
																			})()}
																		</Stack>
																	</Tooltip>
																	<Tooltip title={formatCurrency(entry.value, "$", 2, secretMode)} arrow placement="top">
																		<Typography color="text.secondary" variant="body2" sx={{ minWidth: "90px", textAlign: "right", cursor: "help" }}>
																			{formatCompactCurrency(entry.value, "$", 2, secretMode)}
																		</Typography>
																	</Tooltip>
																</Stack>
															))}
															{allTokenData.length > 6 && (
																<Stack
																	component="li"
																	direction="row"
																	spacing={1}
																	sx={{ alignItems: "center", opacity: 0.6 }}
																>
																	<Box
																		sx={{
																			bgcolor: "var(--mui-palette-text-secondary)",
																			borderRadius: "2px",
																			height: "4px",
																			width: "16px",
																		}}
																	/>
																	<Typography color="text.secondary" sx={{ flex: "1 1 auto" }} variant="subtitle2">
																		+{allTokenData.length - 6} more tokens
																	</Typography>
																	<Tooltip
																		title={formatQuantity(
																			allTokenData
																				.slice(6)
																				.reduce((sum, token) => sum + token.quantity, 0),
																			8,
																			secretMode
																		)}
																		arrow
																		placement="top"
																	>
																		<Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "flex-end", minWidth: "80px" }}>
																			{(() => {
																				const { display, showInfo } = formatQuantityCompactWithK(
																					allTokenData.slice(6).reduce((sum, token) => sum + token.quantity, 0),
																					8,
																					secretMode
																				);
																				return (
																					<>
																						<Typography color="text.secondary" variant="body2" sx={{ textAlign: "right" }}>
																							{display}
																						</Typography>
																						{showInfo && (
																							<InfoIcon fontSize="var(--icon-fontSize-xs)" style={{ opacity: 0.6 }} />
																						)}
																					</>
																				);
																			})()}
																		</Stack>
																	</Tooltip>
																	<Tooltip
																		title={formatCurrency(
																			allTokenData.slice(6).reduce((sum, token) => sum + token.value, 0),
																			"$",
																			2,
																			secretMode
																		)}
																		arrow
																		placement="top"
																	>
																		<Typography color="text.secondary" variant="body2" sx={{ minWidth: "90px", textAlign: "right", cursor: "help" }}>
																			{formatCompactCurrency(
																				allTokenData.slice(6).reduce((sum, token) => sum + token.value, 0),
																				"$",
																				2,
																				secretMode
																			)}
																		</Typography>
																	</Tooltip>
																</Stack>
															)}
														</Stack>
													</Stack>
												</Stack>
											</Stack>
										</CardContent>
									</Card>
								) : (
									<Card sx={{ width: "100%" }}>
										<CardHeader
											avatar={
												<Avatar>
													<WalletIcon fontSize="var(--Icon-fontSize)" />
												</Avatar>
											}
											subheader="Token distribution across your portfolio"
											title="Token Distribution"
										/>
										<CardContent>
											<Box sx={{ py: 4, textAlign: "center" }}>
												<Typography color="text.secondary" variant="body2">
													No tokens to display
												</Typography>
											</Box>
										</CardContent>
									</Card>
								)}
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

// Token Tooltip Component
interface TokenTooltipContentProps {
	active?: boolean;
	payload?: { name: string; payload: { fill: string; quantity: number; tokenName: string }; value: number }[];
	label?: string;
}

function TokenTooltipContent({ active, payload }: TokenTooltipContentProps): React.JSX.Element | null {
	const { secretMode } = useSecretMode();
	
	if (!active || !payload || payload.length === 0) {
		return null;
	}

	const entry = payload[0];
	const data = entry.payload;

	return (
		<Paper sx={{ border: "1px solid var(--mui-palette-divider)", boxShadow: "var(--mui-shadows-16)", p: 1.5 }}>
			<Stack spacing={1.5}>
				<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
					<Box sx={{ bgcolor: entry.payload.fill, borderRadius: "2px", height: "8px", width: "8px" }} />
					<Typography sx={{ whiteSpace: "nowrap" }} variant="subtitle2">
						{entry.name}
					</Typography>
				</Stack>
				{data.tokenName && (
					<Typography color="text.secondary" variant="caption">
						{data.tokenName}
					</Typography>
				)}
				<Divider />
				<Stack spacing={1}>
					<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
						<Typography color="text.secondary" variant="body2">
							Quantity:
						</Typography>
						<Typography variant="body2">
							{formatQuantity(data.quantity, 8, secretMode)} {entry.name}
						</Typography>
					</Stack>
					<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
						<Typography color="text.secondary" variant="body2">
							Value:
						</Typography>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							{formatCompactCurrency(entry.value, "$", 2, secretMode)}
						</Typography>
					</Stack>
				</Stack>
			</Stack>
		</Paper>
	);
}
