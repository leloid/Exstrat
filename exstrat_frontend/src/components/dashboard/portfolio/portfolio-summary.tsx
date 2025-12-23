"use client";

import type * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CurrencyDollarIcon } from "@phosphor-icons/react/dist/ssr/CurrencyDollar";
import { ChartLineIcon } from "@phosphor-icons/react/dist/ssr/ChartLine";
import { TrendDownIcon } from "@phosphor-icons/react/dist/ssr/TrendDown";
import { TrendUpIcon } from "@phosphor-icons/react/dist/ssr/TrendUp";
import { WalletIcon } from "@phosphor-icons/react/dist/ssr/Wallet";

import { formatCompactCurrency, formatPercentage } from "@/lib/format";
import { useSecretMode } from "@/hooks/use-secret-mode";

export interface PortfolioSummaryProps {
	capitalInvesti: number;
	valeurActuelle: number;
	pnlAbsolu: number;
	pnlRelatif: number;
}

export function PortfolioSummary({
	capitalInvesti,
	valeurActuelle,
	pnlAbsolu,
	pnlRelatif,
}: PortfolioSummaryProps): React.JSX.Element {
	const { secretMode } = useSecretMode();
	const isPositive = pnlAbsolu >= 0;

	return (
		<Box
			sx={{
				display: "grid",
				gap: 3,
				gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
			}}
		>
			{/* Capital Investi */}
			<Card>
				<CardContent>
					<Stack direction="row" spacing={3} sx={{ alignItems: "center" }}>
						<Avatar
							sx={{
								"--Avatar-size": "48px",
								bgcolor: "var(--mui-palette-background-paper)",
								boxShadow: "var(--mui-shadows-8)",
								color: "var(--mui-palette-text-primary)",
							}}
						>
							<CurrencyDollarIcon fontSize="var(--icon-fontSize-lg)" />
						</Avatar>
						<div>
							<Typography color="text.secondary" variant="body1">
								Invested Capital
							</Typography>
							<Typography variant="h3">{formatCompactCurrency(capitalInvesti, "$", 2, secretMode)}</Typography>
						</div>
					</Stack>
				</CardContent>
			</Card>

			{/* Valeur Actuelle */}
			<Card>
				<CardContent>
					<Stack direction="row" spacing={3} sx={{ alignItems: "center" }}>
						<Avatar
							sx={{
								"--Avatar-size": "48px",
								bgcolor: "var(--mui-palette-background-paper)",
								boxShadow: "var(--mui-shadows-8)",
								color: "var(--mui-palette-text-primary)",
							}}
						>
							<ChartLineIcon fontSize="var(--icon-fontSize-lg)" />
						</Avatar>
						<div>
							<Typography color="text.secondary" variant="body1">
								Current Value
							</Typography>
							<Typography variant="h3">{formatCompactCurrency(valeurActuelle, "$", 2, secretMode)}</Typography>
						</div>
					</Stack>
				</CardContent>
			</Card>

			{/* PNL Absolu */}
			<Card>
				<CardContent>
					<Stack direction="row" spacing={3} sx={{ alignItems: "center" }}>
						<Avatar
							sx={{
								"--Avatar-size": "48px",
								bgcolor: isPositive ? "var(--mui-palette-success-50)" : "var(--mui-palette-error-50)",
								boxShadow: "var(--mui-shadows-8)",
								color: isPositive ? "var(--mui-palette-success-main)" : "var(--mui-palette-error-main)",
							}}
						>
							{isPositive ? (
								<TrendUpIcon fontSize="var(--icon-fontSize-lg)" />
							) : (
								<TrendDownIcon fontSize="var(--icon-fontSize-lg)" />
							)}
						</Avatar>
						<div>
							<Typography color="text.secondary" variant="body1">
								Profit / Loss
							</Typography>
							<Typography
								variant="h3"
								sx={{
									color: isPositive ? "var(--mui-palette-success-main)" : "var(--mui-palette-error-main)",
								}}
							>
								{isPositive ? "+" : ""}
								{formatCompactCurrency(pnlAbsolu, "$", 2, secretMode)}
							</Typography>
						</div>
					</Stack>
				</CardContent>
				<Divider />
				<Box sx={{ p: "16px" }}>
					<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
						<Box
							sx={{
								alignItems: "center",
								color: isPositive ? "var(--mui-palette-success-main)" : "var(--mui-palette-error-main)",
								display: "flex",
								justifyContent: "center",
							}}
						>
							{isPositive ? (
								<TrendUpIcon fontSize="var(--icon-fontSize-md)" />
							) : (
								<TrendDownIcon fontSize="var(--icon-fontSize-md)" />
							)}
						</Box>
						<Typography color="text.secondary" variant="body2">
							<Typography
								color={isPositive ? "success.main" : "error.main"}
								component="span"
								variant="subtitle2"
							>
								{formatPercentage(pnlRelatif)}
							</Typography>{" "}
							return
						</Typography>
					</Stack>
				</Box>
			</Card>

			{/* PNL Relatif */}
			<Card>
				<CardContent>
					<Stack direction="row" spacing={3} sx={{ alignItems: "center" }}>
						<Avatar
							sx={{
								"--Avatar-size": "48px",
								bgcolor: isPositive ? "var(--mui-palette-success-50)" : "var(--mui-palette-error-50)",
								boxShadow: "var(--mui-shadows-8)",
								color: isPositive ? "var(--mui-palette-success-main)" : "var(--mui-palette-error-main)",
							}}
						>
							<WalletIcon fontSize="var(--icon-fontSize-lg)" />
						</Avatar>
						<div>
							<Typography color="text.secondary" variant="body1">
								Return %
							</Typography>
							<Typography
								variant="h3"
								sx={{
									color: isPositive ? "var(--mui-palette-success-main)" : "var(--mui-palette-error-main)",
								}}
							>
								{isPositive ? "+" : ""}
								{formatPercentage(pnlRelatif)}
							</Typography>
						</div>
					</Stack>
				</CardContent>
			</Card>
		</Box>
	);
}

