"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { WalletIcon } from "@phosphor-icons/react/dist/ssr/Wallet";
import { Cell, Pie, PieChart, Tooltip } from "recharts";

import { NoSsr } from "@/components/core/no-ssr";
import { formatCurrency, formatQuantity } from "@/lib/format";
import { getTokenLogoUrl } from "@/lib/utils";
import type { Holding } from "@/types/portfolio";
import { useSecretMode } from "@/hooks/use-secret-mode";

export interface TokenDistributionProps {
	holdings: Holding[];
}

export function TokenDistribution({ holdings }: TokenDistributionProps): React.JSX.Element {
	const { secretMode } = useSecretMode();
	const chartSize = 200;
	const chartThickness = 30;

	// Calculate distribution
	const distribution = React.useMemo(() => {
		if (!holdings || holdings.length === 0) return [];

		const totalValue = holdings.reduce((sum, h) => {
			const currentValue = h.currentValue || (h.currentPrice || h.averagePrice) * h.quantity;
			return sum + currentValue;
		}, 0);

		if (totalValue === 0) return [];

		// Group by token and calculate total value and quantity per token
		const tokenMap = new Map<string, { symbol: string; name: string; value: number; quantity: number; color: string }>();

		holdings.forEach((holding) => {
			const currentValue = holding.currentValue || (holding.currentPrice || holding.averagePrice) * holding.quantity;
			const tokenId = holding.token.id;
			const existing = tokenMap.get(tokenId);

			if (existing) {
				tokenMap.set(tokenId, {
					...existing,
					value: existing.value + currentValue,
					quantity: existing.quantity + holding.quantity,
				});
			} else {
				// Generate color based on token symbol
				const colors = [
					"var(--mui-palette-primary-main)",
					"var(--mui-palette-success-main)",
					"var(--mui-palette-warning-main)",
					"var(--mui-palette-error-main)",
					"var(--mui-palette-info-main)",
				];
				const colorIndex = tokenMap.size % colors.length;

				tokenMap.set(tokenId, {
					symbol: holding.token.symbol,
					name: holding.token.name || holding.token.symbol,
					value: currentValue,
					quantity: holding.quantity,
					color: colors[colorIndex],
				});
			}
		});

		// Sort by value descending and take top 6, group rest as "Others"
		const sorted = Array.from(tokenMap.values())
			.sort((a, b) => b.value - a.value)
			.slice(0, 6);

		const othersData = Array.from(tokenMap.values()).slice(6);
		const othersValue = othersData.reduce((sum, token) => sum + token.value, 0);
		const othersQuantity = othersData.reduce((sum, token) => sum + token.quantity, 0);

		if (othersValue > 0) {
			sorted.push({
				symbol: "Others",
				name: "Others",
				value: othersValue,
				quantity: othersQuantity,
				color: "var(--mui-palette-text-secondary)",
			});
		}

		return sorted;
	}, [holdings]);

	const total = distribution.reduce((acc, curr) => acc + curr.value, 0);

	if (distribution.length === 0) {
		return (
			<Card>
				<CardHeader
					avatar={
						<Avatar>
							<WalletIcon fontSize="var(--Icon-fontSize)" />
						</Avatar>
					}
					subheader="Token distribution across your portfolio"
					title="Token Distribution"
				/>
				<CardContent>
					<Box sx={{ py: 4, textAlign: "center" }}>
						<Typography color="text.secondary" variant="body2">
							No tokens to display
						</Typography>
					</Box>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader
				avatar={
					<Avatar>
						<WalletIcon fontSize="var(--Icon-fontSize)" />
					</Avatar>
				}
				subheader="Token distribution across your portfolio"
				title="Token Distribution"
			/>
			<CardContent>
				<Stack direction="row" spacing={3} sx={{ alignItems: "center", flexWrap: "wrap" }}>
					<NoSsr fallback={<Box sx={{ height: `${chartSize}px`, width: `${chartSize}px` }} />}>
						<PieChart height={chartSize} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} width={chartSize}>
							<Pie
								animationDuration={300}
								cx={chartSize / 2}
								cy={chartSize / 2}
								data={distribution}
								dataKey="value"
								innerRadius={chartSize / 2 - chartThickness}
								nameKey="symbol"
								outerRadius={chartSize / 2}
								strokeWidth={0}
							>
								{distribution.map(
									(entry): React.JSX.Element => (
										<Cell fill={entry.color} key={entry.symbol} />
									)
								)}
							</Pie>
							<Tooltip animationDuration={50} content={<TooltipContent />} />
						</PieChart>
					</NoSsr>
					<Stack spacing={3} sx={{ flex: "1 1 auto" }}>
						{!secretMode && (
							<Stack spacing={1}>
								<Typography color="text.secondary" variant="overline">
									Total balance
								</Typography>
								<Typography variant="h4">{formatCurrency(total, "$", 2)}</Typography>
							</Stack>
						)}
						<Stack spacing={1}>
							<Typography color="text.secondary" variant="overline">
								Token allocation
							</Typography>
							<Stack component="ul" spacing={2} sx={{ listStyle: "none", m: 0, p: 0 }}>
								{distribution.map((entry) => {
									const percentage = total > 0 ? (entry.value / total) * 100 : 0;
									return (
										<Stack component="li" direction="row" key={entry.symbol} spacing={1} sx={{ alignItems: "center" }}>
											<Box sx={{ bgcolor: entry.color, borderRadius: "2px", height: "4px", width: "16px" }} />
											<Stack direction="row" spacing={1} sx={{ alignItems: "center", flex: "1 1 auto" }}>
												{entry.symbol !== "Others" && (
													<Avatar
														src={getTokenLogoUrl(entry.symbol, undefined) || undefined}
														sx={{ width: 16, height: 16 }}
													>
														{entry.symbol.charAt(0)}
													</Avatar>
												)}
												<Typography sx={{ flex: "1 1 auto" }} variant="subtitle2">
													{entry.name}
												</Typography>
											</Stack>
											<Typography color="text.secondary" variant="body2">
												{percentage.toFixed(1)}%
											</Typography>
											<Typography color="text.secondary" variant="body2" sx={{ minWidth: "80px", textAlign: "right" }}>
												{formatQuantity(entry.quantity, 8, secretMode)}
											</Typography>
											<Typography color="text.secondary" variant="body2" sx={{ minWidth: "90px", textAlign: "right" }}>
												{formatCurrency(entry.value, "$", 2, secretMode)}
											</Typography>
										</Stack>
									);
								})}
							</Stack>
						</Stack>
					</Stack>
				</Stack>
			</CardContent>
		</Card>
	);
}

interface TooltipContentProps {
	active?: boolean;
	payload?: { name: string; payload: { fill: string; name: string; value: number }; value: number }[];
	label?: string;
}

function TooltipContent({ active, payload }: TooltipContentProps): React.JSX.Element | null {
	const { secretMode } = useSecretMode();
	
	if (!active || !payload || payload.length === 0) {
		return null;
	}

	const entry = payload[0];
	if (!entry) return null;

	return (
		<Box
			sx={{
				border: "1px solid var(--mui-palette-divider)",
				boxShadow: "var(--mui-shadows-16)",
				p: 1.5,
				bgcolor: "var(--mui-palette-background-paper)",
				borderRadius: 1,
			}}
		>
			<Stack spacing={1}>
				<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
					<Box sx={{ bgcolor: entry.payload.fill, borderRadius: "2px", height: "8px", width: "8px" }} />
					<Typography sx={{ whiteSpace: "nowrap" }} variant="body2">
						{entry.payload.name}
					</Typography>
				</Stack>
				<Typography color="text.secondary" variant="body2">
					{formatCurrency(entry.value, "$", 2, secretMode)}
				</Typography>
			</Stack>
		</Box>
	);
}

