"use client";

import type * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { DotsThreeIcon } from "@phosphor-icons/react/dist/ssr/DotsThree";
import { TrendDownIcon } from "@phosphor-icons/react/dist/ssr/TrendDown";
import { TrendUpIcon } from "@phosphor-icons/react/dist/ssr/TrendUp";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

import { NoSsr } from "@/components/core/no-ssr";
import { formatCurrency, formatPercentage } from "@/lib/format";
import type { Holding } from "@/types/portfolio";

export interface TokenCardProps {
	holding: Holding;
	data: number[];
}

export function TokenCard({ holding, data: dataRaw }: TokenCardProps): React.JSX.Element {
	const chartHeight = 100;
	const token = holding.token;
	const currentValue = holding.currentValue || (holding.currentPrice || holding.averagePrice) * holding.quantity;
	const profitLoss = holding.profitLoss || currentValue - holding.investedAmount;
	const profitLossPercentage =
		holding.profitLossPercentage || (holding.investedAmount > 0 ? (profitLoss / holding.investedAmount) * 100 : 0);
	const isPositive = profitLoss >= 0;
	const trend = isPositive ? "up" : "down";
	const diff = Math.abs(profitLossPercentage);

	const data = dataRaw.map((item, index) => ({ name: index, value: item }));
	const color = isPositive ? "var(--mui-palette-success-main)" : "var(--mui-palette-error-main)";

	return (
		<Card>
			<Stack direction="row" spacing={3} sx={{ alignItems: "flex-start", pt: 2, px: 2 }}>
				<Stack spacing={1} sx={{ flex: "1 1 auto" }}>
					<Typography color="text.secondary" variant="h6">
						<Typography color="text.primary" component="span" variant="inherit">
							{holding.quantity.toFixed(8)}
						</Typography>{" "}
						{token.symbol}
					</Typography>
					<Typography color="text.secondary" variant="body2">
						{formatCurrency(currentValue, "$", 2)}
					</Typography>
				</Stack>
				<IconButton>
					<DotsThreeIcon weight="bold" />
				</IconButton>
			</Stack>
			<Box sx={{ pt: 3 }}>
				<NoSsr fallback={<Box sx={{ height: `${chartHeight}px` }} />}>
					<ResponsiveContainer height={chartHeight} width="100%">
						<AreaChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
							<defs>
								<linearGradient id={`area-wallet-${token.symbol}`} x1="0" x2="0" y1="0" y2="1">
									<stop offset="0" stopColor={color} stopOpacity={0.1} />
									<stop offset="100%" stopColor={color} stopOpacity={0} />
								</linearGradient>
							</defs>
							<XAxis axisLine={false} dataKey="name" hide type="category" />
							<YAxis axisLine={false} hide type="number" />
							<Area
								animationDuration={300}
								dataKey="value"
								fill={`url(#area-wallet-${token.symbol})`}
								fillOpacity={1}
								name="Value"
								stroke={color}
								strokeWidth={2}
								type="monotone"
							/>
						</AreaChart>
					</ResponsiveContainer>
				</NoSsr>
			</Box>
			<Box sx={{ pb: 2, px: 2 }}>
				<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
					<Box
						component="img"
						src={token.logoUrl || "/assets/logo-btc.svg"}
						alt={token.symbol}
						sx={{ height: "auto", flex: "0 0 auto", width: "40px" }}
					/>
					<div>
						<Typography variant="subtitle2">{token.symbol}/USD</Typography>
						<Stack
							direction="row"
							spacing={0.5}
							sx={{
								alignItems: "center",
								color: trend === "up" ? "var(--mui-palette-success-main)" : "var(--mui-palette-error-main)",
							}}
						>
							{trend === "up" ? (
								<TrendUpIcon fontSize="var(--icon-fontSize-md)" />
							) : (
								<TrendDownIcon fontSize="var(--icon-fontSize-md)" />
							)}
							<Typography color="inherit" variant="body2">
								{formatPercentage(diff)}
							</Typography>
						</Stack>
					</div>
				</Stack>
			</Box>
		</Card>
	);
}

