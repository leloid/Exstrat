"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import LinearProgress from "@mui/material/LinearProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ChartLineIcon } from "@phosphor-icons/react/dist/ssr/ChartLine";
import { CoinsIcon } from "@phosphor-icons/react/dist/ssr/Coins";
import { CurrencyDollarIcon } from "@phosphor-icons/react/dist/ssr/CurrencyDollar";
import { TrendDownIcon } from "@phosphor-icons/react/dist/ssr/TrendDown";
import { TrendUpIcon } from "@phosphor-icons/react/dist/ssr/TrendUp";

import { formatCompactCurrency, formatPercentage } from "@/lib/format";
import { useSecretMode } from "@/hooks/use-secret-mode";

export interface QuickStatsProps {
	capitalInvesti: number;
	valeurActuelle: number;
	pnlAbsolu: number;
	pnlRelatif: number;
}

export function QuickStats({
	capitalInvesti,
	valeurActuelle,
	pnlAbsolu,
	pnlRelatif,
}: QuickStatsProps): React.JSX.Element {
	const { secretMode } = useSecretMode();
	const isPositive = pnlAbsolu >= 0;
	const returnPercentage = Math.abs(pnlRelatif);
	const healthPercentage = Math.min(100, Math.max(0, 50 + pnlRelatif)); // Scale return to 0-100% for health

	return (
		<Box>
			<Grid container spacing={{ xs: 2, sm: 3 }} sx={{ alignItems: "stretch" }}>
				{/* Current Value */}
				<Grid
					size={{
						lg: 3,
						md: 6,
						xs: 12,
					}}
				>
					<Card sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "visible" }}>
						<Stack direction="row" spacing={2} sx={{ alignItems: "center", p: { xs: 2, sm: 3 }, flex: "1 1 auto" }}>
							<Stack spacing={1} sx={{ flex: "1 1 auto", minWidth: 0 }}>
								<Typography color="text.secondary" variant="overline">
									Current Value
								</Typography>
								<Stack direction="row" spacing={1} sx={{ alignItems: "center", flexWrap: "wrap" }}>
									<Typography variant="h5" sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>{formatCompactCurrency(valeurActuelle, "$", 0, secretMode)}</Typography>
									<Chip
										color={isPositive ? "success" : "error"}
										label={formatPercentage(pnlRelatif)}
										size="small"
										variant="soft"
									/>
								</Stack>
							</Stack>
							<Avatar
								sx={{
									bgcolor: "var(--mui-palette-primary-main)",
									color: "var(--mui-palette-primary-contrastText)",
									height: { xs: "40px", sm: "48px" },
									width: { xs: "40px", sm: "48px" },
									flexShrink: 0,
								}}
							>
								<ChartLineIcon fontSize="var(--Icon-fontSize)" />
							</Avatar>
						</Stack>
					</Card>
				</Grid>

				{/* Invested Capital */}
				<Grid
					size={{
						lg: 3,
						md: 6,
						xs: 12,
					}}
				>
					<Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
						<Stack direction="row" spacing={2} sx={{ alignItems: "center", p: { xs: 2, sm: 3 }, flex: "1 1 auto" }}>
							<Stack spacing={1} sx={{ flex: "1 1 auto", minWidth: 0 }}>
								<Typography color="text.secondary" variant="overline">
									Invested Capital
								</Typography>
								<Typography variant="h5" sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>{formatCompactCurrency(capitalInvesti, "$", 0, secretMode)}</Typography>
							</Stack>
							<Avatar
								sx={{
									bgcolor: "var(--mui-palette-primary-main)",
									color: "var(--mui-palette-primary-contrastText)",
									height: { xs: "40px", sm: "48px" },
									width: { xs: "40px", sm: "48px" },
									flexShrink: 0,
								}}
							>
								<CurrencyDollarIcon fontSize="var(--Icon-fontSize)" />
							</Avatar>
						</Stack>
					</Card>
				</Grid>

				{/* Portfolio Health (based on return %) */}
				<Grid
					size={{
						lg: 3,
						md: 6,
						xs: 12,
					}}
				>
					<Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
						<Stack spacing={1} sx={{ p: { xs: 2, sm: 3 }, flex: "1 1 auto", justifyContent: "space-between" }}>
							<Typography color="text.secondary" variant="overline">
								Portfolio Health
							</Typography>
							<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
								<Typography variant="h5" sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>{formatPercentage(pnlRelatif)}</Typography>
								<LinearProgress
									color={isPositive ? "success" : "error"}
									sx={{ flex: "1 1 auto", minWidth: "60px" }}
									value={healthPercentage}
									variant="determinate"
								/>
							</Stack>
						</Stack>
					</Card>
				</Grid>

				{/* Profit / Loss */}
				<Grid
					size={{
						lg: 3,
						md: 6,
						xs: 12,
					}}
				>
					<Card
						sx={{
							height: "100%",
							display: "flex",
							flexDirection: "column",
							alignItems: "stretch",
							bgcolor: isPositive ? "var(--mui-palette-success-main)" : "var(--mui-palette-error-main)",
							color: "var(--mui-palette-success-contrastText)",
						}}
					>
						<Stack direction="row" spacing={2} sx={{ alignItems: "center", p: { xs: 2, sm: 3 }, flex: "1 1 auto" }}>
							<Stack spacing={1} sx={{ flex: "1 1 auto", minWidth: 0 }}>
								<Typography color="inherit" variant="overline">
									Profit / Loss
								</Typography>
								<Typography color="inherit" variant="h5" sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
									{isPositive ? "+" : ""}
									{formatCompactCurrency(pnlAbsolu, "$", 2, secretMode)}
								</Typography>
							</Stack>
							<Avatar
								sx={{
									bgcolor: "var(--mui-palette-success-contrastText)",
									color: isPositive ? "var(--mui-palette-success-main)" : "var(--mui-palette-error-main)",
									height: { xs: "40px", sm: "48px" },
									width: { xs: "40px", sm: "48px" },
									flexShrink: 0,
								}}
							>
								{isPositive ? (
									<TrendUpIcon fontSize="var(--Icon-fontSize)" />
								) : (
									<TrendDownIcon fontSize="var(--Icon-fontSize)" />
								)}
							</Avatar>
						</Stack>
					</Card>
				</Grid>
			</Grid>
		</Box>
	);
}

