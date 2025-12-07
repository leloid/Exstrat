"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
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
		<Card variant="outlined">
			<CardContent>
				<Stack spacing={3}>
					<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
						Choose notification channels
					</Typography>

					{/* Email */}
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
								<Typography variant="body2" sx={{ fontWeight: 500 }}>
									📧 Email
								</Typography>
								<Typography variant="caption" color="text.secondary">
									Receive alerts by email
								</Typography>
							</Box>
						}
					/>

					{/* Push */}
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
								<Typography variant="body2" sx={{ fontWeight: 500 }}>
									📱 Push notifications
								</Typography>
								<Typography variant="caption" color="text.secondary">
									Receive alerts on your mobile device (requires the app)
								</Typography>
								{alertConfiguration.notificationChannels.push && (
									<Box
										sx={{
											mt: 1,
											p: 1,
											bgcolor: "info.light",
											borderRadius: 1,
											border: "1px solid",
											borderColor: "info.main",
										}}
									>
										<Typography variant="caption" color="info.dark">
											💡 Download the exStrat mobile app to enable push notifications
										</Typography>
									</Box>
								)}
							</Box>
						}
					/>
				</Stack>
			</CardContent>
		</Card>
	);
}

