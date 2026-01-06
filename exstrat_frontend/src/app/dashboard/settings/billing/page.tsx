"use client";

import * as React from "react";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { BillingPlan } from "@/components/dashboard/settings/billing-plan";

export default function Page(): React.JSX.Element {
	return (
		<Stack spacing={4}>
			<div>
				<Typography variant="h4">Billing & Plans</Typography>
				<Typography color="text.secondary" variant="body2">
					Manage your subscription and billing information
				</Typography>
			</div>
			<BillingPlan />
		</Stack>
	);
}

