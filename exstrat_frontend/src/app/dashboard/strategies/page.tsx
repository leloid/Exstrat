"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Checkbox from "@mui/material/Checkbox";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TablePagination from "@mui/material/TablePagination";
import Avatar from "@mui/material/Avatar";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
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
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CreateStrategyModal } from "./create-strategy-modal";
import { EditStrategyModal } from "./edit-strategy-modal";
import { StrategiesTable } from "./strategies-table";
import { useDebounce } from "@/hooks/use-debounce";
import { useSelection } from "@/hooks/use-selection";
import { toast } from "@/components/core/toaster";
import { ConfirmModal } from "@/app/dashboard/configuration/confirm-modal";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import type { Portfolio } from "@/types/portfolio";
import type { TransactionResponse } from "@/types/transactions";

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
	const [showCreateModal, setShowCreateModal] = React.useState(false);
	const [showEditModal, setShowEditModal] = React.useState(false);
	const [editingStrategy, setEditingStrategy] = React.useState<StrategyResponse | null>(null);
	const [tokenPrices, setTokenPrices] = React.useState<Map<string, number>>(new Map());
	const [showDeleteMultipleStrategiesModal, setShowDeleteMultipleStrategiesModal] = React.useState(false);
	const [showDeleteStrategyModal, setShowDeleteStrategyModal] = React.useState(false);
	const [strategyToDelete, setStrategyToDelete] = React.useState<string | null>(null);
	const [expandedStrategyId, setExpandedStrategyId] = React.useState<string | null>(null);
	const [walletFilter, setWalletFilter] = React.useState<string>("global"); // "global" or portfolioId
	const [portfolios, setPortfolios] = React.useState<Portfolio[]>([]);
	const [transactions, setTransactions] = React.useState<TransactionResponse[]>([]);
	
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
	}, [page, rowsPerPage]);

	// Load all strategies for search (when search query is active)
	const loadAllStrategiesForSearch = React.useCallback(async () => {
		if (!debouncedSearchQuery.trim()) {
			return;
		}
		try {
			const response = await strategiesApi.getStrategies({
				page: 1,
				limit: 1000, // Load more for search
			});
			setStrategies(response.strategies || []);
			setTotalStrategies(response.total || 0);
		} catch (error) {
			console.error("Error loading strategies for search:", error);
		}
	}, [debouncedSearchQuery]);

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

	// Load portfolios
	React.useEffect(() => {
		const loadPortfolios = async () => {
			try {
				const portfoliosData = await getPortfolios();
				setPortfolios(portfoliosData);
			} catch (error) {
				console.error("Error loading portfolios:", error);
			}
		};
		loadPortfolios();
	}, []);

	// Load transactions
	React.useEffect(() => {
		const loadTransactions = async () => {
			try {
				const response = await transactionsApi.getTransactions();
				const transactionsArray = Array.isArray(response?.transactions)
					? response.transactions
					: [];
				setTransactions(transactionsArray);
			} catch (error) {
				console.error("Error loading transactions:", error);
			}
		};
		loadTransactions();
	}, []);

	// Filter strategies by wallet and search query
	const filteredStrategies = React.useMemo(() => {
		let filtered = strategies;

		// Filter by wallet if not "global"
		if (walletFilter !== "global") {
			// Get transactions for the selected wallet
			const walletTransactions = transactions.filter(
				(transaction) => transaction.portfolioId === walletFilter
			);
			// Get unique symbols from wallet transactions
			const walletSymbols = new Set(
				walletTransactions.map((t) => t.symbol.toUpperCase())
			);
			// Filter strategies that match wallet tokens
			filtered = filtered.filter((strategy) =>
				walletSymbols.has(strategy.symbol.toUpperCase())
			);
		}

		// Filter by search query
		if (debouncedSearchQuery.trim()) {
			const query = debouncedSearchQuery.toLowerCase();
			filtered = filtered.filter(
				(strategy) =>
					strategy.name.toLowerCase().includes(query) ||
					strategy.symbol.toLowerCase().includes(query) ||
					strategy.tokenName.toLowerCase().includes(query)
			);
		}

		return filtered;
	}, [strategies, debouncedSearchQuery, walletFilter, transactions]);

	// Reset page when search changes
	React.useEffect(() => {
		setPage(0);
	}, [searchQuery]);


	// Handlers
	const handleCreateStrategy = React.useCallback(() => {
		setShowCreateModal(true);
	}, []);

	const handleCloseCreateModal = React.useCallback(() => {
		setShowCreateModal(false);
	}, []);

	const handleEditStrategy = React.useCallback((strategy: StrategyResponse) => {
		setEditingStrategy(strategy);
		setShowEditModal(true);
	}, []);

	const handleDeleteStrategy = React.useCallback(
		(strategyId: string) => {
			setStrategyToDelete(strategyId);
			setShowDeleteStrategyModal(true);
		},
		[]
	);

	const confirmDeleteStrategy = React.useCallback(async () => {
		if (!strategyToDelete) return;
		
		try {
			await strategiesApi.deleteStrategy(strategyToDelete);
			await loadStrategies();
			selection.deselectOne(strategyToDelete);
			setShowDeleteStrategyModal(false);
			setStrategyToDelete(null);
			toast.success("Strategy deleted successfully");
		} catch (error) {
			console.error("Error deleting strategy:", error);
			toast.error("Failed to delete strategy. Please try again.");
		}
	}, [strategyToDelete, loadStrategies, selection]);

	const confirmDeleteMultipleStrategies = React.useCallback(async () => {
		const selectedIds = Array.from(selection.selected);
		console.log("Deleting strategies:", selectedIds);
		if (selectedIds.length === 0) {
			console.warn("No strategies selected for deletion");
			setShowDeleteMultipleStrategiesModal(false);
			return;
		}
		try {
			setIsLoading(true);
			// Delete all selected strategies in parallel
			await Promise.all(selectedIds.map((id) => strategiesApi.deleteStrategy(id)));
			selection.deselectAll();
			setShowDeleteMultipleStrategiesModal(false);
			await loadStrategies();
			toast.success(
				selectedIds.length === 1
					? "Strategy deleted successfully"
					: `${selectedIds.length} strategies deleted successfully`
			);
		} catch (error) {
			console.error("Error deleting strategies:", error);
			toast.error("Failed to delete strategies. Please try again.");
		} finally {
			setIsLoading(false);
		}
	}, [loadStrategies, selection]);

	const handlePageChange = React.useCallback((_: unknown, newPage: number) => {
		setPage(newPage);
	}, []);

	const handleRowsPerPageChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setRowsPerPage(parseInt(e.target.value, 10));
		setPage(0);
	}, []);

	// Reset selections when search query changes
	React.useEffect(() => {
		selection.deselectAll();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchQuery]);

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
				width: "100%",
				maxWidth: "100%",
				m: 0,
				p: { xs: 2, sm: 3, md: 4 },
			}}
		>
			<Stack spacing={4}>
				{/* Header */}
				{hasStrategies && (
					<Stack direction={{ xs: "column", sm: "row" }} spacing={3} sx={{ alignItems: "flex-start" }}>
						<Box sx={{ flex: "1 1 auto" }} />
						<Button onClick={handleCreateStrategy} startIcon={<PlusIcon />} variant="contained">
							Create Strategy
						</Button>
					</Stack>
				)}

				{/* Strategies Table */}
				{!hasStrategies ? (
					<Card
						sx={{
							width: "100%",
							py: { xs: 6, sm: 8 },
							px: { xs: 3, sm: 4 },
							textAlign: "center",
							background: (theme) =>
								theme.palette.mode === "dark"
									? "linear-gradient(135deg, rgba(25, 118, 210, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)"
									: "linear-gradient(135deg, rgba(25, 118, 210, 0.05) 0%, rgba(156, 39, 176, 0.05) 100%)",
							border: (theme) =>
								theme.palette.mode === "dark"
									? "1px solid rgba(25, 118, 210, 0.2)"
									: "1px solid rgba(25, 118, 210, 0.1)",
							borderRadius: 3,
						}}
					>
						<Stack spacing={3} sx={{ alignItems: "center", maxWidth: 500, mx: "auto" }}>
							<Stack spacing={1}>
								<Typography variant="h5" sx={{ fontWeight: 600 }}>
									Create Your First Strategy
								</Typography>
								<Typography color="text.secondary" variant="body1" sx={{ maxWidth: 400, mx: "auto" }}>
									Start automating your profit-taking by creating your first token strategy. Set target prices and let the system manage your exits automatically.
								</Typography>
							</Stack>
							<Button
								variant="contained"
								size="large"
								startIcon={<PlusIcon />}
								endIcon={<ArrowRightIcon />}
								onClick={handleCreateStrategy}
								sx={{
									px: 4,
									py: 1.5,
									borderRadius: 2,
									textTransform: "none",
									fontSize: "1rem",
									fontWeight: 600,
									boxShadow: (theme) =>
										theme.palette.mode === "dark"
											? "0 4px 20px rgba(25, 118, 210, 0.4)"
											: "0 4px 20px rgba(25, 118, 210, 0.3)",
									"&:hover": {
										boxShadow: (theme) =>
											theme.palette.mode === "dark"
												? "0 6px 24px rgba(25, 118, 210, 0.5)"
												: "0 6px 24px rgba(25, 118, 210, 0.4)",
										transform: "translateY(-2px)",
									},
									transition: "all 0.3s ease",
								}}
							>
								Create My First Strategy
							</Button>
						</Stack>
					</Card>
				) : (
					<Card sx={{ width: "100%" }}>
						<Box sx={{ p: 2, borderBottom: "1px solid var(--mui-palette-divider)" }}>
							<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
								<Typography variant="h5" sx={{ fontWeight: 600 }}>
									My Strategies
								</Typography>
								<Box sx={{ flex: "1 1 auto" }} />
								<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
									<FormControl size="small" sx={{ minWidth: 150 }}>
										<Select
											value={walletFilter}
											onChange={(e) => {
												setWalletFilter(e.target.value);
												setPage(0); // Reset to first page on filter change
											}}
											displayEmpty
										>
											<MenuItem value="global">Global</MenuItem>
											{portfolios.map((portfolio) => (
												<MenuItem key={portfolio.id} value={portfolio.id}>
													{portfolio.name}
												</MenuItem>
											))}
										</Select>
									</FormControl>
									<OutlinedInput
										onChange={(e) => setSearchQuery(e.target.value)}
										placeholder="Search strategies..."
										size="small"
										startAdornment={
											<InputAdornment position="start">
												<MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
											</InputAdornment>
										}
										sx={{ maxWidth: "300px", width: "100%" }}
										value={searchQuery}
									/>
									{selection.selectedAny && (
										<Button
											color="error"
											onClick={() => setShowDeleteMultipleStrategiesModal(true)}
											size="small"
											startIcon={<TrashIcon />}
											variant="outlined"
										>
											Delete ({selection.selected.size})
										</Button>
									)}
								</Stack>
							</Stack>
						</Box>
						<Divider />
						{displayStrategies.length === 0 ? (
							<CardContent sx={{ py: 8, textAlign: "center" }}>
								<Stack spacing={2} sx={{ alignItems: "center" }}>
									<Typography variant="h6">No Strategies Found</Typography>
									<Typography color="text.secondary" variant="body2">
										Try adjusting your search or filter criteria.
									</Typography>
								</Stack>
							</CardContent>
						) : (
							<>
								<Box sx={{ overflowX: "auto", width: "100%" }}>
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
										expandedStrategyId={expandedStrategyId}
										onToggleExpand={(strategyId) => {
											setExpandedStrategyId((prev) => (prev === strategyId ? null : strategyId));
										}}
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
							</>
						)}
					</Card>
				)}
			</Stack>

			{/* Create Strategy Modal */}
			<CreateStrategyModal onClose={handleCloseCreateModal} onSuccess={loadStrategies} open={showCreateModal} />

			{/* Edit Strategy Modal */}
			<EditStrategyModal
				onClose={() => {
					setShowEditModal(false);
					setEditingStrategy(null);
				}}
				onSuccess={loadStrategies}
				open={showEditModal}
				strategy={editingStrategy}
			/>

			{/* Delete Strategy Confirmation Modal */}
			<ConfirmModal
				open={showDeleteStrategyModal}
				onClose={() => {
					setShowDeleteStrategyModal(false);
					setStrategyToDelete(null);
				}}
				onConfirm={confirmDeleteStrategy}
				title="Delete Strategy"
				message="Are you sure you want to delete this strategy? This action is irreversible and will permanently delete all associated data."
				confirmText="Delete"
				cancelText="Cancel"
			/>

			{/* Delete Multiple Strategies Confirmation Modal */}
			<Dialog
				fullWidth
				maxWidth="sm"
				onClose={() => {
					if (!isLoading) {
						setShowDeleteMultipleStrategiesModal(false);
					}
				}}
				open={showDeleteMultipleStrategiesModal}
			>
				<DialogContent sx={{ border: "none", p: 0 }}>
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
							</Stack>
						</Stack>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button
						color="secondary"
						onClick={() => {
							setShowDeleteMultipleStrategiesModal(false);
						}}
						disabled={isLoading}
					>
						Cancel
					</Button>
					<Button
						color="error"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							confirmDeleteMultipleStrategies();
						}}
						variant="contained"
						disabled={isLoading || selection.selected.size === 0}
						startIcon={isLoading ? <CircularProgress size={16} /> : undefined}
					>
						{isLoading ? "Deleting..." : `Delete ${selection.selected.size} strateg${selection.selected.size > 1 ? "ies" : "y"}`}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
