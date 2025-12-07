"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { getForecastById, getPortfolioHoldings, getTheoreticalStrategies } from "@/lib/portfolios-api";
import { strategiesApi } from "@/lib/strategies-api";
import * as configurationApi from "@/lib/configuration-api";
import type { ForecastResponse } from "@/types/portfolio";
import type { AlertConfiguration, CreateTokenAlertDto } from "@/types/configuration";
import type { TheoreticalStrategyResponse, StrategyResponse } from "@/types/strategies";
import { TokenAlertItem } from "./token-alert-item";

interface TokenAlertsListProps {
	forecastId: string;
	portfolioId: string;
	alertConfiguration: AlertConfiguration | null;
	onConfigurationUpdate: (config: AlertConfiguration) => void;
}

export function TokenAlertsList({
	forecastId,
	portfolioId,
	alertConfiguration,
	onConfigurationUpdate,
}: TokenAlertsListProps): React.JSX.Element {
	const [forecast, setForecast] = React.useState<ForecastResponse | null>(null);
	const [holdings, setHoldings] = React.useState<any[]>([]);
	const [strategiesMap, setStrategiesMap] = React.useState<Map<string, TheoreticalStrategyResponse>>(new Map());
	const [loading, setLoading] = React.useState(true);
	const [expandedTokens, setExpandedTokens] = React.useState<Set<string>>(new Set());

	// Load forecast and associated data
	React.useEffect(() => {
		const loadData = async () => {
			try {
				setLoading(true);

				// Load forecast
				const forecastData = await getForecastById(forecastId);
				setForecast(forecastData);

				// Load holdings
				const holdingsData = await getPortfolioHoldings(portfolioId);
				setHoldings(holdingsData);

				// Load theoretical strategies and real strategies
				const appliedStrategies = forecastData.appliedStrategies || {};
				const strategyIds = Object.values(appliedStrategies).filter((id) => id && id !== "none");

				if (strategyIds.length > 0) {
					// Load both theoretical strategies and real strategies
					const [theoreticalData, realStrategiesData] = await Promise.all([
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

					// Combine theoretical and converted real strategies
					const allStrategies = [...(theoreticalData || []), ...convertedStrategies];
					const strategiesById = new Map<string, TheoreticalStrategyResponse>();

					strategyIds.forEach((strategyId) => {
						const strategy = allStrategies.find((s) => s.id === strategyId);
						if (strategy) {
							strategiesById.set(strategyId, strategy);
						}
					});

					setStrategiesMap(strategiesById);
				}
			} catch (error) {
				console.error("Error loading data:", error);
			} finally {
				setLoading(false);
			}
		};

		if (forecastId && portfolioId) {
			loadData();
		}
	}, [forecastId, portfolioId]);

	// Create token alert with TP alerts
	const handleCreateTokenAlert = async (holding: any, strategy: TheoreticalStrategyResponse) => {
		if (!alertConfiguration || !alertConfiguration.isActive) {
			console.warn("Forecast must be active to configure alerts");
			return;
		}

		try {
			setLoading(true);

			// Calculate TP alerts from strategy
			const tpAlerts = strategy.profitTargets.map((tp) => {
				const targetPrice =
					tp.targetType === "percentage" ? holding.averagePrice * (1 + tp.targetValue / 100) : tp.targetValue;
				const sellQuantity = (holding.quantity * tp.sellPercentage) / 100;
				const projectedAmount = targetPrice * sellQuantity;
				const remainingValue = (holding.quantity - sellQuantity) * targetPrice;

				return {
					tpOrder: tp.order,
					targetPrice,
					sellQuantity,
					projectedAmount,
					remainingValue,
					beforeTP: {
						enabled: true,
						value: -10,
						type: "percentage" as const,
					},
					tpReached: {
						enabled: true,
					},
					isActive: true,
				};
			});

			const tokenAlert: CreateTokenAlertDto = {
				holdingId: holding.id,
				tokenSymbol: holding.token?.symbol || holding.symbol || "",
				strategyId: strategy.id,
				numberOfTargets: strategy.profitTargets.length,
				tpAlerts,
				isActive: true,
			};

			await configurationApi.createTokenAlert(alertConfiguration.id, tokenAlert);

			// Reload configuration
			const updated = await configurationApi.getAlertConfigurationById(alertConfiguration.id);
			onConfigurationUpdate(updated);
		} catch (error) {
			console.error("Error creating token alert:", error);
		} finally {
			setLoading(false);
		}
	};

	if (loading && !forecast) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
				<CircularProgress size={24} />
			</Box>
		);
	}

	if (!forecast) {
		return (
			<Typography color="text.secondary" variant="body2">
				No forecast found
			</Typography>
		);
	}

	const appliedStrategies = forecast.appliedStrategies || {};
	console.log("📊 Applied strategies:", appliedStrategies);
	console.log("📊 Holdings:", holdings);
	console.log("📊 Strategies map size:", strategiesMap.size);
	console.log("📊 Strategies map keys:", Array.from(strategiesMap.keys()));

	const tokensWithStrategies = holdings
		.filter((holding) => {
			const strategyId =
				appliedStrategies[holding.id] || appliedStrategies[holding.token?.id] || appliedStrategies[holding.token?.symbol];
			const hasStrategy = strategyId && strategyId !== "none" && strategiesMap.has(strategyId);
			console.log(
				`🔍 Holding ${holding.token?.symbol || holding.symbol} (id: ${holding.id}): strategyId = ${strategyId}, hasStrategy = ${hasStrategy}`
			);
			return hasStrategy;
		})
		.map((holding) => {
			const strategyId =
				appliedStrategies[holding.id] || appliedStrategies[holding.token?.id] || appliedStrategies[holding.token?.symbol];
			const strategy = strategyId && strategyId !== "none" ? strategiesMap.get(strategyId) : null;
			return { holding, strategy };
		});

	console.log("📊 Tokens with strategies:", tokensWithStrategies);

	if (tokensWithStrategies.length === 0) {
		return (
			<Card variant="outlined">
				<CardContent>
					<Typography color="text.secondary" variant="body2">
						No tokens with associated strategy in this forecast. Make sure theoretical strategies are applied to tokens in this
						forecast.
					</Typography>
				</CardContent>
			</Card>
		);
	}

	const isForecastActive = alertConfiguration?.isActive === true;

	return (
		<Stack spacing={2}>
			{/* Warning if forecast not active */}
			{!isForecastActive && (
				<Card variant="outlined" sx={{ bgcolor: "warning.light", borderColor: "warning.main" }}>
					<CardContent>
						<Stack spacing={1}>
							<Typography color="warning.dark" variant="body2" sx={{ fontWeight: 600 }}>
								⚠️ Forecast not active
							</Typography>
							<Typography color="warning.dark" variant="caption">
								You must first activate this forecast using the "Activate alerts" button above before you can configure token
								alerts.
							</Typography>
						</Stack>
					</CardContent>
				</Card>
			)}

			{/* Token alerts list */}
			{isForecastActive ? (
				<Stack spacing={2}>
					{tokensWithStrategies.map(({ holding, strategy }) => {
						if (!strategy) return null;

						const tokenAlert = alertConfiguration?.tokenAlerts?.find((ta) => ta.holdingId === holding.id);
						const isExpanded = expandedTokens.has(holding.id);

						return (
							<TokenAlertItem
								key={holding.id}
								holding={holding}
								strategy={strategy}
								tokenAlert={tokenAlert}
								alertConfigurationId={alertConfiguration?.id}
								isForecastActive={isForecastActive}
								isExpanded={isExpanded}
								onToggleExpand={() => {
									const newExpanded = new Set(expandedTokens);
									if (isExpanded) {
										newExpanded.delete(holding.id);
									} else {
										newExpanded.add(holding.id);
									}
									setExpandedTokens(newExpanded);
								}}
								onCreateAlert={() => handleCreateTokenAlert(holding, strategy)}
								onConfigurationUpdate={onConfigurationUpdate}
							/>
						);
					})}
				</Stack>
			) : (
				<Card variant="outlined">
					<CardContent>
						<Typography color="text.secondary" variant="body2">
							Tokens will be displayed here once the forecast is activated.
						</Typography>
					</CardContent>
				</Card>
			)}
		</Stack>
	);
}

