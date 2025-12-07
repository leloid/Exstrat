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
import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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

		let price = currentPrice;
		const volatility = 0.05;

		for (let i = days; i >= 0; i--) {
			const date = new Date(now);
			date.setDate(date.getDate() - i);

			const change = (Math.random() - 0.5) * volatility * 2;
			price = price * (1 + change);
			price = Math.max(price, currentPrice * 0.5);

			data.push({
				date: date.toISOString().split("T")[0],
				price: Number(price.toFixed(2)),
			});
		}

		return data;
	}, [holding]);

	if (!holding) {
		return <></>;
	}

	const tokenAlert = alertConfiguration?.tokenAlerts?.find((ta) => ta.holdingId === holding.id);
	const currentPrice = holding.currentPrice || holding.averagePrice || 0;
	const tpAlerts = tokenAlert?.tpAlerts || [];

	const totalTP = strategy?.profitTargets.length || 0;
	const tpReached = tpAlerts.filter((tp) => tp.isActive && currentPrice >= tp.targetPrice).length;
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
									src={getTokenLogoUrl(holding.token.symbol, holding.token.cmcId)}
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
									src={getTokenLogoUrl(holding.token.symbol, holding.token.cmcId)}
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
						<Card variant="outlined" sx={{ mb: 3, bgcolor: "var(--mui-palette-primary-50)" }}>
							<CardContent>
								<Stack direction="row" spacing={3}>
									<Box sx={{ flex: 1 }}>
										<Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
											Progress
										</Typography>
										<Typography variant="h5" sx={{ fontWeight: 600 }}>
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
											boxShadow: i < tpReached ? "0 0 8px rgba(46, 125, 50, 0.5)" : "none",
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
												bgcolor: isReached ? "success.light" : "background.paper",
												borderColor: isReached ? "success.main" : "divider",
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
															<Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
																{formatCurrency(targetPrice, "$", 2)}
															</Typography>
															<Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
																{formatPercentage(percentageGain)} • {formatCurrency(tpAlert?.projectedAmount || 0, "$", 0)}
															</Typography>
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
						{priceChartData.length > 0 && (
							<Box sx={{ mt: 3, pt: 3, borderTop: "1px solid var(--mui-palette-divider)" }}>
								<Typography variant="overline" sx={{ fontWeight: 600, display: "block", mb: 2 }}>
									{holding.token.symbol} Price
								</Typography>
								<Box sx={{ height: 200, mb: 2 }}>
									<NoSsr fallback={<Box sx={{ height: "200px" }} />}>
										<ResponsiveContainer width="100%" height="100%">
											<AreaChart data={priceChartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
												<defs>
													<linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
														<stop offset="5%" stopColor="var(--mui-palette-primary-main)" stopOpacity={0.3} />
														<stop offset="95%" stopColor="var(--mui-palette-primary-main)" stopOpacity={0} />
													</linearGradient>
												</defs>
												<CartesianGrid strokeDasharray="3 3" stroke="var(--mui-palette-divider)" opacity={0.4} />
												<XAxis
													dataKey="date"
													tick={{ fontSize: 10 }}
													tickFormatter={(value) => {
														const date = new Date(value);
														return date.toLocaleDateString("en-US", { day: "2-digit", month: "2-digit" });
													}}
													height={30}
												/>
												<YAxis
													tick={{ fontSize: 10 }}
													tickFormatter={(value) => {
														if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
														if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}k`;
														return `$${value.toFixed(0)}`;
													}}
													width={50}
												/>
												<Tooltip content={<CustomTooltip />} />
												<Area
													type="monotone"
													dataKey="price"
													stroke="var(--mui-palette-primary-main)"
													strokeWidth={1.5}
													fill="url(#colorPrice)"
												/>
												<Line
													type="monotone"
													dataKey="price"
													stroke="var(--mui-palette-primary-main)"
													strokeWidth={1.5}
													dot={false}
												/>
											</AreaChart>
										</ResponsiveContainer>
									</NoSsr>
								</Box>
								<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
									<Typography variant="caption" color="text.secondary">
										Current: <Typography component="span" variant="caption" sx={{ fontWeight: 600 }}>
											{formatCurrency(currentPrice, "$", 2)}
										</Typography>
									</Typography>
									<Typography variant="caption" color="text.secondary">
										Avg: <Typography component="span" variant="caption" sx={{ fontWeight: 600 }}>
											{formatCurrency(holding.averagePrice, "$", 2)}
										</Typography>
									</Typography>
								</Stack>
							</Box>
						)}
					</>
				)}
			</Box>
		</Drawer>
	);
}

