"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import Collapse from "@mui/material/Collapse";
import Checkbox from "@mui/material/Checkbox";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import FormHelperText from "@mui/material/FormHelperText";
import Alert from "@mui/material/Alert";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { formatCurrency, formatPercentage } from "@/lib/format";
import { createForecast, getTheoreticalStrategies, getPortfolioHoldings } from "@/lib/portfolios-api";
import { strategiesApi } from "@/lib/strategies-api";
import { usePortfolio } from "@/contexts/PortfolioContext";
import type { ForecastResponse, CreateForecastDto } from "@/types/portfolio";
import type { TheoreticalStrategyResponse, StrategyResponse } from "@/types/strategies";
import { Option } from "@/components/core/option";

interface CreateForecastModalProps {
	onClose: () => void;
	onSuccess: () => void;
	open: boolean;
}

export function CreateForecastModal({ onClose, onSuccess, open }: CreateForecastModalProps): React.JSX.Element {
	const { portfolios, refreshPortfolios } = usePortfolio();
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [selectedPortfolioId, setSelectedPortfolioId] = React.useState<string>("");
	const [forecastName, setForecastName] = React.useState<string>("");
	const [theoreticalStrategies, setTheoreticalStrategies] = React.useState<TheoreticalStrategyResponse[]>([]);
	const [holdings, setHoldings] = React.useState<any[]>([]);
	const [appliedStrategies, setAppliedStrategies] = React.useState<Record<string, string>>({});
	const [expandedTokens, setExpandedTokens] = React.useState<Set<string>>(new Set());
	const [loading, setLoading] = React.useState(false);
	const [fieldErrors, setFieldErrors] = React.useState<{
		portfolioId: boolean;
		forecastName: boolean;
		strategies: boolean;
	}>({
		portfolioId: false,
		forecastName: false,
		strategies: false,
	});

	// Load portfolios and theoretical strategies on mount
	React.useEffect(() => {
		if (open) {
			refreshPortfolios();
			loadTheoreticalStrategies();
		}
	}, [open, refreshPortfolios]);

	// Load holdings when portfolio is selected
	React.useEffect(() => {
		if (selectedPortfolioId && selectedPortfolioId !== "virtual") {
			loadHoldings();
		} else {
			setHoldings([]);
			setAppliedStrategies({});
		}
	}, [selectedPortfolioId]);

	const loadTheoreticalStrategies = async () => {
		try {
			// Load both theoretical strategies and real strategies
			const [theoreticalData, realStrategiesData] = await Promise.all([
				getTheoreticalStrategies(),
				strategiesApi.getStrategies({}),
			]);

			// Convert real strategies to theoretical format
			const convertedStrategies: TheoreticalStrategyResponse[] = (realStrategiesData.strategies || []).map(
				(strategy: StrategyResponse) => {
					// Convert steps to profitTargets
					const profitTargets = strategy.steps.map((step, index) => ({
						order: index + 1,
						targetType: (step.targetType === "exact_price" ? "price" : "percentage") as "percentage" | "price",
						targetValue: step.targetValue,
						sellPercentage: step.sellPercentage,
					}));

					return {
						id: strategy.id,
						userId: strategy.userId,
						name: strategy.name,
						tokenSymbol: strategy.symbol,
						tokenName: strategy.tokenName,
						quantity: strategy.baseQuantity,
						averagePrice: strategy.referencePrice,
						profitTargets,
						status: strategy.status === "active" ? "active" : strategy.status === "paused" ? "paused" : "completed",
						createdAt: strategy.createdAt,
						updatedAt: strategy.updatedAt,
						numberOfTargets: strategy.steps.length,
					} as TheoreticalStrategyResponse;
				}
			);

			// Combine theoretical and converted real strategies
			setTheoreticalStrategies([...(theoreticalData || []), ...convertedStrategies]);
		} catch (error) {
			console.error("Error loading strategies:", error);
		}
	};

	const loadHoldings = async () => {
		if (!selectedPortfolioId || selectedPortfolioId === "virtual") return;

		try {
			setLoading(true);
			const holdingsData = await getPortfolioHoldings(selectedPortfolioId);
			setHoldings(holdingsData || []);
			// Initialize applied strategies with 'none' for all holdings
			const initialStrategies: Record<string, string> = {};
			holdingsData.forEach((holding: any) => {
				initialStrategies[holding.id] = "none";
			});
			setAppliedStrategies(initialStrategies);
		} catch (error) {
			console.error("Error loading holdings:", error);
			setHoldings([]);
		} finally {
			setLoading(false);
		}
	};

	const handleStrategyChange = (holdingId: string, strategyId: string) => {
		setAppliedStrategies((prev) => {
			const updated = {
				...prev,
				[holdingId]: strategyId,
			};
			// Check if at least one strategy is applied
			const hasStrategy = Object.values(updated).some((sid) => sid !== "none");
			if (hasStrategy) {
				setFieldErrors((prevErrors) => ({ ...prevErrors, strategies: false }));
			}
			return updated;
		});
		// Close expansion when strategy is removed
		if (strategyId === "none") {
			setExpandedTokens((prev) => {
				const newSet = new Set(prev);
				newSet.delete(holdingId);
				return newSet;
			});
		}
	};

	const toggleTokenExpansion = (holdingId: string) => {
		setExpandedTokens((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(holdingId)) {
				newSet.delete(holdingId);
			} else {
				newSet.add(holdingId);
			}
			return newSet;
		});
	};

	const getCompatibleStrategies = (tokenSymbol: string) => {
		return theoreticalStrategies.filter((strategy) => strategy.tokenSymbol.toUpperCase() === tokenSymbol.toUpperCase());
	};

	const calculateTokenResult = (holding: any): {
		invested: number;
		amountCollected: number;
		returnPercentage: number;
		remainingTokens: number;
		remainingTokensValue: number;
		profitTargetsDetails: Array<{
			order: number;
			targetPrice: number;
			tokensSold: number;
			amountCollected: number;
		}>;
	} | null => {
		const strategyId = appliedStrategies[holding.id];
		if (!strategyId || strategyId === "none") {
			return null;
		}

		const strategy = theoreticalStrategies.find((s) => s.id === strategyId);
		if (!strategy) return null;

		const quantity = holding.quantity || 0;
		const averagePrice = holding.averagePrice || 0;
		const currentPrice = holding.currentPrice || averagePrice;

		let amountCollected = 0;
		let remainingTokens = quantity;
		const profitTargetsDetails: Array<{
			order: number;
			targetPrice: number;
			tokensSold: number;
			amountCollected: number;
		}> = [];

		// Calculate based on profit targets
		strategy.profitTargets.forEach((target) => {
			const targetPrice =
				target.targetType === "percentage"
					? averagePrice * (1 + target.targetValue / 100)
					: target.targetValue;

			const tokensToSell = (quantity * target.sellPercentage) / 100;
			const collected = tokensToSell * targetPrice;
			amountCollected += collected;
			remainingTokens -= tokensToSell;

			profitTargetsDetails.push({
				order: target.order,
				targetPrice,
				tokensSold: tokensToSell,
				amountCollected: collected,
			});
		});

		const invested = quantity * averagePrice;
		const totalProfit = amountCollected - invested;
		const returnPercentage = invested > 0 ? (totalProfit / invested) * 100 : 0;
		const remainingTokensValue = remainingTokens * currentPrice;

		return {
			invested,
			amountCollected,
			returnPercentage,
			remainingTokens,
			remainingTokensValue,
			profitTargetsDetails,
		};
	};

	const calculateGlobalSummary = () => {
		let totalInvested = 0;
		let totalCollected = 0;
		let totalRemainingTokensValue = 0;
		let tokenCount = 0;

		holdings.forEach((holding) => {
			const result = calculateTokenResult(holding);
			if (result) {
				// With strategy: use calculated values from result
				totalInvested += result.invested;
				totalCollected += result.amountCollected;
				totalRemainingTokensValue += result.remainingTokensValue;
				tokenCount++;
			} else {
				// Without strategy: count investment and use invested amount as current value (no profit/loss)
				const quantity = holding.quantity || 0;
				const averagePrice = holding.averagePrice || 0;
				const investedAmount = holding.investedAmount || quantity * averagePrice;
				totalInvested += investedAmount;
				totalRemainingTokensValue += investedAmount; // Current value = invested amount (no strategy applied)
			}
		});

		// Calculate profit: collected + remaining value - invested
		const totalProfit = totalCollected + totalRemainingTokensValue - totalInvested;
		const returnPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;

		return {
			totalInvested,
			totalCollected,
			totalProfit,
			returnPercentage,
			remainingTokensValue: totalRemainingTokensValue,
			tokenCount,
		};
	};

	const handleSubmit = async () => {
		// Validate required fields
		const errors = {
			portfolioId: !selectedPortfolioId,
			forecastName: !forecastName.trim(),
			strategies: !Object.values(appliedStrategies).some((strategyId) => strategyId !== "none"),
		};

		setFieldErrors(errors);

		// If there are errors, don't submit
		if (errors.portfolioId || errors.forecastName || errors.strategies) {
			return;
		}

		try {
			setIsSubmitting(true);
			const summary = calculateGlobalSummary();

			const forecastData: CreateForecastDto = {
				portfolioId: selectedPortfolioId,
				name: forecastName.trim(),
				appliedStrategies,
				summary,
			};

			await createForecast(forecastData);
			onSuccess();
			handleClose();
		} catch (error) {
			console.error("Error creating forecast:", error);
			alert("Failed to create forecast. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		setSelectedPortfolioId("");
		setForecastName("");
		setHoldings([]);
		setAppliedStrategies({});
		setFieldErrors({
			portfolioId: false,
			forecastName: false,
			strategies: false,
		});
		onClose();
	};

	const summary = calculateGlobalSummary();

	return (
		<Dialog fullWidth maxWidth="lg" onClose={handleClose} open={open}>
			<DialogTitle>
				<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
					<Typography variant="h6">Create Forecast</Typography>
					<IconButton onClick={handleClose} size="small">
						<XIcon />
					</IconButton>
				</Stack>
			</DialogTitle>
			<DialogContent dividers>
				<Stack spacing={4}>
					{/* Error Alert */}
					{(fieldErrors.portfolioId || fieldErrors.forecastName || fieldErrors.strategies) && (
						<Alert severity="error">
							Please fill in all required fields:
							<ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
								{fieldErrors.portfolioId && <li>Select a wallet</li>}
								{fieldErrors.forecastName && <li>Enter a forecast name</li>}
								{fieldErrors.strategies && <li>Apply at least one strategy to a token</li>}
							</ul>
						</Alert>
					)}

					{/* Configuration Section */}
					<Stack spacing={2}>
						<Typography variant="h6">Configuration</Typography>
						<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
							<FormControl fullWidth error={fieldErrors.portfolioId}>
								<InputLabel>Select a wallet</InputLabel>
								<Select
									label="Select a wallet"
									value={selectedPortfolioId}
									displayEmpty
									onChange={(e) => {
										setSelectedPortfolioId(e.target.value);
										if (e.target.value) {
											setFieldErrors((prev) => ({ ...prev, portfolioId: false }));
										}
									}}
								>
									<Option value="" disabled>
										<em>Select a wallet</em>
									</Option>
									{portfolios
										.filter((p) => p && p.id && p.name)
										.map((portfolio) => (
											<Option key={portfolio.id} value={portfolio.id}>
												{portfolio.name}
											</Option>
										))}
								</Select>
								{fieldErrors.portfolioId && <FormHelperText>This field is required</FormHelperText>}
							</FormControl>
							<TextField
								fullWidth
								label="Forecast name"
								onChange={(e) => {
									setForecastName(e.target.value);
									if (e.target.value.trim()) {
										setFieldErrors((prev) => ({ ...prev, forecastName: false }));
									}
								}}
								placeholder="Ex: Bullrun 2025 Strategy"
								value={forecastName}
								error={fieldErrors.forecastName}
								helperText={fieldErrors.forecastName ? "This field is required" : ""}
							/>
						</Stack>
					</Stack>

					{/* Holdings and Strategy Assignment */}
					{selectedPortfolioId && (
						<>
							{loading ? (
								<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
									<CircularProgress />
								</Box>
							) : holdings.length === 0 ? (
								<Card variant="outlined">
									<CardContent>
										<Typography color="text.secondary" textAlign="center" variant="body2">
											No tokens found in this wallet.
										</Typography>
									</CardContent>
								</Card>
							) : (
								<>
									<Stack spacing={2}>
										<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
											<Box>
												<Typography variant="h6">Apply Strategies to Tokens</Typography>
												<Typography color="text.secondary" variant="body2">
													For each token in your wallet, choose a profit-taking strategy.
												</Typography>
											</Box>
											{fieldErrors.strategies && (
												<Alert severity="error" sx={{ py: 0.5 }}>
													At least one strategy required
												</Alert>
											)}
										</Stack>
									</Stack>
									<Box sx={{ overflowX: "auto" }}>
										<Table>
											<TableHead>
												<TableRow>
													<TableCell sx={{ width: "40px", fontWeight: 600 }} />
													<TableCell sx={{ fontWeight: 600 }}>Token</TableCell>
													<TableCell align="right" sx={{ fontWeight: 600 }}>
														Quantity
													</TableCell>
													<TableCell align="right" sx={{ fontWeight: 600 }}>
														Invested
													</TableCell>
													<TableCell sx={{ fontWeight: 600 }}>Strategy</TableCell>
													<TableCell align="right" sx={{ fontWeight: 600 }}>
														Projected Return
													</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{holdings.map((holding) => {
													const compatibleStrategies = getCompatibleStrategies(
														holding.token?.symbol || holding.symbol || ""
													);
													const selectedStrategyId = appliedStrategies[holding.id] || "none";
													const result = calculateTokenResult(holding);
													const isExpanded = expandedTokens.has(holding.id);
													const selectedStrategy = theoreticalStrategies.find((s) => s.id === selectedStrategyId);

													return (
														<React.Fragment key={holding.id}>
															<TableRow>
																<TableCell>
																	{selectedStrategyId !== "none" && result && (
																		<IconButton
																			onClick={() => toggleTokenExpansion(holding.id)}
																			size="small"
																			sx={{ padding: "4px" }}
																		>
																			{isExpanded ? (
																				<CaretDownIcon fontSize="var(--icon-fontSize-md)" />
																			) : (
																				<CaretRightIcon fontSize="var(--icon-fontSize-md)" />
																			)}
																		</IconButton>
																	)}
																</TableCell>
																<TableCell>
																	<Typography variant="subtitle2">
																		{holding.token?.symbol || holding.symbol || "Unknown"}
																	</Typography>
																	<Typography color="text.secondary" variant="caption">
																		{holding.token?.name || holding.tokenName || ""}
																	</Typography>
																</TableCell>
																<TableCell align="right">
																	<Typography variant="body2">
																		{(holding.quantity || 0).toLocaleString(undefined, {
																			maximumFractionDigits: 8,
																		})}
																	</Typography>
																</TableCell>
																<TableCell align="right">
																	<Typography variant="body2">
																		{formatCurrency((holding.quantity || 0) * (holding.averagePrice || 0), "$", 2)}
																	</Typography>
																</TableCell>
																<TableCell>
																	<FormControl fullWidth size="small">
																		<Select
																			value={selectedStrategyId}
																			onChange={(e) => handleStrategyChange(holding.id, e.target.value)}
																		>
																			<Option value="none">No strategy</Option>
																			{compatibleStrategies.map((strategy) => (
																				<Option key={strategy.id} value={strategy.id}>
																					{strategy.name}
																				</Option>
																			))}
																		</Select>
																	</FormControl>
																</TableCell>
																<TableCell align="right">
																	{result ? (
																		<Stack spacing={0.5}>
																			<Typography
																				color={result.returnPercentage >= 0 ? "success.main" : "error.main"}
																				variant="body2"
																			>
																				{formatPercentage(result.returnPercentage)}
																			</Typography>
																			<Typography color="text.secondary" variant="caption">
																				{formatCurrency(result.amountCollected, "$", 2)}
																			</Typography>
																		</Stack>
																	) : (
																		<Typography color="text.secondary" variant="body2">
																			-
																		</Typography>
																	)}
																</TableCell>
															</TableRow>
															{selectedStrategyId !== "none" && result && (
																<TableRow>
																	<TableCell colSpan={6} sx={{ py: 0, borderBottom: isExpanded ? "1px solid var(--mui-palette-divider)" : "none" }}>
																		<Collapse in={isExpanded} timeout="auto" unmountOnExit>
																			<Box sx={{ py: 2 }}>
																				<Card variant="outlined" sx={{ bgcolor: "var(--mui-palette-background-level1)" }}>
																					<CardContent>
																						<Stack spacing={2}>
																							<Typography variant="subtitle2">
																								Profit takings for strategy {selectedStrategy?.name} on {holding.token?.symbol || holding.symbol}
																							</Typography>
																							<List dense>
																								{result.profitTargetsDetails.map((detail) => {
																									const percentage = holding.quantity > 0 ? (detail.tokensSold / holding.quantity) * 100 : 0;
																									return (
																										<ListItem key={detail.order} sx={{ py: 0.5 }}>
																											<Checkbox checked size="small" sx={{ p: 0, mr: 1 }} />
																											<ListItemText
																												primary={
																													<Typography variant="body2" sx={{ color: "text.primary" }}>
																														TP {detail.order}: {holding.token?.symbol || holding.symbol} = {formatCurrency(detail.targetPrice, "$", 2)} Sell <Typography component="span" variant="body2" sx={{ color: "primary.main", fontWeight: 600 }}>{percentage.toFixed(1)}%</Typography>
																													</Typography>
																												}
																											/>
																										</ListItem>
																									);
																								})}
																							</List>
																						</Stack>
																					</CardContent>
																				</Card>
																			</Box>
																		</Collapse>
																	</TableCell>
																</TableRow>
															)}
														</React.Fragment>
													);
												})}
											</TableBody>
										</Table>
									</Box>
								</>
							)}
						</>
					)}

					{/* Summary Section */}
					{selectedPortfolioId && holdings.length > 0 && (
						<Card variant="outlined" sx={{ bgcolor: "var(--mui-palette-background-level1)" }}>
							<CardContent>
								<Typography variant="subtitle1" sx={{ mb: 2 }}>
									Summary
								</Typography>
								<Stack direction="row" spacing={4} sx={{ flexWrap: "wrap" }}>
									<Box>
										<Typography color="text.secondary" variant="caption">
											Total Invested
										</Typography>
										<Typography variant="h6">{formatCurrency(summary.totalInvested, "$", 2)}</Typography>
									</Box>
									<Box>
										<Typography color="text.secondary" variant="caption">
											Total Collected
										</Typography>
										<Typography color="success.main" variant="h6">
											{formatCurrency(summary.totalCollected, "$", 2)}
										</Typography>
									</Box>
									<Box>
										<Typography color="text.secondary" variant="caption">
											Total Profit
										</Typography>
										<Typography
											color={summary.totalProfit >= 0 ? "success.main" : "error.main"}
											variant="h6"
										>
											{formatCurrency(summary.totalProfit, "$", 2)}
										</Typography>
									</Box>
									<Box>
										<Typography color="text.secondary" variant="caption">
											Return %
										</Typography>
										<Typography
											color={summary.returnPercentage >= 0 ? "success.main" : "error.main"}
											variant="h6"
										>
											{formatPercentage(summary.returnPercentage)}
										</Typography>
									</Box>
									<Box>
										<Typography color="text.secondary" variant="caption">
											Remaining Tokens Value
										</Typography>
										<Typography variant="h6">
											{formatCurrency(summary.remainingTokensValue, "$", 2)}
										</Typography>
									</Box>
								</Stack>
							</CardContent>
						</Card>
					)}
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose}>Cancel</Button>
				<Button
					disabled={isSubmitting}
					onClick={handleSubmit}
					startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
					variant="contained"
				>
					{isSubmitting ? "Creating..." : "Create Forecast"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

