"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Collapse from "@mui/material/Collapse";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CaretUpIcon } from "@phosphor-icons/react/dist/ssr/CaretUp";
import { formatCurrency } from "@/lib/format";
import type { TokenAlert, AlertConfiguration } from "@/types/configuration";
import type { TheoreticalStrategyResponse } from "@/types/strategies";
import { TPAlertsConfig } from "./tp-alerts-config";

interface TokenAlertItemProps {
	holding: any;
	strategy: TheoreticalStrategyResponse | null;
	tokenAlert: TokenAlert | undefined;
	alertConfigurationId: string | undefined;
	isForecastActive: boolean;
	isExpanded: boolean;
	onToggleExpand: () => void;
	onCreateAlert: () => void;
	onConfigurationUpdate: (config: AlertConfiguration) => void;
}

export function TokenAlertItem({
	holding,
	strategy,
	tokenAlert,
	alertConfigurationId,
	isForecastActive,
	isExpanded,
	onToggleExpand,
	onCreateAlert,
	onConfigurationUpdate,
}: TokenAlertItemProps): React.JSX.Element {
	const [isCreating, setIsCreating] = React.useState(false);
	const hasAutoCreatedRef = React.useRef(false);

	if (!strategy) {
		return null;
	}

	const numberOfTargets = strategy.profitTargets.length;

	// Auto-create alerts when expanded
	React.useEffect(() => {
		const autoCreateAlerts = async () => {
			if (
				isExpanded &&
				isForecastActive &&
				!tokenAlert &&
				alertConfigurationId &&
				!isCreating &&
				!hasAutoCreatedRef.current
			) {
				hasAutoCreatedRef.current = true;
				setIsCreating(true);
				try {
					await onCreateAlert();
				} catch (error) {
					console.error("Error auto-creating alerts:", error);
					hasAutoCreatedRef.current = false;
				} finally {
					setIsCreating(false);
				}
			}
		};

		autoCreateAlerts();
	}, [isExpanded, isForecastActive, tokenAlert, alertConfigurationId, isCreating, onCreateAlert]);

	React.useEffect(() => {
		if (tokenAlert) {
			hasAutoCreatedRef.current = false;
		}
	}, [tokenAlert]);

	return (
		<Card variant="outlined">
			<CardContent>
				<Stack spacing={2}>
					{/* Header */}
					<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
						<Stack spacing={0.5} sx={{ flex: 1 }}>
							<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
								<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
									{holding.token?.symbol || holding.symbol} - {holding.token?.name || holding.tokenName}
								</Typography>
								{tokenAlert && (
									<Chip
										label={tokenAlert.isActive ? "Active" : "Inactive"}
										color={tokenAlert.isActive ? "success" : "default"}
										size="small"
									/>
								)}
							</Stack>
							<Stack direction="row" spacing={2}>
								<Typography color="text.secondary" variant="body2">
									Strategy: {strategy.name}
								</Typography>
								<Typography color="text.secondary" variant="body2">
									Number of TP: {numberOfTargets}
								</Typography>
							</Stack>
						</Stack>
						<IconButton onClick={onToggleExpand} size="small">
							{isExpanded ? (
								<CaretUpIcon fontSize="var(--icon-fontSize-md)" />
							) : (
								<CaretDownIcon fontSize="var(--icon-fontSize-md)" />
							)}
						</IconButton>
					</Stack>

					{/* Expanded Content */}
					<Collapse in={isExpanded}>
						<Box sx={{ pt: 2 }}>
							{!isForecastActive ? (
								<Card variant="outlined" sx={{ bgcolor: "warning.light", borderColor: "warning.main" }}>
									<CardContent>
										<Typography color="warning.dark" variant="body2">
											⚠️ You must first activate this forecast to configure alerts for this token.
										</Typography>
									</CardContent>
								</Card>
							) : tokenAlert && alertConfigurationId ? (
								<TPAlertsConfig
									tokenAlert={tokenAlert}
									alertConfigurationId={alertConfigurationId}
									onConfigurationUpdate={onConfigurationUpdate}
								/>
							) : (
								<Stack spacing={2}>
									{isCreating ? (
										<Card variant="outlined" sx={{ bgcolor: "info.light", borderColor: "info.main" }}>
											<CardContent>
												<Typography color="info.dark" variant="body2">
													⏳ Creating alerts...
												</Typography>
											</CardContent>
										</Card>
									) : (
										<Card variant="outlined" sx={{ bgcolor: "info.light", borderColor: "info.main" }}>
											<CardContent>
												<Typography color="info.dark" variant="body2">
													💡 Alerts are being created with default values (-10% before TP, alert when TP is reached).
												</Typography>
											</CardContent>
										</Card>
									)}

									{/* TP Preview */}
									<Box>
										<Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
											TP Preview to Configure
										</Typography>
										<Stack spacing={2}>
											{strategy.profitTargets.map((tp) => {
												const targetPrice =
													tp.targetType === "percentage"
														? holding.averagePrice * (1 + tp.targetValue / 100)
														: tp.targetValue;
												const sellQuantity = (holding.quantity * tp.sellPercentage) / 100;
												const projectedAmount = targetPrice * sellQuantity;
												const remainingValue = (holding.quantity - sellQuantity) * targetPrice;

												return (
													<Card key={tp.order} variant="outlined">
														<CardContent>
															<Stack spacing={1}>
																<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
																	TP {tp.order}
																</Typography>
																<Stack direction="row" spacing={2} sx={{ flexWrap: "wrap" }}>
																	<Box>
																		<Typography color="text.secondary" variant="caption">
																			Target price:
																		</Typography>
																		<Typography variant="body2">{formatCurrency(targetPrice, "$", 2)}</Typography>
																	</Box>
																	<Box>
																		<Typography color="text.secondary" variant="caption">
																			Sell quantity:
																		</Typography>
																		<Typography variant="body2">{sellQuantity.toFixed(4)}</Typography>
																	</Box>
																	<Box>
																		<Typography color="text.secondary" variant="caption">
																			Projected amount:
																		</Typography>
																		<Typography variant="body2">{formatCurrency(projectedAmount, "$", 2)}</Typography>
																	</Box>
																	<Box>
																		<Typography color="text.secondary" variant="caption">
																			Remaining value:
																		</Typography>
																		<Typography variant="body2">{formatCurrency(remainingValue, "$", 2)}</Typography>
																	</Box>
																</Stack>
															</Stack>
														</CardContent>
													</Card>
												);
											})}
										</Stack>
									</Box>
								</Stack>
							)}
						</Box>
					</Collapse>
				</Stack>
			</CardContent>
		</Card>
	);
}

