"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Chip from "@mui/material/Chip";
import { PencilIcon } from "@phosphor-icons/react/dist/ssr/Pencil";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { NoteIcon } from "@phosphor-icons/react/dist/ssr/Note";
import { MinusIcon } from "@phosphor-icons/react/dist/ssr/Minus";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import Button from "@mui/material/Button";

import { formatCurrency, formatPercentage } from "@/lib/format";
import type { StrategyResponse } from "@/types/strategies";
import type { StepAlert } from "@/types/configuration";
import { strategiesApi } from "@/lib/strategies-api";
import { toast } from "@/components/core/toaster";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import type { StrategyAlert } from "@/types/configuration";

interface StrategiesTableProps {
	rows: StrategyResponse[];
	onEdit: (strategy: StrategyResponse) => void;
	onDelete: (strategyId: string) => void;
	onSelect: (strategyId: string) => void;
	onDeselect: (strategyId: string) => void;
	onSelectAll: () => void;
	onDeselectAll: () => void;
	selectedIds: Set<string>;
	tokenPrices: Map<string, number>;
	isLoadingPrices?: boolean;
	expandedStrategyId?: string | null;
	onToggleExpand?: (strategyId: string) => void;
	stepAlerts?: Map<string, StepAlert>;
	onStepAlertChange?: (stepId: string, field: "beforeTPEnabled" | "tpReachedEnabled" | "beforeTPPercentage", value: boolean | number) => void;
	strategyAlerts?: Map<string, StrategyAlert>;
	onStrategyAlertToggle?: (strategyId: string, enabled: boolean) => Promise<void>;
}

