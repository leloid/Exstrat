"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import * as configurationApi from "@/lib/configuration-api";
import type { AlertConfiguration, NotificationChannels } from "@/types/configuration";

interface NotificationChannelsConfigProps {
	alertConfiguration: AlertConfiguration;
	onConfigurationUpdate: (config: AlertConfiguration) => void;
}

export function NotificationChannelsConfig({
	alertConfiguration,
	onConfigurationUpdate,
}: NotificationChannelsConfigProps): React.JSX.Element {
	const [saving, setSaving] = React.useState(false);

	const handleUpdateChannels = async (channels: NotificationChannels) => {
		try {
			setSaving(true);
			const updated = await configurationApi.updateAlertConfiguration(alertConfiguration.id, {
				notificationChannels: channels,
			});
			onConfigurationUpdate(updated);
		} catch (error) {
			console.error("Error updating notification channels:", error);
		} finally {
			setSaving(false);
		}
	};

	return (
		<Stack spacing={2}>
			<FormControlLabel
				control={
					<Checkbox
						checked={alertConfiguration.notificationChannels.email}
						onChange={(e) =>
							handleUpdateChannels({
								...alertConfiguration.notificationChannels,
								email: e.target.checked,
							})
						}
						disabled={saving}
					/>
				}
				label={
					<Box>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							Email
						</Typography>
						<Typography variant="caption" color="text.secondary">
							Receive alerts by email
						</Typography>
					</Box>
				}
				sx={{ m: 0 }}
			/>

			<FormControlLabel
				control={
					<Checkbox
						checked={alertConfiguration.notificationChannels.push}
						onChange={(e) =>
							handleUpdateChannels({
								...alertConfiguration.notificationChannels,
								push: e.target.checked,
							})
						}
						disabled={saving}
					/>
				}
				label={
					<Box>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							Push Notifications
						</Typography>
						<Typography variant="caption" color="text.secondary">
							Receive alerts on your mobile device
						</Typography>
					</Box>
				}
				sx={{ m: 0 }}
			/>
		</Stack>
	);
}

