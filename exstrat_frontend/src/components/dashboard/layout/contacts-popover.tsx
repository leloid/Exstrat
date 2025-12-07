"use client";

import type * as React from "react";
import Box from "@mui/material/Box";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";

export interface Contact {
	id: string;
	name: string;
	avatar?: string;
	status: "online" | "offline" | "away" | "busy";
	lastActivity?: Date;
}

const contacts: Contact[] = [];

export interface ContactsPopoverProps {
	anchorEl: null | Element;
	contacts?: Contact[];
	onClose?: () => void;
	open?: boolean;
}

export function ContactsPopover({ anchorEl, onClose, open = false }: ContactsPopoverProps): React.JSX.Element {
	return (
		<Popover
			anchorEl={anchorEl}
			anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
			onClose={onClose}
			open={open}
			slotProps={{ paper: { sx: { width: "300px" } } }}
			transformOrigin={{ horizontal: "right", vertical: "top" }}
		>
			<Box sx={{ px: 3, py: 2 }}>
				<Typography variant="h6">Contacts</Typography>
			</Box>
			<Box sx={{ p: 2, textAlign: "center" }}>
				<Typography variant="subtitle2" color="text.secondary">
					To be soon
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: "0.75rem" }}>
					Contacts will be available soon
				</Typography>
			</Box>
		</Popover>
	);
}
