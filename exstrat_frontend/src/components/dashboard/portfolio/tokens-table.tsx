"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Typography from "@mui/material/Typography";
import { useColorScheme } from "@mui/material/styles";
import { ArrowDownIcon } from "@phosphor-icons/react/dist/ssr/ArrowDown";
import { ArrowUpIcon } from "@phosphor-icons/react/dist/ssr/ArrowUp";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CaretUpIcon } from "@phosphor-icons/react/dist/ssr/CaretUp";

import { formatCurrency, formatPercentage } from "@/lib/format";
import { getTokenLogoUrl } from "@/lib/utils";
import type { Holding } from "@/types/portfolio";
import * as configurationApi from "@/lib/configuration-api";
import { getTheoreticalStrategies } from "@/lib/portfolios-api";
import { strategiesApi } from "@/lib/strategies-api";
import type { AlertConfiguration } from "@/types/configuration";
import type { TheoreticalStrategyResponse, StrategyResponse } from "@/types/strategies";

export interface TokensTableProps {
	holdings: Holding[];
	portfolioId?: string;
	onTokenClick?: (holding: Holding) => void;
}

interface TokenAlertInfo {
	strategyName: string | null;
	tpProgress: string;
}

type SortField = "symbol" | "quantity" | "investedAmount" | "currentValue" | "pnl" | "pnlPercentage" | "strategy" | "tpProgress";
type SortDirection = "asc" | "desc";

