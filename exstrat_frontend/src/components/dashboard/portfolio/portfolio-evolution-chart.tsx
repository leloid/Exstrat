"use client";

import type * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ChartLineIcon } from "@phosphor-icons/react/dist/ssr/ChartLine";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { NoSsr } from "@/components/core/no-ssr";
import { formatCurrency } from "@/lib/format";

export interface EvolutionDataPoint {
	date: string;
	valeurBrute: number;
	valeurNette: number;
	investi: number;
}

export interface PortfolioEvolutionChartProps {
	data: EvolutionDataPoint[];
}

export function PortfolioEvolutionChart({ data }: PortfolioEvolutionChartProps): React.JSX.Element {
	if (!data || data.length === 0) {
		return (
			<Card>
				<CardHeader
					avatar={
						<Avatar>
							<ChartLineIcon fontSize="var(--Icon-fontSize)" />
						</Avatar>
					}
					subheader="Portfolio performance over time"
					title="Portfolio Evolution"
				/>
				<CardContent>
					<Box sx={{ py: 8, textAlign: "center" }}>
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
				avatar={
					<Avatar>
						<ChartLineIcon fontSize="var(--Icon-fontSize)" />
					</Avatar>
				}
				subheader="Portfolio performance over time"
				title="Portfolio Evolution"
			/>
			<CardContent>
				<NoSsr fallback={<Box sx={{ height: "400px" }} />}>
					<ResponsiveContainer height={400} width="100%">
						<LineChart data={data} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
							<defs>
								<linearGradient id="colorValeurNette" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#F6851B" stopOpacity={0.3} />
									<stop offset="95%" stopColor="#F6851B" stopOpacity={0} />
								</linearGradient>
								<linearGradient id="colorValeurBrute" x1="0" y1="0" x2="0" y2="1">
									<stop offset="5%" stopColor="#047DD5" stopOpacity={0.2} />
									<stop offset="95%" stopColor="#047DD5" stopOpacity={0} />
								</linearGradient>
							</defs>
							<CartesianGrid strokeDasharray="3 3" stroke="var(--mui-palette-divider)" />
							<XAxis
								dataKey="date"
								stroke="var(--mui-palette-text-secondary)"
								tick={{ fill: "var(--mui-palette-text-secondary)", fontSize: 12 }}
								tickFormatter={(value) => {
									const date = new Date(value);
									return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
								}}
							/>
							<YAxis
								stroke="var(--mui-palette-text-secondary)"
								tick={{ fill: "var(--mui-palette-text-secondary)", fontSize: 12 }}
								tickFormatter={(value) => {
									if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
									if (value >= 1000) return `$${(value / 1000).toFixed(0)}k`;
									return `$${value.toFixed(0)}`;
								}}
							/>
							<Tooltip content={<CustomTooltip />} />
							<Area
								type="monotone"
								dataKey="valeurNette"
								stroke="none"
								fill="url(#colorValeurNette)"
								fillOpacity={0.6}
							/>
							<Area
								type="monotone"
								dataKey="valeurBrute"
								stroke="none"
								fill="url(#colorValeurBrute)"
								fillOpacity={0.4}
							/>
							<Line
								type="monotone"
								dataKey="valeurBrute"
								stroke="#047DD5"
								strokeWidth={2.5}
								dot={false}
								activeDot={{ r: 6 }}
							/>
							<Line
								type="monotone"
								dataKey="valeurNette"
								stroke="#F6851B"
								strokeWidth={2.5}
								dot={false}
								activeDot={{ r: 6 }}
							/>
							<Line
								type="monotone"
								dataKey="investi"
								stroke="var(--mui-palette-text-secondary)"
								strokeWidth={1.5}
								strokeDasharray="6 4"
								dot={false}
								activeDot={{ r: 5 }}
							/>
						</LineChart>
					</ResponsiveContainer>
				</NoSsr>
			</CardContent>
		</Card>
	);
}

interface CustomTooltipProps {
	active?: boolean;
	payload?: Array<{ name: string; value: number; dataKey: string; color: string }>;
	label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps): React.JSX.Element | null {
	if (!active || !payload || !payload.length) {
		return null;
	}

	const date = new Date(label || "");
	const formattedDate = date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

	return (
		<Paper sx={{ border: "1px solid var(--mui-palette-divider)", boxShadow: "var(--mui-shadows-16)", p: 2 }}>
			<Stack spacing={2}>
				<Typography variant="subtitle2">{formattedDate}</Typography>
				{payload.map((entry, index) => (
					<Stack direction="row" key={index} spacing={2} sx={{ alignItems: "center" }}>
						<Box
							sx={{
								bgcolor: entry.color || entry.dataKey === "valeurBrute" ? "#047DD5" : "#F6851B",
								borderRadius: "2px",
								height: "8px",
								width: "8px",
							}}
						/>
						<Typography sx={{ flex: "1 1 auto" }} variant="body2">
							{entry.dataKey === "valeurBrute"
								? "Gross Value"
								: entry.dataKey === "valeurNette"
									? "Net Value"
									: "Invested"}
						</Typography>
						<Typography color="text.secondary" variant="body2">
							{formatCurrency(entry.value, "$", 2)}
						</Typography>
					</Stack>
				))}
			</Stack>
		</Paper>
	);
}

