"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { ChartLineIcon } from "@phosphor-icons/react/dist/ssr/ChartLine";
import { TrendUpIcon } from "@phosphor-icons/react/dist/ssr/TrendUp";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { NoSsr } from "@/components/core/no-ssr";
import { formatCurrency, formatPercentage } from "@/lib/format";
import type { Holding } from "@/types/portfolio";
import { useSecretMode } from "@/hooks/use-secret-mode";

export interface GainsLossesChartProps {
	holdings: Holding[];
}

type ChartType = "pnl" | "valuation";

export function GainsLossesChart({ holdings }: GainsLossesChartProps): React.JSX.Element {
	const { secretMode } = useSecretMode();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
	const isTablet = useMediaQuery(theme.breakpoints.between("sm", "md"));
	const chartHeight = isMobile ? 250 : isTablet ? 300 : 350;
	const [chartType, setChartType] = React.useState<ChartType>("pnl");

	// Prepare data for PnL chart
	const pnlData = React.useMemo(() => {
		const data = holdings
			.map((holding) => {
				// IMPORTANT: Utiliser currentValue du backend qui est calculé avec currentPrice (prix actuel du marché)
				const currentValue = holding.currentValue || 0;
				const pnl = currentValue - holding.investedAmount;
				const pnlPercentage = holding.investedAmount > 0 ? (pnl / holding.investedAmount) * 100 : 0;

				return {
					symbol: holding.token.symbol,
					pnlPercentage,
					pnl,
					currentValue,
					investedAmount: holding.investedAmount,
					color: pnlPercentage >= 0 ? "var(--mui-palette-success-main)" : "var(--mui-palette-error-main)",
				};
			})
			.sort((a, b) => {
				// Sort by absolute value (largest first), then by sign (positive first for same absolute value)
				const absA = Math.abs(a.pnl);
				const absB = Math.abs(b.pnl);
				if (absB !== absA) {
					return absB - absA; // Largest absolute values first
				}
				return b.pnl - a.pnl; // If same absolute value, positive first
			});
		
		// Calculate domain with minimum range to ensure small values are visible
		const pnlValues = data.map(d => d.pnl);
		const maxPnL = Math.max(...pnlValues, 0);
		const minPnL = Math.min(...pnlValues, 0);
		const range = maxPnL - minPnL;
		
		// If range is too large compared to small values, we'll use a custom domain
		// For now, we'll handle this in the shape function
		
		return data;
	}, [holdings]);

	// Prepare data for Valuation chart
	const valuationData = React.useMemo(() => {
		return holdings
			.map((holding) => {
				// IMPORTANT: Utiliser currentValue du backend qui est calculé avec currentPrice (prix actuel du marché)
				const currentValue = holding.currentValue || 0;

				return {
					symbol: holding.token.symbol,
					valAchat: holding.investedAmount,
					valMarche: currentValue,
				};
			})
			.sort((a, b) => b.valMarche - a.valMarche);
	}, [holdings]);

	// Calculate stats for PnL view
	const pnlStats = React.useMemo(() => {
		if (pnlData.length === 0) {
			return {
				totalPnL: 0,
				totalPnLPercentage: 0,
				bestGain: null as { symbol: string; percentage: number; amount: number } | null,
				worstLoss: null as { symbol: string; percentage: number; amount: number } | null,
			};
		}

		const totalPnL = pnlData.reduce((sum, item) => sum + item.pnl, 0);
		const totalInvested = pnlData.reduce((sum, item) => sum + item.investedAmount, 0);
		const totalPnLPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

		const gains = pnlData.filter((item) => item.pnlPercentage >= 0);
		const losses = pnlData.filter((item) => item.pnlPercentage < 0);

		const bestGain = gains.length > 0 ? gains[0] : null;
		const worstLoss = losses.length > 0 ? losses[losses.length - 1] : null;

		return {
			totalPnL,
			totalPnLPercentage,
			bestGain: bestGain
				? {
						symbol: bestGain.symbol,
						percentage: bestGain.pnlPercentage,
						amount: bestGain.pnl,
					}
				: null,
			worstLoss: worstLoss
				? {
						symbol: worstLoss.symbol,
						percentage: worstLoss.pnlPercentage,
						amount: worstLoss.pnl,
					}
				: null,
		};
	}, [pnlData]);

	// Calculate stats for Valuation view
	const valuationStats = React.useMemo(() => {
		if (valuationData.length === 0) {
			return {
				totalInvested: 0,
				totalMarketValue: 0,
				topToken: null as { symbol: string; value: number } | null,
			};
		}

		const totalInvested = valuationData.reduce((sum, item) => sum + item.valAchat, 0);
		const totalMarketValue = valuationData.reduce((sum, item) => sum + item.valMarche, 0);
		const topToken = valuationData.length > 0 ? { symbol: valuationData[0].symbol, value: valuationData[0].valMarche } : null;

		return {
			totalInvested,
			totalMarketValue,
			topToken,
		};
	}, [valuationData]);

	const CustomTooltip = ({ active, payload, label }: any) => {
		if (!active || !payload || payload.length === 0) return null;

		if (chartType === "pnl" && payload[0]?.payload) {
			const data = payload[0].payload;
			return (
				<Paper sx={{ border: "1px solid var(--mui-palette-divider)", boxShadow: "var(--mui-shadows-16)", p: 1 }}>
					<Stack spacing={1}>
						<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
							{label}
						</Typography>
						<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", minWidth: "180px" }}>
							<Typography variant="caption" color="text.secondary">
								Gain/Loss
							</Typography>
							<Typography variant="body2" sx={{ fontWeight: 600, color: data.pnlPercentage >= 0 ? "success.main" : "error.main" }}>
								{formatPercentage(data.pnlPercentage)}
							</Typography>
						</Stack>
						{!secretMode && (
							<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
								<Typography variant="caption" color="text.secondary">
									Amount
								</Typography>
								<Typography variant="body2" sx={{ fontWeight: 600, color: data.pnl >= 0 ? "success.main" : "error.main" }}>
									{data.pnl >= 0 ? "+" : ""}
									{formatCurrency(data.pnl, "$", 2)}
								</Typography>
							</Stack>
						)}
					</Stack>
				</Paper>
			);
		}

		// Tooltip for valuation chart
		return (
			<Paper sx={{ border: "1px solid var(--mui-palette-divider)", boxShadow: "var(--mui-shadows-16)", p: 1 }}>
				<Stack spacing={1}>
					<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
						{label}
					</Typography>
					{payload.map((entry: any, index: number) => (
						<Stack key={index} direction="row" spacing={2} sx={{ justifyContent: "space-between", minWidth: "180px" }}>
							<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
								<Box
									sx={{
										width: 8,
										height: 8,
										borderRadius: "50%",
										bgcolor: entry.fill,
									}}
								/>
								<Typography variant="caption" color="text.secondary">
									{entry.name}
								</Typography>
							</Stack>
							{!secretMode && (
								<Typography variant="body2" sx={{ fontWeight: 600 }}>
									{formatCurrency(entry.value, "$", 2)}
								</Typography>
							)}
						</Stack>
					))}
				</Stack>
			</Paper>
		);
	};

	if (holdings.length === 0) {
		return (
			<Card>
				<CardHeader
					title="Gains and Losses per token"
					subheader="Performance of each token in percentage"
				/>
				<CardContent>
					<Box sx={{ py: 4, textAlign: "center" }}>
						<Typography color="text.secondary" variant="body2">
							No data available
						</Typography>
					</Box>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader
				title={chartType === "valuation" ? "Asset Valuation" : "Gains and Losses per token"}
				action={
					<ToggleButtonGroup
						color="primary"
						exclusive
						onChange={(_, newValue) => {
							if (newValue !== null) {
								setChartType(newValue);
							}
						}}
						size="small"
						value={chartType}
					>
						<ToggleButton value="pnl">
							<Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
								<TrendUpIcon fontSize="var(--icon-fontSize-md)" />
								<Typography variant="body2">Gains/Losses</Typography>
							</Stack>
						</ToggleButton>
						<ToggleButton value="valuation">
							<Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
								<ChartLineIcon fontSize="var(--icon-fontSize-md)" />
								<Typography variant="body2">Valuation</Typography>
							</Stack>
						</ToggleButton>
					</ToggleButtonGroup>
				}
			/>
			<CardContent>
				<Stack direction={{ xs: "column", sm: "row" }} spacing={3}>
					{/* Stats Section */}
					<Stack spacing={3} sx={{ flex: "0 0 auto", justifyContent: "space-between", width: { xs: "100%", sm: "240px" } }}>
						{chartType === "pnl" ? (
							<>
								<Stack spacing={2}>
									<Typography color={pnlStats.totalPnLPercentage >= 0 ? "success.main" : "error.main"} variant="h2">
										{secretMode ? "***" : formatPercentage(pnlStats.totalPnLPercentage)}
									</Typography>
									<Typography color="text.secondary">
										total portfolio performance with{" "}
										<Typography color="text.primary" component="span" sx={{ fontWeight: 600 }}>
											{secretMode ? "***" : formatCurrency(Math.abs(pnlStats.totalPnL), "$", 0)}
										</Typography>{" "}
										{pnlStats.totalPnL >= 0 ? "gained" : "lost"}
									</Typography>
								</Stack>
								<Box>
									{pnlStats.bestGain && (
										<Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
											<Typography color="success.main" component="span" variant="subtitle2" sx={{ fontWeight: 600 }}>
												{pnlStats.bestGain.symbol}
											</Typography>{" "}
											leads with {formatPercentage(pnlStats.bestGain.percentage)} gain
										</Typography>
									)}
									{pnlStats.worstLoss && (
										<Typography color="text.secondary" variant="body2">
											<Typography color="error.main" component="span" variant="subtitle2" sx={{ fontWeight: 600 }}>
												{pnlStats.worstLoss.symbol}
											</Typography>{" "}
											down by {formatPercentage(pnlStats.worstLoss.percentage)}
										</Typography>
									)}
								</Box>
							</>
						) : (
							<>
								<Stack spacing={2}>
									<Typography color="primary.main" variant="h2">
										{secretMode ? "***" : formatCurrency(valuationStats.totalMarketValue, "$", 0)}
									</Typography>
									<Typography color="text.secondary">
										total market value from{" "}
										<Typography color="text.primary" component="span" sx={{ fontWeight: 600 }}>
											{secretMode ? "***" : formatCurrency(valuationStats.totalInvested, "$", 0)}
										</Typography>{" "}
										invested
									</Typography>
								</Stack>
								<Box>
									{valuationStats.topToken && (
										<Typography color="text.secondary" variant="body2">
											<Typography color="primary.main" component="span" variant="subtitle2" sx={{ fontWeight: 600 }}>
												{valuationStats.topToken.symbol}
											</Typography>{" "}
											is your top holding with {secretMode ? "***" : formatCurrency(valuationStats.topToken.value, "$", 0)} value
										</Typography>
									)}
								</Box>
							</>
						)}
					</Stack>

					{/* Chart Section */}
					<Stack divider={<Divider />} spacing={2} sx={{ flex: "1 1 auto" }}>
						<Box sx={{ height: { xs: "250px", sm: "300px", md: "350px" }, width: "100%" }}>
							<NoSsr fallback={<Box sx={{ height: { xs: "250px", sm: "300px", md: "350px" } }} />}>
								<ResponsiveContainer width="100%" height={chartHeight}>
									{chartType === "valuation" ? (
										<BarChart data={valuationData} margin={{ top: 0, right: 0, bottom: 20, left: 0 }}>
											<CartesianGrid strokeDasharray="2 4" stroke="var(--mui-palette-divider)" vertical={false} />
											<XAxis
												axisLine={false}
												dataKey="symbol"
												tickLine={false}
												tick={{ fontSize: 12, fill: "var(--mui-palette-text-secondary)" }}
												height={30}
											/>
											<YAxis
												axisLine={false}
												hide
												tick={{ fontSize: 12, fill: "var(--mui-palette-text-secondary)" }}
												tickFormatter={(value) => {
													if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
													if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
													return `$${value.toFixed(0)}`;
												}}
											/>
										<Tooltip animationDuration={50} content={<CustomTooltip />} cursor={false} />
										<Bar
											animationDuration={300}
											barSize={32}
											dataKey="valAchat"
											fill="var(--mui-palette-primary-400)"
											name="Purchase Value"
											radius={[5, 5, 5, 5]}
										/>
										<Bar
											animationDuration={300}
											barSize={32}
											dataKey="valMarche"
											fill="var(--mui-palette-primary-600)"
											name="Market Value"
											radius={[5, 5, 5, 5]}
										/>
									</BarChart>
								) : (
									<BarChart 
										data={pnlData} 
										margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
										barCategoryGap="10%"
									>
										<defs>
											<linearGradient id="colorGain" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="var(--mui-palette-success-main)" stopOpacity={0.9} />
												<stop offset="95%" stopColor="var(--mui-palette-success-dark)" stopOpacity={0.9} />
											</linearGradient>
											<linearGradient id="colorLoss" x1="0" y1="0" x2="0" y2="1">
												<stop offset="5%" stopColor="var(--mui-palette-error-main)" stopOpacity={0.9} />
												<stop offset="95%" stopColor="var(--mui-palette-error-dark)" stopOpacity={0.9} />
											</linearGradient>
										</defs>
										<CartesianGrid strokeDasharray="2 4" stroke="var(--mui-palette-divider)" vertical={false} />
										<XAxis
											axisLine={false}
											dataKey="symbol"
											tickLine={false}
											tick={{ fontSize: 12, fill: "var(--mui-palette-text-secondary)" }}
											height={30}
										/>
										<YAxis
											axisLine={false}
											hide
											tick={{ fontSize: 12, fill: "var(--mui-palette-text-secondary)" }}
											tickFormatter={(value) => {
												const sign = value >= 0 ? "+" : "";
												if (Math.abs(value) >= 1_000_000) return `${sign}$${(Math.abs(value) / 1_000_000).toFixed(1)}M`;
												if (Math.abs(value) >= 1_000) return `${sign}$${(Math.abs(value) / 1_000).toFixed(0)}k`;
												return `${sign}$${Math.abs(value).toFixed(0)}`;
											}}
										/>
										<Tooltip animationDuration={50} content={<CustomTooltip />} cursor={false} />
										<ReferenceLine y={0} stroke="var(--mui-palette-divider)" strokeWidth={2} strokeDasharray="4 4" opacity={0.7} />
										<Bar 
											animationDuration={300} 
											barSize={32} 
											dataKey="pnl" 
											radius={[5, 5, 5, 5]}
											shape={(props: any) => {
												const { x, y, width, height, payload } = props;
												const minBarHeight = 3; // Minimum height in pixels for visibility
												const actualHeight = Math.abs(height);
												const displayHeight = Math.max(actualHeight, minBarHeight);
												const isPositive = payload.pnl >= 0;
												
												// In Recharts BarChart with baseline at y=0:
												// - For positive values: y is the top of the bar (above baseline), height goes downward to baseline
												// - For negative values: y is the bottom of the bar (below baseline), height goes upward to baseline
												// For negative bars, we need to calculate where the baseline (y=0) is
												// The baseline position = y + height (because y is below baseline, height goes up to baseline)
												
												let newY = y;
												let newHeight = displayHeight;
												
												if (isPositive) {
													// For positive: y is the top of the bar, height goes down to baseline
													// If we increased height, we need to move y up
													newY = y - (displayHeight - actualHeight);
													newHeight = displayHeight;
												} else {
													// For negative: y is the bottom of the bar (below baseline)
													// height goes upward to baseline, so baseline = y + height
													// We want the bar to start at baseline and go down
													const baselineY = y + height; // Position of y=0 (baseline)
													
													// Start at baseline and extend downward
													newY = baselineY;
													newHeight = displayHeight;
												}
												
												return (
													<rect
														x={x}
														y={newY}
														width={width}
														height={newHeight}
														fill={payload.pnlPercentage >= 0 ? "url(#colorGain)" : "url(#colorLoss)"}
														rx={5}
														ry={5}
													/>
												);
											}}
										>
											{pnlData.map((entry, index) => (
												<Cell
													key={`cell-${index}`}
													fill={entry.pnlPercentage >= 0 ? "url(#colorGain)" : "url(#colorLoss)"}
												/>
											))}
										</Bar>
									</BarChart>
								)}
							</ResponsiveContainer>
						</NoSsr>
						</Box>
						{/* Legend */}
						<Stack direction="row" spacing={2}>
							{chartType === "valuation" ? (
								<>
									<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
										<Box
											sx={{
												bgcolor: "var(--mui-palette-primary-400)",
												borderRadius: "2px",
												height: "4px",
												width: "16px",
											}}
										/>
										<Typography color="text.secondary" variant="caption">
											Purchase Value
										</Typography>
									</Stack>
									<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
										<Box
											sx={{
												bgcolor: "var(--mui-palette-primary-600)",
												borderRadius: "2px",
												height: "4px",
												width: "16px",
											}}
										/>
										<Typography color="text.secondary" variant="caption">
											Market Value
										</Typography>
									</Stack>
								</>
							) : (
								<Typography color="text.secondary" variant="caption">
									Performance of each token in percentage
								</Typography>
							)}
						</Stack>
					</Stack>
				</Stack>
			</CardContent>
		</Card>
	);
}
