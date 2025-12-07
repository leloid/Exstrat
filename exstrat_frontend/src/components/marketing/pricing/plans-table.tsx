"use client";

import * as React from "react";
import RouterLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Typography from "@mui/material/Typography";
import { ArrowLeftIcon } from "@phosphor-icons/react/dist/ssr/ArrowLeft";

import { paths } from "@/paths";
import { Plan } from "./plan";

export function PlansTable(): React.JSX.Element {
	const [billedAnnually, setBilledAnnually] = React.useState(true);

	return (
		<Box sx={{ bgcolor: "var(--mui-palette-background-level1)", py: { xs: "60px", sm: "120px" } }}>
			<Container maxWidth="lg">
				<Stack spacing={3}>
					<Box sx={{ display: "flex", justifyContent: "flex-start", mb: 2 }}>
						<Button
							component={RouterLink}
							href={paths.dashboard.overview}
							startIcon={<ArrowLeftIcon />}
							variant="outlined"
							sx={{ textTransform: "none" }}
						>
							Back to Dashboard
						</Button>
					</Box>
					<Stack spacing={2} sx={{ alignItems: "center" }}>
						<Typography sx={{ textAlign: "center" }} variant="h3">
							Start today. Boost up your services!
						</Typography>
						<Typography color="text.secondary" sx={{ textAlign: "center" }} variant="body1">
							Join 10,000+ developers &amp; designers using ExStrat to power modern crypto trading projects.
						</Typography>
						<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
							<Switch checked={billedAnnually} onChange={(e) => setBilledAnnually(e.target.checked)} />
							<Typography variant="body1">Billed annually</Typography>
							<Chip color="success" label="25% OFF" size="small" />
						</Stack>
					</Stack>
					<div>
						<Grid container spacing={3}>
							<Grid
								size={{
									md: 4,
									xs: 12,
								}}
							>
								<Plan
									action={<Button variant="outlined">Select</Button>}
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
									action={<Button variant="contained">Start free trial</Button>}
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
										<Button color="secondary" variant="contained">
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
					</div>
					<div>
						<Typography color="text.secondary" component="p" sx={{ textAlign: "center" }} variant="caption">
							30% of our income goes into Whale Charity
						</Typography>
					</div>
				</Stack>
			</Container>
		</Box>
	);
}

