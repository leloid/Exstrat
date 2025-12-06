"use client";

import * as React from "react";
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
import FormControlLabel from "@mui/material/FormControlLabel";
import FormLabel from "@mui/material/FormLabel";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { PencilIcon } from "@phosphor-icons/react/dist/ssr/Pencil";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { TrendDownIcon } from "@phosphor-icons/react/dist/ssr/TrendDown";
import { TrendUpIcon } from "@phosphor-icons/react/dist/ssr/TrendUp";
import { WalletIcon } from "@phosphor-icons/react/dist/ssr/Wallet";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";

import { usePortfolio } from "@/contexts/PortfolioContext";
import * as portfoliosApi from "@/lib/portfolios-api";
import { transactionsApi } from "@/lib/transactions-api";
import { formatCurrency, formatPercentage } from "@/lib/format";
import { TokenSearch } from "@/components/transactions/token-search";
import type { Holding, CreatePortfolioDto, UpdatePortfolioDto } from "@/types/portfolio";
import type { TransactionResponse, CreateTransactionDto, TokenSearchResult } from "@/types/transactions";

interface PortfolioData {
	id: string;
	name: string;
	description?: string;
	isDefault: boolean;
	holdings: Holding[];
	invested: number;
	value: number;
	pnl: number;
	pnlPercentage: number;
	holdingsCount: number;
}

