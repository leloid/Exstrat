"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

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
						<Stack spacing={1} sx={{ p: { xs: 2, sm: 3 }, flex: "1 1 auto" }}>
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
						<Stack spacing={1} sx={{ p: { xs: 2, sm: 3 }, flex: "1 1 auto" }}>
							<Typography color="text.secondary" variant="overline">
								Invested Capital
							</Typography>
							<Typography variant="h5" sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>{formatCompactCurrency(capitalInvesti, "$", 0, secretMode)}</Typography>
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
						<Stack spacing={1} sx={{ p: { xs: 2, sm: 3 }, flex: "1 1 auto" }}>
							<Typography color="inherit" variant="overline">
								Profit / Loss
							</Typography>
							<Typography color="inherit" variant="h5" sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
								{isPositive ? "+" : ""}
								{formatCompactCurrency(pnlAbsolu, "$", 2, secretMode)}
							</Typography>
							<Typography color="inherit" variant="body1" sx={{ fontSize: { xs: "0.875rem", sm: "1rem" }, opacity: 0.9 }}>
								{formatPercentage(pnlRelatif)}
							</Typography>
						</Stack>
					</Card>
				</Grid>
			</Grid>
		</Box>
	);
}

