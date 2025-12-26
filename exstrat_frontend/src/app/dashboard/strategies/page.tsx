"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TablePagination from "@mui/material/TablePagination";
import Avatar from "@mui/material/Avatar";
import { ChartPieIcon } from "@phosphor-icons/react/dist/ssr/ChartPie";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { PencilIcon } from "@phosphor-icons/react/dist/ssr/Pencil";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";

import { strategiesApi } from "@/lib/strategies-api";
import { getPortfolios, getPortfolioHoldings } from "@/lib/portfolios-api";
import { transactionsApi } from "@/lib/transactions-api";
import { formatCurrency, formatPercentage } from "@/lib/format";
import type { StrategyResponse } from "@/types/strategies";
import { StrategyStatus } from "@/types/strategies";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CreateStrategyModal } from "./create-strategy-modal";
import { StrategiesTable } from "./strategies-table";
import { useDebounce } from "@/hooks/use-debounce";
import { useSelection } from "@/hooks/use-selection";

export default function Page(): React.JSX.Element {
	return (
		<ProtectedRoute>
			<StrategiesPageContent />
		</ProtectedRoute>
	);
}

function StrategiesPageContent(): React.JSX.Element {
	const [strategies, setStrategies] = React.useState<StrategyResponse[]>([]);
	const [totalStrategies, setTotalStrategies] = React.useState(0);
	const [isLoading, setIsLoading] = React.useState(true);
	const [isLoadingPrices, setIsLoadingPrices] = React.useState(false);
	const [searchQuery, setSearchQuery] = React.useState("");
	const debouncedSearchQuery = useDebounce(searchQuery, 300);
	const [statusFilter, setStatusFilter] = React.useState<StrategyStatus | "all">("all");
	const [showCreateModal, setShowCreateModal] = React.useState(false);
	const [tokenPrices, setTokenPrices] = React.useState<Map<string, number>>(new Map());
	const [showDeleteMultipleStrategiesModal, setShowDeleteMultipleStrategiesModal] = React.useState(false);
	
	// Pagination states
	const [page, setPage] = React.useState(0);
	const [rowsPerPage, setRowsPerPage] = React.useState(10);

	// Selection management
	const strategyIds = React.useMemo(() => strategies.map((s) => s.id), [strategies]);
	const selection = useSelection(strategyIds);

	// Load strategies with server-side pagination
	const loadStrategies = React.useCallback(async () => {
		try {
			setIsLoading(true);
			const response = await strategiesApi.getStrategies({
				status: statusFilter !== "all" ? statusFilter : undefined,
				page: page + 1, // Backend uses 1-based pagination
				limit: rowsPerPage,
			});
			setStrategies(response.strategies || []);
			setTotalStrategies(response.total || 0);
		} catch (error) {
			console.error("Error loading strategies:", error);
		} finally {
			setIsLoading(false);
		}
	}, [page, rowsPerPage, statusFilter]);

	// Load all strategies for search (when search query is active)
	const loadAllStrategiesForSearch = React.useCallback(async () => {
		if (!debouncedSearchQuery.trim()) {
			return;
		}
		try {
			const response = await strategiesApi.getStrategies({
				status: statusFilter !== "all" ? statusFilter : undefined,
				page: 1,
				limit: 1000, // Load more for search
			});
			setStrategies(response.strategies || []);
			setTotalStrategies(response.total || 0);
		} catch (error) {
			console.error("Error loading strategies for search:", error);
		}
	}, [debouncedSearchQuery, statusFilter]);

	// Load strategies on mount and when filters change
	React.useEffect(() => {
		if (debouncedSearchQuery.trim()) {
			loadAllStrategiesForSearch();
		} else {
			loadStrategies();
		}
	}, [loadStrategies, loadAllStrategiesForSearch, debouncedSearchQuery]);

	// Load current prices for all tokens (optimized)
	const loadTokenPrices = React.useCallback(async () => {
		if (strategies.length === 0) {
			setTokenPrices(new Map());
			return;
		}

		setIsLoadingPrices(true);
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
				const holdingsPromises = portfolios.map((portfolio) => getPortfolioHoldings(portfolio.id));
				const allHoldings = await Promise.all(holdingsPromises);

				allHoldings.flat().forEach((holding) => {
							const symbol = holding.token.symbol.toUpperCase();
							if (uniqueSymbols.includes(symbol) && holding.currentPrice && holding.currentPrice > 0) {
								pricesMap.set(symbol, holding.currentPrice);
							}
						});
			} catch (error) {
				console.error("Error loading portfolios for prices:", error);
			}

			// For tokens not found in holdings, try to get from token search API (batch)
			const missingSymbols = uniqueSymbols.filter((symbol) => !pricesMap.has(symbol));
			if (missingSymbols.length > 0) {
				// Load prices in parallel with a limit to avoid too many requests
				const pricePromises = missingSymbols.slice(0, 10).map(async (symbol) => {
					try {
						const tokens = await transactionsApi.searchTokens(symbol);
						if (tokens.length > 0 && tokens[0].quote?.USD?.price) {
							return { symbol, price: tokens[0].quote.USD.price };
						}
					} catch (error) {
						console.error(`Error loading price for ${symbol}:`, error);
					}
					return null;
				});

				const priceResults = await Promise.all(pricePromises);
				priceResults.forEach((result) => {
					if (result) {
						pricesMap.set(result.symbol, result.price);
					}
				});
			}

			setTokenPrices(pricesMap);
		} catch (error) {
			console.error("Error loading token prices:", error);
		} finally {
			setIsLoadingPrices(false);
		}
	}, [strategies]);

	// Load prices when strategies change
	React.useEffect(() => {
		loadTokenPrices();
	}, [loadTokenPrices]);

	// Filter strategies by search query (client-side for now, can be moved to server)
	const filteredStrategies = React.useMemo(() => {
		if (!debouncedSearchQuery.trim()) {
			return strategies;
		}

		const query = debouncedSearchQuery.toLowerCase();
		return strategies.filter(
				(strategy) =>
					strategy.name.toLowerCase().includes(query) ||
					strategy.symbol.toLowerCase().includes(query) ||
					strategy.tokenName.toLowerCase().includes(query)
			);
	}, [strategies, debouncedSearchQuery]);

	// Reset page when search or filter changes
	React.useEffect(() => {
		setPage(0);
	}, [searchQuery, statusFilter]);

	// Status counts
	const statusCounts = React.useMemo(() => {
		const counts = {
			all: totalStrategies,
			active: 0,
			desactive: 0,
		};

		// We need to load all strategies to get accurate counts
		// For now, we'll use the current page data as an approximation
		strategies.forEach((strategy) => {
			if (strategy.status === "active") {
				counts.active++;
			} else {
				counts.desactive++;
			}
		});

		return counts;
	}, [strategies, totalStrategies]);

	// Handlers
	const handleCreateStrategy = React.useCallback(() => {
		setShowCreateModal(true);
	}, []);

	const handleCloseCreateModal = React.useCallback(() => {
		setShowCreateModal(false);
	}, []);

	const handleEditStrategy = React.useCallback((strategy: StrategyResponse) => {
		// TODO: Open edit strategy modal
		console.log("Edit strategy", strategy);
	}, []);

	const handleDeleteStrategy = React.useCallback(
		async (strategyId: string) => {
			if (window.confirm("Are you sure you want to delete this strategy?")) {
			try {
				await strategiesApi.deleteStrategy(strategyId);
				await loadStrategies();
					selection.deselectOne(strategyId);
			} catch (error) {
				console.error("Error deleting strategy:", error);
					alert("Error deleting strategy");
				}
			}
		},
		[loadStrategies, selection]
	);

	const confirmDeleteMultipleStrategies = React.useCallback(async () => {
		const selectedIds = Array.from(selection.selected);
		if (selectedIds.length === 0) return;
		try {
			// Delete all selected strategies in parallel
			await Promise.all(selectedIds.map((id) => strategiesApi.deleteStrategy(id)));
			await loadStrategies();
			setShowDeleteMultipleStrategiesModal(false);
			selection.deselectAll();
		} catch (error) {
			console.error("Error deleting strategies:", error);
			alert("Error deleting strategies");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [loadStrategies]);

	const handlePageChange = React.useCallback((_: unknown, newPage: number) => {
		setPage(newPage);
	}, []);

	const handleRowsPerPageChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setRowsPerPage(parseInt(e.target.value, 10));
		setPage(0);
	}, []);

	// Reset selections when search query or filter changes
	React.useEffect(() => {
		selection.deselectAll();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchQuery, statusFilter]);

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

	const displayStrategies = filteredStrategies;
	const hasStrategies = totalStrategies > 0;

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
							Create and manage your automated profit-taking strategies per token.
							<br />
							These strategies will be available to be applied to your portfolios in the Forecast page.
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
									label={`Paused (${statusCounts.desactive})`}
									onClick={() => setStatusFilter(StrategyStatus.PAUSED)}
									variant={statusFilter === "paused" ? "filled" : "outlined"}
								/>
							</Stack>
						</Stack>
					</CardContent>
				</Card>

				{/* Strategies Table */}
				{!hasStrategies ? (
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
									<Typography variant="h6">No Strategies</Typography>
									<Typography color="text.secondary" variant="body2">
										Create your first automated profit-taking strategy to get started.
									</Typography>
								</Stack>
									<Button onClick={handleCreateStrategy} startIcon={<PlusIcon />} variant="contained">
									Create Strategy
									</Button>
							</Stack>
						</CardContent>
					</Card>
				) : displayStrategies.length === 0 ? (
					<Card>
						<CardContent sx={{ py: 8, textAlign: "center" }}>
							<Stack spacing={2} sx={{ alignItems: "center" }}>
								<Typography variant="h6">No Strategies Found</Typography>
								<Typography color="text.secondary" variant="body2">
									Try adjusting your search or filter criteria.
								</Typography>
							</Stack>
						</CardContent>
					</Card>
				) : (
					<Card>
						{selection.selectedAny && (
							<Box sx={{ p: 2, borderBottom: "1px solid var(--mui-palette-divider)" }}>
								<Button
									color="error"
									onClick={() => setShowDeleteMultipleStrategiesModal(true)}
									size="small"
									startIcon={<TrashIcon />}
									variant="outlined"
								>
									Delete ({selection.selected.size})
								</Button>
							</Box>
						)}
						<Divider />
						<Box sx={{ overflowX: "auto" }}>
							<StrategiesTable
								onDelete={handleDeleteStrategy}
								onEdit={handleEditStrategy}
								rows={displayStrategies}
								selectedIds={selection.selected}
								tokenPrices={tokenPrices}
								onSelect={selection.selectOne}
								onDeselect={selection.deselectOne}
								onSelectAll={selection.selectAll}
								onDeselectAll={selection.deselectAll}
								isLoadingPrices={isLoadingPrices}
							/>
						</Box>
						{totalStrategies > 0 && (
							<TablePagination
								component="div"
								count={totalStrategies}
								onPageChange={handlePageChange}
								onRowsPerPageChange={handleRowsPerPageChange}
								page={page}
								rowsPerPage={rowsPerPage}
								rowsPerPageOptions={[5, 10, 25, 50]}
								labelRowsPerPage="Rows per page:"
								labelDisplayedRows={({ from, to, count }) => `${from}-${to} of ${count !== -1 ? count : `more than ${to}`}`}
							/>
						)}
					</Card>
				)}
			</Stack>

			{/* Create Strategy Modal */}
			<CreateStrategyModal onClose={handleCloseCreateModal} onSuccess={loadStrategies} open={showCreateModal} />

			{/* Delete Multiple Strategies Confirmation Modal */}
			<Dialog
				fullWidth
				maxWidth="sm"
				onClose={() => {
					setShowDeleteMultipleStrategiesModal(false);
				}}
				open={showDeleteMultipleStrategiesModal}
			>
				<DialogContent>
					<Box sx={{ border: "1px solid var(--mui-palette-divider)", boxShadow: "var(--mui-shadows-16)", p: 0 }}>
						<Stack direction="row" spacing={2} sx={{ display: "flex", p: 3 }}>
							<Avatar sx={{ bgcolor: "var(--mui-palette-error-50)", color: "var(--mui-palette-error-main)" }}>
								<WarningIcon fontSize="var(--icon-fontSize-lg)" />
							</Avatar>
							<Stack spacing={3} sx={{ flex: 1 }}>
								<Stack spacing={1}>
									<Typography variant="h5">Delete Strategies</Typography>
									<Typography color="text.secondary" variant="body2">
										Are you sure you want to delete {selection.selected.size} selected strateg{selection.selected.size > 1 ? "ies" : "y"}? This action is irreversible and will permanently delete all associated data.
									</Typography>
								</Stack>
								<Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
									<Button
										color="secondary"
										onClick={() => {
											setShowDeleteMultipleStrategiesModal(false);
										}}
									>
										Cancel
									</Button>
									<Button color="error" onClick={confirmDeleteMultipleStrategies} variant="contained">
										Delete {selection.selected.size} strateg{selection.selected.size > 1 ? "ies" : "y"}
									</Button>
								</Stack>
							</Stack>
						</Stack>
					</Box>
				</DialogContent>
			</Dialog>
		</Box>
	);
}
