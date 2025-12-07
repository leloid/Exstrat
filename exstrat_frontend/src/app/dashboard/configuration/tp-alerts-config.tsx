"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import FormControlLabel from "@mui/material/FormControlLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { MinusIcon } from "@phosphor-icons/react/dist/ssr/Minus";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import * as configurationApi from "@/lib/configuration-api";
import { formatCurrency } from "@/lib/format";
import type { TokenAlert, AlertConfiguration, UpdateTPAlertDto } from "@/types/configuration";

interface TPAlertsConfigProps {
	tokenAlert: TokenAlert;
	alertConfigurationId: string;
	onConfigurationUpdate: (config: AlertConfiguration) => void;
}

export function TPAlertsConfig({
	tokenAlert,
	alertConfigurationId,
	onConfigurationUpdate,
}: TPAlertsConfigProps): React.JSX.Element {
	const [saving, setSaving] = React.useState<Record<string, boolean>>({});

	const handleUpdateTPAlert = async (tpAlertId: string, updates: UpdateTPAlertDto) => {
		try {
			setSaving((prev) => ({ ...prev, [tpAlertId]: true }));
			await configurationApi.updateTPAlert(tpAlertId, updates);

			// Reload configuration
			const updated = await configurationApi.getAlertConfigurationById(alertConfigurationId);
			onConfigurationUpdate(updated);
		} catch (error) {
			console.error("Error updating TP alert:", error);
		} finally {
			setSaving((prev) => ({ ...prev, [tpAlertId]: false }));
		}
	};

	const handleToggleTokenAlert = async (isActive: boolean) => {
		try {
			setSaving((prev) => ({ ...prev, token: true }));
			await configurationApi.updateTokenAlert(tokenAlert.id, { isActive });

			// Reload configuration
			const updated = await configurationApi.getAlertConfigurationById(alertConfigurationId);
			onConfigurationUpdate(updated);
		} catch (error) {
			console.error("Error updating token alert:", error);
		} finally {
			setSaving((prev) => ({ ...prev, token: false }));
		}
	};

	// Sort TP alerts by order
	const sortedTPAlerts = [...tokenAlert.tpAlerts].sort((a, b) => a.tpOrder - b.tpOrder);

	return (
		<Stack spacing={3}>
			{/* Header with global toggle */}
			<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
				<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
					TP Alerts Configuration
				</Typography>
				<FormControlLabel
					control={
						<Checkbox
							checked={tokenAlert.isActive}
							onChange={(e) => handleToggleTokenAlert(e.target.checked)}
							disabled={saving.token}
						/>
					}
					label={<Typography variant="body2">Enable all alerts</Typography>}
				/>
			</Stack>

			<Divider />

			{/* TP Alerts List */}
			<Stack spacing={2}>
				{sortedTPAlerts.map((tpAlert) => {
					const isSaving = saving[tpAlert.id];

					return (
						<Card key={tpAlert.id} variant="outlined">
							<CardContent>
								<Stack spacing={2}>
									{/* TP Header */}
									<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
										<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
											TP {tpAlert.tpOrder}
										</Typography>
										<FormControlLabel
											control={
												<Checkbox
													checked={tpAlert.isActive}
													onChange={(e) => handleUpdateTPAlert(tpAlert.id, { isActive: e.target.checked })}
													disabled={isSaving}
												/>
											}
											label={<Typography variant="caption">Active</Typography>}
										/>
									</Stack>

									{/* TP Data */}
									<Grid container spacing={2}>
										<Grid size={{ xs: 6, sm: 3 }}>
											<Typography color="text.secondary" variant="caption">
												Target price:
											</Typography>
											<Typography variant="body2" sx={{ fontWeight: 500 }}>
												{formatCurrency(tpAlert.targetPrice, "$", 2)}
											</Typography>
										</Grid>
										<Grid size={{ xs: 6, sm: 3 }}>
											<Typography color="text.secondary" variant="caption">
												Sell quantity:
											</Typography>
											<Typography variant="body2" sx={{ fontWeight: 500 }}>
												{tpAlert.sellQuantity.toFixed(4)}
											</Typography>
										</Grid>
										<Grid size={{ xs: 6, sm: 3 }}>
											<Typography color="text.secondary" variant="caption">
												Projected amount:
											</Typography>
											<Typography variant="body2" sx={{ fontWeight: 500 }}>
												{formatCurrency(tpAlert.projectedAmount, "$", 2)}
											</Typography>
										</Grid>
										<Grid size={{ xs: 6, sm: 3 }}>
											<Typography color="text.secondary" variant="caption">
												Remaining value:
											</Typography>
											<Typography variant="body2" sx={{ fontWeight: 500 }}>
												{formatCurrency(tpAlert.remainingValue, "$", 2)}
											</Typography>
										</Grid>
									</Grid>

									<Divider />

									{/* Alert Configuration */}
									<Stack spacing={2}>
										{/* Before TP Alert */}
										<Card variant="outlined" sx={{ bgcolor: "warning.light", borderColor: "warning.main" }}>
											<CardContent>
												<Stack spacing={2}>
													<FormControlLabel
														control={
															<Checkbox
																checked={tpAlert.beforeTPEnabled}
																onChange={(e) =>
																	handleUpdateTPAlert(tpAlert.id, {
																		beforeTP: {
																			enabled: e.target.checked,
																			value: tpAlert.beforeTPValue || -10,
																			type: (tpAlert.beforeTPType as "percentage" | "absolute") || "percentage",
																		},
																	})
																}
																disabled={isSaving}
															/>
														}
														label={
															<Typography variant="body2" sx={{ fontWeight: 600, color: "warning.dark" }}>
																Before TP
															</Typography>
														}
													/>
													{tpAlert.beforeTPEnabled && (
														<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
															<IconButton
																size="small"
																onClick={() => {
																	const currentValue = tpAlert.beforeTPValue || -10;
																	const newValue = Math.max(-50, currentValue - 5);
																	handleUpdateTPAlert(tpAlert.id, {
																		beforeTP: {
																			enabled: true,
																			value: newValue,
																			type: (tpAlert.beforeTPType as "percentage" | "absolute") || "percentage",
																		},
																	});
																}}
																disabled={isSaving}
															>
																<MinusIcon fontSize="var(--icon-fontSize-sm)" />
															</IconButton>
															<TextField
																type="number"
																value={tpAlert.beforeTPValue || -10}
																onChange={(e) => {
																	const value = parseFloat(e.target.value);
																	if (!isNaN(value)) {
																		handleUpdateTPAlert(tpAlert.id, {
																			beforeTP: {
																				enabled: true,
																				value: Math.max(-50, Math.min(0, value)),
																				type: (tpAlert.beforeTPType as "percentage" | "absolute") || "percentage",
																			},
																		});
																	}
																}}
																disabled={isSaving}
																size="small"
																sx={{ width: "80px" }}
																inputProps={{ min: -50, max: 0, step: 1 }}
															/>
															<Typography variant="body2">%</Typography>
															<IconButton
																size="small"
																onClick={() => {
																	const currentValue = tpAlert.beforeTPValue || -10;
																	const newValue = Math.min(0, currentValue + 5);
																	handleUpdateTPAlert(tpAlert.id, {
																		beforeTP: {
																			enabled: true,
																			value: newValue,
																			type: (tpAlert.beforeTPType as "percentage" | "absolute") || "percentage",
																		},
																	});
																}}
																disabled={isSaving}
															>
																<PlusIcon fontSize="var(--icon-fontSize-sm)" />
															</IconButton>
															<Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
																below threshold
															</Typography>
														</Stack>
													)}
												</Stack>
											</CardContent>
										</Card>

										{/* TP Reached Alert */}
										<Card variant="outlined" sx={{ bgcolor: "success.light", borderColor: "success.main" }}>
											<CardContent>
												<FormControlLabel
													control={
														<Checkbox
															checked={tpAlert.tpReachedEnabled}
															onChange={(e) =>
																handleUpdateTPAlert(tpAlert.id, {
																	tpReached: {
																		enabled: e.target.checked,
																	},
																})
															}
															disabled={isSaving}
														/>
													}
													label={
														<Typography variant="body2" sx={{ fontWeight: 600, color: "success.dark" }}>
															TP Reached
														</Typography>
													}
												/>
											</CardContent>
										</Card>
									</Stack>
								</Stack>
							</CardContent>
						</Card>
					);
				})}
			</Stack>
		</Stack>
	);
}

