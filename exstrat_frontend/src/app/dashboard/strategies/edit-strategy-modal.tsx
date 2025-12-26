"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import Slider from "@mui/material/Slider";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { MinusIcon } from "@phosphor-icons/react/dist/ssr/Minus";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { strategiesApi } from "@/lib/strategies-api";
import { formatCurrency, formatPercentage } from "@/lib/format";
import type { StrategyResponse, UpdateStrategyDto, TargetType } from "@/types/strategies";
import { TargetType as TargetTypeEnum } from "@/types/strategies";
import { Option } from "@/components/core/option";
import { toast } from "@/components/core/toaster";

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

interface EditStrategyModalProps {
	onClose: () => void;
	onSuccess: () => void;
	open: boolean;
	strategy: StrategyResponse | null;
}

export function EditStrategyModal({ onClose, onSuccess, open, strategy }: EditStrategyModalProps): React.JSX.Element {
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [strategyName, setStrategyName] = React.useState<string>("");
	const [strategyQuantity, setStrategyQuantity] = React.useState<string>("");
	const [strategyAveragePrice, setStrategyAveragePrice] = React.useState<string>("");
	const [strategyNotes, setStrategyNotes] = React.useState<string>("");
	const [profitTargets, setProfitTargets] = React.useState<ProfitTarget[]>([]);
	// Local states for raw input values during typing
	const [rawPercentageInputs, setRawPercentageInputs] = React.useState<Record<number, string>>({});
	const [rawTokenInputs, setRawTokenInputs] = React.useState<Record<number, string>>({});
	const [focusedPercentageInput, setFocusedPercentageInput] = React.useState<number | null>(null);
	const [focusedTokenInput, setFocusedTokenInput] = React.useState<number | null>(null);
	const [fieldErrors, setFieldErrors] = React.useState<{
		name: boolean;
		quantity: boolean;
		price: boolean;
		targets: boolean;
	}>({
		name: false,
		quantity: false,
		price: false,
		targets: false,
	});

	// Initialize form when strategy changes or modal opens
	React.useEffect(() => {
		if (open && strategy) {
			setStrategyName(strategy.name || "");
			setStrategyQuantity(strategy.baseQuantity.toString());
			setStrategyAveragePrice(strategy.referencePrice.toString());
			setStrategyNotes(strategy.notes || "");

			// Convert steps to profit targets
			const targets: ProfitTarget[] = strategy.steps.map((step, index) => ({
				id: step.id || `target-${index}`,
				targetType: step.targetType === TargetTypeEnum.PERCENTAGE_OF_AVERAGE ? "percentage" : "price",
				targetValue: step.targetValue,
				sellPercentage: step.sellPercentage,
			}));
			setProfitTargets(targets);

			setFieldErrors({
				name: false,
				quantity: false,
				price: false,
				targets: false,
			});
		}
	}, [open, strategy]);

	// Calculate strategy info for each target
	const strategyInfo = React.useMemo<StrategyInfo[]>(() => {
		if (!strategyQuantity || !strategyAveragePrice || profitTargets.length === 0) {
			return [];
		}

		const qty = parseFloat(strategyQuantity);
		const avgPrice = parseFloat(strategyAveragePrice);
		if (isNaN(qty) || isNaN(avgPrice) || qty <= 0 || avgPrice <= 0) {
			return [];
		}

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
			const remainingBagValue = remainingTokens * targetPrice;

			info.push({
				remainingTokens,
				remainingTokensValuation: remainingBagValue,
				amountCollected,
				remainingBagValue,
			});
		});

		return info;
	}, [strategyQuantity, strategyAveragePrice, profitTargets]);

	const handleClose = () => {
		setStrategyName("");
		setStrategyQuantity("");
		setStrategyAveragePrice("");
		setStrategyNotes("");
		setProfitTargets([]);
		setRawPercentageInputs({});
		setRawTokenInputs({});
		setFocusedPercentageInput(null);
		setFocusedTokenInput(null);
		setFieldErrors({
			name: false,
			quantity: false,
			price: false,
			targets: false,
		});
		onClose();
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
		if (!strategy) return;

		// Validate required fields
		const errors = {
			name: !strategyName.trim(),
			quantity: !strategyQuantity || parseFloat(strategyQuantity) <= 0,
			price: !strategyAveragePrice || parseFloat(strategyAveragePrice) <= 0,
			targets: profitTargets.length === 0,
		};

		setFieldErrors(errors);

		// If there are errors, don't submit
		if (errors.name || errors.quantity || errors.price || errors.targets) {
			return;
		}

		try {
			setIsSubmitting(true);

			const updateData: UpdateStrategyDto = {
				name: strategyName.trim(),
				baseQuantity: parseFloat(strategyQuantity),
				referencePrice: parseFloat(strategyAveragePrice),
				steps: profitTargets.map((target) => ({
					targetType: (target.targetType === "percentage" ? "percentage_of_average" : "exact_price") as TargetType,
					targetValue: target.targetValue,
					sellPercentage: target.sellPercentage,
					notes: "",
				})),
				...(strategyNotes.trim() && { notes: strategyNotes.trim() }),
			};

			await strategiesApi.updateStrategy(strategy.id, updateData);
			onSuccess();
			handleClose();
			toast.success("Strategy updated successfully");
		} catch (error) {
			console.error("Error updating strategy:", error);
			toast.error("Failed to update strategy. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!strategy) {
		return <></>;
	}

	const qty = parseFloat(strategyQuantity) || 0;
	const avgPrice = parseFloat(strategyAveragePrice) || 0;

	return (
		<Dialog fullWidth maxWidth="lg" onClose={handleClose} open={open}>
			<DialogTitle>
				<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
					<Typography variant="h6">Edit Strategy</Typography>
					<IconButton onClick={handleClose} size="small">
						<XIcon />
					</IconButton>
				</Stack>
			</DialogTitle>
			<DialogContent dividers>
				<Stack spacing={4} sx={{ pt: 2 }}>
					{/* Error Alert */}
					{(fieldErrors.name || fieldErrors.quantity || fieldErrors.price || fieldErrors.targets) && (
						<Alert severity="error">
							Please fill in all required fields:
							<ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
								{fieldErrors.name && <li>Strategy name is required</li>}
								{fieldErrors.quantity && <li>Quantity must be greater than 0</li>}
								{fieldErrors.price && <li>Reference price must be greater than 0</li>}
								{fieldErrors.targets && <li>At least one target is required</li>}
							</ul>
						</Alert>
					)}

					{/* Strategy Info Display */}
					<Box
						sx={{
							p: 2,
							bgcolor: "var(--mui-palette-background-level1)",
							borderRadius: 1,
							border: "1px solid var(--mui-palette-divider)",
						}}
					>
						<Stack spacing={1}>
							<Typography color="text.secondary" variant="caption">
								Token
							</Typography>
							<Typography variant="body1" sx={{ fontWeight: 600 }}>
								{strategy.symbol} - {strategy.tokenName}
							</Typography>
						</Stack>
					</Box>

					{/* Basic Configuration */}
					<Stack spacing={2}>
						<Typography variant="h6">Configuration</Typography>
						<TextField
							fullWidth
							label="Strategy Name"
							value={strategyName}
							onChange={(e) => {
								setStrategyName(e.target.value);
								if (e.target.value.trim()) {
									setFieldErrors((prev) => ({ ...prev, name: false }));
								}
							}}
							placeholder="e.g., BTC Strategy 2025"
							error={fieldErrors.name}
							helperText={fieldErrors.name ? "This field is required" : ""}
							required
						/>
						<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
							<TextField
								fullWidth
								label="Quantity"
								type="text"
								value={strategyQuantity}
								onChange={(e) => {
									const value = e.target.value;
									if (value === "" || /^\d*\.?\d*$/.test(value)) {
										setStrategyQuantity(value);
										if (value && parseFloat(value) > 0) {
											setFieldErrors((prev) => ({ ...prev, quantity: false }));
										}
									}
								}}
								error={fieldErrors.quantity}
								helperText={fieldErrors.quantity ? "Quantity must be greater than 0" : ""}
								required
							/>
							<TextField
								fullWidth
								label="Reference Price"
								type="text"
								value={strategyAveragePrice}
								onChange={(e) => {
									const value = e.target.value;
									if (value === "" || /^\d*\.?\d*$/.test(value)) {
										setStrategyAveragePrice(value);
										if (value && parseFloat(value) > 0) {
											setFieldErrors((prev) => ({ ...prev, price: false }));
										}
									}
								}}
								error={fieldErrors.price}
								helperText={fieldErrors.price ? "Price must be greater than 0" : ""}
								required
							/>
						</Stack>
						<TextField
							fullWidth
							label="Notes (Optional)"
							value={strategyNotes}
							onChange={(e) => setStrategyNotes(e.target.value)}
							placeholder="Add any additional notes about this strategy..."
							multiline
							rows={3}
						/>
					</Stack>

					{/* Profit Targets */}
					<Stack spacing={2}>
						<Typography variant="h6">Profit Targets</Typography>
						{profitTargets.length === 0 ? (
							<Alert severity="info">No profit targets configured. Add at least one target to continue.</Alert>
						) : (
							<Stack spacing={3}>
								{profitTargets.map((target, targetIndex) => {
									const info = strategyInfo[targetIndex];
									const otherTargetsTotal = profitTargets.reduce(
										(sum, t, idx) => (idx === targetIndex ? sum : sum + t.sellPercentage),
										0
									);
									const maxValue = Math.max(0, 100 - otherTargetsTotal);
									const isMaxReached = maxValue === 0;

									return (
										<Card key={target.id} variant="outlined">
											<CardContent>
												<Stack spacing={3}>
													<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
														<Typography variant="subtitle1">Target #{targetIndex + 1}</Typography>
													</Stack>

													<Grid container spacing={3}>
														{/* Target Type and Value */}
														<Grid size={{ xs: 12, sm: 6 }}>
															<Stack spacing={2}>
																<FormControl fullWidth>
																	<InputLabel>Target Type</InputLabel>
																	<Select
																		label="Target Type"
																		value={target.targetType}
																		onChange={(e) =>
																			handleTargetChange(targetIndex, "targetType", e.target.value as "percentage" | "price")
																		}
																	>
																		<Option value="percentage">Percentage</Option>
																		<Option value="price">Exact Price</Option>
																	</Select>
																</FormControl>
																<TextField
																	fullWidth
																	label={target.targetType === "percentage" ? "Target Percentage (%)" : "Target Price ($)"}
																	type="text"
																	value={target.targetValue.toString()}
																	onChange={(e) => {
																		const value = e.target.value;
																		if (value === "" || /^\d*\.?\d*$/.test(value)) {
																			const numValue = parseFloat(value);
																			if (!isNaN(numValue) && numValue >= 0) {
																				handleTargetChange(targetIndex, "targetValue", numValue);
																			} else if (value === "" || value === ".") {
																				handleTargetChange(targetIndex, "targetValue", 0);
																			}
																		}
																	}}
																/>
															</Stack>
														</Grid>

														{/* Sell Percentage */}
														<Grid size={{ xs: 12, sm: 6 }}>
															<Stack spacing={2}>
																<Typography variant="body2">Quantity to sell</Typography>
																<Stack spacing={1}>
																	<Box sx={{ px: 1 }}>
																		<Slider
																			min={0}
																			max={100}
																			step={0.1}
																			value={target.sellPercentage}
																			disabled={isMaxReached}
																			onChange={(_, value) => {
																				const newValue = value as number;
																				const clampedValue = Math.min(newValue, maxValue);
																				handleTargetChange(targetIndex, "sellPercentage", clampedValue);
																			}}
																		/>
																		{isMaxReached && (
																			<FormHelperText error sx={{ mt: 0.5, mx: 1 }}>
																				Maximum sell quantity reached (100%). Reduce other targets to allocate more to this one.
																			</FormHelperText>
																		)}
																	</Box>
																	<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
																		<FormControl error={isMaxReached} sx={{ width: 100 }}>
																			<TextField
																				size="small"
																				type="text"
																				value={
																					focusedPercentageInput === targetIndex
																						? rawPercentageInputs[targetIndex] ?? ""
																						: target.sellPercentage > 0
																							? target.sellPercentage.toFixed(1)
																							: ""
																				}
																				onChange={(e) => {
																					const inputValue = e.target.value;
																					if (inputValue === "" || /^\d*\.?\d*$/.test(inputValue)) {
																						setRawPercentageInputs((prev) => ({
																							...prev,
																							[targetIndex]: inputValue,
																						}));
																						const value = parseFloat(inputValue);
																						if (!isNaN(value) && value >= 0) {
																							handleSellPercentageChange(targetIndex, value);
																						} else if (inputValue === "" || inputValue === ".") {
																							handleSellPercentageChange(targetIndex, 0);
																						}
																					}
																				}}
																				onFocus={() => {
																					setFocusedPercentageInput(targetIndex);
																					setRawPercentageInputs((prev) => ({
																						...prev,
																						[targetIndex]: target.sellPercentage > 0 ? target.sellPercentage.toString() : "",
																					}));
																				}}
																				onBlur={() => {
																					setFocusedPercentageInput(null);
																					const value = parseFloat(rawPercentageInputs[targetIndex] || "0");
																					if (!isNaN(value) && value >= 0) {
																						handleSellPercentageChange(targetIndex, value);
																					}
																				}}
																				disabled={isMaxReached}
																				error={isMaxReached}
																			/>
																			{isMaxReached && (
																				<FormHelperText sx={{ m: 0, mt: 0.5 }}>
																					Maximum reached
																				</FormHelperText>
																			)}
																		</FormControl>
																		<Typography variant="body2">%</Typography>
																		<TextField
																			size="small"
																			type="text"
																			value={
																				focusedTokenInput === targetIndex
																					? rawTokenInputs[targetIndex] ?? ""
																					: qty > 0 && target.sellPercentage > 0
																						? ((qty * target.sellPercentage) / 100).toString()
																						: ""
																			}
																			onChange={(e) => {
																				const inputValue = e.target.value;
																				if (inputValue === "" || /^\d*\.?\d*$/.test(inputValue)) {
																					setRawTokenInputs((prev) => ({
																						...prev,
																						[targetIndex]: inputValue,
																					}));
																					const value = parseFloat(inputValue);
																					if (!isNaN(value) && value >= 0) {
																						handleTokensChange(targetIndex, value);
																					} else if (inputValue === "" || inputValue === ".") {
																						handleTokensChange(targetIndex, 0);
																					}
																				}
																			}}
																			onFocus={() => {
																				setFocusedTokenInput(targetIndex);
																				const tokenValue = qty > 0 && target.sellPercentage > 0 ? (qty * target.sellPercentage) / 100 : 0;
																				setRawTokenInputs((prev) => ({
																					...prev,
																					[targetIndex]: tokenValue > 0 ? tokenValue.toString() : "",
																				}));
																			}}
																			onBlur={() => {
																				setFocusedTokenInput(null);
																				const value = parseFloat(rawTokenInputs[targetIndex] || "0");
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
																		<Typography variant="body2">
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
							</Stack>
						)}
					</Stack>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} disabled={isSubmitting}>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={isSubmitting}
					startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
					variant="contained"
				>
					{isSubmitting ? "Updating..." : "Update Strategy"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}