export function StrategiesTable({
	rows,
	onEdit,
	onDelete,
	onSelect,
	onDeselect,
	onSelectAll,
	onDeselectAll,
	selectedIds,
	tokenPrices,
	isLoadingPrices = false,
	expandedStrategyId = null,
	onToggleExpand,
	stepAlerts = new Map(),
	onStepAlertChange,
	strategyAlerts = new Map(),
	onStrategyAlertToggle,
}: StrategiesTableProps): React.JSX.Element {
	const allSelected = rows.length > 0 && selectedIds.size === rows.length;
	const someSelected = selectedIds.size > 0 && selectedIds.size < rows.length;

	// Helper function to get token logo URL
	const getTokenLogoUrl = React.useCallback((symbol: string, cmcId: number | undefined): string | null => {
		const symbolLower = symbol.toLowerCase();

		// Priority 1: CoinMarketCap (if cmcId is available and valid)
		if (cmcId && cmcId > 0) {
			return `https://s2.coinmarketcap.com/static/img/coins/64x64/${cmcId}.png`;
		}

		// Priority 2: Mapping of common tokens to CoinMarketCap IDs
		const commonTokenIds: Record<string, number> = {
			btc: 1,
			eth: 1027,
			usdt: 825,
			bnb: 1839,
			sol: 4128,
			usdc: 3408,
			xrp: 52,
			ada: 2010,
			doge: 5,
			matic: 4713,
			dot: 6636,
			avax: 5805,
			shib: 11939,
			ltc: 2,
			link: 1975,
			trx: 1958,
			atom: 3794,
			etc: 1321,
			xlm: 512,
			algo: 4030,
			vet: 3077,
			fil: 5488,
			icp: 8916,
			uni: 12504,
		};

		if (commonTokenIds[symbolLower]) {
			return `https://s2.coinmarketcap.com/static/img/coins/64x64/${commonTokenIds[symbolLower]}.png`;
		}

		// Priority 3: Try using a simple CDN service
		return `https://cryptologos.cc/logos/${symbolLower}-${symbolLower}-logo.png`;
	}, []);

	return (
		<Table sx={{ tableLayout: "auto", width: "100%" }}>
			<TableHead>
				<TableRow>
					<TableCell padding="checkbox">
						<Checkbox checked={allSelected} indeterminate={someSelected} onChange={allSelected ? onDeselectAll : onSelectAll} />
					</TableCell>
					<TableCell sx={{ minWidth: "140px", fontWeight: 600, fontSize: "0.8125rem" }}>Strategy Name</TableCell>
					<TableCell align="right" sx={{ minWidth: "95px", fontWeight: 600, fontSize: "0.8125rem" }}>Total Invested</TableCell>
					<TableCell align="right" sx={{ minWidth: "85px", fontWeight: 600, fontSize: "0.8125rem" }}>Quantity</TableCell>
					<TableCell align="right" sx={{ minWidth: "115px", fontWeight: 600, fontSize: "0.8125rem" }}>Total Amount Collected</TableCell>
					<TableCell align="right" sx={{ minWidth: "95px", fontWeight: 600, fontSize: "0.8125rem" }}>Net Result</TableCell>
					<TableCell align="right" sx={{ minWidth: "105px", fontWeight: 600, fontSize: "0.8125rem" }}>Bag % Sold</TableCell>
					<TableCell align="right" sx={{ minWidth: "105px", fontWeight: 600, fontSize: "0.8125rem" }}>Remaining Token</TableCell>
					<TableCell align="center" sx={{ minWidth: "40px", fontWeight: 600, fontSize: "0.8125rem" }}>TP</TableCell>
					<TableCell align="center" sx={{ minWidth: "70px", fontWeight: 600, fontSize: "0.8125rem" }}>Alerts</TableCell>
					<TableCell align="center" sx={{ minWidth: "80px", fontWeight: 600, fontSize: "0.8125rem" }}>Actions</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				{rows.map((row) => (
					<StrategyRow
						key={row.id}
						row={row}
						onEdit={onEdit}
						onDelete={onDelete}
						onSelect={onSelect}
						onDeselect={onDeselect}
						isSelected={selectedIds.has(row.id)}
						tokenPrice={tokenPrices.get(row.symbol.toUpperCase())}
						getTokenLogoUrl={getTokenLogoUrl}
						isLoadingPrice={isLoadingPrices}
						isExpanded={expandedStrategyId === row.id}
						onToggleExpand={onToggleExpand}
						stepAlerts={stepAlerts}
						onStepAlertChange={onStepAlertChange}
						strategyAlerts={strategyAlerts}
						onStrategyAlertToggle={onStrategyAlertToggle}
					/>
				))}
			</TableBody>
		</Table>
	);
}

interface StrategyRowProps {
	row: StrategyResponse;
	onEdit: (strategy: StrategyResponse) => void;
	onDelete: (strategyId: string) => void;
	onSelect: (strategyId: string) => void;
	onDeselect: (strategyId: string) => void;
	isSelected: boolean;
	tokenPrice?: number;
	getTokenLogoUrl: (symbol: string, cmcId: number | undefined) => string | null;
	isLoadingPrice: boolean;
	isExpanded?: boolean;
	onToggleExpand?: (strategyId: string) => void;
	stepAlerts?: Map<string, StepAlert>;
	onStepAlertChange?: (stepId: string, field: "beforeTPEnabled" | "tpReachedEnabled" | "beforeTPPercentage", value: boolean | number) => void;
	strategyAlerts?: Map<string, StrategyAlert>;
	onStrategyAlertToggle?: (strategyId: string, enabled: boolean) => Promise<void>;
}

