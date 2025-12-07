"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { getForecasts, getForecastById, getPortfolioHoldings } from "@/lib/portfolios-api";
import { getTheoreticalStrategies } from "@/lib/portfolios-api";
import { strategiesApi } from "@/lib/strategies-api";
import * as configurationApi from "@/lib/configuration-api";
import type { ForecastResponse } from "@/types/portfolio";
import type { AlertConfiguration, CreateTokenAlertDto, CreateTPAlertDto } from "@/types/configuration";
import type { TheoreticalStrategyResponse, StrategyResponse } from "@/types/strategies";
import { WalletSelector } from "./wallet-selector";
import { ForecastSelector } from "./forecast-selector";
import { NotificationChannelsConfig } from "./notification-channels-config";
import { TokenAlertsList } from "./token-alerts-list";
import { ConfirmModal } from "./confirm-modal";

interface AddAlertModalProps {
	open: boolean;
	onClose: () => void;
	onSuccess: () => void;
	existingConfig?: AlertConfiguration | null;
}

export function AddAlertModal({ open, onClose, onSuccess, existingConfig }: AddAlertModalProps): React.JSX.Element {
	const { portfolios } = usePortfolio();
	const [selectedPortfolioId, setSelectedPortfolioId] = React.useState<string>("");
	const [forecasts, setForecasts] = React.useState<ForecastResponse[]>([]);
	const [selectedForecastId, setSelectedForecastId] = React.useState<string | null>(null);
	const [alertConfiguration, setAlertConfiguration] = React.useState<AlertConfiguration | null>(null);
	const [allConfigurations, setAllConfigurations] = React.useState<any[]>([]);
	const [loading, setLoading] = React.useState(false);
	const [showConfirmModal, setShowConfirmModal] = React.useState(false);
	const [pendingForecastId, setPendingForecastId] = React.useState<string | null>(null);

	// Initialize with existing config if editing
	React.useEffect(() => {
		if (existingConfig && open) {
			// Load forecast to get portfolio
			const loadForecastData = async () => {
				try {
					const forecast = await getForecastById(existingConfig.forecastId);
					setSelectedPortfolioId(forecast.portfolioId);
					setSelectedForecastId(existingConfig.forecastId);
					setAlertConfiguration(existingConfig);
				} catch (error) {
					console.error("Error loading forecast data:", error);
				}
			};
			loadForecastData();
		} else if (!existingConfig && open) {
			// Reset when adding new
			setSelectedPortfolioId("");
			setSelectedForecastId(null);
			setAlertConfiguration(null);
		}
	}, [existingConfig, open]);

	// Load forecasts when portfolio changes
	React.useEffect(() => {
		const loadData = async () => {
			if (!selectedPortfolioId) {
				setForecasts([]);
				setSelectedForecastId(null);
				setAllConfigurations([]);
				return;
			}

			try {
				setLoading(true);
				const allForecasts = await getForecasts();
				const portfolioForecasts = allForecasts.filter((f) => f.portfolioId === selectedPortfolioId);
				setForecasts(portfolioForecasts);

				const allConfigs = await configurationApi.getAlertConfigurations();
				const portfolioConfigs = allConfigs.filter((config) => {
					const forecast = portfolioForecasts.find((f) => f.id === config.forecastId);
					return forecast !== undefined;
				});
				setAllConfigurations(portfolioConfigs);
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

	// Reset when modal closes
	React.useEffect(() => {
		if (!open) {
			setSelectedPortfolioId("");
			setSelectedForecastId(null);
			setShowConfirmModal(false);
			setPendingForecastId(null);
		}
	}, [open]);

	const handleActivateForecast = async (forecastId: string) => {
		if (!forecastId) {
			console.error("No forecast selected");
			return;
		}

		// Check if another forecast is already active
		const activeConfig = allConfigurations.find((c) => c.isActive);
		if (activeConfig && activeConfig.forecastId !== forecastId) {
			setPendingForecastId(forecastId);
			setShowConfirmModal(true);
			return;
		}

		await doActivateForecast(forecastId);
	};

	const createAlertsForAllTokens = async (config: AlertConfiguration, forecastId: string) => {
		if (!selectedPortfolioId) {
			console.error("No portfolio selected");
			return;
		}

		try {
			// Load forecast to get applied strategies
			const forecastData = await getForecastById(forecastId);
			const appliedStrategies = forecastData.appliedStrategies || {};

			if (Object.keys(appliedStrategies).length === 0) {
				console.log("⚠️ No strategies applied to this forecast");
				return;
			}

			// Load holdings
			const holdings = await getPortfolioHoldings(selectedPortfolioId);

			// Load both theoretical and real strategies
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

			// Combine theoretical and converted real strategies
			const allStrategies = [...(theoreticalData || []), ...convertedStrategies];
			const strategiesMap = new Map<string, TheoreticalStrategyResponse>();
			allStrategies.forEach((strategy) => {
				strategiesMap.set(strategy.id, strategy);
			});

			// For each holding, check if it has an associated strategy
			for (const holding of holdings) {
				// Find strategy ID (by holdingId, tokenId, or symbol)
				const strategyId =
					appliedStrategies[holding.id] ||
					appliedStrategies[holding.token?.id] ||
					appliedStrategies[holding.token?.symbol];

				if (!strategyId || strategyId === "none") continue;

				const strategy = strategiesMap.get(strategyId);
				if (!strategy) continue;

				// Check if alert already exists
				const existingTokenAlert = config.tokenAlerts?.find((ta) => ta.holdingId === holding.id);
				if (existingTokenAlert) {
					console.log(`✅ Alert already exists for ${holding.token.symbol}`);
					continue;
				}

				// Create TP alerts from strategy
				const tpAlerts: CreateTPAlertDto[] = strategy.profitTargets.map((tp) => {
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
							type: "percentage",
						},
						tpReached: {
							enabled: true,
						},
						isActive: true,
					};
				});

				const tokenAlert: CreateTokenAlertDto = {
					holdingId: holding.id,
					tokenSymbol: holding.token.symbol,
					strategyId: strategy.id,
					numberOfTargets: strategy.profitTargets.length,
					tpAlerts,
					isActive: true,
				};

				try {
					console.log(`🔄 Creating alert for ${holding.token.symbol}...`);
					await configurationApi.createTokenAlert(config.id, tokenAlert);
					console.log(`✅ Alert created for ${holding.token.symbol}`);
				} catch (error) {
					console.error(`❌ Error creating alert for ${holding.token.symbol}:`, error);
				}
			}

			// Reload configuration to get new alerts
			const updatedConfig = await configurationApi.getAlertConfigurationById(config.id);
			setAlertConfiguration(updatedConfig);
		} catch (error) {
			console.error("Error creating alerts for all tokens:", error);
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

			// Reload all configurations to update active state
			const allConfigs = await configurationApi.getAlertConfigurations();
			const portfolioConfigs = allConfigs.filter((c) => {
				const forecast = forecasts.find((f) => f.id === c.forecastId);
				return forecast !== undefined;
			});
			setAllConfigurations(portfolioConfigs);

			onSuccess();
		} catch (error) {
			console.error("Error activating forecast:", error);
		} finally {
			setLoading(false);
		}
	};

	const activeForecastId = allConfigurations.find((c) => c.isActive)?.forecastId || null;

	return (
		<>
			<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
				<DialogTitle>
					<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
						<Typography variant="h6">{existingConfig ? "Edit Alert Configuration" : "Add Alert Configuration"}</Typography>
						<IconButton onClick={onClose} size="small">
							<XIcon fontSize="var(--icon-fontSize-md)" />
						</IconButton>
					</Stack>
				</DialogTitle>
				<DialogContent>
					<Stack spacing={3} sx={{ mt: 1 }}>
						{/* Wallet Selection */}
						<Card variant="outlined">
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
							<Card variant="outlined">
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
													onForecastSelect={setSelectedForecastId}
												/>

												{selectedForecastId && !existingConfig && (
													<Card variant="outlined">
														<CardContent>
															<Stack spacing={2}>
																<Typography variant="body1" sx={{ fontWeight: 600 }}>
																	Activate alerts for this forecast
																</Typography>
																<Typography color="text.secondary" variant="body2">
																	{allConfigurations.find((c) => c.isActive)
																		? "⚠️ Another forecast is already active. Activating this will automatically deactivate the other."
																		: "Activate this forecast to start configuring alerts."}
																</Typography>
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
														</CardContent>
													</Card>
												)}

												{/* Show token alerts configuration if editing existing config */}
												{existingConfig && alertConfiguration && alertConfiguration.isActive && selectedPortfolioId && (
													<Card variant="outlined">
														<CardContent>
															<Stack spacing={2}>
																<Typography variant="h6">Alert Configuration</Typography>
																<Typography color="text.secondary" variant="body2">
																	Configure alerts for each token with associated strategy.
																</Typography>
																<TokenAlertsList
																	forecastId={selectedForecastId || existingConfig.forecastId}
																	portfolioId={selectedPortfolioId}
																	alertConfiguration={alertConfiguration}
																	onConfigurationUpdate={(config) => {
																		setAlertConfiguration(config);
																	}}
																/>
															</Stack>
														</CardContent>
													</Card>
												)}

												{/* Show notification channels if editing existing config */}
												{existingConfig && alertConfiguration && alertConfiguration.isActive && (
													<Card variant="outlined">
														<CardContent>
															<Stack spacing={2}>
																<Typography variant="h6">Notification Channels</Typography>
																<NotificationChannelsConfig
																	alertConfiguration={alertConfiguration}
																	onConfigurationUpdate={(config) => {
																		setAlertConfiguration(config);
																	}}
																/>
															</Stack>
														</CardContent>
													</Card>
												)}
											</>
										)}
									</Stack>
								</CardContent>
							</Card>
						)}
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={onClose}>Cancel</Button>
				</DialogActions>
			</Dialog>

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
		</>
	);
}

