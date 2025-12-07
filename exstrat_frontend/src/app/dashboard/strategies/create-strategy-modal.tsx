"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import LinearProgress from "@mui/material/LinearProgress";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import Step from "@mui/material/Step";
import StepContent from "@mui/material/StepContent";
import type { StepIconProps } from "@mui/material/StepIcon";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { z as zod } from "zod";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { MinusIcon } from "@phosphor-icons/react/dist/ssr/Minus";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { ChartPieIcon } from "@phosphor-icons/react/dist/ssr/ChartPie";

import { strategiesApi } from "@/lib/strategies-api";
import * as portfoliosApi from "@/lib/portfolios-api";
import { transactionsApi } from "@/lib/transactions-api";
import { formatCurrency, formatPercentage } from "@/lib/format";
import type { CreateStrategyDto, TargetType } from "@/types/strategies";
import { StrategyStatus } from "@/types/strategies";
import { TokenSearch } from "@/components/transactions/token-search";
import type { TokenSearchResult } from "@/types/transactions";
import type { Portfolio, Holding } from "@/types/portfolio";
import { usePortfolio } from "@/contexts/PortfolioContext";
import { Option } from "@/components/core/option";

// Type partiel pour les tokens disponibles depuis les holdings
type AvailableToken = Pick<TokenSearchResult, "id" | "symbol" | "name"> & {
	quote: {
		USD: {
			price: number | null;
		};
	};
};

interface ProfitTarget {
	id: string;
	targetType: "percentage" | "price";
	targetValue: number;
	sellPercentage: number;
}

interface StrategyInfo {
	remainingTokens: number;
	remainingTokensValuation: number;
	amountCollected: number;
	remainingBagValue: number;
}

interface CreateStrategyModalProps {
	onClose: () => void;
	onSuccess: () => void;
	open: boolean;
}

function StepIcon({ active, completed, icon }: StepIconProps & { icon: number }): React.JSX.Element {
	const highlight = active || completed;

	return (
		<Avatar
			sx={{
				...(highlight && {
					bgcolor: "var(--mui-palette-primary-main)",
					color: "var(--mui-palette-primary-contrastText)",
				}),
				variant: "rounded",
			}}
		>
			{completed ? <CheckIcon /> : icon}
		</Avatar>
	);
}