function StrategyRow({
	row,
	onEdit,
	onDelete,
	onSelect,
	onDeselect,
	isSelected,
	tokenPrice,
	getTokenLogoUrl,
	isLoadingPrice,
	isExpanded = false,
	onToggleExpand,
	stepAlerts = new Map(),
	onStepAlertChange,
	strategyAlerts = new Map(),
	onStrategyAlertToggle,
}: StrategyRowProps): React.JSX.Element {
	// Memoize calculations
	const calculations = React.useMemo(() => {
		const totalInvested = row.baseQuantity * row.referencePrice;
		const numberOfTargets = row.steps?.length || 0;
		const totalSellPercentage = row.steps?.reduce((sum, step) => sum + step.sellPercentage, 0) || 0;
		const currentPrice = tokenPrice || row.referencePrice;
		const currentValue = row.baseQuantity * currentPrice;
		const profitUSD = currentValue - totalInvested;
		const profitPercentage = totalInvested > 0 ? (profitUSD / totalInvested) * 100 : 0;

		// Calculate projections
		let remainingTokens = row.baseQuantity;
		let totalCashedIn = 0;

		if (row.steps && row.steps.length > 0) {
			row.steps.forEach((step) => {
				const tokensToSell = (row.baseQuantity * step.sellPercentage) / 100;
				const amountCollected = tokensToSell * step.targetPrice;
				totalCashedIn += amountCollected;
				remainingTokens -= tokensToSell;
			});
		}

		remainingTokens = Math.max(0, remainingTokens);
		const netResult = totalCashedIn - totalInvested;

		return {
			totalInvested,
			numberOfTargets,
			totalSellPercentage,
			currentPrice,
			currentValue,
			profitUSD,
			profitPercentage,
			remainingTokens,
			totalCashedIn,
			netResult,
		};
	}, [row, tokenPrice]);

	const tooltipContent = (
		<Box sx={{ p: 1.5, maxWidth: "300px" }}>
			<Stack spacing={1.5}>
				<Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
					Strategy Details
				</Typography>
				<Divider />
				<Stack spacing={1}>
					<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
						<Typography color="text.secondary" variant="body2">
							Number of entries:
						</Typography>
						<Typography variant="body2">1</Typography>
					</Stack>
					<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
						<Typography color="text.secondary" variant="body2">
							Total invested:
						</Typography>
						<Typography variant="body2" sx={{ color: "success.main" }}>
							{formatCurrency(calculations.totalInvested, "$", 2)}
						</Typography>
					</Stack>
					<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
						<Typography color="text.secondary" variant="body2">
							Tokens held:
						</Typography>
						<Typography variant="body2" sx={{ color: "warning.main" }}>
							{row.baseQuantity.toLocaleString(undefined, { maximumFractionDigits: 8 })}
						</Typography>
					</Stack>
					<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
						<Typography color="text.secondary" variant="body2">
							Average purchase price:
						</Typography>
						<Typography variant="body2" sx={{ color: "primary.main" }}>
							{formatCurrency(row.referencePrice, "$", 2)}
						</Typography>
					</Stack>
					<Divider />
					<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
						<Typography color="text.secondary" variant="body2">
							Current PNL:
						</Typography>
						<Typography
							variant="body2"
							sx={{ color: calculations.profitUSD >= 0 ? "success.main" : "error.main" }}
						>
							{formatCurrency(calculations.profitUSD, "$", 2)}
						</Typography>
					</Stack>
					<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
						<Typography color="text.secondary" variant="body2">
							PNL %:
						</Typography>
						<Typography
							variant="body2"
							sx={{ color: calculations.profitPercentage >= 0 ? "success.main" : "error.main" }}
						>
							{formatPercentage(calculations.profitPercentage)}
						</Typography>
					</Stack>
					<Divider />
					<Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 0.5 }}>
						Summary
					</Typography>
					<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
						<Typography color="text.secondary" variant="body2">
							Invested:
						</Typography>
						<Typography variant="body2" sx={{ color: "success.main" }}>
							{formatCurrency(calculations.totalInvested, "$", 2)}
						</Typography>
					</Stack>
					<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
						<Typography color="text.secondary" variant="body2">
							Total cashed out:
						</Typography>
						<Typography variant="body2" sx={{ color: "success.main" }}>
							{formatCurrency(calculations.totalCashedIn, "$", 2)}
						</Typography>
					</Stack>
					<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
						<Typography color="text.secondary" variant="body2">
							Net result:
						</Typography>
						<Typography variant="body2" sx={{ color: calculations.netResult >= 0 ? "success.main" : "error.main" }}>
							{formatCurrency(calculations.netResult, "$", 2)}
						</Typography>
					</Stack>
					<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
						<Typography color="text.secondary" variant="body2">
							Remaining tokens:
						</Typography>
						<Typography variant="body2" sx={{ color: "warning.main" }}>
							{calculations.remainingTokens.toLocaleString(undefined, { maximumFractionDigits: 8 })}
						</Typography>
					</Stack>
				</Stack>
			</Stack>
		</Box>
	);

	return (
		<>
			<TableRow
				hover
				onClick={() => onToggleExpand?.(row.id)}
				sx={{
					cursor: "pointer",
					...(isExpanded && {
						bgcolor: "var(--mui-palette-primary-selected)",
						"&:hover": {
							bgcolor: "var(--mui-palette-primary-selected)",
						},
					}),
				}}
			>
				<TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
					<Checkbox checked={isSelected} onChange={isSelected ? () => onDeselect(row.id) : () => onSelect(row.id)} />
				</TableCell>
				<TableCell>
					<Tooltip arrow title={tooltipContent} placement="right">
						<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
							{onToggleExpand && (
								<IconButton
									size="small"
									onClick={(e) => {
										e.stopPropagation();
										onToggleExpand(row.id);
									}}
									sx={{ padding: "2px", color: isExpanded ? "var(--mui-palette-primary-main)" : "var(--mui-palette-text-secondary)" }}
								>
									{isExpanded ? (
										<CaretDownIcon fontSize="var(--icon-fontSize-sm)" />
									) : (
										<CaretRightIcon fontSize="var(--icon-fontSize-sm)" />
									)}
								</IconButton>
							)}
						<Stack spacing={0.25} sx={{ minWidth: 0 }}>
							<Typography 
								variant="subtitle2" 
								sx={{ 
									fontSize: "0.875rem", 
									lineHeight: 1.3,
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap"
								}}
							>
								{row.name}
							</Typography>
							<Typography 
								color="text.secondary" 
								variant="body2" 
								sx={{ 
									fontSize: "0.75rem", 
									lineHeight: 1.2,
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap"
								}}
							>
								{row.symbol} - {row.tokenName}
							</Typography>
						</Stack>
						</Stack>
					</Tooltip>
				</TableCell>
				<TableCell align="right" sx={{ py: 1 }}>
					<Typography variant="body2" sx={{ fontSize: "0.8125rem", whiteSpace: "nowrap" }}>
						{formatCurrency(calculations.totalInvested, "$", 2)}
					</Typography>
				</TableCell>
				<TableCell align="right" sx={{ py: 1 }}>
					<Typography variant="body2" sx={{ fontSize: "0.8125rem", whiteSpace: "nowrap" }}>
						{row.baseQuantity.toLocaleString(undefined, { maximumFractionDigits: 6 })} {row.symbol}
					</Typography>
				</TableCell>
				<TableCell align="right" sx={{ py: 1 }}>
					<Typography variant="body2" sx={{ fontSize: "0.8125rem", whiteSpace: "nowrap", color: "success.main" }}>
						{formatCurrency(calculations.totalCashedIn, "$", 2)}
					</Typography>
				</TableCell>
				<TableCell align="right" sx={{ py: 1 }}>
					<Typography
						variant="body2"
						sx={{
							fontSize: "0.8125rem",
							whiteSpace: "nowrap",
							color: calculations.netResult >= 0 ? "success.main" : "error.main",
						}}
					>
						{formatCurrency(calculations.netResult, "$", 2)}
					</Typography>
				</TableCell>
				<TableCell align="right" sx={{ py: 1 }}>
					<Typography variant="body2" sx={{ fontSize: "0.8125rem", whiteSpace: "nowrap" }}>
						{formatPercentage(calculations.totalSellPercentage)}
					</Typography>
				</TableCell>
				<TableCell align="right" sx={{ py: 1 }}>
					<Typography variant="body2" sx={{ fontSize: "0.8125rem", whiteSpace: "nowrap", color: "warning.main" }}>
						{calculations.remainingTokens.toLocaleString(undefined, { maximumFractionDigits: 6 })}
					</Typography>
				</TableCell>
				<TableCell align="center" sx={{ py: 1 }}>
					<Typography variant="body2" sx={{ fontSize: "0.8125rem" }}>
						{calculations.numberOfTargets}
					</Typography>
				</TableCell>
				<TableCell align="center" sx={{ py: 1 }} onClick={(e) => e.stopPropagation()}>
					{onStrategyAlertToggle && (
						<Switch
							checked={strategyAlerts.get(row.id)?.isActive ?? false}
							onChange={(e) => {
								e.stopPropagation();
								onStrategyAlertToggle(row.id, e.target.checked);
							}}
							size="small"
							color="primary"
						/>
					)}
				</TableCell>
				<TableCell align="center" sx={{ py: 1 }} onClick={(e) => e.stopPropagation()}>
					<Stack direction="row" spacing={0.25} sx={{ alignItems: "center", justifyContent: "center" }}>
						{row.notes && row.notes.trim() && (
							<Tooltip title={row.notes} arrow placement="top">
								<IconButton size="small" sx={{ padding: "2px", color: "text.secondary" }}>
									<NoteIcon fontSize="var(--icon-fontSize-sm)" />
								</IconButton>
							</Tooltip>
						)}
						<IconButton
							onClick={(e) => {
								e.stopPropagation();
								onEdit(row);
							}}
							size="small"
							sx={{ padding: "2px" }}
						>
							<PencilIcon fontSize="var(--icon-fontSize-sm)" />
						</IconButton>
						<IconButton
							onClick={(e) => {
								e.stopPropagation();
								onDelete(row.id);
							}}
							size="small"
							sx={{ padding: "2px", color: "error.main" }}
						>
							<TrashIcon fontSize="var(--icon-fontSize-sm)" />
						</IconButton>
					</Stack>
				</TableCell>
			</TableRow>
			{isExpanded && row.steps && row.steps.length > 0 && (
				<TableRow>
					<TableCell colSpan={11} sx={{ py: 0, borderBottom: "1px solid var(--mui-palette-divider)" }}>
						<Collapse in={isExpanded} timeout="auto" unmountOnExit>
							<Box sx={{ py: 2, px: 2, bgcolor: "var(--mui-palette-background-paper)" }}>
								<Grid container spacing={2}>
									{row.steps.map((step, index) => {
										const targetPrice = step.targetPrice || 0;
										const tokensToSell = step.sellQuantity || (row.baseQuantity * step.sellPercentage) / 100;
										const amountCollected = tokensToSell * targetPrice;
										const targetType = step.targetType === "percentage_of_average" ? "percentage" : "price";

										return (
											<Grid key={step.id || index} size={{ xs: 12, sm: 6, md: 2 }}>
												<Box
													sx={{
														p: 2,
														bgcolor: "background.paper",
														borderRadius: 2,
														border: "1px solid",
														borderColor: "divider",
														height: "100%",
													}}
												>
													<Stack spacing={1.5}>
														<Typography variant="subtitle1" sx={{ color: "text.primary", fontWeight: 600 }}>
															TP {index + 1}
														</Typography>
														<Stack spacing={0.5}>
															<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
																Target
															</Typography>
															<Typography variant="body2" sx={{ color: "text.primary", fontWeight: 600 }}>
																{formatCurrency(targetPrice, "$", 2)}
															</Typography>
														</Stack>
														<Stack spacing={0.5}>
															<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
																Token quantity to sell
															</Typography>
															<Typography variant="body2" sx={{ color: "text.primary" }}>
																{tokensToSell.toLocaleString(undefined, { maximumFractionDigits: 6 })} {row.symbol}
															</Typography>
														</Stack>
														<Stack spacing={0.5}>
															<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
																Amount collected
															</Typography>
															<Typography variant="body2" sx={{ color: "success.main", fontWeight: 600 }}>
																{formatCurrency(amountCollected, "$", 2)}
															</Typography>
														</Stack>
														<Stack spacing={0.5}>
															<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
																Status
															</Typography>
															<Box>
																{step.state === "triggered" ? (
																	<Chip
																		label="Triggered"
																		size="small"
																		color="success"
																		sx={{ fontSize: "0.65rem", height: "20px" }}
																	/>
																) : (
																	<Chip
																		label="Pending"
																		size="small"
																		variant="outlined"
																		sx={{
																			fontSize: "0.65rem",
																			height: "20px",
																			borderColor: "var(--mui-palette-text-secondary)",
																			color: "var(--mui-palette-text-primary)",
																		}}
																	/>
																)}
															</Box>
														</Stack>
														{onStepAlertChange && (
															<Stack spacing={1.5} sx={{ mt: 1.5, pt: 1.5, borderTop: "1px solid", borderColor: "divider" }}>
																{/* Pre-reaching Alert */}
																<Stack spacing={0.5}>
																	<Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600, fontSize: "0.7rem" }}>
																		Pre-reaching Alert
																	</Typography>
																	<Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
																		<IconButton
																			size="small"
																			onClick={(e) => {
																				e.stopPropagation();
																				const current = stepAlerts.get(step.id)?.beforeTPPercentage ?? 2;
																				const newValue = Math.max(0, current - 1);
																				onStepAlertChange(step.id, "beforeTPPercentage", newValue);
																			}}
																			sx={{ 
																				width: 28, 
																				height: 28,
																				border: "1px solid",
																				borderColor: "divider",
																				borderRadius: 1,
																			}}
																		>
																			<MinusIcon size={14} />
																		</IconButton>
																		<Box
																			sx={{
																				flex: 1,
																				px: 1,
																				py: 0.5,
																				bgcolor: "background.level1",
																				borderRadius: 1,
																				textAlign: "center",
																				minWidth: 50,
																			}}
																		>
																			<Typography variant="body2" sx={{ fontWeight: 600, fontSize: "0.75rem" }}>
																				{stepAlerts.get(step.id)?.beforeTPPercentage ?? 2}%
																			</Typography>
																		</Box>
																		<IconButton
																			size="small"
																			onClick={(e) => {
																				e.stopPropagation();
																				const current = stepAlerts.get(step.id)?.beforeTPPercentage ?? 2;
																				const newValue = Math.min(100, current + 1);
																				onStepAlertChange(step.id, "beforeTPPercentage", newValue);
																			}}
																			sx={{ 
																				width: 28, 
																				height: 28,
																				border: "1px solid",
																				borderColor: "divider",
																				borderRadius: 1,
																			}}
																		>
																			<PlusIcon size={14} />
																		</IconButton>
																	</Stack>
																</Stack>
																{/* Reaching Alert */}
																<FormControlLabel
																	control={
																		<Checkbox
																			size="small"
																			checked={stepAlerts.get(step.id)?.tpReachedEnabled ?? true}
																			onChange={(e) => {
																				e.stopPropagation();
																				onStepAlertChange(step.id, "tpReachedEnabled", e.target.checked);
																			}}
																		/>
																	}
																	label={
																		<Typography variant="caption" sx={{ fontSize: "0.7rem" }}>
																			Reaching Alert
																		</Typography>
																	}
																	sx={{ m: 0 }}
																/>
															</Stack>
														)}
													</Stack>
												</Box>
											</Grid>
										);
									})}
								</Grid>
							</Box>
						</Collapse>
					</TableCell>
				</TableRow>
			)}
		</>
	);
}
