"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { FloppyDiskIcon } from "@phosphor-icons/react/dist/ssr/FloppyDisk";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import * as configurationApi from "@/lib/configuration-api";
import type { TokenAlert, AlertConfiguration, UpdateTPAlertDto } from "@/types/configuration";
import type { TheoreticalStrategyResponse } from "@/types/strategies";
import { TPAlertsConfig } from "./tp-alerts-config";

interface TokenAlertsModalProps {
	open: boolean;
	onClose: () => void;
	holding: any;
	strategy: TheoreticalStrategyResponse | null;
	tokenAlert: TokenAlert | undefined;
	alertConfigurationId: string | undefined;
	isForecastActive: boolean;
	onConfigurationUpdate: (config: AlertConfiguration) => void;
	onCreateAlert: () => Promise<void>;
}

export function TokenAlertsModal({
	open,
	onClose,
	holding,
	strategy,
	tokenAlert,
	alertConfigurationId,
	isForecastActive,
	onConfigurationUpdate,
	onCreateAlert,
}: TokenAlertsModalProps): React.JSX.Element {
	const [pendingUpdates, setPendingUpdates] = React.useState<Map<string, UpdateTPAlertDto>>(new Map());
	const [saving, setSaving] = React.useState(false);
	const [isCreating, setIsCreating] = React.useState(false);
	const hasAutoCreatedRef = React.useRef(false);

	// Reset pending updates when modal closes
	React.useEffect(() => {
		if (!open) {
			setPendingUpdates(new Map());
			hasAutoCreatedRef.current = false;
		}
	}, [open]);

	// Auto-create alerts when modal opens
	React.useEffect(() => {
		const autoCreateAlerts = async () => {
			if (
				open &&
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
	}, [open, isForecastActive, tokenAlert, alertConfigurationId, isCreating, onCreateAlert]);

	// Handle local update (store in pending updates)
	const handleLocalTPAlertUpdate = React.useCallback((tpAlertId: string, updates: UpdateTPAlertDto) => {
		setPendingUpdates((prev) => {
			const newMap = new Map(prev);
			// Merge with existing updates for this TP alert
			const existing = newMap.get(tpAlertId);
			if (existing) {
				newMap.set(tpAlertId, {
					...existing,
					...updates,
					beforeTP: updates.beforeTP || existing.beforeTP,
					tpReached: updates.tpReached || existing.tpReached,
				});
			} else {
				newMap.set(tpAlertId, updates);
			}
			return newMap;
		});
	}, []);

	// Save all pending updates
	const handleSaveAllUpdates = React.useCallback(async () => {
		if (pendingUpdates.size === 0) return;

		try {
			setSaving(true);
			// Save all updates in parallel
			await Promise.all(
				Array.from(pendingUpdates.entries()).map(([tpAlertId, updates]) =>
					configurationApi.updateTPAlert(tpAlertId, updates)
				)
			);

			// Clear pending updates
			setPendingUpdates(new Map());

			// Reload configuration
			if (alertConfigurationId) {
				const updated = await configurationApi.getAlertConfigurationById(alertConfigurationId);
				onConfigurationUpdate(updated);
			}

			// Close modal after successful save
			onClose();
		} catch (error) {
			console.error("Error saving TP alert updates:", error);
		} finally {
			setSaving(false);
		}
	}, [pendingUpdates, alertConfigurationId, onConfigurationUpdate, onClose]);

	if (!strategy) {
		return <></>;
	}

	const numberOfTargets = strategy.profitTargets.length;

	return (
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
			<DialogTitle>
				<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
					<Stack spacing={0.5}>
						<Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
							<Typography variant="h6" sx={{ fontWeight: 600 }}>
								{holding.token?.symbol || holding.symbol}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{holding.token?.name || holding.tokenName}
							</Typography>
							{tokenAlert && (
								<Chip
									label={tokenAlert.isActive ? "Active" : "Inactive"}
									color={tokenAlert.isActive ? "success" : "default"}
									size="small"
									sx={{ height: "24px", fontSize: "0.75rem", fontWeight: 500 }}
								/>
							)}
						</Stack>
						<Typography variant="caption" color="text.secondary">
							Strategy: {strategy.name} • {numberOfTargets} Take Profit Target{numberOfTargets !== 1 ? "s" : ""}
						</Typography>
					</Stack>
					<IconButton onClick={onClose} size="small" sx={{ ml: "auto" }}>
						<XIcon />
					</IconButton>
				</Stack>
			</DialogTitle>

			<DialogContent>
				{!isForecastActive ? (
					<Box
						sx={{
							p: 3,
							textAlign: "center",
							bgcolor: "warning.light",
							borderRadius: 1,
							border: "1px solid",
							borderColor: "warning.main",
						}}
					>
						<Typography color="warning.dark" variant="body2" sx={{ fontWeight: 500 }}>
							⚠️ Forecast not active. Activate it to configure alerts.
						</Typography>
					</Box>
				) : tokenAlert && alertConfigurationId ? (
					<Box sx={{ pt: 1 }}>
						<TPAlertsConfig
							tokenAlert={tokenAlert}
							alertConfigurationId={alertConfigurationId}
							onConfigurationUpdate={onConfigurationUpdate}
							onLocalUpdate={handleLocalTPAlertUpdate}
							pendingUpdates={pendingUpdates}
						/>
					</Box>
				) : (
					<Box sx={{ p: 3, textAlign: "center" }}>
						{isCreating ? (
							<Stack spacing={1} sx={{ alignItems: "center" }}>
								<CircularProgress size={24} />
								<Typography color="info.main" variant="body2" sx={{ fontWeight: 500 }}>
									Creating alerts...
								</Typography>
							</Stack>
						) : (
							<Typography color="info.main" variant="body2" sx={{ fontWeight: 500 }}>
								Alerts will be created with default values.
							</Typography>
						)}
					</Box>
				)}
			</DialogContent>

			{isForecastActive && tokenAlert && pendingUpdates.size > 0 && (
				<DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
					<Button onClick={onClose} variant="outlined" disabled={saving}>
						Cancel
					</Button>
					<Button
						variant="contained"
						startIcon={<FloppyDiskIcon />}
						onClick={handleSaveAllUpdates}
						disabled={saving}
						sx={{
							minWidth: "160px",
							textTransform: "none",
							fontWeight: 600,
						}}
					>
						{saving ? "Saving..." : `Save Changes (${pendingUpdates.size})`}
					</Button>
				</DialogActions>
			)}
		</Dialog>
	);
}

