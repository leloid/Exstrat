"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ChartPieIcon } from "@phosphor-icons/react/dist/ssr/ChartPie";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { PencilIcon } from "@phosphor-icons/react/dist/ssr/Pencil";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";

import { strategiesApi } from "@/lib/strategies-api";
import { getPortfolios, getPortfolioHoldings } from "@/lib/portfolios-api";
import { transactionsApi } from "@/lib/transactions-api";
import { formatCurrency, formatPercentage } from "@/lib/format";
import type { StrategyResponse } from "@/types/strategies";
import { StrategyStatus } from "@/types/strategies";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CreateStrategyModal } from "./create-strategy-modal";
import { DataTable } from "@/components/core/data-table";
import type { ColumnDef } from "@/components/core/data-table";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import Tooltip from "@mui/material/Tooltip";
import Avatar from "@mui/material/Avatar";

export default function Page(): React.JSX.Element {
	return (
		<ProtectedRoute>
			<StrategiesPageContent />
		</ProtectedRoute>
	);
}

function StrategiesPageContent(): React.JSX.Element {
	const [strategies, setStrategies] = React.useState<StrategyResponse[]>([]);
	const [isLoading, setIsLoading] = React.useState(true);
	const [searchQuery, setSearchQuery] = React.useState("");
	const [statusFilter, setStatusFilter] = React.useState<StrategyStatus | "all">(StrategyStatus.PAUSED);
	const [showCreateModal, setShowCreateModal] = React.useState(false);
	const [isSubmitting, setIsSubmitting] = React.useState(false);
	const [tokenPrices, setTokenPrices] = React.useState<Map<string, number>>(new Map());
	
	// Pagination states
	const [page, setPage] = React.useState(0);
	const [rowsPerPage, setRowsPerPage] = React.useState(10);

	// Load strategies
	React.useEffect(() => {
		loadStrategies();
	}, []);

	// Load current prices for all tokens
	React.useEffect(() => {
		if (strategies.length > 0) {
			loadTokenPrices();
		}
	}, [strategies]);

	const loadStrategies = async () => {
		try {
			setIsLoading(true);
			const response = await strategiesApi.getStrategies({});
			setStrategies(response.strategies || []);
		} catch (error) {
			console.error("Error loading strategies:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const loadTokenPrices = async () => {
		try {
			const pricesMap = new Map<string, number>();

			// Get unique symbols from strategies
			const uniqueSymbols = Array.from(new Set(strategies.map((s) => s.symbol.toUpperCase())));

			if (uniqueSymbols.length === 0) {
				setTokenPrices(pricesMap);
				return;
			}

			// Try to get prices from holdings first (more accurate)
			try {
				const portfolios = await getPortfolios();
				for (const portfolio of portfolios) {
					try {
						const holdings = await getPortfolioHoldings(portfolio.id);
						holdings.forEach((holding) => {
							const symbol = holding.token.symbol.toUpperCase();
							if (uniqueSymbols.includes(symbol) && holding.currentPrice && holding.currentPrice > 0) {
								pricesMap.set(symbol, holding.currentPrice);
							}
						});
					} catch (error) {
						console.error(`Error loading holdings for portfolio ${portfolio.id}:`, error);
					}
				}
			} catch (error) {
				console.error("Error loading portfolios for prices:", error);
			}

			// For tokens not found in holdings, try to get from token search API
			for (const symbol of uniqueSymbols) {
				if (!pricesMap.has(symbol)) {
					try {
						const tokens = await transactionsApi.searchTokens(symbol);
						if (tokens.length > 0 && tokens[0].quote?.USD?.price) {
							pricesMap.set(symbol, tokens[0].quote.USD.price);
						}
					} catch (error) {
						console.error(`Error loading price for ${symbol}:`, error);
					}
				}
			}

			setTokenPrices(pricesMap);
		} catch (error) {
			console.error("Error loading token prices:", error);
		}
	};

	// Filter strategies
	const filteredStrategies = React.useMemo(() => {
		let result = strategies;

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(strategy) =>
					strategy.name.toLowerCase().includes(query) ||
					strategy.symbol.toLowerCase().includes(query) ||
					strategy.tokenName.toLowerCase().includes(query)
			);
		}

		// Filter by status
		if (statusFilter === "active") {
			result = result.filter((strategy) => strategy.status === "active");
		} else if (statusFilter === "paused") {
			// "Desactive" includes both paused and completed
			result = result.filter((strategy) => strategy.status === "paused" || strategy.status === "completed");
		}

		return result;
	}, [strategies, searchQuery, statusFilter]);

	// Paginated strategies
	const paginatedStrategies = React.useMemo(() => {
		const start = page * rowsPerPage;
		const end = start + rowsPerPage;
		return filteredStrategies.slice(start, end);
	}, [filteredStrategies, page, rowsPerPage]);

	// Reset page when search or filter changes
	React.useEffect(() => {
		setPage(0);
	}, [searchQuery, statusFilter]);

	// Status counts
	const statusCounts = React.useMemo(() => {
		const counts = {
			all: strategies.length,
			active: 0,
			desactive: 0,
		};

		strategies.forEach((strategy) => {
			if (strategy.status === "active") {
				counts.active++;
			} else {
				// paused and completed are both considered "desactive"
				counts.desactive++;
			}
		});

		return counts;
	}, [strategies]);

	const handleCreateStrategy = () => {
		setShowCreateModal(true);
	};

	const handleCloseCreateModal = () => {
		setShowCreateModal(false);
	};

	const handleEditStrategy = (strategy: StrategyResponse) => {
		// TODO: Open edit strategy modal
		console.log("Edit strategy", strategy);
	};

	const handleDeleteStrategy = async (strategyId: string) => {
		if (window.confirm("Are you sure you want to delete this strategy?")) {
			try {
				await strategiesApi.deleteStrategy(strategyId);
				await loadStrategies();
			} catch (error) {
				console.error("Error deleting strategy:", error);
			}
		}
	};

	if (isLoading) {
		return (
			<Box
				sx={{
					alignItems: "center",
					display: "flex",
					justifyContent: "center",
					minHeight: "400px",
				}}
			>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<Box
			sx={{
				maxWidth: "var(--Content-maxWidth)",
				m: "var(--Content-margin)",
				p: "var(--Content-padding)",
				width: "var(--Content-width)",
			}}
		>
			<Stack spacing={4}>
				{/* Header */}
				<Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ alignItems: "flex-start" }}>
					<Box sx={{ flex: "1 1 auto" }}>
						<Typography variant="h4">Strategies</Typography>
						<Typography color="text.secondary" variant="body1">
							Create and manage your automated profit-taking strategies by token.
							<br />
							These strategies will be available to apply to your wallets in the Forecast page.
						</Typography>
					</Box>
					<Button onClick={handleCreateStrategy} startIcon={<PlusIcon />} variant="contained">
						Create Strategy
					</Button>
				</Stack>

				{/* Filters */}
				<Card>
					<CardContent>
						<Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
							<OutlinedInput
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search strategies..."
								size="small"
								startAdornment={
									<InputAdornment position="start">
										<MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
									</InputAdornment>
								}
								sx={{ flex: "1 1 auto", maxWidth: "400px" }}
								value={searchQuery}
							/>
							<Stack direction="row" spacing={1}>
								<Chip
									color={statusFilter === "all" ? "primary" : "default"}
									label={`All (${statusCounts.all})`}
									onClick={() => setStatusFilter("all")}
									variant={statusFilter === "all" ? "filled" : "outlined"}
								/>
								<Chip
									color={statusFilter === "active" ? "primary" : "default"}
									label={`Active (${statusCounts.active})`}
									onClick={() => setStatusFilter(StrategyStatus.ACTIVE)}
									variant={statusFilter === "active" ? "filled" : "outlined"}
								/>
								<Chip
									color={statusFilter === "paused" ? "primary" : "default"}
									label={`Desactive (${statusCounts.desactive})`}
									onClick={() => setStatusFilter(StrategyStatus.PAUSED)}
									variant={statusFilter === "paused" ? "filled" : "outlined"}
								/>
							</Stack>
						</Stack>
					</CardContent>
				</Card>

				{/* Strategies Table */}
				{filteredStrategies.length === 0 ? (
					<Card>
						<CardContent sx={{ py: 8, textAlign: "center" }}>
							<Stack spacing={2} sx={{ alignItems: "center" }}>
								<Box
									sx={{
										alignItems: "center",
										bgcolor: "var(--mui-palette-background-level1)",
										borderRadius: "50%",
										display: "flex",
										height: "64px",
										justifyContent: "center",
										width: "64px",
									}}
								>
									<ChartPieIcon fontSize="var(--icon-fontSize-xl)" />
								</Box>
								<Stack spacing={1}>
									<Typography variant="h6">
										{strategies.length === 0 ? "No strategies yet" : "No strategies found"}
									</Typography>
									<Typography color="text.secondary" variant="body2">
										{strategies.length === 0
											? "Create your first automated profit-taking strategy to get started."
											: "Try adjusting your search or filter criteria."}
									</Typography>
								</Stack>
								{strategies.length === 0 && (
									<Button onClick={handleCreateStrategy} startIcon={<PlusIcon />} variant="contained">
										Create Strategy
									</Button>
								)}
							</Stack>
						</CardContent>
					</Card>
				) : (
					<Card>
						<Divider />
						<Box sx={{ overflowX: "auto" }}>
							<StrategiesTable
								onDelete={handleDeleteStrategy}
								onEdit={handleEditStrategy}
								rows={paginatedStrategies}
								tokenPrices={tokenPrices}
							/>
						</Box>
						{filteredStrategies.length > 0 && (
							<TablePagination
								component="div"
								count={filteredStrategies.length}
								onPageChange={(_, newPage) => setPage(newPage)}
								onRowsPerPageChange={(e) => {
									setRowsPerPage(parseInt(e.target.value, 10));
									setPage(0);
								}}
								page={page}
								rowsPerPage={rowsPerPage}
								rowsPerPageOptions={[5, 10, 25, 50]}
								labelRowsPerPage="Rows per page:"
							/>
						)}
					</Card>
				)}
			</Stack>

			{/* Create Strategy Modal */}
			<CreateStrategyModal onClose={handleCloseCreateModal} onSuccess={loadStrategies} open={showCreateModal} />
		</Box>
	);
}

