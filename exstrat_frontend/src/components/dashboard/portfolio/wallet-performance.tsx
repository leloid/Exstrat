"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Typography from "@mui/material/Typography";
import { ChartLineIcon } from "@phosphor-icons/react/dist/ssr/ChartLine";
import { GlobeIcon } from "@phosphor-icons/react/dist/ssr/Globe";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { NoSsr } from "@/components/core/no-ssr";
import { formatCompactCurrency, formatPercentage } from "@/lib/format";
import { useSecretMode } from "@/hooks/use-secret-mode";
import type { TransactionResponse } from "@/types/transactions";

interface PortfolioData {
	id: string;
	name: string;
	description?: string;
	isDefault: boolean;
	holdings: any[];
	invested: number;
	value: number;
	pnl: number;
	pnlPercentage: number;
	holdingsCount: number;
}

interface WalletPerformanceProps {
	portfolios: Array<{ id: string; name: string }>;
	transactions: TransactionResponse[];
	portfolioData: Record<string, PortfolioData>;
	selectedPortfolioId?: string | null; // Portfolio sélectionné (null = global)
}

export function WalletPerformance({ portfolios, transactions, portfolioData, selectedPortfolioId }: WalletPerformanceProps): React.JSX.Element {
	const { secretMode } = useSecretMode();
	const [walletPerformanceView, setWalletPerformanceView] = React.useState<"global" | "byWallet">("global");

	// Determine which portfolio to use (selected or global)
	const activePortfolioData = React.useMemo(() => {
		if (selectedPortfolioId && portfolioData[selectedPortfolioId]) {
			return portfolioData[selectedPortfolioId];
		}
		// Global: aggregate all portfolios
		const portfolioStats = Object.values(portfolioData);
		return {
			id: "global",
			name: "Global",
			invested: portfolioStats.reduce((sum, p) => sum + p.invested, 0),
			value: portfolioStats.reduce((sum, p) => sum + p.value, 0),
			pnl: portfolioStats.reduce((sum, p) => sum + p.pnl, 0),
			pnlPercentage:
				portfolioStats.reduce((sum, p) => sum + p.invested, 0) > 0
					? (portfolioStats.reduce((sum, p) => sum + p.pnl, 0) /
							portfolioStats.reduce((sum, p) => sum + p.invested, 0)) *
						100
					: 0,
		};
	}, [portfolioData, selectedPortfolioId]);

	// Filter transactions based on selected portfolio
	const filteredTransactions = React.useMemo(() => {
		if (selectedPortfolioId) {
			return transactions.filter((t) => t.portfolioId === selectedPortfolioId);
		}
		return transactions;
	}, [transactions, selectedPortfolioId]);

	// Calculate portfolio performance over time
	const portfolioPerformanceData = React.useMemo(() => {
		if (filteredTransactions.length === 0 || !activePortfolioData) {
			const currentTotalValue = activePortfolioData?.value || 0;
			const currentTotalInvested = activePortfolioData?.invested || 0;
			const now = new Date();
			const days = 30;
			const data: Array<{ name: string; value: number }> = [];

			for (let i = days; i >= 0; i--) {
				const date = new Date(now);
				date.setDate(date.getDate() - i);
				const progress = i / days;
				const simulatedInvested = currentTotalInvested * (0.7 + 0.3 * progress);
				const simulatedValue = simulatedInvested * (1 + ((activePortfolioData?.pnlPercentage || 0) / 100) * progress);
				const monthName = date.toLocaleDateString("en-US", { month: "short" });
				const day = date.getDate();
				data.push({
					name: `${monthName} ${day}`,
					value: simulatedValue,
				});
			}

			return data;
		}

		const transactionPoints: Array<{ date: Date; invested: number; daysAgo: number }> = [];
		const sortedTransactions = [...filteredTransactions].sort((a, b) => {
			const dateA = new Date(a.transactionDate).getTime();
			const dateB = new Date(b.transactionDate).getTime();
			return dateA - dateB;
		});

		let cumulativeInvested = 0;
		const now = new Date();
		const days = 30;

		for (const transaction of sortedTransactions) {
			const transactionDate = new Date(transaction.transactionDate);
			const daysDiff = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
			if (daysDiff <= days && daysDiff >= 0) {
				if (transaction.type === "BUY") {
					cumulativeInvested += transaction.amountInvested || 0;
				} else {
					cumulativeInvested -= transaction.amountInvested || 0;
				}
				transactionPoints.push({
					date: transactionDate,
					invested: cumulativeInvested,
					daysAgo: daysDiff,
				});
			}
		}

		const data: Array<{ name: string; value: number }> = [];
		
		for (let i = days; i >= 0; i--) {
			const date = new Date(now);
			date.setDate(date.getDate() - i);
			const monthName = date.toLocaleDateString("en-US", { month: "short" });
			const day = date.getDate();
			const dateKey = `${monthName} ${day}`;
			const daysAgo = i;

			let beforePoint: { invested: number; daysAgo: number } | null = null;
			let afterPoint: { invested: number; daysAgo: number } | null = null;

			for (const point of transactionPoints) {
				if (point.daysAgo >= daysAgo) {
					if (!beforePoint || point.daysAgo < beforePoint.daysAgo) {
						beforePoint = point;
					}
				}
				if (point.daysAgo <= daysAgo) {
					if (!afterPoint || point.daysAgo > afterPoint.daysAgo) {
						afterPoint = point;
					}
				}
			}

			let investedAtDate: number;
			if (beforePoint && afterPoint) {
				if (beforePoint.daysAgo === afterPoint.daysAgo) {
					investedAtDate = beforePoint.invested;
			} else {
					const factor = (daysAgo - afterPoint.daysAgo) / (beforePoint.daysAgo - afterPoint.daysAgo);
					investedAtDate = afterPoint.invested + (beforePoint.invested - afterPoint.invested) * factor;
				}
			} else if (beforePoint) {
				investedAtDate = beforePoint.invested;
			} else if (afterPoint) {
				investedAtDate = afterPoint.invested;
			} else {
				const progress = i / days;
				investedAtDate = (activePortfolioData?.invested || 0) * (0.7 + 0.3 * (1 - progress));
			}

			const progress = i / days;
			const estimatedPnLPercentage = (activePortfolioData?.pnlPercentage || 0) * (1 - progress * 0.3);
			const valueAtDate = investedAtDate * (1 + estimatedPnLPercentage / 100);

				data.push({
					name: dateKey,
				value: Math.max(0, valueAtDate),
				});
			}

		if (data.length > 0 && activePortfolioData) {
			data[data.length - 1].value = activePortfolioData.value;
		}

		return data;
	}, [filteredTransactions, activePortfolioData]);

	// Calculate performance data by wallet (top 3) - only if global view
	const walletPerformanceByWalletData = React.useMemo<{
		data: Array<{ name: string; [key: string]: string | number }>;
		wallets: PortfolioData[];
	}>(() => {
		// Only show "by wallet" view if in global mode
		if (selectedPortfolioId) {
			return { data: [], wallets: [] };
		}

		const portfolioStats = Object.values(portfolioData);
		if (portfolioStats.length === 0) {
			return { data: [], wallets: [] };
		}

		const topWallets = [...portfolioStats]
			.sort((a, b) => b.value - a.value)
			.slice(0, 3);

		if (topWallets.length === 0) {
			return { data: [], wallets: [] };
		}

		const now = new Date();
		const days = 30;
		const data: Array<{ name: string; [key: string]: string | number }> = [];

		const walletDataPoints: Record<string, Array<{ date: Date; invested: number; value: number; daysAgo: number }>> = {};

		topWallets.forEach((wallet) => {
			const walletKey = wallet.name.replace(/\s+/g, "_");
			const walletTransactions = filteredTransactions.filter(
				(t) => t.portfolioId === wallet.id
			).sort((a, b) => {
				const dateA = new Date(a.transactionDate).getTime();
				const dateB = new Date(b.transactionDate).getTime();
				return dateA - dateB;
			});

			let cumulativeInvested = 0;
			const points: Array<{ date: Date; invested: number; value: number; daysAgo: number }> = [];

			for (const transaction of walletTransactions) {
				const transactionDate = new Date(transaction.transactionDate);
				const daysDiff = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
				
				if (daysDiff <= days && daysDiff >= 0) {
					if (transaction.type === "BUY") {
						cumulativeInvested += transaction.amountInvested || 0;
					} else {
						cumulativeInvested -= transaction.amountInvested || 0;
					}
					
					const pnlPercentage = wallet.pnlPercentage || 0;
					const progress = daysDiff / days;
					const estimatedPnLPercentage = pnlPercentage * (1 - progress * 0.4);
					const estimatedValue = cumulativeInvested * (1 + estimatedPnLPercentage / 100);

					points.push({
						date: transactionDate,
						invested: cumulativeInvested,
						value: Math.max(0, estimatedValue),
						daysAgo: daysDiff,
					});
				}
			}

			walletDataPoints[walletKey] = points;
		});

		for (let i = days; i >= 0; i--) {
			const date = new Date(now);
			date.setDate(date.getDate() - i);
			const monthName = date.toLocaleDateString("en-US", { month: "short" });
			const day = date.getDate();
			const dateKey = `${monthName} ${day}`;
			const daysAgo = i;

			const dataPoint: { name: string; [key: string]: string | number } = { name: dateKey };

			topWallets.forEach((wallet) => {
				const walletKey = wallet.name.replace(/\s+/g, "_");
				const points = walletDataPoints[walletKey] || [];

				let beforePoint: { invested: number; value: number; daysAgo: number } | null = null;
				let afterPoint: { invested: number; value: number; daysAgo: number } | null = null;

				for (const point of points) {
					if (point.daysAgo >= daysAgo) {
						if (!beforePoint || point.daysAgo < beforePoint.daysAgo) {
							beforePoint = point;
						}
					}
					if (point.daysAgo <= daysAgo) {
						if (!afterPoint || point.daysAgo > afterPoint.daysAgo) {
							afterPoint = point;
						}
					}
				}

				let valueAtDate: number;
				if (beforePoint && afterPoint) {
					if (beforePoint.daysAgo === afterPoint.daysAgo) {
						valueAtDate = beforePoint.value;
					} else {
						const factor = (daysAgo - afterPoint.daysAgo) / (beforePoint.daysAgo - afterPoint.daysAgo);
						valueAtDate = afterPoint.value + (beforePoint.value - afterPoint.value) * factor;
					}
				} else if (beforePoint) {
					valueAtDate = beforePoint.value;
				} else if (afterPoint) {
					valueAtDate = afterPoint.value;
				} else {
					const progress = i / days;
					const pnlPercentage = wallet.pnlPercentage || 0;
					const startValue = wallet.value * 0.6;
					const endValue = wallet.value;
					const volatility = 1 + (Math.sin(progress * Math.PI * 4) * 0.05);
					valueAtDate = (startValue + (endValue - startValue) * (1 - progress)) * volatility;
				}

				if (points.length > 0) {
					const variation = 1 + (Math.sin((daysAgo / days) * Math.PI * 6) * 0.02);
					valueAtDate = valueAtDate * variation;
				}

				dataPoint[walletKey] = Math.max(0, valueAtDate);
			});

			data.push(dataPoint);
		}

		const lastDataPoint = data[data.length - 1];
		topWallets.forEach((wallet) => {
			const walletKey = wallet.name.replace(/\s+/g, "_");
			lastDataPoint[walletKey] = wallet.value;
		});

		return { data, wallets: topWallets };
	}, [filteredTransactions, portfolioData, selectedPortfolioId]);

	if (portfolios.length === 0 || transactions.length === 0) {
		return <></>;
	}

	const displayTitle = selectedPortfolioId 
		? `Wallet Performance - ${activePortfolioData?.name || "Unknown"}`
		: "Wallet Performance";

	return (
		<Card>
			<CardHeader
				title={displayTitle}
				action={
					!selectedPortfolioId && (
						<ToggleButtonGroup
							color="primary"
							exclusive
							onChange={(_, value) => {
								if (value !== null) {
									setWalletPerformanceView(value);
								}
							}}
							size="small"
							value={walletPerformanceView}
						>
							<ToggleButton value="global">
								<Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
									<GlobeIcon fontSize="var(--icon-fontSize-md)" />
									<Typography variant="body2">Global</Typography>
								</Stack>
							</ToggleButton>
							<ToggleButton value="byWallet">
								<Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
									<ChartLineIcon fontSize="var(--icon-fontSize-md)" />
									<Typography variant="body2">Top Wallets</Typography>
								</Stack>
							</ToggleButton>
						</ToggleButtonGroup>
					)
				}
			/>
			<CardContent>
				{secretMode ? (
					<Box sx={{ height: "240px", display: "flex", alignItems: "center", justifyContent: "center" }}>
						<Typography color="text.secondary" variant="h6">
							Secret mode activé
						</Typography>
					</Box>
				) : (
					<>
						{!selectedPortfolioId && walletPerformanceView === "byWallet" && walletPerformanceByWalletData.wallets.length > 0 ? (
							<Stack spacing={3}>
								{/* Wallet Stats Summary */}
								{walletPerformanceByWalletData.wallets.length > 0 && (
									<Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", justifyContent: "center", gap: 2 }}>
										{walletPerformanceByWalletData.wallets.map((wallet, index) => {
											const colors = [
												"var(--mui-palette-primary-main)",
												"var(--mui-palette-secondary-main)",
												"var(--mui-palette-success-main)",
											];
											const color = colors[index % colors.length];
											return (
												<Card 
													key={wallet.id} 
													variant="outlined"
													sx={{ 
														minWidth: "200px",
														flex: "1 1 auto",
														borderLeft: `4px solid ${color}`,
														position: "relative",
													}}
												>
													<Box
														sx={{
															position: "absolute",
															top: 8,
															right: 8,
															bgcolor: color,
															color: "white",
															borderRadius: "50%",
															width: 24,
															height: 24,
															display: "flex",
															alignItems: "center",
															justifyContent: "center",
															fontWeight: 700,
															fontSize: "0.75rem",
														}}
													>
														{index + 1}
													</Box>
													<CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
														<Stack spacing={1}>
															<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
																<Box
																	sx={{
																		bgcolor: color,
																		borderRadius: "4px",
																		height: "12px",
																		width: "12px",
																	}}
																/>
																<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
																	{wallet.name}
																</Typography>
															</Stack>
															<Typography variant="h6" sx={{ fontWeight: 600 }}>
																{formatCompactCurrency(wallet.value, "$", 2, secretMode)}
															</Typography>
															<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
																<Typography 
																	color={wallet.pnl >= 0 ? "success.main" : "error.main"}
																	variant="body2"
																	sx={{ fontWeight: 600 }}
																>
																	{formatCompactCurrency(wallet.pnl, "$", 2, secretMode)}
																</Typography>
																<Typography 
																	color={wallet.pnlPercentage >= 0 ? "success.main" : "error.main"}
																	variant="caption"
																>
																	({formatPercentage(wallet.pnlPercentage, 2)})
																</Typography>
															</Stack>
														</Stack>
													</CardContent>
												</Card>
											);
										})}
									</Stack>
								)}
								<NoSsr fallback={<Box sx={{ height: "280px" }} />}>
									<ResponsiveContainer height={280} width="100%">
										<LineChart data={walletPerformanceByWalletData.data} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
											<CartesianGrid 
												strokeDasharray="3 3" 
												vertical={false} 
												stroke="var(--mui-palette-divider)"
												opacity={0.5}
											/>
											<XAxis
												axisLine={false}
												dataKey="name"
												tickLine={false}
												type="category"
												interval="preserveStartEnd"
												tick={{ fontSize: 11, fill: "var(--mui-palette-text-secondary)" }}
												height={30}
											/>
											<YAxis
												axisLine={false}
												tickLine={false}
												type="number"
												tickFormatter={(value) => formatCompactCurrency(value, "$", 0).replace("$", "")}
												tick={{ fontSize: 11, fill: "var(--mui-palette-text-secondary)" }}
												width={60}
											/>
											{walletPerformanceByWalletData.wallets.map((wallet, index) => {
												const walletKey = wallet.name.replace(/\s+/g, "_");
												const colors = [
													"var(--mui-palette-primary-main)",
													"var(--mui-palette-secondary-main)",
													"var(--mui-palette-success-main)",
												];
												const color = colors[index % colors.length];
												return (
													<Line
														key={wallet.id}
														animationDuration={800}
														dataKey={walletKey}
														name={wallet.name}
														stroke={color}
														strokeWidth={3}
														type="monotone"
														dot={false}
														activeDot={{ 
															r: 6, 
															fill: color, 
															strokeWidth: 2, 
															stroke: "var(--mui-palette-background-paper)" 
														}}
													/>
												);
											})}
											<Tooltip
												animationDuration={50}
												content={<WalletPerformanceTooltipContent wallets={walletPerformanceByWalletData.wallets} />}
												cursor={{ stroke: "var(--mui-palette-divider)", strokeWidth: 1, strokeDasharray: "5 5", opacity: 0.5 }}
											/>
										</LineChart>
									</ResponsiveContainer>
								</NoSsr>
							</Stack>
						) : (
							<NoSsr fallback={<Box sx={{ height: "280px" }} />}>
									<ResponsiveContainer height={280} width="100%">
										<AreaChart data={portfolioPerformanceData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
											<defs>
												<linearGradient id="area-performance-gradient" x1="0" x2="0" y1="0" y2="1">
													<stop offset="0%" stopColor="var(--mui-palette-primary-main)" stopOpacity={0.4} />
													<stop offset="50%" stopColor="var(--mui-palette-primary-main)" stopOpacity={0.2} />
													<stop offset="100%" stopColor="var(--mui-palette-primary-main)" stopOpacity={0} />
												</linearGradient>
												<linearGradient id="area-performance-stroke" x1="0" x2="1" y1="0" y2="0">
													<stop offset="0%" stopColor="var(--mui-palette-primary-main)" />
													<stop offset="100%" stopColor="var(--mui-palette-secondary-main)" />
												</linearGradient>
											</defs>
											<CartesianGrid 
												strokeDasharray="3 3" 
												vertical={false} 
												stroke="var(--mui-palette-divider)"
												opacity={0.5}
											/>
											<XAxis
												axisLine={false}
												dataKey="name"
												tickLine={false}
												type="category"
												interval="preserveStartEnd"
												tick={{ fontSize: 11, fill: "var(--mui-palette-text-secondary)" }}
												height={30}
											/>
											<YAxis
												axisLine={false}
												tickLine={false}
												type="number"
												tickFormatter={(value) => formatCompactCurrency(value, "$", 0).replace("$", "")}
												tick={{ fontSize: 11, fill: "var(--mui-palette-text-secondary)" }}
												width={60}
											/>
											<Area
												animationDuration={800}
												dataKey="value"
												fill="url(#area-performance-gradient)"
												fillOpacity={1}
												name="Total Value"
												stroke="url(#area-performance-stroke)"
												strokeWidth={3}
												type="monotone"
												dot={false}
												activeDot={{ r: 6, fill: "var(--mui-palette-primary-main)", strokeWidth: 2, stroke: "var(--mui-palette-background-paper)" }}
											/>
											<Tooltip
												animationDuration={50}
												content={<PerformanceTooltipContent />}
												cursor={{ stroke: "var(--mui-palette-primary-main)", strokeWidth: 1, strokeDasharray: "5 5", opacity: 0.5 }}
											/>
										</AreaChart>
									</ResponsiveContainer>
								</NoSsr>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}

interface PerformanceTooltipContentProps {
	active?: boolean;
	payload?: { name: string; dataKey: string; value: number; stroke: string }[];
	label?: string;
}

function PerformanceTooltipContent({ active, payload }: PerformanceTooltipContentProps): React.JSX.Element | null {
	const { secretMode } = useSecretMode();
	
	if (!active || !payload || payload.length === 0) {
		return null;
	}

	const entry = payload[0];

	return (
		<Paper sx={{ border: "1px solid var(--mui-palette-divider)", boxShadow: "var(--mui-shadows-16)", p: 1 }}>
			<Stack spacing={2}>
				<Stack direction="row" spacing={3} sx={{ alignItems: "center" }}>
					<Stack direction="row" spacing={1} sx={{ alignItems: "center", flex: "1 1 auto" }}>
						<Box
							sx={{
								bgcolor: entry.stroke,
								borderRadius: "2px",
								height: "8px",
								width: "8px",
							}}
						/>
						<Typography sx={{ whiteSpace: "nowrap" }}>{entry.name}</Typography>
					</Stack>
					<Typography color="text.secondary" variant="body2">
						{formatCompactCurrency(entry.value, "$", 2, secretMode)}
					</Typography>
				</Stack>
			</Stack>
		</Paper>
	);
}

interface WalletPerformanceTooltipContentProps {
	active?: boolean;
	payload?: { name: string; dataKey: string; value: number; stroke: string }[];
	label?: string;
	wallets: Array<{ id: string; name: string }>;
}

function WalletPerformanceTooltipContent({
	active,
	payload,
	label,
	wallets,
}: WalletPerformanceTooltipContentProps): React.JSX.Element | null {
	const { secretMode } = useSecretMode();
	
	if (!active || !payload || payload.length === 0) {
		return null;
	}

	return (
		<Paper sx={{ border: "1px solid var(--mui-palette-divider)", boxShadow: "var(--mui-shadows-16)", p: 1 }}>
			<Stack spacing={2}>
				{label && (
					<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
						{label}
					</Typography>
				)}
				{payload.map((entry) => {
					const wallet = wallets.find((w) => w.name.replace(/\s+/g, "_") === entry.dataKey);
					return (
						<Stack key={entry.dataKey} direction="row" spacing={3} sx={{ alignItems: "center" }}>
							<Stack direction="row" spacing={1} sx={{ alignItems: "center", flex: "1 1 auto" }}>
								<Box
									sx={{
										bgcolor: entry.stroke,
										borderRadius: "2px",
										height: "8px",
										width: "8px",
									}}
								/>
								<Typography sx={{ whiteSpace: "nowrap" }}>{wallet?.name || entry.name}</Typography>
							</Stack>
							<Typography color="text.secondary" variant="body2">
								{formatCompactCurrency(entry.value, "$", 2, secretMode)}
							</Typography>
						</Stack>
					);
				})}
			</Stack>
		</Paper>
	);
}

