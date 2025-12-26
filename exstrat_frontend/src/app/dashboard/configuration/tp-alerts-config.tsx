"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { MinusIcon } from "@phosphor-icons/react/dist/ssr/Minus";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import * as configurationApi from "@/lib/configuration-api";
import { formatCurrency } from "@/lib/format";
import type { TokenAlert, AlertConfiguration, UpdateTPAlertDto } from "@/types/configuration";
import { toast } from "@/components/core/toaster";

interface TPAlertsConfigProps {
	tokenAlert: TokenAlert;
	alertConfigurationId: string;
	onConfigurationUpdate: (config: AlertConfiguration) => void;
	onLocalUpdate?: (tpAlertId: string, updates: UpdateTPAlertDto) => void;
	pendingUpdates?: Map<string, UpdateTPAlertDto>;
}

export function TPAlertsConfig({
	tokenAlert,
	alertConfigurationId,
	onConfigurationUpdate,
	onLocalUpdate,
	pendingUpdates,
}: TPAlertsConfigProps): React.JSX.Element {
	// Use local updates if provided, otherwise use immediate save
	const handleUpdateTPAlert = React.useCallback(
		(tpAlertId: string, updates: UpdateTPAlertDto) => {
			if (onLocalUpdate) {
				// Store locally for batch save
				onLocalUpdate(tpAlertId, updates);
			} else {
				// Immediate save (fallback)
				(async () => {
					try {
						await configurationApi.updateTPAlert(tpAlertId, updates);
						const updated = await configurationApi.getAlertConfigurationById(alertConfigurationId);
						onConfigurationUpdate(updated);
						toast.success("Alert updated successfully");
					} catch (error) {
						console.error("Error updating TP alert:", error);
						toast.error("Failed to update alert. Please try again.");
					}
				})();
			}
		},
		[onLocalUpdate, alertConfigurationId, onConfigurationUpdate]
	);

	// Get current value (from pending updates or original)
	const getCurrentValue = React.useCallback(
		(tpAlertId: string, field: "beforeTPValue" | "beforeTPEnabled" | "tpReachedEnabled" | "isActive") => {
			const pending = pendingUpdates?.get(tpAlertId);
			if (pending) {
				if (field === "beforeTPValue") {
					return pending.beforeTP?.value;
				}
				if (field === "beforeTPEnabled") {
					return pending.beforeTP?.enabled;
				}
				if (field === "tpReachedEnabled") {
					return pending.tpReached?.enabled;
				}
				if (field === "isActive") {
					return pending.isActive;
				}
			}
			// Fallback to original value
			const tpAlert = tokenAlert.tpAlerts.find((ta) => ta.id === tpAlertId);
			if (!tpAlert) return undefined;
			if (field === "beforeTPValue") return tpAlert.beforeTPValue;
			if (field === "beforeTPEnabled") return tpAlert.beforeTPEnabled;
			if (field === "tpReachedEnabled") return tpAlert.tpReachedEnabled;
			if (field === "isActive") return tpAlert.isActive;
			return undefined;
		},
		[pendingUpdates, tokenAlert]
	);

	// Sort TP alerts by order
	const sortedTPAlerts = [...tokenAlert.tpAlerts].sort((a, b) => a.tpOrder - b.tpOrder);

	return (
		<Stack spacing={1.5}>
			{sortedTPAlerts.map((tpAlert) => {
				const beforeTPValue = getCurrentValue(tpAlert.id, "beforeTPValue");
				const beforeTPEnabled = getCurrentValue(tpAlert.id, "beforeTPEnabled");
				const tpReachedEnabled = getCurrentValue(tpAlert.id, "tpReachedEnabled");
				
				const currentBeforeTPValue = (typeof beforeTPValue === "number" ? beforeTPValue : tpAlert.beforeTPValue) ?? -10;
				const currentBeforeTPEnabled = typeof beforeTPEnabled === "boolean" ? beforeTPEnabled : (tpAlert.beforeTPEnabled ?? false);
				const currentTPReachedEnabled = typeof tpReachedEnabled === "boolean" ? tpReachedEnabled : (tpAlert.tpReachedEnabled ?? false);

				return (
					<Box
						key={tpAlert.id}
						sx={{
							border: "1px solid var(--mui-palette-divider)",
							borderRadius: 1.5,
							overflow: "hidden",
							transition: "all 0.2s ease-in-out",
							"&:hover": {
								borderColor: "var(--mui-palette-primary-main)",
								boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
							},
						}}
					>
						{/* Header with TP number */}
						<Box
							sx={{
								px: 1.5,
								py: 1,
								bgcolor: "var(--mui-palette-background-default)",
								borderBottom: "1px solid var(--mui-palette-divider)",
							}}
						>
							<Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
								TP {tpAlert.tpOrder}
							</Typography>
						</Box>

						{/* Content */}
						<Box sx={{ p: 1.5 }}>
							<Stack spacing={2}>
								{/* Metrics Grid */}
								<Box
									sx={{
										display: "grid",
										gridTemplateColumns: "repeat(4, 1fr)",
										gap: 1.5,
									}}
								>
									<Box>
										<Typography color="text.secondary" variant="caption" sx={{ display: "block", mb: 0.5, fontSize: "0.7rem" }}>
											Target
										</Typography>
										<Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
											{formatCurrency(tpAlert.targetPrice, "$", 2)}
										</Typography>
									</Box>
									<Box>
										<Typography color="text.secondary" variant="caption" sx={{ display: "block", mb: 0.5, fontSize: "0.7rem" }}>
											Qty
										</Typography>
										<Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
											{tpAlert.sellQuantity.toFixed(4)}
										</Typography>
									</Box>
									<Box>
										<Typography color="text.secondary" variant="caption" sx={{ display: "block", mb: 0.5, fontSize: "0.7rem" }}>
											Projected
										</Typography>
										<Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
											{formatCurrency(tpAlert.projectedAmount, "$", 2)}
										</Typography>
									</Box>
									<Box>
										<Typography color="text.secondary" variant="caption" sx={{ display: "block", mb: 0.5, fontSize: "0.7rem" }}>
											Remaining
										</Typography>
										<Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.875rem" }}>
											{formatCurrency(tpAlert.remainingValue, "$", 2)}
										</Typography>
									</Box>
								</Box>

								{/* Divider */}
								<Box sx={{ height: "1px", bgcolor: "var(--mui-palette-divider)" }} />

								{/* Alert Me Section */}
								<Box>
									<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1.5, display: "block", fontSize: "0.7rem" }}>
										Alert Me
									</Typography>
									<Stack direction="row" spacing={3} sx={{ alignItems: "flex-start" }}>
										{/* Before */}
										<Box sx={{ flex: 1 }}>
											<Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontSize: "0.7rem" }}>
												Before
											</Typography>
											<Stack spacing={1}>
												<Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
													<IconButton
														size="small"
														onClick={() => {
															const newValue = Math.max(-50, currentBeforeTPValue - 5);
															handleUpdateTPAlert(tpAlert.id, {
																beforeTP: {
																	enabled: true,
																	value: newValue,
																	type: (tpAlert.beforeTPType as "percentage" | "absolute") || "percentage",
																},
															});
														}}
														disabled={!currentBeforeTPEnabled}
														sx={{
															p: 0.5,
															width: "32px",
															height: "32px",
															border: "1px solid var(--mui-palette-divider)",
															borderRadius: 0.5,
															"&:hover": {
																bgcolor: "var(--mui-palette-action-hover)",
																borderColor: "var(--mui-palette-primary-main)",
															},
														}}
													>
														<MinusIcon fontSize="var(--icon-fontSize-sm)" />
													</IconButton>
													<TextField
														type="number"
														value={currentBeforeTPValue}
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
														disabled={!currentBeforeTPEnabled}
														size="small"
														sx={{
															width: "70px",
															"& .MuiOutlinedInput-root": {
																height: "32px",
																"& input": {
																	padding: "4px 8px",
																	fontSize: "0.875rem",
																	fontWeight: 600,
																	textAlign: "center",
																},
															},
														}}
														inputProps={{ min: -50, max: 0, step: 1 }}
													/>
													<Typography variant="body2" sx={{ fontSize: "0.75rem", fontWeight: 500, minWidth: "20px" }}>
														%
													</Typography>
													<IconButton
														size="small"
														onClick={() => {
															const newValue = Math.min(0, currentBeforeTPValue + 5);
															handleUpdateTPAlert(tpAlert.id, {
																beforeTP: {
																	enabled: true,
																	value: newValue,
																	type: (tpAlert.beforeTPType as "percentage" | "absolute") || "percentage",
																},
															});
														}}
														disabled={!currentBeforeTPEnabled}
														sx={{
															p: 0.5,
															width: "32px",
															height: "32px",
															border: "1px solid var(--mui-palette-divider)",
															borderRadius: 0.5,
															"&:hover": {
																bgcolor: "var(--mui-palette-action-hover)",
																borderColor: "var(--mui-palette-primary-main)",
															},
														}}
													>
														<PlusIcon fontSize="var(--icon-fontSize-sm)" />
													</IconButton>
												</Stack>
												<FormControlLabel
													control={
														<Checkbox
															checked={currentBeforeTPEnabled}
															onChange={(e) =>
																handleUpdateTPAlert(tpAlert.id, {
																	beforeTP: {
																		enabled: e.target.checked,
																		value: currentBeforeTPValue,
																		type: (tpAlert.beforeTPType as "percentage" | "absolute") || "percentage",
																	},
																})
															}
															size="small"
														/>
													}
													label={<Typography variant="caption">Enable</Typography>}
													sx={{ m: 0 }}
												/>
											</Stack>
										</Box>

										{/* Reaching */}
										<Box sx={{ flex: 1 }}>
											<Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1, fontSize: "0.7rem" }}>
												Reaching
											</Typography>
											<Box sx={{ height: "32px", display: "flex", alignItems: "center", mb: 1 }} />
											<FormControlLabel
												control={
													<Checkbox
														checked={currentTPReachedEnabled}
														onChange={(e) =>
															handleUpdateTPAlert(tpAlert.id, {
																tpReached: {
																	enabled: e.target.checked,
																},
															})
														}
														size="small"
													/>
												}
												label={<Typography variant="caption">Enable</Typography>}
												sx={{ m: 0 }}
											/>
										</Box>
									</Stack>
								</Box>
							</Stack>
						</Box>
					</Box>
				);
			})}
		</Stack>
	);
}