export function CreateStrategyModal({ onClose, onSuccess, open }: CreateStrategyModalProps): React.JSX.Element {
	const { portfolios, refreshPortfolios } = usePortfolio();
	const [activeStep, setActiveStep] = React.useState(0);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	// Strategy form data
	const [selectedPortfolioId, setSelectedPortfolioId] = React.useState<string>("");
	const [selectedToken, setSelectedToken] = React.useState<TokenSearchResult | AvailableToken | null>(null);
	const [availableQuantity, setAvailableQuantity] = React.useState<number>(0);
	const [strategyQuantity, setStrategyQuantity] = React.useState<string>("");
	const [strategyAveragePrice, setStrategyAveragePrice] = React.useState<string>("");
	const [strategyName, setStrategyName] = React.useState<string>("");
	const [numberOfTargets, setNumberOfTargets] = React.useState<number>(0);
	const [profitTargets, setProfitTargets] = React.useState<ProfitTarget[]>([]);
	const [availableTokens, setAvailableTokens] = React.useState<AvailableToken[]>([]);
	const [investmentData, setInvestmentData] = React.useState<{
		numberOfTransactions: number;
		totalInvested: number;
		totalQuantity: number;
		averagePrice: number;
		currentPrice?: number;
		currentPNL?: number;
		currentPNLPercentage?: number;
	} | null>(null);

	const isVirtualWallet = selectedPortfolioId === "virtual";

	// Load portfolios on mount
	React.useEffect(() => {
		if (open) {
			refreshPortfolios();
		}
	}, [open, refreshPortfolios]);

	// Load available tokens when portfolio is selected
	React.useEffect(() => {
		const loadAvailableTokens = async () => {
			if (!selectedPortfolioId || selectedPortfolioId === "virtual" || !portfolios.length) {
				setAvailableTokens([]);
				return;
			}

			try {
				const holdings = await portfoliosApi.getPortfolioHoldings(selectedPortfolioId);
				const tokens: AvailableToken[] = holdings.map((holding) => ({
					id: holding.token.cmcId || 0,
					symbol: holding.token.symbol,
					name: holding.token.name,
					quote: {
						USD: {
							price: holding.currentPrice || null,
						},
					},
				}));
				setAvailableTokens(tokens);
			} catch (error) {
				console.error("Error loading available tokens:", error);
				setAvailableTokens([]);
			}
		};

		loadAvailableTokens();
	}, [selectedPortfolioId, portfolios]);

	// Load available quantity when token is selected
	React.useEffect(() => {
		const loadAvailableQuantity = async () => {
			if (isVirtualWallet || !selectedToken || !selectedPortfolioId || selectedPortfolioId === "virtual") {
				setAvailableQuantity(0);
				return;
			}

			try {
				const holdings = await portfoliosApi.getPortfolioHoldings(selectedPortfolioId);
				const holding = holdings.find((h) => h.token.symbol.toUpperCase() === selectedToken.symbol.toUpperCase());

				if (holding) {
					setAvailableQuantity(holding.quantity);
					if (holding.quantity > 0) {
						setStrategyQuantity(holding.quantity.toString());
					}
					// Calculate average price from transactions
					if (holding.averagePrice) {
						setStrategyAveragePrice(holding.averagePrice.toString());
					}
				} else {
					setAvailableQuantity(0);
					setStrategyQuantity("");
				}
			} catch (error) {
				console.error("Error loading available quantity:", error);
				setAvailableQuantity(0);
			}
		};

		loadAvailableQuantity();
	}, [selectedPortfolioId, selectedToken, isVirtualWallet]);

	// Load investment data when token and quantity are set
	React.useEffect(() => {
		const loadInvestmentData = async () => {
			if (!selectedToken || !strategyQuantity || !strategyAveragePrice) {
				setInvestmentData(null);
				return;
			}

			try {
				const qty = parseFloat(strategyQuantity);
				const avgPrice = parseFloat(strategyAveragePrice);

				if (qty <= 0 || avgPrice <= 0) {
					setInvestmentData(null);
					return;
				}

				// For virtual wallet, use simple calculation
				if (isVirtualWallet) {
					const currentPrice = selectedToken.quote?.USD?.price || avgPrice;
					const totalInvested = qty * avgPrice;
					const currentValue = qty * currentPrice;
					const currentPNL = currentValue - totalInvested;
					const currentPNLPercentage = totalInvested > 0 ? (currentPNL / totalInvested) * 100 : 0;

					setInvestmentData({
						numberOfTransactions: 1,
						totalInvested,
						totalQuantity: qty,
						averagePrice: avgPrice,
						currentPrice,
						currentPNL,
						currentPNLPercentage,
					});
					return;
				}

				// For real wallet, calculate from actual transactions
				if (!selectedPortfolioId) {
					setInvestmentData(null);
					return;
				}

				// Get transactions for this token in the selected portfolio
				const allTransactionsResponse = await transactionsApi.getTransactions();
				const transactionsArray = Array.isArray(allTransactionsResponse?.transactions)
					? allTransactionsResponse.transactions
					: [];
				const portfolioTransactions = transactionsArray.filter(
					(t) =>
						t.portfolioId === selectedPortfolioId &&
						t.symbol?.toUpperCase() === selectedToken.symbol.toUpperCase()
				);

				// Get holding to get current price
				const holdings = await portfoliosApi.getPortfolioHoldings(selectedPortfolioId);
				const holding = holdings.find(
					(h) => h.token?.symbol?.toUpperCase() === selectedToken.symbol.toUpperCase()
				);

				const currentPrice = holding?.currentPrice || selectedToken.quote?.USD?.price || avgPrice;
				const totalInvested = portfolioTransactions.reduce((sum, t) => sum + (t.amountInvested || 0), 0);
				const totalQuantity = portfolioTransactions.reduce((sum, t) => sum + (t.quantity || 0), 0);
				const averagePrice = totalQuantity > 0 ? totalInvested / totalQuantity : avgPrice;
				const currentValue = qty * currentPrice;
				const currentPNL = currentValue - totalInvested;
				const currentPNLPercentage = totalInvested > 0 ? (currentPNL / totalInvested) * 100 : 0;

				setInvestmentData({
					numberOfTransactions: portfolioTransactions.length || 1,
					totalInvested: totalInvested || qty * avgPrice,
					totalQuantity: totalQuantity || qty,
					averagePrice: averagePrice || avgPrice,
					currentPrice,
					currentPNL,
					currentPNLPercentage,
				});
			} catch (error) {
				console.error("Error loading investment data:", error);
				setInvestmentData(null);
			}
		};

		loadInvestmentData();
	}, [selectedToken, strategyQuantity, strategyAveragePrice, isVirtualWallet, selectedPortfolioId]);

	// Initialize profit targets when number changes
	React.useEffect(() => {
		if (numberOfTargets <= 0) {
			setProfitTargets([]);
			return;
		}

		const newTargets: ProfitTarget[] = [];
		for (let i = 0; i < numberOfTargets; i++) {
			newTargets.push({
				id: `target-${i}`,
				targetType: "percentage",
				targetValue: (i + 1) * 50, // 50%, 100%, 150%, etc.
				sellPercentage: 0, // Start at 0, user can set custom percentages
			});
		}
		setProfitTargets(newTargets);
	}, [numberOfTargets]);

	// Calculate strategy info for each target
	const strategyInfo = React.useMemo<StrategyInfo[]>(() => {
		if (!strategyQuantity || !strategyAveragePrice || profitTargets.length === 0) {
			return [];
		}

		const qty = parseFloat(strategyQuantity);
		const avgPrice = parseFloat(strategyAveragePrice);
		const currentPrice = selectedToken?.quote?.USD?.price || avgPrice;

		let remainingTokens = qty;
		const info: StrategyInfo[] = [];

		profitTargets.forEach((target) => {
			// Calculate target price
			let targetPrice = 0;
			if (target.targetType === "percentage") {
				targetPrice = avgPrice * (1 + target.targetValue / 100);
			} else {
				targetPrice = target.targetValue;
			}

			// Calculate tokens to sell
			const tokensToSell = (remainingTokens * target.sellPercentage) / 100;
			const amountCollected = tokensToSell * targetPrice;
			remainingTokens -= tokensToSell;

			// Calculate remaining bag value
			const remainingBagValue = remainingTokens * currentPrice;

			info.push({
				remainingTokens,
				remainingTokensValuation: remainingBagValue,
				amountCollected,
				remainingBagValue,
			});
		});

		return info;
	}, [strategyQuantity, strategyAveragePrice, profitTargets, selectedToken]);

	const handleNext = () => {
		if (activeStep === 0 && selectedPortfolioId) {
			setActiveStep(1);
		} else if (activeStep === 1 && selectedToken) {
			setActiveStep(2);
		} else if (activeStep === 2 && strategyQuantity && parseFloat(strategyQuantity) > 0) {
			setActiveStep(3);
		} else if (activeStep === 3 && strategyName) {
			setActiveStep(4);
		} else if (activeStep === 4 && numberOfTargets > 0) {
			setActiveStep(5);
		}
	};

	const handleBack = () => {
		setActiveStep((prev) => Math.max(0, prev - 1));
	};

	const handleTargetChange = (index: number, field: keyof ProfitTarget, value: number | string) => {
		setProfitTargets((prev) => {
			const newTargets = [...prev];
			newTargets[index] = { ...newTargets[index], [field]: value };
			return newTargets;
		});
	};

	const handleSellPercentageChange = (index: number, value: number) => {
		// Calculate max value based on other targets to keep total at 100%
		const otherTargetsTotal = profitTargets.reduce((sum, t, idx) => (idx === index ? sum : sum + t.sellPercentage), 0);
		const maxValue = Math.max(0, 100 - otherTargetsTotal);
		const clampedValue = Math.max(0, Math.min(maxValue, value));
		handleTargetChange(index, "sellPercentage", clampedValue);
	};

	const handleTokensChange = (index: number, tokens: number) => {
		const qty = parseFloat(strategyQuantity);
		if (isNaN(qty) || qty <= 0) return;

		const percentage = (tokens / qty) * 100;
		handleSellPercentageChange(index, percentage);
	};

	const handleSubmit = async () => {
		if (!selectedToken || !strategyQuantity || !strategyAveragePrice || !strategyName || numberOfTargets === 0) {
			return;
		}

		setIsSubmitting(true);
		try {
			const strategyData: CreateStrategyDto = {
				name: strategyName,
				symbol: selectedToken.symbol,
				tokenName: selectedToken.name,
				cmcId: selectedToken.id,
				baseQuantity: parseFloat(strategyQuantity),
				referencePrice: parseFloat(strategyAveragePrice),
				steps: profitTargets.map((target, index) => ({
					targetType: (target.targetType === "percentage" ? "percentage_of_average" : "exact_price") as TargetType,
					targetValue: target.targetValue,
					sellPercentage: target.sellPercentage,
					notes: "",
				})),
				notes: "",
				status: StrategyStatus.PAUSED, // Create strategy as paused (desactive) by default
			};

			await strategiesApi.createStrategy(strategyData);
			onSuccess();
			handleClose();
		} catch (error) {
			console.error("Error creating strategy:", error);
			// TODO: Show error toast
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleClose = () => {
		setActiveStep(0);
		setSelectedPortfolioId("");
		setSelectedToken(null);
		setAvailableQuantity(0);
		setStrategyQuantity("");
		setStrategyAveragePrice("");
		setStrategyName("");
		setNumberOfTargets(0);
		setProfitTargets([]);
		setAvailableTokens([]);
		setInvestmentData(null);
		onClose();
	};

	const steps = [
		{ label: "Choose your wallet", key: "wallet" },
		{ label: "Choose a token", key: "token" },
		{ label: "Quantity to apply", key: "quantity" },
		{ label: "Strategy name", key: "name" },
		{ label: "Number of exits", key: "exits" },
		{ label: "Target Configuration", key: "targets" },
	];

	return (
		<Dialog fullWidth maxWidth="lg" onClose={handleClose} open={open}>
			<DialogTitle>
				<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
					<Typography variant="h6">Create Strategy</Typography>
					<IconButton onClick={handleClose} size="small">
						<XIcon />
					</IconButton>
				</Stack>
			</DialogTitle>
			<DialogContent dividers>
				<Grid container spacing={4}>
					{/* Left Column: Strategy Settings */}
					<Grid size={{ xs: 12, md: 7 }}>
						<Stack spacing={3}>
							<Typography variant="h6">Strategy Settings</Typography>
							<Stepper activeStep={activeStep} orientation="vertical">
								{steps.map((step, index) => (
									<Step key={step.key}>
										<StepLabel
											StepIconComponent={(props) => (
												<StepIcon {...props} icon={index + 1} />
											)}
											onClick={() => {
												// Allow clicking on completed steps or current step to navigate back
												if (activeStep > index || activeStep === index) {
													setActiveStep(index);
												}
											}}
											sx={{
												cursor: activeStep >= index ? "pointer" : "default",
												"&:hover": activeStep >= index ? { opacity: 0.7 } : {},
											}}
										>
											<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
												<Typography variant="subtitle2">
													{index + 1}. {step.label}
												</Typography>
												{activeStep > index && (
													<Chip color="success" label="Completed" size="small" />
												)}
											</Stack>
										</StepLabel>
										<StepContent>
											<Box sx={{ py: 2 }}>
												{/* Step 1: Wallet Selection */}
												{index === 0 && (
													<Stack spacing={2}>
														<FormControl fullWidth>
															<InputLabel>Select a wallet</InputLabel>
															<Select
																label="Select a wallet"
																value={selectedPortfolioId}
																displayEmpty
																onChange={(e) => {
																	setSelectedPortfolioId(e.target.value);
																	setSelectedToken(null);
																	setStrategyQuantity("");
																	setStrategyName("");
																	setNumberOfTargets(0);
																	setProfitTargets([]);
																	if (e.target.value && e.target.value !== "virtual") {
																		setActiveStep(1);
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
																<Divider sx={{ my: 1 }} />
																<Option value="virtual" disabled>
																	Virtual Wallet (Coming soon)
																</Option>
															</Select>
														</FormControl>
													</Stack>
												)}

												{/* Step 2: Token Selection */}
												{index === 1 && selectedPortfolioId && (
													<Stack spacing={2}>
														{availableTokens.length > 0 && !isVirtualWallet ? (
														<FormControl fullWidth>
															<InputLabel>Select a token</InputLabel>
															<Select
																label="Select a token"
																value={selectedToken?.symbol || ""}
																displayEmpty
																onChange={(e) => {
																	const token = availableTokens.find((t) => t.symbol === e.target.value);
																	if (token) {
																		setSelectedToken(token);
																		// Automatically move to next step when token is selected
																		setActiveStep(2);
																	}
																}}
															>
																<Option value="" disabled>
																	<em>Select a token</em>
																</Option>
																	{availableTokens.map((token) => (
																		<Option key={token.symbol} value={token.symbol}>
																			{token.symbol} - {token.name}
																		</Option>
																	))}
																</Select>
															</FormControl>
														) : (
															<TokenSearch
																onTokenSelect={(token) => {
																	setSelectedToken(token);
																	// Automatically move to next step when token is selected
																	if (token) {
																		setActiveStep(2);
																	}
																}}
																selectedToken={selectedToken}
															/>
														)}
													</Stack>
												)}

												{/* Step 3: Quantity */}
												{index === 2 && selectedToken && (
													<Stack spacing={2}>
														<Stack spacing={1}>
															<Typography variant="body2" color="primary">
																Quantity
															</Typography>
															<Box sx={{ px: 1 }}>
																<Slider
																	min={0}
																	max={!isVirtualWallet && availableQuantity > 0 ? availableQuantity : parseFloat(strategyQuantity) || 1}
																	step={0.00000001}
																	value={parseFloat(strategyQuantity) || 0}
																	onChange={(_, value) => {
																		const numValue = value as number;
																		if (!isVirtualWallet && availableQuantity > 0 && numValue > availableQuantity) {
																			setStrategyQuantity(availableQuantity.toString());
																		} else {
																			setStrategyQuantity(numValue.toString());
																		}
																	}}
																	valueLabelDisplay="auto"
																	valueLabelFormat={(value) => `${value.toFixed(8)} ${selectedToken?.symbol || ""}`}
																/>
															</Box>
															<TextField
																fullWidth
																type="number"
																value={strategyQuantity}
																onChange={(e) => {
																	const value = e.target.value;
																	if (!isVirtualWallet && availableQuantity > 0 && value) {
																		const numValue = parseFloat(value);
																		if (numValue > availableQuantity) {
																			return;
																		}
																	}
																	setStrategyQuantity(value);
																}}
																inputProps={{ step: "0.00000001", min: 0, max: !isVirtualWallet && availableQuantity > 0 ? availableQuantity : undefined }}
																helperText={
																	!isVirtualWallet && availableQuantity > 0
																		? `Maximum available: ${availableQuantity.toLocaleString(undefined, { maximumFractionDigits: 8 })} ${selectedToken?.symbol || ""}`
																		: undefined
																}
															/>
															{!isVirtualWallet && parseFloat(strategyQuantity) > availableQuantity && (
																<Typography color="error" variant="body2">
																	Quantity exceeds available ({availableQuantity.toLocaleString(undefined, { maximumFractionDigits: 8 })})
																</Typography>
															)}
														</Stack>
														<TextField
															fullWidth
															label="Average Price (USD)"
															type="number"
															value={strategyAveragePrice}
															onChange={(e) => setStrategyAveragePrice(e.target.value)}
															inputProps={{ step: "0.01" }}
														/>
														{strategyQuantity && parseFloat(strategyQuantity) > 0 && (
															<Stack direction="row" spacing={2}>
																<Button onClick={handleBack} variant="outlined">
																	Previous
																</Button>
																<Button onClick={handleNext} variant="contained">
																	Next
																</Button>
															</Stack>
														)}
													</Stack>
												)}

												{/* Step 4: Strategy Name */}
												{index === 3 && strategyQuantity && (
													<Stack spacing={2}>
														<TextField
															fullWidth
															label="Strategy Name"
															value={strategyName}
															onChange={(e) => setStrategyName(e.target.value)}
															placeholder="e.g., BTC Strategy 2025"
														/>
														{strategyName && (
															<Stack direction="row" spacing={2}>
																<Button onClick={handleBack} variant="outlined">
																	Previous
																</Button>
																<Button onClick={handleNext} variant="contained">
																	Next
																</Button>
															</Stack>
														)}
													</Stack>
												)}

												{/* Step 5: Number of Exits */}
												{index === 4 && strategyName && (
													<Stack spacing={2}>
														<FormControl fullWidth>
															<InputLabel>Number of exits</InputLabel>
															<Select
																label="Number of exits"
																value={numberOfTargets > 0 ? numberOfTargets.toString() : ""}
																onChange={(e) => {
																	const val = parseInt(e.target.value);
																	if (!isNaN(val) && val >= 1 && val <= 6) {
																		setNumberOfTargets(val);
																		setActiveStep(5);
																	}
																}}
															>
																{[1, 2, 3, 4, 5, 6].map((num) => (
																	<Option key={num} value={num.toString()}>
																		{num} {num === 1 ? "exit" : "exits"}
																	</Option>
																))}
															</Select>
														</FormControl>
													</Stack>
												)}

												{/* Step 6: Target Configuration */}
												{index === 5 && numberOfTargets > 0 && profitTargets.length > 0 && (
													<Stack spacing={3}>
														{profitTargets.map((target, targetIndex) => {
															const info = strategyInfo[targetIndex];
															const qty = parseFloat(strategyQuantity);
															const avgPrice = parseFloat(strategyAveragePrice);

															// Calculate target price
															let targetPrice = 0;
															if (target.targetType === "percentage") {
																targetPrice = avgPrice * (1 + target.targetValue / 100);
															} else {
																targetPrice = target.targetValue;
															}

															return (
																<Card key={target.id} variant="outlined">
																	<CardContent>
																		<Stack spacing={3}>
																			{/* Target Header */}
																			<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
																				<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
																					<Avatar sx={{ bgcolor: "var(--mui-palette-primary-main)", width: 32, height: 32 }}>
																						{targetIndex + 1}
																					</Avatar>
																					<Typography variant="subtitle1">Exit Target #{targetIndex + 1}</Typography>
																				</Stack>
																				<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
																					<Typography variant="body2">Percentage</Typography>
																					<Switch
																						checked={target.targetType === "price"}
																						onChange={(e) =>
																							handleTargetChange(targetIndex, "targetType", e.target.checked ? "price" : "percentage")
																						}
																					/>
																					<Typography variant="body2">Price</Typography>
																				</Stack>
																			</Stack>

																			{/* Target Value */}
																			<Grid container spacing={2}>
																				<Grid size={{ xs: 12, sm: 6 }}>
																					<Stack spacing={1}>
																						<Typography variant="body2">
																							{target.targetType === "percentage" ? "Percentage (%)" : "Price (USD)"}
																						</Typography>
																						{target.targetType === "percentage" ? (
																							<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
																								<IconButton
																									onClick={() => handleTargetChange(targetIndex, "targetValue", Math.max(0, target.targetValue - 10))}
																									size="small"
																								>
																									<MinusIcon />
																								</IconButton>
																								<TextField
																									fullWidth
																									type="number"
																									value={target.targetValue}
																									onChange={(e) => handleTargetChange(targetIndex, "targetValue", parseFloat(e.target.value) || 0)}
																									inputProps={{ step: "0.01" }}
																								/>
																								<IconButton
																									onClick={() => handleTargetChange(targetIndex, "targetValue", target.targetValue + 10)}
																									size="small"
																								>
																									<PlusIcon />
																								</IconButton>
																							</Stack>
																						) : (
																							<TextField
																								fullWidth
																								type="number"
																								value={target.targetValue}
																								onChange={(e) => handleTargetChange(targetIndex, "targetValue", parseFloat(e.target.value) || 0)}
																								inputProps={{ step: "0.01" }}
																							/>
																						)}
																						{target.targetType === "percentage" && !isNaN(avgPrice) && avgPrice > 0 && (
																							<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
																								<Typography color="primary" variant="body2">
																									{target.targetValue > 0 ? `${100 + target.targetValue}%` : "100%"}
																								</Typography>
																								<Typography color="primary" variant="body2">
																									= {formatCurrency(targetPrice, "$", 6)}
																								</Typography>
																							</Stack>
																						)}
																					</Stack>
																				</Grid>

																				{/* Sell Percentage */}
																				<Grid size={{ xs: 12, sm: 6 }}>
																					<Stack spacing={2}>
																						<Typography variant="body2">Quantity to sell</Typography>
																						<Stack spacing={1}>
																							<Box sx={{ px: 1 }}>
																								{(() => {
																									const otherTargetsTotal = profitTargets.reduce(
																										(sum, t, idx) => (idx === targetIndex ? sum : sum + t.sellPercentage),
																										0
																									);
																									const maxValue = Math.max(0, 100 - otherTargetsTotal);
																									return (
																										<Slider
																											min={0}
																											max={100}
																											step={0.1}
																											value={target.sellPercentage}
																											onChange={(_, value) => {
																												const newValue = value as number;
																												// Limit the value based on what's available
																												const clampedValue = Math.min(newValue, maxValue);
																												handleTargetChange(targetIndex, "sellPercentage", clampedValue);
																											}}
																										/>
																									);
																								})()}
																							</Box>
																							<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
																								{(() => {
																									const otherTargetsTotal = profitTargets.reduce(
																										(sum, t, idx) => (idx === targetIndex ? sum : sum + t.sellPercentage),
																										0
																									);
																									const maxValue = Math.max(0, 100 - otherTargetsTotal);
																									return (
																										<TextField
																											size="small"
																											type="number"
																											value={target.sellPercentage.toFixed(1)}
																											onChange={(e) => {
																												const value = parseFloat(e.target.value);
																												if (!isNaN(value) && value >= 0) {
																													handleSellPercentageChange(targetIndex, value);
																												}
																											}}
																											inputProps={{ step: "0.1", min: 0, max: maxValue }}
																											sx={{ width: 100 }}
																										/>
																									);
																								})()}
																								<Typography variant="body2">%</Typography>
																								<TextField
																									size="small"
																									type="number"
																									value={
																										qty > 0 && target.sellPercentage > 0
																											? ((qty * target.sellPercentage) / 100).toFixed(8)
																											: ""
																									}
																									onChange={(e) => {
																										const value = parseFloat(e.target.value);
																										if (!isNaN(value) && value >= 0) {
																											handleTokensChange(targetIndex, value);
																										}
																									}}
																									inputProps={{ step: "0.00000001", min: 0 }}
																									sx={{ width: 150 }}
																								/>
																								<Typography variant="body2">tokens</Typography>
																							</Stack>
																						</Stack>
																					</Stack>
																				</Grid>
																			</Grid>

																			{/* Projections */}
																			{info && (
																				<Card variant="outlined" sx={{ bgcolor: "var(--mui-palette-background-level1)" }}>
																					<CardContent>
																						<Typography variant="subtitle2" sx={{ mb: 2 }}>
																							Simulation #{targetIndex + 1}
																						</Typography>
																						<Stack spacing={1}>
																							<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
																								<Typography color="text.secondary" variant="body2">
																									Remaining tokens valuation:
																								</Typography>
																								<Typography color="success.main" variant="body2">
																									{formatCurrency(info.remainingTokensValuation, "$", 2)}
																								</Typography>
																							</Stack>
																							<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
																								<Typography color="text.secondary" variant="body2">
																									Amount collected:
																								</Typography>
																								<Typography color="success.main" variant="body2">
																									{formatCurrency(info.amountCollected, "$", 2)}
																								</Typography>
																							</Stack>
																							<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
																								<Typography color="text.secondary" variant="body2">
																									Remaining bag value:
																								</Typography>
																								<Typography color="success.main" variant="body2">
																									{formatCurrency(info.remainingBagValue, "$", 2)}
																								</Typography>
																							</Stack>
																							<Divider />
																							<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
																								<Typography color="text.secondary" variant="body2">
																									Number of remaining tokens:
																								</Typography>
																								<Typography color="warning.main" variant="h6">
																									{info.remainingTokens.toFixed(8)}
																								</Typography>
																							</Stack>
																						</Stack>
																					</CardContent>
																				</Card>
																			)}
																		</Stack>
																	</CardContent>
																</Card>
															);
														})}

														{(() => {
															const totalPercentage = profitTargets.reduce((sum, t) => sum + t.sellPercentage, 0);
															return (
																<Stack spacing={1}>
																	<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "center" }}>
																		<Typography variant="body2">Total sell percentage:</Typography>
																		<Typography
																			color={totalPercentage > 100 ? "error.main" : totalPercentage === 100 ? "success.main" : "text.secondary"}
																			variant="body2"
																			sx={{ fontWeight: "bold" }}
																		>
																			{totalPercentage.toFixed(1)}%
																		</Typography>
																	</Stack>
																	{totalPercentage > 100 && (
																		<Typography color="error" variant="body2">
																			Warning: The sum exceeds 100%! Please adjust the percentages.
																		</Typography>
																	)}
																	{totalPercentage < 100 && totalPercentage > 0 && (
																		<Typography color="warning.main" variant="body2">
																			The sum is less than 100%. You can add more or adjust the percentages.
																		</Typography>
																	)}
																	{totalPercentage === 100 && (
																		<Typography color="success.main" variant="body2">
																			✓ Total is exactly 100%!
																		</Typography>
																	)}
																</Stack>
															);
														})()}
													</Stack>
												)}
											</Box>
										</StepContent>
									</Step>
								))}
							</Stepper>
						</Stack>
					</Grid>

					{/* Right Column: Investment Data */}
					<Grid
						size={{ xs: 12, md: 5 }}
						sx={{
							position: { md: "sticky" },
							top: { md: 24 },
							alignSelf: { md: "flex-start" },
							maxHeight: { md: "calc(100vh - 200px)" },
							overflowY: { md: "auto" },
						}}
					>
						<Stack spacing={3}>
							<Typography variant="h6">Your Investment Data</Typography>
							<Card variant="outlined">
								<CardContent>
									<Stack spacing={2}>
										<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
											<Typography color="text.secondary" variant="body2">
												Number of entries
											</Typography>
											<Typography variant="body2">
												{investmentData?.numberOfTransactions || (strategyQuantity && strategyAveragePrice ? 1 : 0)}
											</Typography>
										</Stack>
										<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
											<Typography color="text.secondary" variant="body2">
												Total invested
											</Typography>
											<Typography color="success.main" variant="body2">
												{investmentData
													? formatCurrency(investmentData.totalInvested, "$", 2)
													: strategyQuantity && strategyAveragePrice
														? formatCurrency(parseFloat(strategyQuantity) * parseFloat(strategyAveragePrice), "$", 2)
														: "$0.00"}
											</Typography>
										</Stack>
										<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
											<Typography color="text.secondary" variant="body2">
												Tokens held
											</Typography>
											<Typography color="warning.main" variant="body2">
												{investmentData?.totalQuantity ||
													(strategyQuantity ? parseFloat(strategyQuantity).toLocaleString(undefined, { maximumFractionDigits: 8 }) : "0")}
											</Typography>
										</Stack>
										<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
											<Typography color="text.secondary" variant="body2">
												Average purchase price
											</Typography>
											<Typography color="primary.main" variant="body2">
												{investmentData?.averagePrice
													? formatCurrency(investmentData.averagePrice, "$", 2)
													: strategyAveragePrice
														? formatCurrency(parseFloat(strategyAveragePrice), "$", 2)
														: "$0.00"}
											</Typography>
										</Stack>
										{investmentData?.currentPNL !== undefined && (
											<>
												<Divider />
												<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
													<Typography color="text.secondary" variant="body2">
														Current PNL
													</Typography>
													<Typography
														color={investmentData.currentPNL >= 0 ? "success.main" : "error.main"}
														variant="body2"
													>
														{formatCurrency(investmentData.currentPNL, "$", 2)}
													</Typography>
												</Stack>
												<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
													<Typography color="text.secondary" variant="body2">
														PNL %
													</Typography>
													<Typography
														color={(investmentData.currentPNLPercentage ?? 0) >= 0 ? "success.main" : "error.main"}
														variant="body2"
													>
														{(investmentData.currentPNLPercentage ?? 0) >= 0 ? "+" : ""}
														{(investmentData.currentPNLPercentage ?? 0).toFixed(2)}%
													</Typography>
												</Stack>
											</>
										)}
										{selectedToken?.quote?.USD?.price && (
											<>
												<Divider />
												<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
													<Typography color="text.secondary" variant="body2">
														Current price
													</Typography>
													<Typography variant="body2">
														{formatCurrency(selectedToken.quote?.USD?.price || null, "$", 2)}
													</Typography>
												</Stack>
											</>
										)}
									</Stack>
								</CardContent>
							</Card>

							{/* Summary */}
							{strategyInfo.length > 0 && strategyQuantity && strategyAveragePrice && (
								<Card variant="outlined" sx={{ bgcolor: "var(--mui-palette-background-level1)" }}>
									<CardContent>
										<Typography variant="subtitle1" sx={{ mb: 2 }}>
											Summary
										</Typography>
										<Grid container spacing={2}>
											<Grid size={6}>
												<Typography color="text.secondary" variant="caption">
													Invested
												</Typography>
												<Typography color="success.main" variant="h6">
													{formatCurrency(parseFloat(strategyQuantity) * parseFloat(strategyAveragePrice), "$", 2)}
												</Typography>
											</Grid>
											<Grid size={6}>
												<Typography color="text.secondary" variant="caption">
													Total cashed in
												</Typography>
												<Typography color="success.main" variant="h6">
													{formatCurrency(
														strategyInfo.reduce((sum, info) => sum + info.amountCollected, 0),
														"$",
														2
													)}
												</Typography>
											</Grid>
											<Grid size={6}>
												<Typography color="text.secondary" variant="caption">
													Net result
												</Typography>
												<Typography color="success.main" variant="h6">
													{formatCurrency(
														strategyInfo.reduce((sum, info) => sum + info.amountCollected, 0) -
															parseFloat(strategyQuantity) * parseFloat(strategyAveragePrice),
														"$",
														2
													)}
												</Typography>
											</Grid>
											<Grid size={6}>
												<Typography color="text.secondary" variant="caption">
													Remaining tokens
												</Typography>
												<Typography color="warning.main" variant="h6">
													{strategyInfo.length > 0
														? strategyInfo[strategyInfo.length - 1].remainingTokens.toFixed(6)
														: "0.000000"}
												</Typography>
											</Grid>
										</Grid>
									</CardContent>
								</Card>
							)}
						</Stack>
					</Grid>
				</Grid>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose}>Cancel</Button>
				<Button
					disabled={
						isSubmitting ||
						!selectedToken ||
						!strategyQuantity ||
						!strategyAveragePrice ||
						!strategyName ||
						numberOfTargets === 0 ||
						profitTargets.reduce((sum, t) => sum + t.sellPercentage, 0) > 100
					}
					onClick={handleSubmit}
					startIcon={isSubmitting ? <CircularProgress size={16} /> : <ChartPieIcon />}
					variant="contained"
				>
					{isSubmitting ? "Creating..." : "Create Strategy"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
