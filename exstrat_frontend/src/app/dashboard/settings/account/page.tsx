"use client";

import * as React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { AccountDetails } from "@/components/dashboard/settings/account-details";
import { DeleteAccount } from "@/components/dashboard/settings/delete-account";
import { ThemeSwitch } from "@/components/dashboard/settings/theme-switch";

export default function Page(): React.JSX.Element {
	return (
		<Stack spacing={4}>
			<div>
				<Typography variant="h4">Account</Typography>
			</div>
			<Stack spacing={4}>
				<AccountDetails />
				<ThemeSwitch />
				<DeleteAccount />
			</Stack>
		</Stack>
	);
}

