"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";

import { Plan } from "@/components/marketing/pricing/plan";

export function BillingPlan(): React.JSX.Element {
	const [billedAnnually, setBilledAnnually] = React.useState(true);

	return (
		<Card sx={{ p: 3 }}>
			<Stack spacing={4}>
				<div>
					<Typography variant="h6">Billing & Plan</Typography>
					<Typography color="text.secondary" variant="body2">
						Manage your subscription and billing information
					</Typography>
				</div>
				<Stack spacing={3}>
					<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "center" }}>
						<Typography variant="body2">Billed monthly</Typography>
						<Switch checked={billedAnnually} onChange={(e) => setBilledAnnually(e.target.checked)} />
						<Typography variant="body2">Billed annually</Typography>
						<Chip color="success" label="25% OFF" size="small" />
					</Stack>
					<Grid container spacing={3}>
						<Grid
							size={{
								md: 4,
								xs: 12,
							}}
						>
							<Plan
								action={<Button variant="outlined" fullWidth>Select</Button>}
								currency="USD"
								description="To familiarize yourself with our tools."
								features={["Create strategies", "Chat support", "Email alerts"]}
								id="startup"
								name="Startup"
								price={0}
							/>
						</Grid>
						<Grid
							size={{
								md: 4,
								xs: 12,
							}}
						>
							<Plan
								action={<Button variant="contained" fullWidth>Start free trial</Button>}
								currency="USD"
								description="Best for small teams with up to 10 members."
								features={["All previous", "Advanced reporting", "Data history", "Unlimited wallets"]}
								id="standard"
								name="Standard"
								popular
								price={billedAnnually ? 11.24 : 14.99}
							/>
						</Grid>
						<Grid
							size={{
								md: 4,
								xs: 12,
							}}
						>
							<Plan
								action={
									<Button color="secondary" variant="contained" fullWidth>
										Contact us
									</Button>
								}
								currency="USD"
								description="For larger teams managing multiple projects."
								features={[
									"All previous",
									"Unlimited strategies",
									"Analytics platform",
									"Public API access",
									"Advanced forecast alerts",
								]}
								id="business"
								name="Business"
								price={billedAnnually ? 22.49 : 29.99}
							/>
						</Grid>
					</Grid>
					<Box sx={{ textAlign: "center" }}>
						<Typography color="text.secondary" component="p" variant="caption">
							30% of our income goes into Whale Charity
						</Typography>
					</Box>
				</Stack>
			</Stack>
		</Card>
	);
}

