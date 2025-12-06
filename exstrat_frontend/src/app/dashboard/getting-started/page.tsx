import type * as React from "react";
import type { Metadata } from "next";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";

import { appConfig } from "@/config/app";
import { paths } from "@/paths";

export const metadata = { title: `Getting Started | Dashboard | ${appConfig.name}` } satisfies Metadata;

export default function Page(): React.JSX.Element {
	return (
		<Box
			sx={{
				maxWidth: "var(--Content-maxWidth)",
				m: "var(--Content-margin)",
				p: "var(--Content-padding)",
				width: "var(--Content-width)",
			}}
		>
			<Stack spacing={4}>
				<Box>
					<Typography variant="h4" sx={{ mb: 1 }}>
						Getting Started
					</Typography>
					<Typography color="text.secondary" variant="body1">
						Welcome to ExStrat! Follow this guide to get started with managing your crypto portfolio.
					</Typography>
				</Box>

				<Stack spacing={3}>
					{/* Step 1 */}
					<Card>
						<CardHeader
							avatar={
								<Box
									sx={{
										alignItems: "center",
										bgcolor: "var(--mui-palette-primary-main)",
										borderRadius: "50%",
										color: "var(--mui-palette-primary-contrastText)",
										display: "flex",
										height: "40px",
										justifyContent: "center",
										width: "40px",
									}}
								>
									<Typography variant="h6">1</Typography>
								</Box>
							}
							title="Create Your Portfolio"
							subheader="Start by creating your first portfolio to organize your investments"
						/>
						<CardContent>
							<Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
								A portfolio helps you group and track your crypto investments. You can create multiple portfolios for
								different strategies or accounts.
							</Typography>
							<Button component="a" href={paths.dashboard.investissements} startIcon={<ArrowRightIcon />} variant="contained">
								Go to Investissements
							</Button>
						</CardContent>
					</Card>

					{/* Step 2 */}
					<Card>
						<CardHeader
							avatar={
								<Box
									sx={{
										alignItems: "center",
										bgcolor: "var(--mui-palette-primary-main)",
										borderRadius: "50%",
										color: "var(--mui-palette-primary-contrastText)",
										display: "flex",
										height: "40px",
										justifyContent: "center",
										width: "40px",
									}}
								>
									<Typography variant="h6">2</Typography>
								</Box>
							}
							title="Add Your Investments"
							subheader="Record your crypto transactions and holdings"
						/>
						<CardContent>
							<Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
								Add your existing crypto holdings or new transactions. The system will automatically calculate your
								profit and loss based on current market prices.
							</Typography>
							<Button component="a" href={paths.dashboard.investissements} startIcon={<ArrowRightIcon />} variant="outlined">
								Add Transactions
							</Button>
						</CardContent>
					</Card>

					{/* Step 3 */}
					<Card>
						<CardHeader
							avatar={
								<Box
									sx={{
										alignItems: "center",
										bgcolor: "var(--mui-palette-primary-main)",
										borderRadius: "50%",
										color: "var(--mui-palette-primary-contrastText)",
										display: "flex",
										height: "40px",
										justifyContent: "center",
										width: "40px",
									}}
								>
									<Typography variant="h6">3</Typography>
								</Box>
							}
							title="Create Trading Strategies"
							subheader="Set up profit-taking strategies for your tokens"
						/>
						<CardContent>
							<Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
								Define when and how much to sell your tokens at different price targets. Create custom strategies or
								use templates to automate your trading decisions.
							</Typography>
							<Button component="a" href={paths.dashboard.strategies} startIcon={<ArrowRightIcon />} variant="outlined">
								Create Strategy
							</Button>
						</CardContent>
					</Card>

					{/* Step 4 */}
					<Card>
						<CardHeader
							avatar={
								<Box
									sx={{
										alignItems: "center",
										bgcolor: "var(--mui-palette-primary-main)",
										borderRadius: "50%",
										color: "var(--mui-palette-primary-contrastText)",
										display: "flex",
										height: "40px",
										justifyContent: "center",
										width: "40px",
									}}
								>
									<Typography variant="h6">4</Typography>
								</Box>
							}
							title="View Forecasts"
							subheader="Analyze potential returns with your strategies"
						/>
						<CardContent>
							<Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
								Generate forecasts to see how your portfolio would perform with different strategies applied. Compare
								scenarios and optimize your approach.
							</Typography>
							<Button component="a" href={paths.dashboard.prevision} startIcon={<ArrowRightIcon />} variant="outlined">
								View Forecasts
							</Button>
						</CardContent>
					</Card>

					{/* Step 5 */}
					<Card>
						<CardHeader
							avatar={
								<Box
									sx={{
										alignItems: "center",
										bgcolor: "var(--mui-palette-primary-main)",
										borderRadius: "50%",
										color: "var(--mui-palette-primary-contrastText)",
										display: "flex",
										height: "40px",
										justifyContent: "center",
										width: "40px",
									}}
								>
									<Typography variant="h6">5</Typography>
								</Box>
							}
							title="Configure Alerts"
							subheader="Set up notifications for important events"
						/>
						<CardContent>
							<Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
								Configure alerts to be notified when your price targets are reached or when important events occur in
								your portfolio.
							</Typography>
							<Button component="a" href={paths.dashboard.configuration} startIcon={<ArrowRightIcon />} variant="outlined">
								Configure Alerts
							</Button>
						</CardContent>
					</Card>
				</Stack>

				{/* Quick Tips */}
				<Card>
					<CardHeader title="Quick Tips" />
					<CardContent>
						<Stack spacing={2}>
							<Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
								<CheckCircleIcon color="var(--mui-palette-success-main)" fontSize="var(--icon-fontSize-md)" />
								<Box>
									<Typography variant="subtitle2">Keep your portfolio updated</Typography>
									<Typography color="text.secondary" variant="body2">
										Regularly update your transactions to get accurate profit and loss calculations.
									</Typography>
								</Box>
							</Stack>
							<Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
								<CheckCircleIcon color="var(--mui-palette-success-main)" fontSize="var(--icon-fontSize-md)" />
								<Box>
									<Typography variant="subtitle2">Use multiple portfolios</Typography>
									<Typography color="text.secondary" variant="body2">
										Create separate portfolios for different strategies or accounts to better organize your
										investments.
									</Typography>
								</Box>
							</Stack>
							<Stack direction="row" spacing={2} sx={{ alignItems: "flex-start" }}>
								<CheckCircleIcon color="var(--mui-palette-success-main)" fontSize="var(--icon-fontSize-md)" />
								<Box>
									<Typography variant="subtitle2">Test strategies with forecasts</Typography>
									<Typography color="text.secondary" variant="body2">
										Before applying a strategy, use the forecast feature to see potential outcomes.
									</Typography>
								</Box>
							</Stack>
						</Stack>
					</CardContent>
				</Card>
			</Stack>
		</Box>
	);
}

