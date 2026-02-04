"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";
import Chip from "@mui/material/Chip";

export function DeleteAccount(): React.JSX.Element {
	const handleDelete = React.useCallback(() => {
		// TODO: Implement account deletion
		console.log("Delete account clicked - Coming soon");
	}, []);

	return (
		<Card 
			sx={{ 
				opacity: 0.6, 
				cursor: "pointer",
				"&:hover": {
					opacity: 0.8,
					boxShadow: 2,
				},
			}}
			onClick={handleDelete}
		>
			<CardHeader
				avatar={
					<Avatar>
						<WarningIcon fontSize="var(--Icon-fontSize)" />
					</Avatar>
				}
				title={
					<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
						<Typography variant="h6">Delete account</Typography>
						<Chip label="Coming soon" size="small" color="primary" />
					</Stack>
				}
			/>
			<CardContent>
				<Stack spacing={3} sx={{ alignItems: "flex-start" }}>
					<Typography variant="subtitle1">
						Delete your account and all of your source data. This is irreversible.
					</Typography>
					<Button color="error" variant="outlined" disabled onClick={handleDelete}>
						Delete account
					</Button>
				</Stack>
			</CardContent>
		</Card>
	);
}