export default function Page(): React.JSX.Element {
	const {
		portfolios,
		isLoading: portfoliosLoading,
		createPortfolio,
		updatePortfolio,
		deletePortfolio,
		refreshPortfolios,
	} = usePortfolio();

	// Portfolio states
	const [portfolioData, setPortfolioData] = React.useState<Record<string, PortfolioData>>({});
	const [loadingPortfolios, setLoadingPortfolios] = React.useState(false);
	const [showPortfolioDialog, setShowPortfolioDialog] = React.useState(false);
	const [editingPortfolioId, setEditingPortfolioId] = React.useState<string | null>(null);
	const [portfolioFormData, setPortfolioFormData] = React.useState<CreatePortfolioDto>({
		name: "",
		description: "",
		isDefault: false,
	});

	// Transaction states
	const [transactions, setTransactions] = React.useState<TransactionResponse[]>([]);
	const [loadingTransactions, setLoadingTransactions] = React.useState(false);
	const [showTransactionDialog, setShowTransactionDialog] = React.useState(false);
	const [editingTransaction, setEditingTransaction] = React.useState<TransactionResponse | null>(null);
	const [selectedToken, setSelectedToken] = React.useState<TokenSearchResult | null>(null);
	const [transactionFormData, setTransactionFormData] = React.useState<{
		quantity: string;
		amountInvested: string;
		averagePrice: string;
		type: "BUY" | "SELL";
		transactionDate: string;
		notes: string;
		portfolioId: string;
	}>({
		quantity: "",
		amountInvested: "",
		averagePrice: "",
		type: "BUY",
		transactionDate: new Date().toISOString().split("T")[0],
		notes: "",
		portfolioId: "",
	});
	const [transactionError, setTransactionError] = React.useState<string | null>(null);

	// Load portfolio data
	React.useEffect(() => {
		const loadPortfolioData = async () => {
			if (portfolios.length === 0 || loadingPortfolios) return;

			setLoadingPortfolios(true);
			try {
				const data: Record<string, PortfolioData> = {};

				for (const portfolio of portfolios) {
					try {
						const holdings = await portfoliosApi.getPortfolioHoldings(portfolio.id);
						const invested = holdings.reduce((sum, h) => sum + (h.investedAmount || 0), 0);
						const value = holdings.reduce((sum, h) => {
							const currentValue = h.currentValue || (h.currentPrice || h.averagePrice) * h.quantity;
							return sum + currentValue;
						}, 0);
						const pnl = value - invested;
						const pnlPercentage = invested > 0 ? (pnl / invested) * 100 : 0;

						data[portfolio.id] = {
							id: portfolio.id,
							name: portfolio.name,
							description: portfolio.description,
							isDefault: portfolio.isDefault,
							holdings,
							invested,
							value,
							pnl,
							pnlPercentage,
							holdingsCount: holdings.length,
						};
					} catch (error) {
						console.error(`Error loading holdings for ${portfolio.name}:`, error);
						data[portfolio.id] = {
							id: portfolio.id,
							name: portfolio.name,
							description: portfolio.description,
							isDefault: portfolio.isDefault,
							holdings: [],
							invested: 0,
							value: 0,
							pnl: 0,
							pnlPercentage: 0,
							holdingsCount: 0,
						};
					}
				}

				setPortfolioData(data);
			} catch (error) {
				console.error("Error loading portfolio data:", error);
			} finally {
				setLoadingPortfolios(false);
			}
		};

		if (!portfoliosLoading && portfolios.length > 0) {
			loadPortfolioData();
		}
	}, [portfolios, portfoliosLoading]);

	// Load transactions
	React.useEffect(() => {
		const loadTransactions = async () => {
			setLoadingTransactions(true);
			try {
				const response = await transactionsApi.getTransactions({ limit: 100 });
				setTransactions(response.transactions);
			} catch (error) {
				console.error("Error loading transactions:", error);
			} finally {
				setLoadingTransactions(false);
			}
		};

		loadTransactions();
	}, []);

	// Calculate global stats
	const globalStats = React.useMemo(() => {
		const portfolioStats = Object.values(portfolioData);
		return {
			totalInvested: portfolioStats.reduce((sum, p) => sum + p.invested, 0),
			totalValue: portfolioStats.reduce((sum, p) => sum + p.value, 0),
			totalPNL: portfolioStats.reduce((sum, p) => sum + p.pnl, 0),
			totalPNLPercentage:
				portfolioStats.reduce((sum, p) => sum + p.invested, 0) > 0
					? (portfolioStats.reduce((sum, p) => sum + p.pnl, 0) /
							portfolioStats.reduce((sum, p) => sum + p.invested, 0)) *
						100
					: 0,
			totalHoldings: portfolioStats.reduce((sum, p) => sum + p.holdingsCount, 0),
		};
	}, [portfolioData]);

	// Portfolio handlers
	const handleCreatePortfolio = async () => {
		try {
			await createPortfolio(portfolioFormData);
			setShowPortfolioDialog(false);
			setPortfolioFormData({ name: "", description: "", isDefault: false });
			await refreshPortfolios();
		} catch (error) {
			console.error("Error creating portfolio:", error);
		}
	};

	const handleUpdatePortfolio = async () => {
		if (!editingPortfolioId) return;
		try {
			await updatePortfolio(editingPortfolioId, portfolioFormData);
			setShowPortfolioDialog(false);
			setEditingPortfolioId(null);
			setPortfolioFormData({ name: "", description: "", isDefault: false });
			await refreshPortfolios();
		} catch (error) {
			console.error("Error updating portfolio:", error);
		}
	};

	const handleDeletePortfolio = async (portfolioId: string) => {
		if (window.confirm("Are you sure you want to delete this portfolio?")) {
			try {
				await deletePortfolio(portfolioId);
				await refreshPortfolios();
			} catch (error) {
				console.error("Error deleting portfolio:", error);
			}
		}
	};

	const openEditPortfolio = (portfolio: PortfolioData) => {
		setEditingPortfolioId(portfolio.id);
		setPortfolioFormData({
			name: portfolio.name,
			description: portfolio.description || "",
			isDefault: portfolio.isDefault,
		});
		setShowPortfolioDialog(true);
	};

	// Calculate average price automatically
	React.useEffect(() => {
		const quantity = parseFloat(transactionFormData.quantity);
		const amountInvested = parseFloat(transactionFormData.amountInvested);
		if (!isNaN(quantity) && !isNaN(amountInvested) && quantity > 0) {
			const calculatedPrice = (amountInvested / quantity).toFixed(8);
			setTransactionFormData((prev) => ({ ...prev, averagePrice: calculatedPrice }));
		} else {
			setTransactionFormData((prev) => ({ ...prev, averagePrice: "" }));
		}
	}, [transactionFormData.quantity, transactionFormData.amountInvested]);

	// Transaction handlers
	const handleCreateTransaction = async () => {
		setTransactionError(null);

		// Validation
		if (!selectedToken) {
			setTransactionError("Please select a token");
			return;
		}

		if (!transactionFormData.quantity || !transactionFormData.amountInvested || !transactionFormData.averagePrice || !transactionFormData.portfolioId) {
			setTransactionError("Please fill all required fields");
			return;
		}

		try {
			if (editingTransaction) {
				// Update mode
				const updateData = {
					quantity: parseFloat(transactionFormData.quantity),
					amountInvested: parseFloat(transactionFormData.amountInvested),
					averagePrice: parseFloat(transactionFormData.averagePrice),
					type: transactionFormData.type,
					transactionDate: new Date(transactionFormData.transactionDate).toISOString(),
					notes: transactionFormData.notes || undefined,
				};
				await transactionsApi.updateTransaction(editingTransaction.id, updateData);
			} else {
				// Create mode
				const transactionData: CreateTransactionDto = {
					symbol: selectedToken.symbol,
					name: selectedToken.name,
					cmcId: selectedToken.id,
					quantity: parseFloat(transactionFormData.quantity),
					amountInvested: parseFloat(transactionFormData.amountInvested),
					averagePrice: parseFloat(transactionFormData.averagePrice),
					type: transactionFormData.type,
					transactionDate: new Date(transactionFormData.transactionDate).toISOString(),
					notes: transactionFormData.notes || undefined,
					portfolioId: transactionFormData.portfolioId,
				};
				await transactionsApi.createTransaction(transactionData);
			}
			setShowTransactionDialog(false);
			setEditingTransaction(null);
			setSelectedToken(null);
			setTransactionFormData({
				quantity: "",
				amountInvested: "",
				averagePrice: "",
				type: "BUY",
				transactionDate: new Date().toISOString().split("T")[0],
				notes: "",
				portfolioId: portfolios[0]?.id || "",
			});
			// Reload transactions
			const response = await transactionsApi.getTransactions({ limit: 100 });
			setTransactions(response.transactions);
			// Reload portfolios
			await refreshPortfolios();
		} catch (error: unknown) {
			const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
			const errorMessage =
				axiosError.response?.data?.message || axiosError.message || "Error saving transaction";
			setTransactionError(errorMessage);
			console.error("Error saving transaction:", error);
		}
	};

	const openEditTransaction = (transaction: TransactionResponse) => {
		setEditingTransaction(transaction);
		setSelectedToken({
			id: transaction.cmcId,
			name: transaction.name,
			symbol: transaction.symbol,
			slug: transaction.symbol.toLowerCase(),
			num_market_pairs: 0,
			date_added: "",
			tags: [],
			max_supply: 0,
			circulating_supply: 0,
			total_supply: 0,
			is_active: 1,
			is_fiat: 0,
			infinite_supply: false,
			platform: null,
			cmc_rank: 0,
			self_reported_circulating_supply: null,
			self_reported_market_cap: null,
			tvl_ratio: null,
			last_updated: "",
			quote: {
				USD: {
					price: transaction.averagePrice,
					volume_24h: null,
					volume_change_24h: null,
					percent_change_1h: null,
					percent_change_24h: null,
					percent_change_7d: null,
					percent_change_30d: null,
					percent_change_60d: null,
					percent_change_90d: null,
					market_cap: null,
					market_cap_dominance: null,
					fully_diluted_market_cap: null,
					tvl: null,
					last_updated: "",
				},
			},
		});
		setTransactionFormData({
			quantity: transaction.quantity.toString(),
			amountInvested: transaction.amountInvested.toString(),
			averagePrice: transaction.averagePrice.toString(),
			type: transaction.type as "BUY" | "SELL",
			transactionDate: transaction.transactionDate.split("T")[0],
			notes: transaction.notes || "",
			portfolioId: transaction.portfolioId || "",
		});
		setShowTransactionDialog(true);
	};

	const handleDeleteTransaction = async (transactionId: string) => {
		if (window.confirm("Are you sure you want to delete this transaction?")) {
			try {
				await transactionsApi.deleteTransaction(transactionId);
				const response = await transactionsApi.getTransactions({ limit: 100 });
				setTransactions(response.transactions);
				await refreshPortfolios();
			} catch (error) {
				console.error("Error deleting transaction:", error);
			}
		}
	};

	if (portfoliosLoading || loadingPortfolios) {
		return (
			<Box
				sx={{
					alignItems: "center",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					minHeight: "400px",
				}}
			>
				<CircularProgress />
				<Typography color="text.secondary" sx={{ mt: 2 }} variant="body2">
					Loading...
				</Typography>
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
						<Typography variant="h4">Investissements</Typography>
						<Typography color="text.secondary" variant="body1">
							Manage your portfolios and transactions
						</Typography>
					</Box>
					<Stack direction="row" spacing={2}>
						<Button
							onClick={() => {
								setEditingPortfolioId(null);
								setPortfolioFormData({ name: "", description: "", isDefault: false });
								setShowPortfolioDialog(true);
							}}
							startIcon={<WalletIcon />}
							variant="outlined"
						>
							Add Wallet
						</Button>
						<Button
							onClick={() => {
								setEditingTransaction(null);
								setSelectedToken(null);
								setTransactionError(null);
								setTransactionFormData({
									quantity: "",
									amountInvested: "",
									averagePrice: "",
									type: "BUY",
									transactionDate: new Date().toISOString().split("T")[0],
									notes: "",
									portfolioId: portfolios[0]?.id || "",
								});
								setShowTransactionDialog(true);
							}}
							startIcon={<PlusIcon />}
							variant="contained"
						>
							Add Transaction
						</Button>
					</Stack>
				</Stack>

				{/* Global Stats */}
				<Grid container spacing={3}>
					<Grid size={{ xs: 12, sm: 6, md: 3 }}>
						<Card>
							<CardContent>
								<Typography color="text.secondary" variant="body2">
									Total Value
								</Typography>
								<Typography variant="h5">{formatCurrency(globalStats.totalValue, "$", 2)}</Typography>
							</CardContent>
						</Card>
					</Grid>
					<Grid size={{ xs: 12, sm: 6, md: 3 }}>
						<Card>
							<CardContent>
								<Typography color="text.secondary" variant="body2">
									Total Invested
								</Typography>
								<Typography variant="h5">{formatCurrency(globalStats.totalInvested, "$", 2)}</Typography>
							</CardContent>
						</Card>
					</Grid>
					<Grid size={{ xs: 12, sm: 6, md: 3 }}>
						<Card>
							<CardContent>
								<Typography color="text.secondary" variant="body2">
									Profit / Loss
								</Typography>
								<Typography
									color={globalStats.totalPNL >= 0 ? "success.main" : "error.main"}
									variant="h5"
								>
									{formatCurrency(globalStats.totalPNL, "$", 2)}
								</Typography>
								<Typography
									color={globalStats.totalPNLPercentage >= 0 ? "success.main" : "error.main"}
									variant="body2"
								>
									{formatPercentage(globalStats.totalPNLPercentage)}
								</Typography>
							</CardContent>
						</Card>
					</Grid>
					<Grid size={{ xs: 12, sm: 6, md: 3 }}>
						<Card>
							<CardContent>
								<Typography color="text.secondary" variant="body2">
									Total Holdings
								</Typography>
								<Typography variant="h5">{globalStats.totalHoldings}</Typography>
							</CardContent>
						</Card>
					</Grid>
				</Grid>

				{/* Portfolios Section */}
				<Card>
					<CardContent>
						<Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 3 }}>
							<WalletIcon fontSize="var(--icon-fontSize-lg)" />
							<Typography variant="h6">Portfolios</Typography>
						</Stack>
						{portfolios.length === 0 ? (
							<Box sx={{ py: 8, textAlign: "center" }}>
								<Typography color="text.secondary" variant="body1" sx={{ mb: 2 }}>
									No portfolios yet. Create your first portfolio to get started.
								</Typography>
								<Button
									onClick={() => {
										setEditingPortfolioId(null);
										setPortfolioFormData({ name: "", description: "", isDefault: false });
										setShowPortfolioDialog(true);
									}}
									startIcon={<PlusIcon />}
									variant="contained"
								>
									Create Portfolio
								</Button>
							</Box>
						) : (
							<Table>
								<TableHead>
									<TableRow>
										<TableCell>Portfolio</TableCell>
										<TableCell align="right">Current Value</TableCell>
										<TableCell align="right">Invested</TableCell>
										<TableCell align="right">P&L</TableCell>
										<TableCell align="right">Positions</TableCell>
										<TableCell align="right">Actions</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{portfolios.map((portfolio) => {
										const data = portfolioData[portfolio.id];
										if (!data) return null;

										return (
											<TableRow key={portfolio.id} hover>
												<TableCell>
													<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
														<Box
															sx={{
																alignItems: "center",
																bgcolor: "var(--mui-palette-primary-main)",
																borderRadius: 1,
																color: "var(--mui-palette-primary-contrastText)",
																display: "flex",
																height: "40px",
																justifyContent: "center",
																width: "40px",
															}}
														>
															<WalletIcon fontSize="var(--icon-fontSize-md)" />
														</Box>
														<Box>
															<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
																<Typography variant="subtitle2">{data.name}</Typography>
																{data.isDefault && <Chip label="Default" size="small" />}
															</Stack>
															{data.description && (
																<Typography color="text.secondary" variant="body2">
																	{data.description}
																</Typography>
															)}
														</Box>
													</Stack>
												</TableCell>
												<TableCell align="right">
													<Typography variant="body2">{formatCurrency(data.value, "$", 2)}</Typography>
												</TableCell>
												<TableCell align="right">
													<Typography variant="body2">{formatCurrency(data.invested, "$", 2)}</Typography>
												</TableCell>
												<TableCell align="right">
													<Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
														{data.pnl >= 0 ? (
															<TrendUpIcon color="var(--mui-palette-success-main)" fontSize="var(--icon-fontSize-sm)" />
														) : (
															<TrendDownIcon color="var(--mui-palette-error-main)" fontSize="var(--icon-fontSize-sm)" />
														)}
														<Typography
															color={data.pnl >= 0 ? "success.main" : "error.main"}
															variant="body2"
														>
															{formatCurrency(data.pnl, "$", 2)}
														</Typography>
													</Stack>
													<Typography
														color={data.pnlPercentage >= 0 ? "success.main" : "error.main"}
														variant="caption"
													>
														{formatPercentage(data.pnlPercentage)}
													</Typography>
												</TableCell>
												<TableCell align="right">
													<Typography variant="body2">{data.holdingsCount}</Typography>
												</TableCell>
												<TableCell align="right">
													<Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
														<IconButton onClick={() => openEditPortfolio(data)} size="small">
															<PencilIcon fontSize="var(--icon-fontSize-sm)" />
														</IconButton>
														<IconButton
															color="error"
															onClick={() => handleDeletePortfolio(portfolio.id)}
															size="small"
														>
															<TrashIcon fontSize="var(--icon-fontSize-sm)" />
														</IconButton>
													</Stack>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>

				{/* Transactions Section */}
				<Card>
					<CardContent>
						<Stack direction="row" spacing={2} sx={{ alignItems: "center", mb: 3 }}>
							<PlusIcon fontSize="var(--icon-fontSize-lg)" />
							<Typography variant="h6">Transactions</Typography>
						</Stack>
						{loadingTransactions ? (
							<Box sx={{ py: 8, textAlign: "center" }}>
								<CircularProgress />
							</Box>
						) : transactions.length === 0 ? (
							<Box sx={{ py: 8, textAlign: "center" }}>
								<Typography color="text.secondary" variant="body1" sx={{ mb: 2 }}>
									No transactions yet. Add your first transaction to get started.
								</Typography>
								<Button
									onClick={() => {
										setEditingTransaction(null);
										setSelectedToken(null);
										setTransactionError(null);
										setTransactionFormData({
											quantity: "",
											amountInvested: "",
											averagePrice: "",
											type: "BUY",
											transactionDate: new Date().toISOString().split("T")[0],
											notes: "",
											portfolioId: portfolios[0]?.id || "",
										});
										setShowTransactionDialog(true);
									}}
									startIcon={<PlusIcon />}
									variant="contained"
								>
									Add Transaction
								</Button>
							</Box>
						) : (
							<Table>
								<TableHead>
									<TableRow>
										<TableCell>Date</TableCell>
										<TableCell>Token</TableCell>
										<TableCell align="right">Type</TableCell>
										<TableCell align="right">Quantity</TableCell>
										<TableCell align="right">Price</TableCell>
										<TableCell align="right">Amount</TableCell>
										<TableCell align="right">Portfolio</TableCell>
										<TableCell align="right">Actions</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{transactions.map((transaction) => (
										<TableRow key={transaction.id} hover>
											<TableCell>
												<Typography variant="body2">
													{new Date(transaction.transactionDate).toLocaleDateString()}
												</Typography>
											</TableCell>
											<TableCell>
												<Typography variant="subtitle2">{transaction.symbol}</Typography>
												<Typography color="text.secondary" variant="caption">
													{transaction.name}
												</Typography>
											</TableCell>
											<TableCell align="right">
												<Chip
													color={transaction.type === "BUY" ? "success" : "error"}
													label={transaction.type}
													size="small"
												/>
											</TableCell>
											<TableCell align="right">
												<Typography variant="body2">{transaction.quantity}</Typography>
											</TableCell>
											<TableCell align="right">
												<Typography variant="body2">{formatCurrency(transaction.averagePrice, "$", 2)}</Typography>
											</TableCell>
											<TableCell align="right">
												<Typography variant="body2">{formatCurrency(transaction.amountInvested, "$", 2)}</Typography>
											</TableCell>
											<TableCell align="right">
												<Typography variant="body2">{transaction.portfolio?.name || "-"}</Typography>
											</TableCell>
											<TableCell align="right">
												<Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
													<IconButton onClick={() => openEditTransaction(transaction)} size="small">
														<PencilIcon fontSize="var(--icon-fontSize-sm)" />
													</IconButton>
													<IconButton
														color="error"
														onClick={() => handleDeleteTransaction(transaction.id)}
														size="small"
													>
														<TrashIcon fontSize="var(--icon-fontSize-sm)" />
													</IconButton>
												</Stack>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</Stack>

			{/* Portfolio Dialog */}
			<Dialog fullWidth maxWidth="sm" onClose={() => setShowPortfolioDialog(false)} open={showPortfolioDialog}>
				<DialogTitle>
					{editingPortfolioId ? "Edit Portfolio" : "Create Portfolio"}
					<IconButton
						onClick={() => {
							setShowPortfolioDialog(false);
							setEditingPortfolioId(null);
							setPortfolioFormData({ name: "", description: "", isDefault: false });
						}}
						sx={{ position: "absolute", right: 8, top: 8 }}
					>
						<XIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent>
					<Stack spacing={3} sx={{ mt: 1 }}>
						<TextField
							fullWidth
							label="Name"
							onChange={(e) => setPortfolioFormData({ ...portfolioFormData, name: e.target.value })}
							required
							value={portfolioFormData.name}
						/>
						<TextField
							fullWidth
							label="Description"
							multiline
							onChange={(e) => setPortfolioFormData({ ...portfolioFormData, description: e.target.value })}
							rows={3}
							value={portfolioFormData.description || ""}
						/>
						<FormControlLabel
							control={
								<Switch
									checked={portfolioFormData.isDefault || false}
									onChange={(e) => setPortfolioFormData({ ...portfolioFormData, isDefault: e.target.checked })}
								/>
							}
							label="Default Portfolio"
						/>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowPortfolioDialog(false)}>Cancel</Button>
					<Button
						onClick={editingPortfolioId ? handleUpdatePortfolio : handleCreatePortfolio}
						variant="contained"
					>
						{editingPortfolioId ? "Update" : "Create"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Transaction Dialog */}
			<Dialog fullWidth maxWidth="md" onClose={() => setShowTransactionDialog(false)} open={showTransactionDialog}>
				<DialogTitle>
					{editingTransaction ? "Edit Transaction" : "Create Transaction"}
					<IconButton
						onClick={() => {
							setShowTransactionDialog(false);
							setEditingTransaction(null);
							setSelectedToken(null);
							setTransactionError(null);
							setTransactionFormData({
								quantity: "",
								amountInvested: "",
								averagePrice: "",
								type: "BUY",
								transactionDate: new Date().toISOString().split("T")[0],
								notes: "",
								portfolioId: portfolios[0]?.id || "",
							});
						}}
						sx={{ position: "absolute", right: 8, top: 8 }}
					>
						<XIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent>
					<Stack spacing={3} sx={{ mt: 1 }}>
						{transactionError && (
							<Box sx={{ p: 2, bgcolor: "error.50", borderRadius: 1, border: "1px solid", borderColor: "error.200" }}>
								<Typography color="error.main" variant="body2">
									{transactionError}
								</Typography>
							</Box>
						)}
						<TokenSearch
							onTokenSelect={setSelectedToken}
							selectedToken={selectedToken}
							error={!selectedToken && transactionError !== null}
							helperText={!selectedToken ? "Please select a token" : undefined}
						/>
						<FormControl fullWidth required>
							<InputLabel>Portfolio</InputLabel>
							<Select
								label="Portfolio"
								onChange={(e) => setTransactionFormData({ ...transactionFormData, portfolioId: e.target.value })}
								value={transactionFormData.portfolioId || ""}
							>
								{portfolios.map((portfolio) => (
									<MenuItem key={portfolio.id} value={portfolio.id}>
										{portfolio.name} {portfolio.isDefault && "(Default)"}
									</MenuItem>
								))}
							</Select>
						</FormControl>
						<FormControl fullWidth>
							<InputLabel>Type</InputLabel>
							<Select
								label="Type"
								onChange={(e) =>
									setTransactionFormData({ ...transactionFormData, type: e.target.value as "BUY" | "SELL" })
								}
								value={transactionFormData.type || "BUY"}
							>
								<MenuItem value="BUY">BUY</MenuItem>
								<MenuItem value="SELL">SELL</MenuItem>
							</Select>
						</FormControl>
						<Grid container spacing={2}>
							<Grid size={{ xs: 12, sm: 6 }}>
								<TextField
									fullWidth
									label="Quantity"
									onChange={(e) => setTransactionFormData({ ...transactionFormData, quantity: e.target.value })}
									required
									type="number"
									inputProps={{ step: "0.00000001" }}
									value={transactionFormData.quantity || ""}
								/>
							</Grid>
							<Grid size={{ xs: 12, sm: 6 }}>
								<TextField
									fullWidth
									label="Amount Invested (USD)"
									onChange={(e) => setTransactionFormData({ ...transactionFormData, amountInvested: e.target.value })}
									required
									type="number"
									inputProps={{ step: "0.01" }}
									value={transactionFormData.amountInvested || ""}
								/>
							</Grid>
						</Grid>
						<TextField
							fullWidth
							label="Average Price (USD)"
							disabled
							helperText="Calculated automatically from quantity and amount invested"
							value={transactionFormData.averagePrice || ""}
						/>
						<TextField
							fullWidth
							label="Transaction Date"
							onChange={(e) => setTransactionFormData({ ...transactionFormData, transactionDate: e.target.value })}
							required
							type="date"
							value={transactionFormData.transactionDate || ""}
						/>
						<TextField
							fullWidth
							label="Notes (optional)"
							multiline
							onChange={(e) => setTransactionFormData({ ...transactionFormData, notes: e.target.value })}
							rows={3}
							value={transactionFormData.notes || ""}
						/>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowTransactionDialog(false)}>Cancel</Button>
					<Button onClick={handleCreateTransaction} variant="contained">
						{editingTransaction ? "Update" : "Create"}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
