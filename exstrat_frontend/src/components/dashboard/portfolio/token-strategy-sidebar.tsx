"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import LinearProgress from "@mui/material/LinearProgress";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { useColorScheme } from "@mui/material/styles";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { Area, AreaChart, CartesianGrid, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { NoSsr } from "@/components/core/no-ssr";
import { formatCurrency, formatPercentage } from "@/lib/format";
import { getTokenLogoUrl } from "@/lib/utils";
import type { Holding } from "@/types/portfolio";
import * as configurationApi from "@/lib/configuration-api";
import { getForecasts, getTheoreticalStrategies } from "@/lib/portfolios-api";
import { strategiesApi } from "@/lib/strategies-api";
import type { ForecastResponse } from "@/types/portfolio";
import type { AlertConfiguration } from "@/types/configuration";
import type { TheoreticalStrategyResponse, StrategyResponse } from "@/types/strategies";

export interface TokenStrategySidebarProps {
	open: boolean;
	onClose: () => void;
	holding: Holding | null;
	portfolioId?: string;
}

export function TokenStrategySidebar({
	open,
	onClose,
	holding,
	portfolioId,
}: TokenStrategySidebarProps): React.JSX.Element {
	const { colorScheme = "light" } = useColorScheme();
	const [forecast, setForecast] = React.useState<ForecastResponse | null>(null);
	const [strategy, setStrategy] = React.useState<TheoreticalStrategyResponse | null>(null);
	const [alertConfiguration, setAlertConfiguration] = React.useState<AlertConfiguration | null>(null);
	const [loading, setLoading] = React.useState(false);

	React.useEffect(() => {
		const loadData = async () => {
			if (!holding) {
				setForecast(null);
				setStrategy(null);
				setAlertConfiguration(null);
				return;
			}

			try {
				setLoading(true);

				// Load all active alert configurations (even without portfolioId for global view)
				const allConfigs = await configurationApi.getAlertConfigurations();
				const activeConfigs = allConfigs.filter((config) => config.isActive);

				// Find configuration with token alert for this holding
				const configWithToken = activeConfigs.find((config) =>
					config.tokenAlerts?.some((ta) => ta.holdingId === holding.id && ta.isActive)
				);

				if (!configWithToken) {
					setForecast(null);
					setStrategy(null);
					setAlertConfiguration(null);
					return;
				}

				setAlertConfiguration(configWithToken);

				// Load forecast
				const allForecasts = await getForecasts();
				const forecastData = allForecasts.find((f) => f.id === configWithToken.forecastId);

				if (!forecastData) {
					setForecast(null);
					setStrategy(null);
					return;
				}
				setForecast(forecastData);

				// Find strategy from token alert
				const tokenAlert = configWithToken.tokenAlerts?.find((ta) => ta.holdingId === holding.id);
				if (tokenAlert?.strategyId) {
					// Load both theoretical and real strategies
					const [theoreticalStrategies, realStrategiesData] = await Promise.all([
						getTheoreticalStrategies(),
						strategiesApi.getStrategies({}),
					]);

					// Convert real strategies to theoretical format
					const convertedStrategies: TheoreticalStrategyResponse[] = (realStrategiesData.strategies || []).map(
						(strategy: StrategyResponse) => {
							const profitTargets = strategy.steps.map((step, index) => ({
								order: index + 1,
								targetType: (step.targetType === "exact_price" ? "price" : "percentage") as "percentage" | "price",
								targetValue: step.targetValue,
								sellPercentage: step.sellPercentage,
								notes: step.notes,
							}));

							return {
								id: strategy.id,
								userId: strategy.userId,
								name: strategy.name,
								tokenSymbol: strategy.symbol,
								tokenName: strategy.tokenName,
								quantity: strategy.baseQuantity,
								averagePrice: strategy.referencePrice,
								profitTargets,
								status:
									strategy.status === "active" ? "active" : strategy.status === "paused" ? "paused" : "completed",
								createdAt: strategy.createdAt,
								updatedAt: strategy.updatedAt,
								numberOfTargets: strategy.steps.length,
							} as TheoreticalStrategyResponse;
						}
					);

					// Combine all strategies
					const allStrategies = [...(theoreticalStrategies || []), ...convertedStrategies];
					const strategyData = allStrategies.find((s) => s.id === tokenAlert.strategyId);
					setStrategy(strategyData || null);
				} else {
					setStrategy(null);
				}
			} catch (error) {
				console.error("Error loading strategy details:", error);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [holding, portfolioId]);

	// Generate price chart data
	const priceChartData = React.useMemo(() => {
		if (!holding) return [];
		const currentPrice = holding.currentPrice || holding.averagePrice || 0;
		if (currentPrice <= 0) return [];

		const data = [];
		const now = new Date();
		const days = 30;
		const averagePrice = holding.averagePrice || currentPrice;

		// Start from current price and work backwards
		let price = currentPrice;
		const volatility = 0.05;

		// Generate data points from past to present
		for (let i = days; i >= 0; i--) {
			const date = new Date(now);
			date.setDate(date.getDate() - i);

			// For the last point (today), use exact current price
			if (i === 0) {
				data.push({
					date: date.toISOString().split("T")[0],
					price: Number(currentPrice.toFixed(2)),
				});
			} else {
				// For past dates, simulate price evolution backwards
				// Calculate a realistic price based on distance from today
				const daysAgo = i;
				const progress = daysAgo / days; // 1 = 30 days ago, 0 = today
				
				// Simulate price evolution: start closer to average price in the past, move towards current price
				const targetPrice = averagePrice + (currentPrice - averagePrice) * (1 - progress);
				
				// Add some volatility
				const change = (Math.random() - 0.5) * volatility * 2;
				price = targetPrice * (1 + change);
				
				// Ensure price stays within reasonable bounds
				const minPrice = Math.min(averagePrice, currentPrice) * 0.5;
				const maxPrice = Math.max(averagePrice, currentPrice) * 1.5;
				price = Math.max(minPrice, Math.min(maxPrice, price));

				data.push({
					date: date.toISOString().split("T")[0],
					price: Number(price.toFixed(2)),
				});
			}
		}

		return data;
	}, [holding]);

	// Calculate Y-axis domain to include all Target Prices (must be before conditional return)
	const yAxisDomain = React.useMemo(() => {
		if (!strategy || !holding) return ["auto", "auto"];
		
		const currentPrice = holding.currentPrice || holding.averagePrice || 0;
		const prices: number[] = [];
		const targetPrices: number[] = [];
		
		// Add current price
		if (currentPrice > 0) prices.push(currentPrice);
		
		// Add average price
		if (holding.averagePrice > 0) prices.push(holding.averagePrice);
		
		// Add all Target Prices separately to track them
		strategy.profitTargets.forEach((tp) => {
			const targetPrice =
				tp.targetType === "percentage"
					? holding.averagePrice * (1 + tp.targetValue / 100)
					: tp.targetValue;
			if (targetPrice > 0) {
				prices.push(targetPrice);
				targetPrices.push(targetPrice);
			}
		});
		
		// Add all price data points
		priceChartData.forEach((point) => {
			if (point.price > 0) prices.push(point.price);
		});
		
		if (prices.length === 0) return ["auto", "auto"];
		
		const minPrice = Math.min(...prices);
		const maxPrice = Math.max(...prices);
		const range = maxPrice - minPrice;
		
		// Calculate margins intelligently based on TP positions
		let marginBottom = 0;
		let marginTop = 0;
		
		if (targetPrices.length > 0 && currentPrice > 0) {
			const minTP = Math.min(...targetPrices);
			const maxTP = Math.max(...targetPrices);
			
			// Calculate ratio between TP and current price
			const minTPRatio = minTP / currentPrice;
			const maxTPRatio = maxTP / currentPrice;
			
			// If TP is very low compared to current price (e.g., $200 vs $3206)
			if (minTPRatio < 0.5) {
				// TP is less than 50% of current price - ensure TP is visible with good margin
				// Use at least 20% of current price as bottom margin, or 50% of the TP value
				marginBottom = Math.max(
					currentPrice * 0.2,  // At least 20% of current price
					minTP * 0.5,         // Or 50% of the lowest TP
					range * 0.25         // Or 25% of the total range
				);
			} else {
				// Normal case - use proportional margin
				marginBottom = Math.max(range * 0.15, currentPrice * 0.05);
			}
			
			// If TP is very high compared to current price (e.g., $200k vs $80k)
			if (maxTPRatio > 1.5) {
				// TP is more than 150% of current price - ensure TP is visible with good margin
				// Use at least 20% of current price as top margin, or 30% of the gap to max TP
				marginTop = Math.max(
					currentPrice * 0.2,           // At least 20% of current price
					(maxTP - currentPrice) * 0.3,  // Or 30% of the gap to max TP
					range * 0.25                  // Or 25% of the total range
				);
			} else {
				// Normal case - use proportional margin
				marginTop = Math.max(range * 0.15, currentPrice * 0.05);
			}
		} else {
			// No TP, use standard margins
			marginBottom = Math.max(range * 0.15, currentPrice * 0.05);
			marginTop = Math.max(range * 0.15, currentPrice * 0.05);
		}
		
		const domainMin = Math.max(0, minPrice - marginBottom);
		const domainMax = maxPrice + marginTop;
		
		return [domainMin, domainMax];
	}, [strategy, holding, priceChartData]);

	if (!holding) {
		return <></>;
	}

	const tokenAlert = alertConfiguration?.tokenAlerts?.find((ta) => ta.holdingId === holding.id);
	const currentPrice = holding.currentPrice || holding.averagePrice || 0;
	const tpAlerts = tokenAlert?.tpAlerts || [];

	const totalTP = strategy?.profitTargets.length || 0;
	// Compter les TP atteints basé uniquement sur le prix, pas sur isActive
	// Un TP atteint reste atteint même s'il est désactivé après l'envoi de l'email
	const tpReached = tpAlerts.filter((tp) => currentPrice >= Number(tp.targetPrice)).length;
	const completionPercentage = totalTP > 0 ? (tpReached / totalTP) * 100 : 0;
	const projectedValue = tpAlerts.reduce((sum, tp) => sum + (tp.projectedAmount || 0), 0);

	const CustomTooltip = ({ active, payload, label }: any) => {
		if (active && payload && payload.length) {
			return (
				<Box
					sx={{
						bgcolor: "var(--mui-palette-background-paper)",
						border: "1px solid var(--mui-palette-divider)",
						borderRadius: 1,
						p: 1.5,
						boxShadow: "var(--mui-shadows-16)",
					}}
				>
					<Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
						{new Date(label).toLocaleDateString("en-US", { day: "2-digit", month: "short", year: "numeric" })}
					</Typography>
					<Typography variant="body2" sx={{ fontWeight: 600 }}>
						{formatCurrency(payload[0].value, "$", 2)}
					</Typography>
				</Box>
			);
		}
		return null;
	};

	// Custom label component for TP reference lines
	const TPLabel = ({ viewBox, value, isReached }: any) => {
		if (!viewBox || !value) return null;
		const { x, y } = viewBox;
		return (
			<g>
				<rect
					x={x + 5}
					y={y - 12}
					width={value.length * 6 + 8}
					height={18}
					fill={colorScheme === "dark" ? "var(--mui-palette-background-paper)" : "rgba(255, 255, 255, 0.95)"}
					stroke={isReached ? "var(--mui-palette-success-main)" : "var(--mui-palette-warning-main)"}
					strokeWidth={1.5}
					rx={4}
					opacity={0.95}
				/>
				<text
					x={x + 9}
					y={y + 2}
					fill={isReached ? "var(--mui-palette-success-main)" : "var(--mui-palette-warning-main)"}
					fontSize={11}
					fontWeight={700}
					textAnchor="start"
				>
					{value}
				</text>
			</g>
		);
	};

	return (
		<Drawer anchor="right" open={open} onClose={onClose} PaperProps={{ sx: { width: { xs: "100%", sm: 400 } } }}>
			<Box sx={{ p: 3, height: "100%", overflowY: "auto" }}>
				{loading ? (
					<Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 8 }}>
						<Box
							sx={{
								width: 40,
								height: 40,
								border: "3px solid var(--mui-palette-primary-main)",
								borderTop: "3px solid transparent",
								borderRadius: "50%",
								animation: "spin 1s linear infinite",
								"@keyframes spin": {
									"0%": { transform: "rotate(0deg)" },
									"100%": { transform: "rotate(360deg)" },
								},
							}}
						/>
						<Typography color="text.secondary" variant="body2" sx={{ mt: 2 }}>
							Loading...
						</Typography>
					</Box>
				) : !forecast || !strategy || !alertConfiguration ? (
					<>
						<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
							<Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
								<Avatar
									src={getTokenLogoUrl(holding.token.symbol, holding.token.cmcId) || undefined}
									sx={{ width: 40, height: 40 }}
								>
									{holding.token.symbol.charAt(0)}
								</Avatar>
								<Box>
									<Typography variant="h6" sx={{ fontWeight: 600 }}>
										{holding.token.symbol}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										Strategy Details
									</Typography>
								</Box>
							</Stack>
							<IconButton onClick={onClose} size="small">
								<XIcon />
							</IconButton>
						</Stack>
						<Box sx={{ py: 8, textAlign: "center" }}>
							<Typography color="text.secondary" variant="body2">
								No active strategy found for this token.
							</Typography>
						</Box>
					</>
				) : (
					<>
						{/* Header */}
						<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between", mb: 3, pb: 2, borderBottom: "1px solid var(--mui-palette-divider)" }}>
							<Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
								<Avatar
									src={getTokenLogoUrl(holding.token.symbol, holding.token.cmcId) || undefined}
									sx={{ width: 40, height: 40 }}
								>
									{holding.token.symbol.charAt(0)}
								</Avatar>
								<Box>
									<Typography variant="h6" sx={{ fontWeight: 600 }}>
										{holding.token.symbol}
									</Typography>
									<Typography variant="caption" color="text.secondary">
										{strategy.name}
									</Typography>
								</Box>
							</Stack>
							<IconButton onClick={onClose} size="small">
								<XIcon />
							</IconButton>
						</Stack>

						{/* Progress Stats */}
						<Card 
							variant="outlined" 
							sx={{ 
								mb: 3, 
								bgcolor: colorScheme === "dark" 
									? "var(--mui-palette-background-level1)" 
									: "var(--mui-palette-primary-50)",
								borderColor: colorScheme === "dark" 
									? "var(--mui-palette-divider)" 
									: undefined
							}}
						>
							<CardContent>
								<Stack direction="row" spacing={3}>
									<Box sx={{ flex: 1 }}>
										<Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
											Progress
										</Typography>
										<Typography variant="h5" sx={{ fontWeight: 600, color: "text.primary" }}>
											{Math.round(completionPercentage)}%
										</Typography>
									</Box>
									<Box sx={{ flex: 1 }}>
										<Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
											Projected Value
										</Typography>
										<Typography variant="h5" sx={{ fontWeight: 600, color: "success.main" }}>
											{formatCurrency(projectedValue, "$", 0)}
										</Typography>
									</Box>
								</Stack>
							</CardContent>
						</Card>

						{/* Progress Bar */}
						<Box sx={{ mb: 3 }}>
							<Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
								{Array.from({ length: totalTP }).map((_, i) => (
									<Box
										key={i}
										sx={{
											width: 8,
											height: 8,
											borderRadius: "50%",
											bgcolor: i < tpReached ? "success.main" : "divider",
											boxShadow: i < tpReached 
												? colorScheme === "dark" 
													? "0 0 8px rgba(76, 175, 80, 0.6)" 
													: "0 0 8px rgba(46, 125, 50, 0.5)" 
												: "none",
										}}
									/>
								))}
								<Box sx={{ flex: 1 }} />
								<Typography variant="caption" sx={{ fontWeight: 500 }}>
									{tpReached}/{totalTP} TP
								</Typography>
							</Stack>
							<LinearProgress
								variant="determinate"
								value={completionPercentage}
								color="success"
								sx={{ height: 8, borderRadius: 1 }}
							/>
						</Box>

						{/* TP Levels */}
						<Box sx={{ mb: 3 }}>
							<Typography variant="overline" sx={{ fontWeight: 600, display: "block", mb: 2 }}>
								TP Levels
							</Typography>
							<Stack spacing={1.5}>
								{strategy.profitTargets.map((tp) => {
									const tpAlert = tpAlerts.find((ta) => ta.tpOrder === tp.order);
									const targetPrice =
										tp.targetType === "percentage"
											? holding.averagePrice * (1 + tp.targetValue / 100)
											: tp.targetValue;
									const isReached = currentPrice >= targetPrice;
									
									// Calculate percentage gain from average price
									const percentageGain = holding.averagePrice > 0 
										? ((targetPrice - holding.averagePrice) / holding.averagePrice) * 100 
										: 0;

									return (
										<Card
											key={tp.order}
											variant="outlined"
											sx={{
												bgcolor: isReached 
													? colorScheme === "dark" 
														? "rgba(76, 175, 80, 0.15)" 
														: "success.light" 
													: "background.paper",
												borderColor: isReached ? "success.main" : "divider",
												borderWidth: isReached ? 1.5 : 1,
											}}
										>
											<CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
												<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
													<Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flex: 1, minWidth: 0 }}>
														<Avatar
															sx={{
																width: 32,
																height: 32,
																bgcolor: isReached ? "success.main" : "divider",
																fontSize: "0.875rem",
																fontWeight: 600,
																flexShrink: 0,
															}}
														>
															{tp.order}
														</Avatar>
														<Box sx={{ flex: 1, minWidth: 0 }}>
															<Stack spacing={0.5}>
																<Box>
																	<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem", display: "block", mb: 0.25 }}>
																		Target Price
																	</Typography>
																	<Typography variant="body2" sx={{ fontWeight: 600 }}>
																		{formatCurrency(targetPrice, "$", 2)}
																	</Typography>
																</Box>
																<Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flexWrap: "wrap" }}>
																	<Box>
																		<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem", display: "block", mb: 0.25 }}>
																			Gain
																		</Typography>
																		<Typography 
																			variant="caption" 
																			sx={{ 
																				display: "block",
																				color: percentageGain >= 0 ? "success.main" : "error.main",
																				fontWeight: 600
																			}}
																		>
																			{formatPercentage(percentageGain)}
																		</Typography>
																	</Box>
																	<Box>
																		<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem", display: "block", mb: 0.25 }}>
																			Amount
																		</Typography>
																		<Typography variant="caption" sx={{ display: "block", fontWeight: 600, color: "success.main" }}>
																			{formatCurrency(tpAlert?.projectedAmount || 0, "$", 0)}
																		</Typography>
																	</Box>
																</Stack>
															</Stack>
														</Box>
													</Stack>
													{isReached ? (
														<Chip 
															icon={<CheckIcon />} 
															label="Reached" 
															color="success" 
															size="small"
															sx={{ flexShrink: 0 }}
														/>
													) : (
														<Chip 
															label="Pending" 
															size="small"
															sx={{ flexShrink: 0 }}
														/>
													)}
												</Stack>
											</CardContent>
										</Card>
									);
								})}
							</Stack>
						</Box>

						{/* Price Chart */}
						{priceChartData.length > 0 && (() => {
							// Séparer les TP en deux groupes : normaux et très bas
							const lowTPs: Array<{ tp: any; targetPrice: number; isReached: boolean }> = [];
							const normalTPs: Array<{ tp: any; targetPrice: number; isReached: boolean }> = [];
							
							strategy.profitTargets.forEach((tp) => {
								const targetPrice =
									tp.targetType === "percentage"
										? holding.averagePrice * (1 + tp.targetValue / 100)
										: tp.targetValue;
								const isReached = currentPrice >= targetPrice;
								const tpRatio = currentPrice > 0 ? targetPrice / currentPrice : 1;
								
								// TP très bas si < 30% du prix actuel
								if (tpRatio < 0.3) {
									lowTPs.push({ tp, targetPrice, isReached });
								} else {
									normalTPs.push({ tp, targetPrice, isReached });
								}
							});
							
							return (
								<Box sx={{ mt: 3, pt: 3, borderTop: "1px solid var(--mui-palette-divider)" }}>
									<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}>
										<Typography variant="overline" sx={{ fontWeight: 600, display: "block" }}>
											{holding.token.symbol} Price Evolution
										</Typography>
										<Stack spacing={0.25} sx={{ alignItems: "flex-end" }}>
											<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
												Current
											</Typography>
											<Typography variant="body2" sx={{ fontWeight: 600, color: "primary.main" }}>
												{formatCurrency(currentPrice, "$", 2)}
											</Typography>
										</Stack>
									</Stack>
									<Box sx={{ height: 240, mb: 2 }}>
									<NoSsr fallback={<Box sx={{ height: "240px" }} />}>
										<ResponsiveContainer width="100%" height="100%">
											<AreaChart data={priceChartData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
												<defs>
													<linearGradient id="colorPriceGradient" x1="0" y1="0" x2="0" y2="1">
														<stop offset="0%" stopColor="var(--mui-palette-primary-main)" stopOpacity={0.4} />
														<stop offset="50%" stopColor="var(--mui-palette-primary-main)" stopOpacity={0.2} />
														<stop offset="100%" stopColor="var(--mui-palette-primary-main)" stopOpacity={0} />
													</linearGradient>
													<linearGradient id="colorPriceStroke" x1="0" x2="1" y1="0" y2="0">
														<stop offset="0%" stopColor="var(--mui-palette-primary-main)" />
														<stop offset="100%" stopColor="var(--mui-palette-secondary-main)" />
													</linearGradient>
													{/* Reference lines for TP levels */}
													{strategy.profitTargets.map((tp, index) => {
														const targetPrice =
															tp.targetType === "percentage"
																? holding.averagePrice * (1 + tp.targetValue / 100)
																: tp.targetValue;
														const isReached = currentPrice >= targetPrice;
														return (
															<linearGradient key={`tp-line-${tp.order}`} id={`tpLine-${tp.order}`} x1="0" x2="1" y1="0" y2="0">
																<stop offset="0%" stopColor={isReached ? "var(--mui-palette-success-main)" : "var(--mui-palette-warning-main)"} stopOpacity={0.6} />
																<stop offset="100%" stopColor={isReached ? "var(--mui-palette-success-main)" : "var(--mui-palette-warning-main)"} stopOpacity={0.3} />
															</linearGradient>
														);
													})}
												</defs>
												<CartesianGrid 
													strokeDasharray="3 3" 
													stroke="var(--mui-palette-divider)" 
													opacity={0.3}
													vertical={false}
												/>
												<XAxis
													dataKey="date"
													tick={{ fontSize: 10, fill: "var(--mui-palette-text-secondary)" }}
													tickLine={false}
													axisLine={false}
													tickFormatter={(value) => {
														const date = new Date(value);
														return date.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
													}}
													height={30}
												/>
												<YAxis
													domain={yAxisDomain}
													tick={{ fontSize: 10, fill: "var(--mui-palette-text-secondary)" }}
													tickLine={false}
													axisLine={false}
													tickFormatter={(value) => {
														if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
														if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
														return `$${value.toFixed(2)}`;
													}}
													width={60}
												/>
												{/* Reference lines for normal TP levels (only those in visible range) */}
												{normalTPs.map(({ tp, targetPrice, isReached }) => {
													return (
														<ReferenceLine
															key={`tp-${tp.order}`}
															y={targetPrice}
															stroke={isReached ? "var(--mui-palette-success-main)" : "var(--mui-palette-warning-main)"}
															strokeWidth={2.5}
															strokeDasharray="6 4"
															opacity={0.9}
															label={{
																value: `TP${tp.order}: ${formatCurrency(targetPrice, "$", 2)}`,
																position: "right",
																content: ({ viewBox, value }: any) => (
																	<TPLabel viewBox={viewBox} value={value} isReached={isReached} />
																),
															}}
														/>
													);
												})}
												<Tooltip 
													content={<CustomTooltip />}
													cursor={{ stroke: "var(--mui-palette-primary-main)", strokeWidth: 1, strokeDasharray: "5 5", opacity: 0.5 }}
												/>
												<Area
													type="monotone"
													dataKey="price"
													stroke="url(#colorPriceStroke)"
													strokeWidth={2.5}
													fill="url(#colorPriceGradient)"
													dot={false}
													activeDot={{ 
														r: 5, 
														fill: "var(--mui-palette-primary-main)", 
														strokeWidth: 2, 
														stroke: "var(--mui-palette-background-paper)" 
													}}
												/>
											</AreaChart>
										</ResponsiveContainer>
									</NoSsr>
								</Box>
								
								{/* Zone séparée pour les TP très bas */}
								{lowTPs.length > 0 && (
									<Box 
										sx={{ 
											mt: 2, 
											pt: 2, 
											borderTop: "2px dashed var(--mui-palette-divider)",
											bgcolor: colorScheme === "dark" 
												? "rgba(255, 193, 7, 0.05)" 
												: "rgba(255, 193, 7, 0.08)",
											borderRadius: 1,
											px: 1.5,
											py: 1.5,
										}}
									>
										<Stack direction="row" spacing={1} sx={{ alignItems: "center", mb: 1 }}>
											<Box
												sx={{
													width: 4,
													height: 4,
													borderRadius: "50%",
													bgcolor: "warning.main",
													animation: "pulse 2s ease-in-out infinite",
													"@keyframes pulse": {
														"0%, 100%": { opacity: 1 },
														"50%": { opacity: 0.5 },
													},
												}}
											/>
											<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.7rem", fontWeight: 600 }}>
												Low Target Prices (Below 30% of current price)
											</Typography>
										</Stack>
										<Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", gap: 1 }}>
											{lowTPs.map(({ tp, targetPrice, isReached }) => (
												<Chip
													key={`low-tp-${tp.order}`}
													label={`TP${tp.order}: ${formatCurrency(targetPrice, "$", 2)}`}
													size="small"
													color={isReached ? "success" : "warning"}
													variant={isReached ? "filled" : "outlined"}
													sx={{
														fontWeight: 600,
														fontSize: "0.7rem",
														height: "24px",
														borderWidth: isReached ? 0 : 1.5,
														...(isReached && {
															bgcolor: "success.main",
															color: "white",
														}),
													}}
												/>
											))}
										</Stack>
									</Box>
								)}
							</Box>
							);
						})()}
					</>
				)}
			</Box>
		</Drawer>
	);
}