export function TokensTable({ holdings, portfolioId, onTokenClick }: TokensTableProps): React.JSX.Element {
	const { colorScheme = "light" } = useColorScheme();
	const [sortField, setSortField] = React.useState<SortField>("currentValue");
	const [sortDirection, setSortDirection] = React.useState<SortDirection>("desc");
	const [alertConfigurations, setAlertConfigurations] = React.useState<AlertConfiguration[]>([]);
	const [strategiesMap, setStrategiesMap] = React.useState<Map<string, TheoreticalStrategyResponse>>(new Map());
	const [loadingAlerts, setLoadingAlerts] = React.useState(false);

	// Load alert configurations and strategies
	React.useEffect(() => {
		const loadAlertData = async () => {
			// Load even if no portfolioId (for global view)
			try {
				setLoadingAlerts(true);

				const allConfigs = await configurationApi.getAlertConfigurations();
				const activeConfigs = allConfigs.filter((config) => config.isActive);
				setAlertConfigurations(activeConfigs);

				// Load theoretical strategies
				const theoreticalStrategies = await getTheoreticalStrategies();
				const strategiesById = new Map<string, TheoreticalStrategyResponse>();
				theoreticalStrategies.forEach((strategy) => {
					strategiesById.set(strategy.id, strategy);
				});

				// Also load real strategies and convert them to theoretical format
				try {
					const realStrategiesData = await strategiesApi.getStrategies({});
					const realStrategies = realStrategiesData.strategies || [];
					realStrategies.forEach((s: StrategyResponse) => {
						const theoreticalStrategy: TheoreticalStrategyResponse = {
							id: s.id,
							userId: s.userId,
							name: s.name,
							tokenSymbol: s.symbol,
							tokenName: s.tokenName,
							quantity: s.baseQuantity,
							averagePrice: s.referencePrice,
							profitTargets: s.steps.map((step, index) => ({
								order: index + 1,
								targetType: step.targetType === "exact_price" ? "price" : "percentage",
								targetValue: step.targetValue,
								sellPercentage: step.sellPercentage,
								notes: step.notes,
							})),
							status: s.status === "active" ? "active" : s.status === "paused" ? "paused" : "completed",
							createdAt: s.createdAt,
							updatedAt: s.updatedAt,
							numberOfTargets: s.steps.length,
						};
						strategiesById.set(s.id, theoreticalStrategy);
					});
				} catch (error) {
					console.error("Error loading real strategies:", error);
				}

				setStrategiesMap(strategiesById);
			} catch (error) {
				console.error("Error loading alerts:", error);
			} finally {
				setLoadingAlerts(false);
			}
		};

		loadAlertData();
	}, [portfolioId]);

	// Get token alert info
	const getTokenAlertInfo = React.useCallback(
		(holding: Holding): TokenAlertInfo => {
			for (const config of alertConfigurations) {
				const tokenAlert = config.tokenAlerts?.find((ta) => ta.holdingId === holding.id);

				if (tokenAlert && tokenAlert.isActive) {
					let strategyName: string | null = null;
					if (tokenAlert.strategyId) {
						const strategy = strategiesMap.get(tokenAlert.strategyId);
						strategyName = strategy?.name || null;
					}

					const currentPrice = holding.currentPrice || holding.averagePrice || 0;
					const tpReached = tokenAlert.tpAlerts?.filter((tp) => tp.isActive && currentPrice >= tp.targetPrice).length || 0;
					const totalTP = tokenAlert.numberOfTargets || tokenAlert.tpAlerts?.length || 0;

					return {
						strategyName,
						tpProgress: `${tpReached}/${totalTP}`,
					};
				}
			}

			return {
				strategyName: null,
				tpProgress: "-",
			};
		},
		[alertConfigurations, strategiesMap]
	);

	// Calculate values for each holding
	const holdingsWithCalculations = React.useMemo(() => {
		return holdings.map((holding) => {
			const currentValue = holding.currentValue || (holding.currentPrice || holding.averagePrice) * holding.quantity;
			const pnl = currentValue - holding.investedAmount;
			const pnlPercentage = holding.investedAmount > 0 ? (pnl / holding.investedAmount) * 100 : 0;

			return {
				...holding,
				currentValue,
				pnl,
				pnlPercentage,
			};
		});
	}, [holdings]);

	// Sort holdings
	const sortedHoldings = React.useMemo(() => {
		const sorted = [...holdingsWithCalculations];

		sorted.sort((a, b) => {
			let aValue: number | string;
			let bValue: number | string;

			switch (sortField) {
				case "symbol":
					aValue = a.token.symbol.toUpperCase();
					bValue = b.token.symbol.toUpperCase();
					break;
				case "quantity":
					aValue = a.quantity;
					bValue = b.quantity;
					break;
				case "investedAmount":
					aValue = a.investedAmount;
					bValue = b.investedAmount;
					break;
				case "currentValue":
					aValue = a.currentValue || 0;
					bValue = b.currentValue || 0;
					break;
				case "pnl":
					aValue = a.pnl || 0;
					bValue = b.pnl || 0;
					break;
				case "pnlPercentage":
					aValue = a.pnlPercentage || 0;
					bValue = b.pnlPercentage || 0;
					break;
				case "strategy":
					aValue = getTokenAlertInfo(a).strategyName || "";
					bValue = getTokenAlertInfo(b).strategyName || "";
					break;
				case "tpProgress":
					aValue = getTokenAlertInfo(a).tpProgress;
					bValue = getTokenAlertInfo(b).tpProgress;
					break;
				default:
					return 0;
			}

			if (typeof aValue === "string" && typeof bValue === "string") {
				return sortDirection === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
			}

			const numA = Number(aValue);
			const numB = Number(bValue);

			return sortDirection === "asc" ? numA - numB : numB - numA;
		});

		return sorted;
	}, [holdingsWithCalculations, sortField, sortDirection, getTokenAlertInfo]);

	const handleSort = (field: SortField) => {
		if (sortField === field) {
			setSortDirection(sortDirection === "asc" ? "desc" : "asc");
		} else {
			setSortField(field);
			setSortDirection("desc");
		}
	};

	const SortIcon = ({ field }: { field: SortField }) => {
		if (sortField !== field) {
			return (
				<Box sx={{ color: "var(--mui-palette-text-secondary)" }}>
					<CaretUpIcon size={16} />
				</Box>
			);
		}
		return sortDirection === "asc" ? (
			<Box sx={{ color: "var(--mui-palette-primary-main)" }}>
				<CaretUpIcon size={16} />
			</Box>
		) : (
			<Box sx={{ color: "var(--mui-palette-primary-main)" }}>
				<CaretDownIcon size={16} />
			</Box>
		);
	};

	if (holdings.length === 0) {
		return (
			<Card>
				<CardHeader title="Tokens Table" subheader="Tokens in your portfolio" />
				<CardContent>
					<Box sx={{ py: 4, textAlign: "center" }}>
						<Typography color="text.secondary" variant="body2">
							No tokens in this portfolio
						</Typography>
					</Box>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader
				title="Tokens Table"
				subheader={`${holdings.length} ${holdings.length !== 1 ? "tokens" : "token"} in your portfolio`}
			/>
			<CardContent>
				<Box sx={{ overflowX: "auto" }}>
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>
									<TableSortLabel
										active={sortField === "symbol"}
										direction={sortField === "symbol" ? sortDirection : "asc"}
										onClick={() => handleSort("symbol")}
										IconComponent={() => <SortIcon field="symbol" />}
									>
										<Typography variant="caption" sx={{ fontWeight: 600 }}>
											Token
										</Typography>
									</TableSortLabel>
								</TableCell>
								<TableCell align="right">
									<TableSortLabel
										active={sortField === "quantity"}
										direction={sortField === "quantity" ? sortDirection : "asc"}
										onClick={() => handleSort("quantity")}
										IconComponent={() => <SortIcon field="quantity" />}
									>
										<Typography variant="caption" sx={{ fontWeight: 600 }}>
											Qty
										</Typography>
									</TableSortLabel>
								</TableCell>
								<TableCell align="right">
									<TableSortLabel
										active={sortField === "investedAmount"}
										direction={sortField === "investedAmount" ? sortDirection : "asc"}
										onClick={() => handleSort("investedAmount")}
										IconComponent={() => <SortIcon field="investedAmount" />}
									>
										<Typography variant="caption" sx={{ fontWeight: 600 }}>
											Invested
										</Typography>
									</TableSortLabel>
								</TableCell>
								<TableCell align="right">
									<TableSortLabel
										active={sortField === "currentValue"}
										direction={sortField === "currentValue" ? sortDirection : "asc"}
										onClick={() => handleSort("currentValue")}
										IconComponent={() => <SortIcon field="currentValue" />}
									>
										<Typography variant="caption" sx={{ fontWeight: 600 }}>
											Current
										</Typography>
									</TableSortLabel>
								</TableCell>
								<TableCell align="right">
									<TableSortLabel
										active={sortField === "pnl"}
										direction={sortField === "pnl" ? sortDirection : "asc"}
										onClick={() => handleSort("pnl")}
										IconComponent={() => <SortIcon field="pnl" />}
									>
										<Typography variant="caption" sx={{ fontWeight: 600 }}>
											P/L
										</Typography>
									</TableSortLabel>
								</TableCell>
								<TableCell align="right">
									<TableSortLabel
										active={sortField === "pnlPercentage"}
										direction={sortField === "pnlPercentage" ? sortDirection : "asc"}
										onClick={() => handleSort("pnlPercentage")}
										IconComponent={() => <SortIcon field="pnlPercentage" />}
									>
										<Typography variant="caption" sx={{ fontWeight: 600 }}>
											%
										</Typography>
									</TableSortLabel>
								</TableCell>
								<TableCell>
									<TableSortLabel
										active={sortField === "strategy"}
										direction={sortField === "strategy" ? sortDirection : "asc"}
										onClick={() => handleSort("strategy")}
										IconComponent={() => <SortIcon field="strategy" />}
									>
										<Typography variant="caption" sx={{ fontWeight: 600 }}>
											Strat
										</Typography>
									</TableSortLabel>
								</TableCell>
								<TableCell align="center">
									<TableSortLabel
										active={sortField === "tpProgress"}
										direction={sortField === "tpProgress" ? sortDirection : "asc"}
										onClick={() => handleSort("tpProgress")}
										IconComponent={() => <SortIcon field="tpProgress" />}
									>
										<Typography variant="caption" sx={{ fontWeight: 600 }}>
											TP
										</Typography>
									</TableSortLabel>
								</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{sortedHoldings.map((holding) => {
								const isPositive = (holding.pnl || 0) >= 0;
								const alertInfo = getTokenAlertInfo(holding);

								return (
									<TableRow
										key={holding.id}
										onClick={() => onTokenClick?.(holding)}
										sx={{
											cursor: "pointer",
											"&:hover": {
												bgcolor: "var(--mui-palette-action-hover)",
											},
										}}
									>
										<TableCell>
											<Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
												<Avatar
													src={getTokenLogoUrl(holding.token.symbol, holding.token.cmcId)}
													sx={{ width: 32, height: 32 }}
												>
													{holding.token.symbol.charAt(0)}
												</Avatar>
												<Box>
													<Typography variant="body2" sx={{ fontWeight: 600 }}>
														{holding.token.symbol}
													</Typography>
													<Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: "100px" }}>
														{holding.token.name}
													</Typography>
												</Box>
											</Stack>
										</TableCell>
										<TableCell align="right">
											<Typography variant="body2" sx={{ fontWeight: 500 }}>
												{holding.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })}
											</Typography>
										</TableCell>
										<TableCell align="right">
											<Typography variant="body2" sx={{ fontWeight: 600 }}>
												{formatCurrency(holding.investedAmount, "$", 0)}
											</Typography>
										</TableCell>
										<TableCell align="right">
											<Typography variant="body2" sx={{ fontWeight: 600 }}>
												{formatCurrency(holding.currentValue || 0, "$", 0)}
											</Typography>
										</TableCell>
										<TableCell align="right">
											<Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
												{isPositive ? (
													<Box sx={{ color: "success.main" }}>
														<ArrowUpIcon size={16} />
													</Box>
												) : (
													<Box sx={{ color: "error.main" }}>
														<ArrowDownIcon size={16} />
													</Box>
												)}
												<Typography variant="body2" sx={{ fontWeight: 600, color: isPositive ? "success.main" : "error.main" }}>
													{isPositive ? "+" : ""}
													{formatCurrency(holding.pnl || 0, "$", 0)}
												</Typography>
											</Stack>
										</TableCell>
										<TableCell align="right">
											<Chip
												label={formatPercentage(holding.pnlPercentage || 0)}
												size="small"
												color={isPositive ? "success" : "error"}
												variant="soft"
												sx={{ fontWeight: 600, fontSize: "0.75rem" }}
											/>
										</TableCell>
										<TableCell>
											{alertInfo.strategyName ? (
												<Chip
													label={alertInfo.strategyName}
													size="small"
													color="primary"
													variant={colorScheme === "dark" ? "filled" : "outlined"}
													sx={{ 
														fontWeight: 500, 
														fontSize: "0.75rem", 
														maxWidth: "100px",
														...(colorScheme === "dark" && {
															bgcolor: "var(--mui-palette-primary-main)",
															color: "var(--mui-palette-primary-contrastText)",
														}),
													}}
												/>
											) : (
												<Typography variant="body2" color="text.secondary">
													-
												</Typography>
											)}
										</TableCell>
										<TableCell align="center">
											{alertInfo.tpProgress !== "-" ? (
												<Chip
													label={alertInfo.tpProgress}
													size="small"
													color="secondary"
													variant={colorScheme === "dark" ? "filled" : "outlined"}
													sx={{ 
														fontWeight: 600, 
														fontSize: "0.75rem",
														...(colorScheme === "dark" && {
															bgcolor: "var(--mui-palette-secondary-main)",
															color: "var(--mui-palette-secondary-contrastText)",
														}),
													}}
												/>
											) : (
												<Typography variant="body2" color="text.secondary">
													-
												</Typography>
											)}
										</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</Box>
			</CardContent>
		</Card>
	);
}

