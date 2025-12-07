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
import { getForecasts, getForecastById } from "@/lib/portfolios-api";
import * as configurationApi from "@/lib/configuration-api";
import type { ForecastResponse } from "@/types/portfolio";
import type { AlertConfiguration } from "@/types/configuration";
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

