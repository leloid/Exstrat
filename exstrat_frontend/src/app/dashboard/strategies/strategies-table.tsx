"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
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

import { formatCurrency, formatPercentage } from "@/lib/format";
import type { StrategyResponse } from "@/types/strategies";

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
		<Table>
			<TableHead>
				{/* Group Headers */}
				<TableRow>
					<TableCell padding="checkbox" rowSpan={2}>
						<Checkbox checked={allSelected} indeterminate={someSelected} onChange={allSelected ? onDeselectAll : onSelectAll} />
					</TableCell>
					<TableCell rowSpan={2} sx={{ width: "200px", minWidth: "180px" }}>
						Strategy
					</TableCell>
					<TableCell colSpan={2} sx={{ textAlign: "center", borderBottom: "1px solid var(--mui-palette-divider)" }}>
						<Typography variant="overline" sx={{ fontWeight: 600, letterSpacing: "0.1em", fontSize: "0.7rem" }}>
							INVESTI
						</Typography>
					</TableCell>
					<TableCell colSpan={2} sx={{ textAlign: "center", borderBottom: "1px solid var(--mui-palette-divider)" }}>
						<Typography variant="overline" sx={{ fontWeight: 600, letterSpacing: "0.1em", fontSize: "0.7rem" }}>
							PROFIT
						</Typography>
					</TableCell>
					<TableCell rowSpan={2} sx={{ width: "80px", minWidth: "70px" }}>
						Cibles
					</TableCell>
					<TableCell rowSpan={2} sx={{ width: "100px", minWidth: "90px" }}>
						Total Vente %
					</TableCell>
					<TableCell rowSpan={2} sx={{ width: "100px", minWidth: "90px" }} />
				</TableRow>
				{/* Column Headers */}
				<TableRow>
					<TableCell sx={{ width: "120px", minWidth: "110px", fontSize: "0.875rem" }}>Total Investi</TableCell>
					<TableCell sx={{ width: "130px", minWidth: "120px", fontSize: "0.875rem" }}>QTY</TableCell>
					<TableCell sx={{ width: "120px", minWidth: "110px", fontSize: "0.875rem" }}>Profit(USD)</TableCell>
					<TableCell sx={{ width: "120px", minWidth: "110px", fontSize: "0.875rem" }}>Profit(%)</TableCell>
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
							<Stack spacing={0.25}>
								<Typography variant="subtitle2" sx={{ fontSize: "0.875rem", lineHeight: 1.3 }}>
									{row.name}
								</Typography>
								<Typography color="text.secondary" variant="body2" sx={{ fontSize: "0.75rem", lineHeight: 1.2 }}>
									{row.symbol} - {row.tokenName}
								</Typography>
							</Stack>
						</Stack>
					</Tooltip>
				</TableCell>
				<TableCell>
					<Typography variant="body2" sx={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>
						{formatCurrency(calculations.totalInvested, "$", 2)}
					</Typography>
				</TableCell>
				<TableCell>
					<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
						<Avatar
							src={getTokenLogoUrl(row.symbol, row.cmcId) || undefined}
							alt={row.symbol}
							sx={{
								width: 20,
								height: 20,
								fontSize: "0.625rem",
								bgcolor: "var(--mui-palette-primary-main)",
							}}
						>
							{row.symbol.charAt(0)}
						</Avatar>
						<Typography variant="body2" sx={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>
							{row.baseQuantity.toLocaleString(undefined, { maximumFractionDigits: 6 })} {row.symbol}
						</Typography>
					</Stack>
				</TableCell>
				<TableCell>
					{isLoadingPrice ? (
						<CircularProgress size={16} />
					) : (
						<Typography
							variant="body2"
							sx={{
								color: calculations.profitUSD >= 0 ? "success.main" : "error.main",
								fontSize: "0.875rem",
								whiteSpace: "nowrap",
							}}
						>
							{formatCurrency(calculations.profitUSD, "$", 2)}
						</Typography>
					)}
				</TableCell>
				<TableCell>
					{isLoadingPrice ? (
						<CircularProgress size={16} />
					) : (
						<Typography
							variant="body2"
							sx={{
								color: calculations.profitPercentage >= 0 ? "success.main" : "error.main",
								fontSize: "0.875rem",
								whiteSpace: "nowrap",
							}}
						>
							{formatPercentage(calculations.profitPercentage)}
						</Typography>
					)}
				</TableCell>
				<TableCell>
					<Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
						{calculations.numberOfTargets}
					</Typography>
				</TableCell>
				<TableCell>
					<Typography variant="body2" sx={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>
						{formatPercentage(calculations.totalSellPercentage)}
					</Typography>
				</TableCell>
				<TableCell align="right" onClick={(e) => e.stopPropagation()}>
					<Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
						<IconButton
							onClick={(e) => {
								e.stopPropagation();
								onEdit(row);
							}}
							size="small"
							sx={{ padding: "4px" }}
						>
							<PencilIcon fontSize="var(--icon-fontSize-sm)" />
						</IconButton>
						<IconButton
							onClick={(e) => {
								e.stopPropagation();
								onDelete(row.id);
							}}
							size="small"
							sx={{ padding: "4px", color: "error.main" }}
						>
							<TrashIcon fontSize="var(--icon-fontSize-sm)" />
						</IconButton>
					</Stack>
				</TableCell>
			</TableRow>
			{isExpanded && row.steps && row.steps.length > 0 && (
				<TableRow>
					<TableCell colSpan={9} sx={{ py: 0, borderBottom: "1px solid var(--mui-palette-divider)" }}>
						<Collapse in={isExpanded} timeout="auto" unmountOnExit>
							<Box sx={{ py: 2, px: 2, bgcolor: "var(--mui-palette-background-paper)" }}>
								<Table size="small" sx={{ "& .MuiTableCell-root": { borderBottom: "1px solid var(--mui-palette-divider)", py: 1 } }}>
									<TableHead>
										<TableRow>
											<TableCell sx={{ width: "60px", fontWeight: 600, fontSize: "0.75rem" }}>TP</TableCell>
											<TableCell sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Type</TableCell>
											<TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Target</TableCell>
											<TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Sell %</TableCell>
											<TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Quantity</TableCell>
											<TableCell align="right" sx={{ fontWeight: 600, fontSize: "0.75rem" }}>Amount</TableCell>
											<TableCell sx={{ width: "100px", fontWeight: 600, fontSize: "0.75rem" }}>Status</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{row.steps.map((step, index) => {
											const targetPrice = step.targetPrice || 0;
											const tokensToSell = step.sellQuantity || (row.baseQuantity * step.sellPercentage) / 100;
											const amountCollected = tokensToSell * targetPrice;
											const targetType = step.targetType === "percentage_of_average" ? "percentage" : "price";
											const targetValue = targetType === "percentage"
												? step.targetValue
												: targetPrice;

											return (
												<TableRow key={step.id || index} hover>
													<TableCell>
														<Chip
															label={`TP ${index + 1}`}
															size="small"
															color="primary"
															sx={{ fontWeight: 600, fontSize: "0.7rem", height: "22px" }}
														/>
													</TableCell>
													<TableCell>
														<Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
															{targetType === "percentage" ? "Percentage" : "Price"}
														</Typography>
													</TableCell>
													<TableCell align="right">
														<Typography variant="body2" sx={{ fontSize: "0.75rem", fontWeight: 500, color: "primary.main" }}>
															{targetType === "percentage"
																? `${targetValue.toFixed(2)}%`
																: formatCurrency(targetValue, "$", 2)}
														</Typography>
													</TableCell>
													<TableCell align="right">
														<Typography variant="body2" sx={{ fontSize: "0.75rem", fontWeight: 500, color: "secondary.main" }}>
															{formatPercentage(step.sellPercentage)}
														</Typography>
													</TableCell>
													<TableCell align="right">
														<Typography variant="body2" sx={{ fontSize: "0.75rem" }}>
															{tokensToSell.toLocaleString(undefined, { maximumFractionDigits: 6 })}
														</Typography>
														<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.65rem" }}>
															{row.symbol}
														</Typography>
													</TableCell>
													<TableCell align="right">
														<Typography variant="body2" sx={{ fontSize: "0.75rem", fontWeight: 600, color: "success.main" }}>
															{formatCurrency(amountCollected, "$", 2)}
														</Typography>
													</TableCell>
													<TableCell>
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
																	"&:hover": {
																		borderColor: "var(--mui-palette-text-primary)",
																		backgroundColor: "var(--mui-palette-action-hover)",
																	},
																}}
															/>
														)}
													</TableCell>
												</TableRow>
											);
										})}
									</TableBody>
								</Table>
							</Box>
						</Collapse>
					</TableCell>
				</TableRow>
			)}
		</>
	);
}
