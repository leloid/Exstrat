"use client";

import * as React from "react";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";

interface ConfirmModalProps {
	open: boolean;
	onClose: () => void;
	onConfirm: () => void;
	title: string;
	message: string;
	confirmText?: string;
	cancelText?: string;
}

export function ConfirmModal({
	open,
	onClose,
	onConfirm,
	title,
	message,
	confirmText = "Confirm",
	cancelText = "Cancel",
}: ConfirmModalProps): React.JSX.Element {
	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>
				<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
					<WarningIcon fontSize="var(--icon-fontSize-lg)" color="var(--mui-palette-warning-main)" />
					<Typography variant="h6">{title}</Typography>
				</Stack>
			</DialogTitle>
			<DialogContent>
				<Typography variant="body2" color="text.secondary">
					{message}
				</Typography>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>{cancelText}</Button>
				<Button onClick={onConfirm} variant="contained" color="primary">
					{confirmText}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

