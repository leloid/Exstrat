"use client";

import type * as React from "react";
import Avatar from "@mui/material/Avatar";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";

export const workspaces = [
	{ name: "My Wallets", avatar: "/assets/logo-btc.svg", disabled: false },
	{ name: "Virtual Wallet", avatar: "/assets/logo-eth.svg", disabled: true },
] satisfies Workspaces[];

export interface Workspaces {
	name: string;
	avatar: string;
	disabled?: boolean;
}

export interface WorkspacesPopoverProps {
	anchorEl: null | Element;
	onChange?: (tenant: string) => void;
	onClose?: () => void;
	open?: boolean;
}

export function WorkspacesPopover({
	anchorEl,
	onChange,
	onClose,
	open = false,
}: WorkspacesPopoverProps): React.JSX.Element {
	return (
		<Menu
			anchorEl={anchorEl}
			anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
			onClose={onClose}
			open={open}
			slotProps={{ paper: { sx: { width: "250px" } } }}
			transformOrigin={{ horizontal: "right", vertical: "top" }}
		>
			{workspaces.map((workspace) => (
				<MenuItem
					key={workspace.name}
					disabled={workspace.disabled}
					onClick={() => {
						if (!workspace.disabled) {
							onChange?.(workspace.name);
						}
					}}
					sx={{
						opacity: workspace.disabled ? 0.5 : 1,
					}}
				>
					<ListItemAvatar>
						<Avatar src={workspace.avatar} sx={{ "--Avatar-size": "32px", opacity: workspace.disabled ? 0.5 : 1 }} variant="rounded" />
					</ListItemAvatar>
					{workspace.name}
				</MenuItem>
			))}
		</Menu>
	);
}
