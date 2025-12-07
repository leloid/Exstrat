"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { getForecasts, getForecastById, getPortfolioHoldings, getTheoreticalStrategies } from "@/lib/portfolios-api";
import { strategiesApi } from "@/lib/strategies-api";
import * as configurationApi from "@/lib/configuration-api";
import type { ForecastResponse } from "@/types/portfolio";
import type { AlertConfiguration, CreateTokenAlertDto } from "@/types/configuration";
import type { TheoreticalStrategyResponse, StrategyResponse } from "@/types/strategies";
import { WalletSelector } from "./wallet-selector";
import { ForecastSelector } from "./forecast-selector";
import { TokenAlertsList } from "./token-alerts-list";
import { NotificationChannelsConfig } from "./notification-channels-config";
import { ConfirmModal } from "./confirm-modal";

export function ConfigurationAlertsTab(): React.JSX.Element {
	const { portfolios } = usePortfolio();
	const [selectedPortfolioId, setSelectedPortfolioId] = React.useState<string>("");
	const [forecasts, setForecasts] = React.useState<ForecastResponse[]>([]);
	const [selectedForecastId, setSelectedForecastId] = React.useState<string | null>(null);
	const [alertConfiguration, setAlertConfiguration] = React.useState<AlertConfiguration | null>(null);
	const [allConfigurations, setAllConfigurations] = React.useState<AlertConfiguration[]>([]);
	const [loading, setLoading] = React.useState(false);
	const [showConfirmModal, setShowConfirmModal] = React.useState(false);
	const [pendingForecastId, setPendingForecastId] = React.useState<string | null>(null);

	// Load forecasts and configurations when portfolio changes
	React.useEffect(() => {
		const loadData = async () => {
			if (!selectedPortfolioId) {
				setForecasts([]);
				setSelectedForecastId(null);
				setAlertConfiguration(null);
				setAllConfigurations([]);
				return;
			}

			try {
				setLoading(true);
				// Load forecasts
				const allForecasts = await getForecasts();
				const portfolioForecasts = allForecasts.filter((f) => f.portfolioId === selectedPortfolioId);
				setForecasts(portfolioForecasts);

				// Load all alert configurations
				const allConfigs = await configurationApi.getAlertConfigurations();
				const portfolioConfigs = allConfigs.filter((config) => {
					const forecast = portfolioForecasts.find((f) => f.id === config.forecastId);
					return forecast !== undefined;
				});
				setAllConfigurations(portfolioConfigs);

				// Find active configuration
				const activeConfig = portfolioConfigs.find((config) => config.isActive);
				if (activeConfig) {
					setSelectedForecastId(activeConfig.forecastId);
					setAlertConfiguration(activeConfig);
				} else {
					setSelectedForecastId(null);
					setAlertConfiguration(null);
				}
			} catch (error) {
				console.error("Error loading data:", error);
				setForecasts([]);
				setAllConfigurations([]);
			} finally {
				setLoading(false);
			}
		};

		loadData();
	}, [selectedPortfolioId]);

	// Load alert configuration when forecast is selected
	React.useEffect(() => {
		const loadAlertConfiguration = async () => {
			if (!selectedForecastId) {
				setAlertConfiguration(null);
				return;
			}

			try {
				setLoading(true);
				const config = await configurationApi.getAlertConfigurationByForecastId(selectedForecastId);
				setAlertConfiguration(config);
			} catch (error) {
				console.error("Error loading alert configuration:", error);
				setAlertConfiguration(null);
			} finally {
				setLoading(false);
			}
		};

		loadAlertConfiguration();
	}, [selectedForecastId]);

	const handleForecastSelect = (forecastId: string) => {
		setSelectedForecastId(forecastId);
	};

	const handleActivateForecast = async (forecastId: string) => {
		if (!forecastId) {
			console.error("No forecast selected");
			return;
		}

		// Check if another forecast is already active
		const activeConfig = allConfigurations.find((c) => c.isActive);
		if (activeConfig && activeConfig.forecastId !== forecastId) {
			// Show confirmation modal
			setPendingForecastId(forecastId);
			setShowConfirmModal(true);
			return;
		}

		// If no other forecast is active, activate directly
		await doActivateForecast(forecastId);
	};

	// Automatically create alerts for all tokens with strategies
	const createAlertsForAllTokens = async (config: AlertConfiguration, forecastId: string) => {
		try {
			// Load forecast to get applied strategies
			const forecastData = await getForecastById(forecastId);
			const appliedStrategies = forecastData.appliedStrategies || {};

			if (Object.keys(appliedStrategies).length === 0) {
				console.log("No strategies applied to this forecast");
				return;
			}

			// Load holdings
			const holdings = await getPortfolioHoldings(selectedPortfolioId);

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
						status: strategy.status === "active" ? "active" : strategy.status === "paused" ? "paused" : "completed",
						createdAt: strategy.createdAt,
						updatedAt: strategy.updatedAt,
						numberOfTargets: strategy.steps.length,
					} as TheoreticalStrategyResponse;
				}
			);

			// Combine theoretical and converted real strategies
			const allStrategies = [...(theoreticalData || []), ...convertedStrategies];
			const strategiesMap = new Map<string, TheoreticalStrategyResponse>();
			allStrategies.forEach((strategy) => {
				strategiesMap.set(strategy.id, strategy);
			});

			// For each holding, check if it has an associated strategy
			for (const holding of holdings) {
				const strategyId =
					appliedStrategies[holding.id] || appliedStrategies[holding.token?.id] || appliedStrategies[holding.token?.symbol];

				if (!strategyId) continue;

				const strategy = strategiesMap.get(strategyId);
				if (!strategy) continue;

				// Check if alert already exists
				const existingTokenAlert = config.tokenAlerts?.find((ta) => ta.holdingId === holding.id);
				if (existingTokenAlert) {
					console.log(`Alert already exists for ${holding.token?.symbol}`);
					continue;
				}

				// Create TP alerts from strategy
				const tpAlerts = strategy.profitTargets.map((tp) => {
					const targetPrice = tp.targetType === "percentage" ? holding.averagePrice * (1 + tp.targetValue / 100) : tp.targetValue;
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

				const tokenAlert = {
					holdingId: holding.id,
					tokenSymbol: holding.token?.symbol || holding.symbol || "",
					strategyId: strategy.id,
					numberOfTargets: strategy.profitTargets.length,
					tpAlerts,
					isActive: true,
				};

				try {
					console.log(`Creating alert for ${holding.token?.symbol}...`);
					await configurationApi.createTokenAlert(config.id, tokenAlert);
					console.log(`Alert created for ${holding.token?.symbol}`);
				} catch (error) {
					console.error(`Error creating alert for ${holding.token?.symbol}:`, error);
				}
			}

			// Reload configuration
			const updatedConfig = await configurationApi.getAlertConfigurationById(config.id);
			setAlertConfiguration(updatedConfig);
		} catch (error) {
			console.error("Error creating automatic alerts:", error);
		}
	};

	const doActivateForecast = async (forecastId: string) => {
		try {
			setLoading(true);

			// Check if configuration already exists
			let config = await configurationApi.getAlertConfigurationByForecastId(forecastId);

			if (!config) {
				// Create new active configuration
				config = await configurationApi.createAlertConfiguration({
					forecastId,
					notificationChannels: {
						email: true,
						push: false,
					},
					isActive: true,
				});
			} else {
				// Activate this configuration
				config = await configurationApi.updateAlertConfiguration(config.id, {
					isActive: true,
				});
			}

			setAlertConfiguration(config);
			setSelectedForecastId(forecastId);

			// Automatically create alerts for all tokens with strategies
			await createAlertsForAllTokens(config, forecastId);

			// Reload all configurations
			const allConfigs = await configurationApi.getAlertConfigurations();
			const portfolioConfigs = allConfigs.filter((c) => {
				const forecast = forecasts.find((f) => f.id === c.forecastId);
				return forecast !== undefined;
			});
			setAllConfigurations(portfolioConfigs);
		} catch (error) {
			console.error("Error activating forecast:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleDeactivateForecast = async (configurationId: string) => {
		try {
			setLoading(true);

			// Deactivate configuration
			const config = await configurationApi.updateAlertConfiguration(configurationId, {
				isActive: false,
			});

			setAlertConfiguration(config);

			// Reload all configurations
			const allConfigs = await configurationApi.getAlertConfigurations();
			const portfolioConfigs = allConfigs.filter((c) => {
				const forecast = forecasts.find((f) => f.id === c.forecastId);
				return forecast !== undefined;
			});
			setAllConfigurations(portfolioConfigs);
		} catch (error) {
			console.error("Error deactivating forecast:", error);
		} finally {
			setLoading(false);
		}
	};

	const handleConfigurationUpdate = async (config: AlertConfiguration) => {
		setAlertConfiguration(config);

		// Reload all configurations
		try {
			const allConfigs = await configurationApi.getAlertConfigurations();
			const portfolioConfigs = allConfigs.filter((c) => {
				const forecast = forecasts.find((f) => f.id === c.forecastId);
				return forecast !== undefined;
			});
			setAllConfigurations(portfolioConfigs);
		} catch (error) {
			console.error("Error reloading configurations:", error);
		}
	};

	const activeForecastId = allConfigurations.find((c) => c.isActive)?.forecastId || null;

	return (
		<Stack spacing={4}>
			{/* Wallet Selection */}
			<Card>
				<CardContent>
					<Stack spacing={2}>
						<Typography variant="h6">Wallet Selection</Typography>
						<WalletSelector
							portfolios={portfolios}
							selectedPortfolioId={selectedPortfolioId}
							onPortfolioChange={setSelectedPortfolioId}
						/>
					</Stack>
				</CardContent>
			</Card>

			{/* Forecast Selection */}
			{selectedPortfolioId && (
				<Card>
					<CardContent>
						<Stack spacing={2}>
							<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
								<Typography variant="h6">Forecast Selection</Typography>
								{allConfigurations.find((c) => c.isActive) && (
									<Chip
										color="warning"
										label="⚠️ Only one active forecast per wallet"
										size="small"
										sx={{ fontSize: "0.75rem" }}
									/>
								)}
							</Stack>
							{loading ? (
								<Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
									<CircularProgress size={24} />
								</Box>
							) : forecasts.length === 0 ? (
								<Typography color="text.secondary" variant="body2">
									No forecasts available for this wallet
								</Typography>
							) : (
								<>
									<ForecastSelector
										forecasts={forecasts}
										selectedForecastId={selectedForecastId}
										activeForecastId={activeForecastId}
										onForecastSelect={handleForecastSelect}
									/>

									{/* Activate/Deactivate Button */}
									{selectedForecastId && (
										<Box>
											{allConfigurations.find((c) => c.forecastId === selectedForecastId && c.isActive) ? (
												<Card variant="outlined" sx={{ bgcolor: "success.light", borderColor: "success.main" }}>
													<CardContent>
														<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
															<Typography color="success.dark" variant="body2" sx={{ fontWeight: 600 }}>
																✅ This forecast is active
															</Typography>
															<Button
																variant="contained"
																color="error"
																size="small"
																onClick={() => {
																	const config = allConfigurations.find((c) => c.forecastId === selectedForecastId);
																	if (config) {
																		handleDeactivateForecast(config.id);
																	}
																}}
																disabled={loading}
															>
																Deactivate Alerts
															</Button>
														</Stack>
													</CardContent>
												</Card>
											) : (
												<Card variant="outlined">
													<CardContent>
														<Stack spacing={2}>
															<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
																<Box>
																	<Typography variant="body1" sx={{ fontWeight: 600, mb: 0.5 }}>
																		Activate alerts for this forecast
																	</Typography>
																	<Typography color="text.secondary" variant="body2">
																		{allConfigurations.find((c) => c.isActive)
																			? "⚠️ Another forecast is already active. Activating this will automatically deactivate the other."
																			: "Activate this forecast to start configuring alerts."}
																	</Typography>
																</Box>
																<Button
																	variant="contained"
																	color="primary"
																	onClick={() => {
																		if (selectedForecastId) {
																			handleActivateForecast(selectedForecastId);
																		}
																	}}
																	disabled={loading || !selectedForecastId}
																>
																	{loading ? "Activating..." : "✅ Activate Alerts"}
																</Button>
															</Stack>
														</Stack>
													</CardContent>
												</Card>
											)}
										</Box>
									)}
								</>
							)}
						</Stack>
					</CardContent>
				</Card>
			)}

			{/* Token Alerts Configuration */}
			{selectedForecastId && allConfigurations.find((c) => c.forecastId === selectedForecastId && c.isActive) && (
				<Card>
					<CardContent>
						<Stack spacing={2}>
							<Typography variant="h6">Alert Configuration</Typography>
							<Typography color="text.secondary" variant="body2">
								Configure alerts for each token with associated strategy. Click "Configure alerts" for each token, then customize
								alerts by TP.
							</Typography>
							<TokenAlertsList
								forecastId={selectedForecastId}
								portfolioId={selectedPortfolioId}
								alertConfiguration={alertConfiguration}
								onConfigurationUpdate={handleConfigurationUpdate}
							/>
						</Stack>
					</CardContent>
				</Card>
			)}

			{/* Notification Channels */}
			{selectedForecastId && alertConfiguration && alertConfiguration.isActive && (
				<Card>
					<CardContent>
						<Stack spacing={2}>
							<Typography variant="h6">Notification Channels</Typography>
							<NotificationChannelsConfig
								alertConfiguration={alertConfiguration}
								onConfigurationUpdate={handleConfigurationUpdate}
							/>
						</Stack>
					</CardContent>
				</Card>
			)}

			{/* Confirmation Modal */}
			<ConfirmModal
				open={showConfirmModal}
				onClose={() => {
					setShowConfirmModal(false);
					setPendingForecastId(null);
				}}
				onConfirm={() => {
					if (pendingForecastId) {
						doActivateForecast(pendingForecastId);
					}
					setShowConfirmModal(false);
					setPendingForecastId(null);
				}}
				title="Confirm activation"
				message="Another forecast is already active. Activating this forecast will automatically deactivate the other one. Do you want to continue?"
			/>
		</Stack>
	);
}

