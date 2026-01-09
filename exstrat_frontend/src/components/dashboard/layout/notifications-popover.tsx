"use client";

import type * as React from "react";
import Box from "@mui/material/Box";
import Popover from "@mui/material/Popover";
import Stack from "@mui/material/Stack";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/ssr/EnvelopeSimple";
import IconButton from "@mui/material/IconButton";

export interface NotificationsPopoverProps {
	anchorEl: null | Element;
	onClose?: () => void;
	onMarkAllAsRead?: () => void;
	onRemoveOne?: (id: string) => void;
	open?: boolean;
}

export function NotificationsPopover({
	anchorEl,
	onClose,
	onMarkAllAsRead,
	onRemoveOne,
	open = false,
}: NotificationsPopoverProps): React.JSX.Element {
	return (
		<Popover
			anchorEl={anchorEl}
			anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
			onClose={onClose}
			open={open}
			slotProps={{ paper: { sx: { width: "380px" } } }}
			transformOrigin={{ horizontal: "right", vertical: "top" }}
		>
			<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between", px: 3, py: 2 }}>
				<Typography variant="h6">Notifications</Typography>
				<Tooltip title="Mark all as read">
					<IconButton edge="end" onClick={onMarkAllAsRead}>
						<EnvelopeSimpleIcon />
					</IconButton>
				</Tooltip>
			</Stack>
			<Box sx={{ p: 2, textAlign: "center" }}>
				<Typography variant="body2" color="text.secondary">
					Notifications will be available soon
				</Typography>
			</Box>
		</Popover>
	);
}