interface StrategiesTableProps {
	rows: StrategyResponse[];
	onEdit: (strategy: StrategyResponse) => void;
	onDelete: (strategyId: string) => void;
	tokenPrices: Map<string, number>;
}

function StrategiesTable({ rows, onEdit, onDelete, tokenPrices }: StrategiesTableProps): React.JSX.Element {
	// State to track mouse position for tooltip (per row)
	const [mousePosition, setMousePosition] = React.useState<{ x: number; y: number; rowId: string } | null>(null);

	// Helper function to get token logo URL from multiple sources with fallback
	const getTokenLogoUrl = (symbol: string, cmcId: number | undefined): string | null => {
		const symbolLower = symbol.toLowerCase();
		
		// Priority 1: CoinMarketCap (if cmcId is available and valid) - most reliable
		if (cmcId && cmcId > 0) {
			return `https://s2.coinmarketcap.com/static/img/coins/64x64/${cmcId}.png`;
		}
		
		// Priority 2: Mapping of common tokens to CoinMarketCap IDs
		// This is a fallback when cmcId is not available but we know the symbol
		const commonTokenIds: Record<string, number> = {
			btc: 1,        // Bitcoin
			eth: 1027,     // Ethereum
			usdt: 825,     // Tether
			bnb: 1839,     // Binance Coin
			sol: 4128,     // Solana
			usdc: 3408,    // USD Coin
			xrp: 52,       // Ripple
			ada: 2010,     // Cardano
			doge: 5,       // Dogecoin
			matic: 4713,   // Polygon (MATIC)
			dot: 6636,     // Polkadot
			avax: 5805,    // Avalanche
			shib: 11939,   // Shiba Inu
			ltc: 2,        // Litecoin
			link: 1975,    // Chainlink
			trx: 1958,     // TRON
			atom: 3794,    // Cosmos
			etc: 1321,     // Ethereum Classic
			xlm: 512,      // Stellar
			algo: 4030,    // Algorand
			vet: 3077,     // VeChain
			fil: 5488,     // Filecoin
			icp: 8916,     // Internet Computer
			uni: 12504,    // Uniswap
		};
		
		if (commonTokenIds[symbolLower]) {
			return `https://s2.coinmarketcap.com/static/img/coins/64x64/${commonTokenIds[symbolLower]}.png`;
		}
		
		// Priority 3: Try using a simple CDN service that works with symbols
		// Using cryptologos.cc which provides logos for many cryptocurrencies
		return `https://cryptologos.cc/logos/${symbolLower}-${symbolLower}-logo.png`;
	};

	return (
		<Table>
			<TableHead>
				{/* Group Headers */}
				<TableRow>
					<TableCell rowSpan={2} sx={{ width: "200px", minWidth: "180px" }}>
						Strategy
					</TableCell>
					<TableCell colSpan={2} sx={{ textAlign: "center", borderBottom: "1px solid var(--mui-palette-divider)" }}>
						<Typography variant="overline" sx={{ fontWeight: 600, letterSpacing: "0.1em", fontSize: "0.7rem" }}>
							INVESTED
						</Typography>
					</TableCell>
					<TableCell colSpan={2} sx={{ textAlign: "center", borderBottom: "1px solid var(--mui-palette-divider)" }}>
						<Typography variant="overline" sx={{ fontWeight: 600, letterSpacing: "0.1em", fontSize: "0.7rem" }}>
							PROFIT
						</Typography>
					</TableCell>
					<TableCell rowSpan={2} sx={{ width: "80px", minWidth: "70px" }}>
						Targets
					</TableCell>
					<TableCell rowSpan={2} sx={{ width: "100px", minWidth: "90px" }}>
						Total Sell %
					</TableCell>
					<TableCell rowSpan={2} sx={{ width: "100px", minWidth: "90px" }} />
				</TableRow>
				{/* Column Headers */}
				<TableRow>
					<TableCell sx={{ width: "120px", minWidth: "110px", fontSize: "0.875rem" }}>Total Invested</TableCell>
					<TableCell sx={{ width: "130px", minWidth: "120px", fontSize: "0.875rem" }}>QTY</TableCell>
					<TableCell sx={{ width: "120px", minWidth: "110px", fontSize: "0.875rem" }}>Profit(USD)</TableCell>
					<TableCell sx={{ width: "120px", minWidth: "110px", fontSize: "0.875rem" }}>Profit(%)</TableCell>
				</TableRow>
			</TableHead>
			<TableBody>
				{rows.map((row) => {
					const totalInvested = row.baseQuantity * row.referencePrice;
					const numberOfTargets = row.steps?.length || 0;
					const totalSellPercentage = row.steps?.reduce((sum, step) => sum + step.sellPercentage, 0) || 0;
					// Get current price from tokenPrices map, fallback to referencePrice if not available
					const currentPrice = tokenPrices.get(row.symbol.toUpperCase()) || row.referencePrice;
					const currentValue = row.baseQuantity * currentPrice;
					const profitUSD = currentValue - totalInvested;
					const profitPercentage = totalInvested > 0 ? (profitUSD / totalInvested) * 100 : 0;

					// Calculate additional info for tooltip
					const numberOfEntries = 1; // Could be calculated from transactions
					const tokensHeld = row.baseQuantity;
					const averagePrice = row.referencePrice;
					const currentPNL = profitUSD;
					const currentPNLPercentage = profitPercentage;
					
					// Calculate projections for all steps (same logic as in create modal)
					let remainingTokens = tokensHeld;
					let totalCashedIn = 0;
					
					if (row.steps && row.steps.length > 0) {
						// For each step, calculate tokens to sell and amount collected
						row.steps.forEach((step) => {
							// Calculate tokens to sell based on sellPercentage
							const tokensToSell = (tokensHeld * step.sellPercentage) / 100;
							const amountCollected = tokensToSell * step.targetPrice;
							totalCashedIn += amountCollected;
							remainingTokens -= tokensToSell;
						});
					}
					
					// Ensure remainingTokens is not negative
					remainingTokens = Math.max(0, remainingTokens);
					
					// Net result = Total cashed in - Invested (same as in create modal)
					const netResult = totalCashedIn - totalInvested;

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
										<Typography variant="body2">{numberOfEntries}</Typography>
									</Stack>
									<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
										<Typography color="text.secondary" variant="body2">
											Total invested:
										</Typography>
										<Typography variant="body2" sx={{ color: "success.main" }}>
											{formatCurrency(totalInvested, "$", 2)}
										</Typography>
									</Stack>
									<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
										<Typography color="text.secondary" variant="body2">
											Tokens held:
										</Typography>
										<Typography variant="body2" sx={{ color: "warning.main" }}>
											{tokensHeld.toLocaleString(undefined, { maximumFractionDigits: 8 })}
										</Typography>
									</Stack>
									<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
										<Typography color="text.secondary" variant="body2">
											Average purchase price:
										</Typography>
										<Typography variant="body2" sx={{ color: "primary.main" }}>
											{formatCurrency(averagePrice, "$", 2)}
										</Typography>
									</Stack>
									<Divider />
									<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
										<Typography color="text.secondary" variant="body2">
											Current PNL:
										</Typography>
										<Typography
											variant="body2"
											sx={{ color: currentPNL >= 0 ? "success.main" : "error.main" }}
										>
											{formatCurrency(currentPNL, "$", 2)}
										</Typography>
									</Stack>
									<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
										<Typography color="text.secondary" variant="body2">
											PNL %:
										</Typography>
										<Typography
											variant="body2"
											sx={{ color: currentPNLPercentage >= 0 ? "success.main" : "error.main" }}
										>
											{formatPercentage(currentPNLPercentage)}
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
											{formatCurrency(totalInvested, "$", 2)}
										</Typography>
									</Stack>
									<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
										<Typography color="text.secondary" variant="body2">
											Total cashed in:
										</Typography>
										<Typography variant="body2" sx={{ color: "success.main" }}>
											{formatCurrency(totalCashedIn, "$", 2)}
										</Typography>
									</Stack>
									<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
										<Typography color="text.secondary" variant="body2">
											Net result:
										</Typography>
										<Typography variant="body2" sx={{ color: netResult >= 0 ? "success.main" : "error.main" }}>
											{formatCurrency(netResult, "$", 2)}
										</Typography>
									</Stack>
									<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
										<Typography color="text.secondary" variant="body2">
											Remaining tokens:
										</Typography>
										<Typography variant="body2" sx={{ color: "warning.main" }}>
											{remainingTokens.toLocaleString(undefined, { maximumFractionDigits: 8 })}
										</Typography>
									</Stack>
								</Stack>
							</Stack>
						</Box>
					);

					return (
						<Tooltip
							key={row.id}
							arrow
							disableHoverListener // Disabled for now - keep code for future use
							componentsProps={{
								tooltip: {
									sx: {
										bgcolor: "var(--mui-palette-background-paper)",
										border: "1px solid var(--mui-palette-divider)",
										boxShadow: "var(--mui-shadows-16)",
										maxWidth: "none",
									},
								},
							}}
							PopperProps={{
								modifiers: [
									{
										name: "offset",
										options: {
											offset: [10, 10], // Offset from cursor
										},
									},
									{
										name: "computeStyles",
										options: {
											gpuAcceleration: false,
											adaptive: false,
										},
									},
								],
								anchorEl: mousePosition && mousePosition.rowId === row.id
									? {
											getBoundingClientRect: () => ({
												width: 0,
												height: 0,
												top: mousePosition.y,
												left: mousePosition.x,
												bottom: mousePosition.y,
												right: mousePosition.x,
												x: mousePosition.x,
												y: mousePosition.y,
												toJSON: () => {},
											}),
										}
									: undefined,
							}}
							placement="right"
							title={tooltipContent}
						>
							<TableRow
								onMouseMove={(e) => {
									setMousePosition({ x: e.clientX, y: e.clientY, rowId: row.id });
								}}
								onMouseLeave={() => {
									setMousePosition(null);
								}}
							>
								<TableCell>
									<Stack spacing={0.25}>
										<Typography variant="subtitle2" sx={{ fontSize: "0.875rem", lineHeight: 1.3 }}>
											{row.name}
										</Typography>
										<Typography color="text.secondary" variant="body2" sx={{ fontSize: "0.75rem", lineHeight: 1.2 }}>
											{row.symbol} - {row.tokenName}
										</Typography>
									</Stack>
								</TableCell>
							<TableCell>
								<Typography variant="body2" sx={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>
									{formatCurrency(totalInvested, "$", 2)}
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
								<Typography
									variant="body2"
									sx={{
										color: profitUSD >= 0 ? "success.main" : "error.main",
										fontSize: "0.875rem",
										whiteSpace: "nowrap",
									}}
								>
									{formatCurrency(profitUSD, "$", 2)}
								</Typography>
							</TableCell>
							<TableCell>
								<Typography
									variant="body2"
									sx={{
										color: profitPercentage >= 0 ? "success.main" : "error.main",
										fontSize: "0.875rem",
										whiteSpace: "nowrap",
									}}
								>
									{formatPercentage(profitPercentage)}
								</Typography>
							</TableCell>
							<TableCell>
								<Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
									{numberOfTargets}
								</Typography>
							</TableCell>
							<TableCell>
								<Typography variant="body2" sx={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>
									{formatPercentage(totalSellPercentage)}
								</Typography>
							</TableCell>
							<TableCell align="right">
								<Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.5 }}>
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
										color="error"
										onClick={(e) => {
											e.stopPropagation();
											onDelete(row.id);
										}}
										size="small"
										sx={{ padding: "4px" }}
									>
										<TrashIcon fontSize="var(--icon-fontSize-sm)" />
									</IconButton>
								</Box>
							</TableCell>
							</TableRow>
						</Tooltip>
					);
				})}
			</TableBody>
		</Table>
	);
}
