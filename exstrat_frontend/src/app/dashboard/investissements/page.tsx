"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Avatar from "@mui/material/Avatar";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemAvatar from "@mui/material/ListItemAvatar";
import ListItemText from "@mui/material/ListItemText";
import CardHeader from "@mui/material/CardHeader";
import Checkbox from "@mui/material/Checkbox";
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
import TablePagination from "@mui/material/TablePagination";
import TableSortLabel from "@mui/material/TableSortLabel";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import InputAdornment from "@mui/material/InputAdornment";
import OutlinedInput from "@mui/material/OutlinedInput";
import Collapse from "@mui/material/Collapse";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { PencilIcon } from "@phosphor-icons/react/dist/ssr/Pencil";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { TrendDownIcon } from "@phosphor-icons/react/dist/ssr/TrendDown";
import { TrendUpIcon } from "@phosphor-icons/react/dist/ssr/TrendUp";
import { WalletIcon } from "@phosphor-icons/react/dist/ssr/Wallet";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { GlobeIcon } from "@phosphor-icons/react/dist/ssr/Globe";
import { ChartLineIcon } from "@phosphor-icons/react/dist/ssr/ChartLine";
import { PlugsConnectedIcon } from "@phosphor-icons/react/dist/ssr/PlugsConnected";
import { FileCsvIcon } from "@phosphor-icons/react/dist/ssr/FileCsv";
import MuiTooltip from "@mui/material/Tooltip";

import { usePortfolio } from "@/contexts/PortfolioContext";
import * as portfoliosApi from "@/lib/portfolios-api";
import { transactionsApi } from "@/lib/transactions-api";
import { formatCurrency, formatPercentage, formatCompactCurrency, formatQuantity, formatQuantityCompact, formatQuantityCompactWithK } from "@/lib/format";
import { useSecretMode } from "@/hooks/use-secret-mode";
import { TokenSearch } from "@/components/transactions/token-search";
import { CreateTransactionModal } from "@/components/transactions/create-transaction-modal";
import { AddTransactionMethodModal } from "@/components/transactions/add-transaction-method-modal";
import { SelectExchangeModal, type ExchangeType } from "@/components/exchanges/select-exchange-modal";
import { SelectCsvModal } from "@/components/exchanges/select-csv-modal";
import { ImportCsvModal } from "@/components/exchanges/import-csv-modal";
import { toast } from "@/components/core/toaster";
import type { Holding, CreatePortfolioDto, UpdatePortfolioDto } from "@/types/portfolio";
import type { TransactionResponse, CreateTransactionDto, TokenSearchResult } from "@/types/transactions";
import { Area, AreaChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { NoSsr } from "@/components/core/no-ssr";
import CardActions from "@mui/material/CardActions";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { ArrowDownRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowDownRight";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";
import { ArrowsLeftRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowsLeftRight";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { InfoIcon } from "@phosphor-icons/react/dist/ssr/Info";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";

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

export default function Page(): React.JSX.Element {
	const { secretMode } = useSecretMode();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
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
	const [showDeleteWalletModal, setShowDeleteWalletModal] = React.useState(false);
	const [walletToDelete, setWalletToDelete] = React.useState<string | null>(null);
	const [showSelectExchangeModal, setShowSelectExchangeModal] = React.useState(false);
	const [showSelectCsvModal, setShowSelectCsvModal] = React.useState(false);
	const [showImportCsvModal, setShowImportCsvModal] = React.useState(false);
	const [selectedExchange, setSelectedExchange] = React.useState<ExchangeType | null>(null);
	const [showAddTransactionMethodModal, setShowAddTransactionMethodModal] = React.useState(false);
	const [showDeleteTransactionModal, setShowDeleteTransactionModal] = React.useState(false);
	const [transactionToDelete, setTransactionToDelete] = React.useState<string | null>(null);
	const [selectedTransactionIds, setSelectedTransactionIds] = React.useState<Set<string>>(new Set());
	const [showDeleteMultipleTransactionsModal, setShowDeleteMultipleTransactionsModal] = React.useState(false);
	const [showWalletDetailsModal, setShowWalletDetailsModal] = React.useState(false);
	const [selectedWalletId, setSelectedWalletId] = React.useState<string | null>(null);
	
	// Wallet Transactions pagination and search states (per wallet)
	const [walletTransactionsSearch, setWalletTransactionsSearch] = React.useState<Record<string, string>>({});
	const [walletTransactionsPage, setWalletTransactionsPage] = React.useState<Record<string, number>>({});
	const [walletTransactionsRowsPerPage, setWalletTransactionsRowsPerPage] = React.useState<Record<string, number>>({});
	const [portfolioFormData, setPortfolioFormData] = React.useState<CreatePortfolioDto>({
		name: "",
		description: "",
		isDefault: false,
	});
	const [portfolioName, setPortfolioName] = React.useState("");

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

	// Search and pagination states for wallets
	const [walletSearchQuery, setWalletSearchQuery] = React.useState("");
	const [walletPage, setWalletPage] = React.useState(0);
	const [walletRowsPerPage, setWalletRowsPerPage] = React.useState(3);
	const [walletOrderBy, setWalletOrderBy] = React.useState<keyof PortfolioData | "">("");
	const [walletOrder, setWalletOrder] = React.useState<"asc" | "desc">("asc");

	// Search and pagination states for transactions
	const [transactionSearchQuery, setTransactionSearchQuery] = React.useState("");
	const [transactionPage, setTransactionPage] = React.useState(0);
	const [transactionRowsPerPage, setTransactionRowsPerPage] = React.useState(5);
	const [transactionOrderBy, setTransactionOrderBy] = React.useState<string>("");
	const [transactionOrder, setTransactionOrder] = React.useState<"asc" | "desc">("asc");
	const [transactionWalletFilter, setTransactionWalletFilter] = React.useState<string>("global"); // "global" or portfolioId

	// View all tokens modal state
	const [showAllTokensModal, setShowAllTokensModal] = React.useState(false);
	const [allTokensSearchQuery, setAllTokensSearchQuery] = React.useState("");
	const [allTokensPage, setAllTokensPage] = React.useState(0);
	const [allTokensRowsPerPage, setAllTokensRowsPerPage] = React.useState(10);

	// Wallet performance view mode
	const [walletPerformanceView, setWalletPerformanceView] = React.useState<"global" | "byWallet">("global");
	
	// Expanded wallets state
	const [expandedWalletId, setExpandedWalletId] = React.useState<string | null>(null);

	// Calculate aggregated token data for chart
	// Full token data (all tokens, no limit)
	const allTokenData = React.useMemo(() => {
		const tokenMap = new Map<string, { symbol: string; name: string; quantity: number; value: number; color: string }>();

		// Aggregate all holdings from all portfolios
		Object.values(portfolioData).forEach((portfolio) => {
			portfolio.holdings.forEach((holding) => {
				const symbol = holding.token.symbol.toUpperCase();
				// IMPORTANT: Utiliser currentValue du backend qui est calculé avec currentPrice (prix actuel du marché)
				const currentValue = holding.currentValue || 0;

				if (tokenMap.has(symbol)) {
					const existing = tokenMap.get(symbol)!;
					existing.quantity += holding.quantity;
					existing.value += currentValue;
				} else {
				// Generate a color based on symbol using vibrant colors that work well in dark mode
					const colors = [
					"var(--mui-palette-primary-main)", // #047DD5 - Exstrat Blue
					"var(--mui-palette-secondary-main)", // #F6851B - Exstrat Orange
					"var(--mui-palette-success-main)", // Green
					"var(--mui-palette-warning-main)", // Yellow/Orange
					"var(--mui-palette-error-main)", // Red
					"var(--mui-palette-info-main)", // Cyan/Blue
					"#9C27B0", // Purple
					"#E91E63", // Pink
					"#00BCD4", // Cyan
					"#4CAF50", // Green
					"#FF9800", // Orange
					"#2196F3", // Blue
					];
					const colorIndex = symbol.charCodeAt(0) % colors.length;

					tokenMap.set(symbol, {
						symbol,
						name: holding.token.name,
						quantity: holding.quantity,
						value: currentValue,
						color: colors[colorIndex],
					});
				}
			});
		});

		// Convert to array and sort by value (descending)
		return Array.from(tokenMap.values())
			.sort((a, b) => b.value - a.value)
			.map((item) => ({
				name: item.symbol,
				value: item.value,
				color: item.color,
				quantity: item.quantity,
				tokenName: item.name,
			}));
	}, [portfolioData]);

	// Token data for chart (limited to top 10, with "Others" for the rest)
	const aggregatedTokenData = React.useMemo(() => {
		// Limit to top 10 for chart display, group the rest as "Others"
		const MAX_TOKENS_FOR_CHART = 10;
		if (allTokenData.length <= MAX_TOKENS_FOR_CHART) {
			return allTokenData;
		}

		const topTokens = allTokenData.slice(0, MAX_TOKENS_FOR_CHART);
		const othersValue = allTokenData.slice(MAX_TOKENS_FOR_CHART).reduce((sum, token) => sum + token.value, 0);
		const othersQuantity = allTokenData.slice(MAX_TOKENS_FOR_CHART).reduce((sum, token) => sum + token.quantity, 0);

		if (othersValue > 0) {
			topTokens.push({
				name: "Others",
				value: othersValue,
				color: "var(--mui-palette-text-secondary)",
				quantity: othersQuantity,
				tokenName: `+${allTokenData.length - MAX_TOKENS_FOR_CHART} more tokens`,
			});
		}

		return topTokens;
	}, [allTokenData]);

	// Load portfolio data function (extracted for reuse)
	const loadPortfolioDataRef = React.useRef<((portfoliosToLoad?: typeof portfolios) => Promise<void>) | null>(null);
	
	const loadPortfolioData = React.useCallback(async (portfoliosToLoad?: typeof portfolios) => {
		const portfoliosList = portfoliosToLoad || portfolios;
		if (portfoliosList.length === 0 || loadingPortfolios) return;

			setLoadingPortfolios(true);
			try {
				const data: Record<string, PortfolioData> = {};

			for (const portfolio of portfoliosList) {
					try {
						const holdings = await portfoliosApi.getPortfolioHoldings(portfolio.id);
						const invested = holdings.reduce((sum, h) => sum + (h.investedAmount || 0), 0);
					// IMPORTANT: Utiliser currentValue du backend qui est calculé avec currentPrice (prix actuel du marché)
					// currentValue = quantity * currentPrice (ou quantity * averagePrice si currentPrice n'est pas disponible)
					const value = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
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
	}, [portfolios]);

	// Store the function in ref for stable reference
	loadPortfolioDataRef.current = loadPortfolioData;

	// Load portfolio data
	React.useEffect(() => {
		if (!portfoliosLoading && portfolios.length > 0 && !loadingPortfolios) {
			loadPortfolioData();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [portfolios, portfoliosLoading]);

	// Load transactions function (extracted for reuse)
	const loadTransactions = React.useCallback(async () => {
			setLoadingTransactions(true);
			try {
				const response = await transactionsApi.getTransactions({ limit: 100 });
				setTransactions(response.transactions);
			} catch (error) {
				console.error("Error loading transactions:", error);
			} finally {
				setLoadingTransactions(false);
			}
	}, []);

	// Load transactions on mount
	React.useEffect(() => {
		loadTransactions();
	}, [loadTransactions]);

	// Refresh all data function (for use after imports/updates)
	const refreshAllData = React.useCallback(async () => {
		// First refresh portfolios list
		await refreshPortfolios();
		// Get the updated portfolios directly from API
		const updatedPortfolios = await portfoliosApi.getPortfolios();
		// Then reload transactions and portfolio data with updated portfolios
		await Promise.all([
			loadTransactions(),
			loadPortfolioDataRef.current?.(updatedPortfolios) || Promise.resolve()
		]);
	}, [refreshPortfolios, loadTransactions]);

	// Filtered, sorted and paginated wallets
	const filteredWallets = React.useMemo(() => {
		if (!walletSearchQuery.trim()) {
			return portfolios;
		}
		const query = walletSearchQuery.toLowerCase();
		return portfolios.filter((portfolio) => {
			const data = portfolioData[portfolio.id];
			if (!data) return false;
			return (
				data.name.toLowerCase().includes(query) ||
				(data.description?.toLowerCase().includes(query) ?? false)
			);
		});
	}, [portfolios, portfolioData, walletSearchQuery]);

	const sortedWallets = React.useMemo(() => {
		if (!walletOrderBy) {
			return filteredWallets;
		}

		return [...filteredWallets].sort((a, b) => {
			const dataA = portfolioData[a.id];
			const dataB = portfolioData[b.id];
			if (!dataA || !dataB) return 0;

			let aValue: number | string = "";
			let bValue: number | string = "";

			switch (walletOrderBy) {
				case "name":
					aValue = dataA.name.toLowerCase();
					bValue = dataB.name.toLowerCase();
					break;
				case "value":
					aValue = dataA.value;
					bValue = dataB.value;
					break;
				case "invested":
					aValue = dataA.invested;
					bValue = dataB.invested;
					break;
				case "pnl":
					aValue = dataA.pnl;
					bValue = dataB.pnl;
					break;
				default:
					return 0;
			}

			if (typeof aValue === "string" && typeof bValue === "string") {
				return walletOrder === "asc"
					? aValue.localeCompare(bValue)
					: bValue.localeCompare(aValue);
			}

			if (typeof aValue === "number" && typeof bValue === "number") {
				return walletOrder === "asc" ? aValue - bValue : bValue - aValue;
			}

			return 0;
		});
	}, [filteredWallets, portfolioData, walletOrderBy, walletOrder]);

	const paginatedWallets = React.useMemo(() => {
		const start = walletPage * walletRowsPerPage;
		return sortedWallets.slice(start, start + walletRowsPerPage);
	}, [sortedWallets, walletPage, walletRowsPerPage]);

	// Filtered, sorted and paginated transactions
	const filteredTransactions = React.useMemo(() => {
		let filtered = transactions;
		
		// Filter by wallet if not "global"
		if (transactionWalletFilter !== "global") {
			filtered = filtered.filter((transaction) => transaction.portfolioId === transactionWalletFilter);
		}
		
		// Filter by search query
		if (transactionSearchQuery.trim()) {
			const query = transactionSearchQuery.toLowerCase();
			filtered = filtered.filter(
				(transaction) =>
					transaction.symbol.toLowerCase().includes(query) ||
					transaction.name.toLowerCase().includes(query) ||
					transaction.portfolio?.name.toLowerCase().includes(query)
			);
		}
		
		return filtered;
	}, [transactions, transactionSearchQuery, transactionWalletFilter]);

	const sortedTransactions = React.useMemo(() => {
		if (!transactionOrderBy) {
			return filteredTransactions;
		}

		return [...filteredTransactions].sort((a, b) => {
			let aValue: number | string = "";
			let bValue: number | string = "";

			switch (transactionOrderBy) {
				case "date":
					aValue = new Date(a.transactionDate).getTime();
					bValue = new Date(b.transactionDate).getTime();
					break;
				case "symbol":
					aValue = a.symbol.toLowerCase();
					bValue = b.symbol.toLowerCase();
					break;
				case "name":
					aValue = a.name.toLowerCase();
					bValue = b.name.toLowerCase();
					break;
				case "type":
					aValue = a.type;
					bValue = b.type;
					break;
				case "quantity":
					aValue = a.quantity;
					bValue = b.quantity;
					break;
				case "averagePrice":
					aValue = a.averagePrice;
					bValue = b.averagePrice;
					break;
				case "amountInvested":
					aValue = a.amountInvested;
					bValue = b.amountInvested;
					break;
				case "wallet":
					aValue = a.portfolio?.name?.toLowerCase() || "";
					bValue = b.portfolio?.name?.toLowerCase() || "";
					break;
				default:
					return 0;
			}

			if (typeof aValue === "string" && typeof bValue === "string") {
				return transactionOrder === "asc"
					? aValue.localeCompare(bValue)
					: bValue.localeCompare(aValue);
			}

			if (typeof aValue === "number" && typeof bValue === "number") {
				return transactionOrder === "asc" ? aValue - bValue : bValue - aValue;
			}

			return 0;
		});
	}, [filteredTransactions, transactionOrderBy, transactionOrder]);

	const paginatedTransactions = React.useMemo(() => {
		const start = transactionPage * transactionRowsPerPage;
		return sortedTransactions.slice(start, start + transactionRowsPerPage);
	}, [sortedTransactions, transactionPage, transactionRowsPerPage]);

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

	// Calculate portfolio performance over time
	const portfolioPerformanceData = React.useMemo(() => {
		if (transactions.length === 0 || Object.keys(portfolioData).length === 0) {
			// Generate simulated data based on current values
			const currentTotalValue = globalStats.totalValue;
			const currentTotalInvested = globalStats.totalInvested;
			const now = new Date();
			const days = 30;
			const data: Array<{ name: string; value: number }> = [];

			for (let i = days; i >= 0; i--) {
				const date = new Date(now);
				date.setDate(date.getDate() - i);
				const progress = i / days;
				const simulatedInvested = currentTotalInvested * (0.7 + 0.3 * progress);
				const simulatedValue = simulatedInvested * (1 + (globalStats.totalPNLPercentage / 100) * progress);
				const monthName = date.toLocaleDateString("en-US", { month: "short" });
				const day = date.getDate();
				data.push({
					name: `${monthName} ${day}`,
					value: simulatedValue,
				});
			}

			return data;
		}

		// Group transactions by date and calculate portfolio value evolution
		const transactionPoints: Array<{ date: Date; invested: number; daysAgo: number }> = [];
		const sortedTransactions = [...transactions].sort((a, b) => {
			const dateA = new Date(a.transactionDate).getTime();
			const dateB = new Date(b.transactionDate).getTime();
			return dateA - dateB;
		});

		let cumulativeInvested = 0;
		const now = new Date();
		const days = 30;

		// Calculate cumulative invested amount for each transaction date
		for (const transaction of sortedTransactions) {
			const transactionDate = new Date(transaction.transactionDate);
			const daysDiff = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
			if (daysDiff <= days && daysDiff >= 0) {
				if (transaction.type === "BUY") {
					cumulativeInvested += transaction.amountInvested || 0;
				} else {
					// For SELL, subtract the cost basis (amountInvested represents what was sold)
					cumulativeInvested -= transaction.amountInvested || 0;
				}
				transactionPoints.push({
					date: transactionDate,
					invested: cumulativeInvested,
					daysAgo: daysDiff,
				});
			}
		}

		// Generate data points for all dates with smooth interpolation
		const data: Array<{ name: string; value: number }> = [];
		
		for (let i = days; i >= 0; i--) {
			const date = new Date(now);
			date.setDate(date.getDate() - i);
			const monthName = date.toLocaleDateString("en-US", { month: "short" });
			const day = date.getDate();
			const dateKey = `${monthName} ${day}`;
			const daysAgo = i;

			// Find the closest transaction points before and after this date
			let beforePoint: { invested: number; daysAgo: number } | null = null;
			let afterPoint: { invested: number; daysAgo: number } | null = null;

			for (const point of transactionPoints) {
				if (point.daysAgo >= daysAgo) {
					if (!beforePoint || point.daysAgo < beforePoint.daysAgo) {
						beforePoint = point;
					}
				}
				if (point.daysAgo <= daysAgo) {
					if (!afterPoint || point.daysAgo > afterPoint.daysAgo) {
						afterPoint = point;
					}
				}
			}

			// Calculate invested amount for this date
			let investedAtDate: number;
			if (beforePoint && afterPoint) {
				// Interpolate between two points
				if (beforePoint.daysAgo === afterPoint.daysAgo) {
					investedAtDate = beforePoint.invested;
			} else {
					const factor = (daysAgo - afterPoint.daysAgo) / (beforePoint.daysAgo - afterPoint.daysAgo);
					investedAtDate = afterPoint.invested + (beforePoint.invested - afterPoint.invested) * factor;
				}
			} else if (beforePoint) {
				// Only before point (future transaction)
				investedAtDate = beforePoint.invested;
			} else if (afterPoint) {
				// Only after point (past transaction)
				investedAtDate = afterPoint.invested;
			} else {
				// No transactions, estimate based on current invested
				const progress = i / days;
				investedAtDate = globalStats.totalInvested * (0.7 + 0.3 * (1 - progress));
			}

			// Calculate value by applying PnL percentage
			// Estimate PnL percentage at this point in time (assume it was lower in the past)
			const progress = i / days; // 0 = today, 1 = 30 days ago
			const estimatedPnLPercentage = globalStats.totalPNLPercentage * (1 - progress * 0.3); // PnL was 30% lower 30 days ago
			const valueAtDate = investedAtDate * (1 + estimatedPnLPercentage / 100);

				data.push({
					name: dateKey,
				value: Math.max(0, valueAtDate), // Ensure non-negative
				});
			}

		// Ensure the last value (today) matches current total value exactly
		if (data.length > 0) {
			data[data.length - 1].value = globalStats.totalValue;
		}

		return data;
	}, [transactions, portfolioData, globalStats]);

	// Calculate performance data by wallet (top 3)
	const walletPerformanceByWalletData = React.useMemo<{
		data: Array<{ name: string; [key: string]: string | number }>;
		wallets: PortfolioData[];
	}>(() => {
		const portfolioStats = Object.values(portfolioData);
		if (portfolioStats.length === 0) {
			return { data: [], wallets: [] };
		}

		// Get top 3 wallets by value
		const topWallets = [...portfolioStats]
			.sort((a, b) => b.value - a.value)
			.slice(0, 3);

		if (topWallets.length === 0) {
			return { data: [], wallets: [] };
		}

		const now = new Date();
		const days = 30;
		const data: Array<{ name: string; [key: string]: string | number }> = [];

		// For each wallet, calculate value evolution based on transactions
		const walletDataPoints: Record<string, Array<{ date: Date; invested: number; value: number; daysAgo: number }>> = {};

		topWallets.forEach((wallet) => {
			const walletKey = wallet.name.replace(/\s+/g, "_");
			const walletTransactions = transactions.filter(
				(t) => t.portfolioId === wallet.id
			).sort((a, b) => {
				const dateA = new Date(a.transactionDate).getTime();
				const dateB = new Date(b.transactionDate).getTime();
				return dateA - dateB;
			});

			let cumulativeInvested = 0;
			const points: Array<{ date: Date; invested: number; value: number; daysAgo: number }> = [];

			// Calculate cumulative invested and value for each transaction
			for (const transaction of walletTransactions) {
				const transactionDate = new Date(transaction.transactionDate);
				const daysDiff = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
				
				if (daysDiff <= days && daysDiff >= 0) {
					if (transaction.type === "BUY") {
						cumulativeInvested += transaction.amountInvested || 0;
					} else {
						cumulativeInvested -= transaction.amountInvested || 0;
					}
					
					// Estimate value at transaction date based on current PnL percentage
					const pnlPercentage = wallet.pnlPercentage || 0;
					const progress = daysDiff / days; // 0 = today, 1 = 30 days ago
					// Assume PnL was lower in the past (gradual improvement)
					const estimatedPnLPercentage = pnlPercentage * (1 - progress * 0.4);
					const estimatedValue = cumulativeInvested * (1 + estimatedPnLPercentage / 100);

					points.push({
						date: transactionDate,
						invested: cumulativeInvested,
						value: Math.max(0, estimatedValue),
						daysAgo: daysDiff,
					});
				}
			}

			walletDataPoints[walletKey] = points;
		});

		// Generate data points for each date
		for (let i = days; i >= 0; i--) {
			const date = new Date(now);
			date.setDate(date.getDate() - i);
			const monthName = date.toLocaleDateString("en-US", { month: "short" });
			const day = date.getDate();
			const dateKey = `${monthName} ${day}`;
			const daysAgo = i;

			const dataPoint: { name: string; [key: string]: string | number } = { name: dateKey };

			// Calculate value for each wallet at this date
			topWallets.forEach((wallet) => {
				const walletKey = wallet.name.replace(/\s+/g, "_");
				const points = walletDataPoints[walletKey] || [];

				// Find closest transaction points before and after this date
				let beforePoint: { invested: number; value: number; daysAgo: number } | null = null;
				let afterPoint: { invested: number; value: number; daysAgo: number } | null = null;

				for (const point of points) {
					if (point.daysAgo >= daysAgo) {
						if (!beforePoint || point.daysAgo < beforePoint.daysAgo) {
							beforePoint = point;
						}
					}
					if (point.daysAgo <= daysAgo) {
						if (!afterPoint || point.daysAgo > afterPoint.daysAgo) {
							afterPoint = point;
						}
					}
				}

				// Calculate value at this date
				let valueAtDate: number;
				if (beforePoint && afterPoint) {
					// Interpolate between two points
					if (beforePoint.daysAgo === afterPoint.daysAgo) {
						valueAtDate = beforePoint.value;
					} else {
						const factor = (daysAgo - afterPoint.daysAgo) / (beforePoint.daysAgo - afterPoint.daysAgo);
						valueAtDate = afterPoint.value + (beforePoint.value - afterPoint.value) * factor;
					}
				} else if (beforePoint) {
					// Only before point (future transaction)
					valueAtDate = beforePoint.value;
				} else if (afterPoint) {
					// Only after point (past transaction)
					valueAtDate = afterPoint.value;
				} else {
					// No transactions, simulate based on current value
					const progress = i / days; // 0 = today, 1 = 30 days ago
					const pnlPercentage = wallet.pnlPercentage || 0;
					// Simulate starting from lower value with gradual growth
					const startValue = wallet.value * 0.6;
					const endValue = wallet.value;
					// Add some volatility (random variation between -5% and +5%)
					const volatility = 1 + (Math.sin(progress * Math.PI * 4) * 0.05);
					valueAtDate = (startValue + (endValue - startValue) * (1 - progress)) * volatility;
				}

				// Add some realistic volatility to make the graph more interesting
				if (points.length > 0) {
					// Add small random variations (±2%) for realism
					const variation = 1 + (Math.sin((daysAgo / days) * Math.PI * 6) * 0.02);
					valueAtDate = valueAtDate * variation;
				}

				dataPoint[walletKey] = Math.max(0, valueAtDate);
			});

			data.push(dataPoint);
		}

		// Ensure the last value (today) matches current wallet value exactly
		const lastDataPoint = data[data.length - 1];
		topWallets.forEach((wallet) => {
			const walletKey = wallet.name.replace(/\s+/g, "_");
			lastDataPoint[walletKey] = wallet.value;
		});

		return { data, wallets: topWallets };
	}, [portfolioData, transactions]);

	// Portfolio handlers
	const handleCreatePortfolio = async () => {
		if (!portfolioName.trim()) {
			return;
		}
		try {
			await createPortfolio({ name: portfolioName.trim(), description: "", isDefault: false });
			setShowPortfolioDialog(false);
			setPortfolioName("");
			setPortfolioFormData({ name: "", description: "", isDefault: false });
			await refreshPortfolios();
			toast.success("Wallet created successfully");
		} catch (error) {
			console.error("Error creating portfolio:", error);
			toast.error("Failed to create wallet. Please try again.");
		}
	};

	const handleUpdatePortfolio = async () => {
		if (!editingPortfolioId) return;
		try {
			await updatePortfolio(editingPortfolioId, { name: portfolioFormData.name });
			setShowPortfolioDialog(false);
			setEditingPortfolioId(null);
			setPortfolioFormData({ name: "", description: "", isDefault: false });
			await refreshPortfolios();
			toast.success("Wallet updated successfully");
		} catch (error) {
			console.error("Error updating portfolio:", error);
			toast.error("Failed to update wallet. Please try again.");
		}
	};

	const handleDeletePortfolio = async (portfolioId: string) => {
		setWalletToDelete(portfolioId);
		setShowDeleteWalletModal(true);
	};

	const confirmDeleteWallet = async () => {
		if (!walletToDelete) return;
		try {
			await deletePortfolio(walletToDelete);
			await refreshPortfolios();
			setShowDeleteWalletModal(false);
			setWalletToDelete(null);
			toast.success("Wallet deleted successfully");
		} catch (error) {
			console.error("Error deleting portfolio:", error);
			toast.error("Failed to delete wallet. Please try again.");
		}
	};

	const openEditPortfolio = (portfolio: PortfolioData) => {
		setEditingPortfolioId(portfolio.id);
		setPortfolioFormData({
			name: portfolio.name,
			description: "",
			isDefault: false,
		});
		setShowPortfolioDialog(true);
	};

	const openWalletDetails = (portfolioId: string) => {
		setSelectedWalletId(portfolioId);
		setShowWalletDetailsModal(true);
	};

	const handleToggleWalletExpand = (portfolioId: string) => {
		if (expandedWalletId === portfolioId) {
			setExpandedWalletId(null);
		} else {
			setExpandedWalletId(portfolioId);
		}
	};

	// Get wallet transactions
	const walletTransactions = React.useMemo(() => {
		if (!selectedWalletId) return [];
		return transactions.filter((transaction) => transaction.portfolioId === selectedWalletId);
	}, [transactions, selectedWalletId]);

	// Get selected wallet data
	const selectedWalletData = React.useMemo(() => {
		if (!selectedWalletId) return null;
		return portfolioData[selectedWalletId] || null;
	}, [portfolioData, selectedWalletId]);

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
			// IMPORTANT: Recharger les holdings pour mettre à jour les valeurs après la transaction
			// Le backend recalcule déjà le holding de manière synchrone, mais on doit recharger les données
			const data: Record<string, PortfolioData> = {};
			const updatedPortfolios = await portfoliosApi.getPortfolios();
			for (const portfolio of updatedPortfolios) {
				try {
					const holdings = await portfoliosApi.getPortfolioHoldings(portfolio.id);
					const invested = holdings.reduce((sum, h) => sum + (h.investedAmount || 0), 0);
					const value = holdings.reduce((sum, h) => sum + (h.currentValue || 0), 0);
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
					console.error(`Error reloading holdings for ${portfolio.name}:`, error);
				}
			}
			setPortfolioData(data);
			// Show success notification
			if (editingTransaction) {
				toast.success("Transaction updated successfully");
			} else {
				toast.success("Transaction created successfully");
			}
		} catch (error: unknown) {
			const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
			const errorMessage =
				axiosError.response?.data?.message || axiosError.message || "Error saving transaction";
			setTransactionError(errorMessage);
			console.error("Error saving transaction:", error);
			toast.error("Failed to save transaction. Please try again.");
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
		setTransactionToDelete(transactionId);
		setShowDeleteTransactionModal(true);
	};

	const confirmDeleteTransaction = async () => {
		if (!transactionToDelete) return;
		try {
			await transactionsApi.deleteTransaction(transactionToDelete);
			// Reload transactions
			const response = await transactionsApi.getTransactions({ limit: 100 });
			setTransactions(response.transactions);
			// Reload portfolios
			await refreshPortfolios();
			setShowDeleteTransactionModal(false);
			setTransactionToDelete(null);
			toast.success("Transaction deleted successfully");
		} catch (error) {
			console.error("Error deleting transaction:", error);
			toast.error("Failed to delete transaction. Please try again.");
		}
	};

	const handleSelectTransaction = (transactionId: string) => {
		setSelectedTransactionIds((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(transactionId)) {
				newSet.delete(transactionId);
			} else {
				newSet.add(transactionId);
			}
			return newSet;
		});
	};

	const handleSelectAllTransactions = () => {
		if (selectedTransactionIds.size === paginatedTransactions.length) {
			setSelectedTransactionIds(new Set());
		} else {
			setSelectedTransactionIds(new Set(paginatedTransactions.map((t) => t.id)));
		}
	};

	const confirmDeleteMultipleTransactions = async () => {
		if (selectedTransactionIds.size === 0) return;
		try {
			// Delete all selected transactions in parallel
			await Promise.all(Array.from(selectedTransactionIds).map((id) => transactionsApi.deleteTransaction(id)));
			// Reload transactions
			const response = await transactionsApi.getTransactions({ limit: 100 });
			setTransactions(response.transactions);
			// Reload portfolios
			await refreshPortfolios();
			setShowDeleteMultipleTransactionsModal(false);
			const count = selectedTransactionIds.size;
			setSelectedTransactionIds(new Set());
			toast.success(`${count} transaction${count > 1 ? "s" : ""} deleted successfully`);
		} catch (error) {
			console.error("Error deleting transactions:", error);
			toast.error("Failed to delete transactions. Please try again.");
		}
	};

	// Reset selections when search query changes
	React.useEffect(() => {
		setSelectedTransactionIds(new Set());
	}, [transactionSearchQuery]);

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
				width: "100%",
				maxWidth: { xs: "100%", sm: "100%", md: "var(--Content-maxWidth)", lg: "var(--Content-maxWidth)" },
				m: { xs: 0, sm: 1, md: "var(--Content-margin)" },
				p: { xs: 2, sm: 2, md: "var(--Content-padding)" },
			}}
		>
			{portfolios.length === 0 ? (
				// Empty state when no wallets exist
				<Card
					sx={{
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
						<Box
							sx={{
								width: 80,
								height: 80,
								borderRadius: "50%",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: "primary.main",
								color: "primary.contrastText",
								mb: 1,
							}}
						>
							<WalletIcon fontSize={40} weight="fill" />
						</Box>
						<Stack spacing={1}>
							<Typography variant="h5" sx={{ fontWeight: 600 }}>
								Create Your First Wallet
							</Typography>
							<Typography color="text.secondary" variant="body1" sx={{ maxWidth: 400, mx: "auto" }}>
								Start tracking your cryptocurrency investments by creating your first wallet. Add transactions to see your portfolio performance.
							</Typography>
						</Stack>
						<Button
							variant="contained"
							size="large"
							startIcon={<PlusIcon />}
							endIcon={<ArrowRightIcon />}
							onClick={() => {
								setEditingPortfolioId(null);
								setPortfolioName("");
								setPortfolioFormData({ name: "", description: "", isDefault: false });
								setShowPortfolioDialog(true);
							}}
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
							Create My First Wallet
						</Button>
					</Stack>
				</Card>
			) : (
				<Stack spacing={{ xs: 2, sm: 3, md: 4 }}>
					{/* Header */}
					<Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 2, sm: 3 }} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
						<Button
							onClick={() => {
								setEditingPortfolioId(null);
								setPortfolioFormData({ name: "", description: "", isDefault: false });
								setShowPortfolioDialog(true);
							}}
							startIcon={<WalletIcon />}
							variant="outlined"
							sx={{
								width: { xs: "100%", sm: "auto" },
								color: "primary.main",
								borderColor: "primary.main",
								"&:hover": {
									backgroundColor: "primary.main",
									borderColor: "primary.main",
									color: "primary.contrastText",
									"& .MuiSvgIcon-root": {
										color: "primary.contrastText",
									},
								},
							}}
						>
							Add Wallet
						</Button>
						<Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1, sm: 2 }} sx={{ width: { xs: "100%", sm: "auto" } }}>
							<Button
								onClick={() => {
									setShowAddTransactionMethodModal(true);
								}}
								startIcon={<PlusIcon />}
								variant="contained"
								sx={{ width: { xs: "100%", sm: "auto" } }}
							>
								Add Transaction
							</Button>
							<Button
								onClick={() => setShowSelectExchangeModal(true)}
								startIcon={<PlugsConnectedIcon />}
								variant="outlined"
								sx={{
									width: { xs: "100%", sm: "auto" },
									color: "secondary.main",
									borderColor: "secondary.main",
									"&:hover": {
										backgroundColor: "secondary.main",
										borderColor: "secondary.main",
										color: "secondary.contrastText",
										"& .MuiSvgIcon-root": {
											color: "secondary.contrastText",
										},
									},
								}}
							>
								Add Exchange
							</Button>
							<Button
								onClick={() => setShowSelectCsvModal(true)}
								startIcon={<FileCsvIcon />}
								variant="outlined"
								sx={{
									width: { xs: "100%", sm: "auto" },
									color: "secondary.main",
									borderColor: "secondary.main",
									"&:hover": {
										backgroundColor: "secondary.main",
										borderColor: "secondary.main",
										color: "secondary.contrastText",
										"& .MuiSvgIcon-root": {
											color: "secondary.contrastText",
										},
									},
								}}
							>
								Import CSV
							</Button>
						</Stack>
					</Stack>

					{/* Wallets Section */}
					<Grid container spacing={{ xs: 2, sm: 3 }}>
						{/* Wallets Section */}
						<Grid size={{ xs: 12 }}>
							<Card>
								<CardContent>
									<Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 2, sm: 2 }} sx={{ alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between", mb: 3 }}>
										<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
											<WalletIcon fontSize="var(--icon-fontSize-lg)" />
											<Typography variant="h6">Wallets</Typography>
										</Stack>
										<OutlinedInput
											onChange={(e) => {
												setWalletSearchQuery(e.target.value);
												setWalletPage(0); // Reset to first page on search
											}}
											placeholder="Search wallets..."
											size="small"
											startAdornment={
												<InputAdornment position="start">
													<MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
												</InputAdornment>
											}
											sx={{ maxWidth: { xs: "100%", sm: "300px" }, width: { xs: "100%", sm: "auto" } }}
											value={walletSearchQuery}
										/>
									</Stack>
									{filteredWallets.length === 0 ? (
							<Box sx={{ py: 8, textAlign: "center" }}>
								<Typography color="text.secondary" variant="body1">
									No wallets found matching "{walletSearchQuery}"
								</Typography>
							</Box>
						) : (
							<Box sx={{ overflowX: "auto", width: "100%" }}>
								<Table sx={{ tableLayout: { xs: "auto", sm: "fixed" }, width: "100%" }}>
									<TableHead>
										<TableRow>
											<TableCell sx={{ width: { xs: "40px", sm: "40px" } }} />
											<TableCell sx={{ width: { xs: "auto", sm: "30%" }, minWidth: { xs: "120px", sm: "150px" }, maxWidth: { xs: "none", sm: "200px" } }}>
												<TableSortLabel
													active={walletOrderBy === "name"}
													direction={walletOrderBy === "name" ? walletOrder : "asc"}
													onClick={() => {
														if (walletOrderBy === "name") {
															setWalletOrder(walletOrder === "asc" ? "desc" : "asc");
														} else {
															setWalletOrder("asc");
															setWalletOrderBy("name");
														}
														setWalletPage(0);
													}}
												>
													Wallet
												</TableSortLabel>
											</TableCell>
											<TableCell align="right" sx={{ width: { xs: "auto", sm: "15%" }, minWidth: { xs: "80px", sm: "100px" }, display: { xs: "none", md: "table-cell" } }}>
												<TableSortLabel
													active={walletOrderBy === "value"}
													direction={walletOrderBy === "value" ? walletOrder : "asc"}
													onClick={() => {
														if (walletOrderBy === "value") {
															setWalletOrder(walletOrder === "asc" ? "desc" : "asc");
														} else {
															setWalletOrder("asc");
															setWalletOrderBy("value");
														}
														setWalletPage(0);
													}}
												>
													Value
												</TableSortLabel>
											</TableCell>
											<TableCell align="right" sx={{ width: { xs: "auto", sm: "15%" }, minWidth: { xs: "80px", sm: "100px" }, display: { xs: "none", md: "table-cell" } }}>
												<TableSortLabel
													active={walletOrderBy === "invested"}
													direction={walletOrderBy === "invested" ? walletOrder : "asc"}
													onClick={() => {
														if (walletOrderBy === "invested") {
															setWalletOrder(walletOrder === "asc" ? "desc" : "asc");
														} else {
															setWalletOrder("asc");
															setWalletOrderBy("invested");
														}
														setWalletPage(0);
													}}
												>
													Invested
												</TableSortLabel>
											</TableCell>
											<TableCell align="right" sx={{ width: { xs: "auto", sm: "20%" }, minWidth: { xs: "100px", sm: "120px" } }}>
												<TableSortLabel
													active={walletOrderBy === "pnl"}
													direction={walletOrderBy === "pnl" ? walletOrder : "asc"}
													onClick={() => {
														if (walletOrderBy === "pnl") {
															setWalletOrder(walletOrder === "asc" ? "desc" : "asc");
														} else {
															setWalletOrder("asc");
															setWalletOrderBy("pnl");
														}
														setWalletPage(0);
													}}
												>
													P&L
												</TableSortLabel>
											</TableCell>
											<TableCell align="right" sx={{ width: { xs: "auto", sm: "10%" }, minWidth: { xs: "60px", sm: "80px" } }}>Actions</TableCell>
										</TableRow>
									</TableHead>
								<TableBody>
									{paginatedWallets.map((portfolio) => {
										const data = portfolioData[portfolio.id];
										if (!data) return null;
										const isExpanded = expandedWalletId === portfolio.id;
										const walletTransactions = transactions.filter((t) => t.portfolioId === portfolio.id);

										return (
											<React.Fragment key={portfolio.id}>
												<TableRow
													hover
													onClick={() => handleToggleWalletExpand(portfolio.id)}
													sx={{
														cursor: "pointer",
														transition: "background-color 0.2s ease-in-out",
														...(isExpanded && {
															bgcolor: "var(--mui-palette-primary-selected)",
															"&:hover": {
																bgcolor: "var(--mui-palette-primary-selected)",
															},
														}),
													}}
												>
													<TableCell>
														<IconButton
																onClick={(e) => {
																	e.stopPropagation();
																	handleToggleWalletExpand(portfolio.id);
																}}
																size="small"
																sx={{
																	padding: "4px",
																	color: isExpanded ? "var(--mui-palette-primary-main)" : "var(--mui-palette-text-secondary)",
																	transition: "color 0.2s ease-in-out, transform 0.2s ease-in-out",
																	transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
																}}
															>
																<CaretDownIcon fontSize="var(--icon-fontSize-md)" />
															</IconButton>
														</TableCell>
														<TableCell>
															<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
															<Box
																sx={{
																	alignItems: "center",
																	bgcolor: "var(--mui-palette-primary-main)",
																	borderRadius: 1,
																	color: "var(--mui-palette-primary-contrastText)",
																	display: "flex",
																	flexShrink: 0,
																	height: "32px",
																	justifyContent: "center",
																	width: "32px",
																}}
															>
																<WalletIcon fontSize="var(--icon-fontSize-xs)" />
															</Box>
														<Box sx={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
															<Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
																<Typography
																	variant="subtitle2"
																	sx={{
																		fontSize: "0.875rem",
																		lineHeight: 1.2,
																		overflow: "hidden",
																		textOverflow: "ellipsis",
																		whiteSpace: "nowrap",
																	}}
																>
																	{data.name}
																</Typography>
																{data.isDefault && (
																	<Chip
																		label="D"
																		size="small"
																		sx={{ height: "18px", fontSize: "0.65rem", minWidth: "20px", px: 0.5 }}
																	/>
																)}
															</Stack>
															{data.description && (
																<Typography
																	color="text.secondary"
																	variant="caption"
																	sx={{
																		display: "block",
																		fontSize: "0.7rem",
																		overflow: "hidden",
																		textOverflow: "ellipsis",
																		whiteSpace: "nowrap",
																	}}
																>
																	{data.description}
																</Typography>
															)}
														</Box>
													</Stack>
												</TableCell>
												<TableCell align="right" sx={{ display: { xs: "none", md: "table-cell" } }}>
													<Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, whiteSpace: "nowrap" }}>
														{formatCompactCurrency(data.value, "$", 2, secretMode)}
													</Typography>
												</TableCell>
												<TableCell align="right" sx={{ display: { xs: "none", md: "table-cell" } }}>
													<Typography variant="body2" sx={{ fontSize: { xs: "0.75rem", sm: "0.875rem" }, whiteSpace: "nowrap" }}>
														{formatCompactCurrency(data.invested, "$", 2, secretMode)}
													</Typography>
												</TableCell>
												<TableCell align="right">
													<Stack spacing={0.25} sx={{ alignItems: "flex-end" }}>
														<Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
															{data.pnl >= 0 ? (
																<TrendUpIcon
																	color="var(--mui-palette-success-main)"
																	fontSize="var(--icon-fontSize-xs)"
																/>
															) : (
																<TrendDownIcon
																	color="var(--mui-palette-error-main)"
																	fontSize="var(--icon-fontSize-xs)"
																/>
															)}
															<Typography
																color={data.pnl >= 0 ? "success.main" : "error.main"}
																variant="body2"
																sx={{ fontSize: { xs: "0.75rem", sm: "0.8rem" }, whiteSpace: "nowrap" }}
															>
																{formatCompactCurrency(data.pnl, "$", 2, secretMode)}
															</Typography>
														</Stack>
														<Typography
															color={data.pnlPercentage >= 0 ? "success.main" : "error.main"}
															variant="caption"
															sx={{ fontSize: { xs: "0.6rem", sm: "0.65rem" } }}
														>
															{formatPercentage(data.pnlPercentage)}
														</Typography>
													</Stack>
												</TableCell>
												<TableCell align="right" onClick={(e) => e.stopPropagation()}>
													<Stack direction="row" spacing={0.25} sx={{ justifyContent: "flex-end" }}>
														<IconButton
															onClick={(e) => {
																e.stopPropagation();
																openEditPortfolio(data);
															}}
															size="small"
															sx={{ padding: "2px" }}
														>
															<PencilIcon fontSize="var(--icon-fontSize-xs)" />
														</IconButton>
														<IconButton
															color="error"
															onClick={(e) => {
																e.stopPropagation();
																handleDeletePortfolio(portfolio.id);
															}}
															size="small"
															sx={{ padding: "2px" }}
														>
															<TrashIcon fontSize="var(--icon-fontSize-xs)" />
														</IconButton>
													</Stack>
												</TableCell>
											</TableRow>
											<TableRow>
												<TableCell
													colSpan={isMobile ? 3 : 5}
													sx={{
														py: 0,
														borderBottom: isExpanded ? "1px solid var(--mui-palette-divider)" : "none",
														bgcolor: isExpanded ? "var(--mui-palette-background-default)" : "transparent",
													}}
												>
													<Collapse in={isExpanded} timeout="auto" unmountOnExit>
														<Box sx={{ py: 3 }}>
															<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between", mb: 2 }}>
																<Typography variant="h6">
																Wallet Transactions
															</Typography>
																<TextField
																	placeholder="Search transactions..."
																	size="small"
																	value={walletTransactionsSearch[portfolio.id] || ""}
																	onChange={(e) => {
																		setWalletTransactionsSearch((prev) => ({
																			...prev,
																			[portfolio.id]: e.target.value,
																		}));
																		// Reset to first page when searching
																		setWalletTransactionsPage((prev) => ({
																			...prev,
																			[portfolio.id]: 0,
																		}));
																	}}
																	InputProps={{
																		startAdornment: (
																			<InputAdornment position="start">
																				<MagnifyingGlassIcon fontSize="var(--icon-fontSize-sm)" />
																			</InputAdornment>
																		),
																	}}
																	sx={{ width: 250 }}
																/>
															</Stack>
															{(() => {
																const searchQuery = walletTransactionsSearch[portfolio.id] || "";
																const filtered = searchQuery
																	? walletTransactions.filter(
																			(tx) =>
																				tx.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
																				tx.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
																				tx.type.toLowerCase().includes(searchQuery.toLowerCase())
																		)
																	: walletTransactions;
																
																const page = walletTransactionsPage[portfolio.id] || 0;
																const rowsPerPage = walletTransactionsRowsPerPage[portfolio.id] || 5;
																const start = page * rowsPerPage;
																const paginated = filtered.slice(start, start + rowsPerPage);
																
																if (filtered.length === 0) {
																	return (
																<Typography color="text.secondary" variant="body2">
																			{searchQuery
																				? "No transactions found matching your search."
																				: "No transactions in this wallet yet."}
																</Typography>
																	);
																}
																
																return (
																	<>
																<Table size="small">
																	<TableHead>
																		<TableRow>
																			<TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
																			<TableCell sx={{ fontWeight: 600 }}>Token</TableCell>
																			<TableCell align="right" sx={{ fontWeight: 600 }}>Type</TableCell>
																			<TableCell align="right" sx={{ fontWeight: 600 }}>Quantity</TableCell>
																					{!secretMode && (
																						<>
																			<TableCell align="right" sx={{ fontWeight: 600 }}>Price</TableCell>
																			<TableCell align="right" sx={{ fontWeight: 600 }}>Amount</TableCell>
																						</>
																					)}
																		</TableRow>
																	</TableHead>
																	<TableBody>
																				{paginated.map((transaction) => (
																			<TableRow key={transaction.id}>
																				<TableCell>
																					<Typography variant="body2">
																						{new Date(transaction.transactionDate).toLocaleDateString("en-US", {
																							year: "numeric",
																							month: "short",
																							day: "numeric",
																						})}
																					</Typography>
																				</TableCell>
																				<TableCell>
																					<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
																						<Avatar
																							src={getTokenLogoUrl(transaction.symbol, transaction.cmcId) || undefined}
																							sx={{ width: 24, height: 24 }}
																						>
																							{transaction.symbol.charAt(0)}
																						</Avatar>
																						<Typography variant="body2">{transaction.symbol}</Typography>
																					</Stack>
																				</TableCell>
																				<TableCell align="right">
																					<Chip
																						label={transaction.type}
																						size="small"
																						color={transaction.type === "BUY" ? "success" : "error"}
																					/>
																				</TableCell>
																				<TableCell align="right">
																					{(() => {
																						const { display, full, showInfo } = formatQuantityCompact(transaction.quantity, 8, secretMode);
																						return (
																							<MuiTooltip title={full} arrow placement="top">
																								<Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
																									<Typography variant="body2">{display}</Typography>
																									{showInfo && (
																										<InfoIcon fontSize="var(--icon-fontSize-xs)" style={{ opacity: 0.6 }} />
																									)}
																								</Stack>
																							</MuiTooltip>
																						);
																					})()}
																				</TableCell>
																				{!secretMode && (
																					<>
																				<TableCell align="right">
																					{(() => {
																						const price = transaction.averagePrice;
																						const display = price < 1 && price > 0 ? "<1" : Math.round(price).toLocaleString();
																						const full = formatCurrency(price, "$", 2);
																						return (
																							<MuiTooltip title={full} arrow placement="top">
																								<Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
																									<Typography variant="body2">${display}</Typography>
																									{price < 1 && price > 0 && (
																										<InfoIcon fontSize="var(--icon-fontSize-xs)" style={{ opacity: 0.6 }} />
																									)}
																								</Stack>
																							</MuiTooltip>
																						);
																					})()}
																				</TableCell>
																				<TableCell align="right">
																					{(() => {
																						const amount = transaction.amountInvested;
																						const display = amount < 1 && amount > 0 ? "<1" : Math.round(amount).toLocaleString();
																						const full = formatCurrency(amount, "$", 2);
																						return (
																							<MuiTooltip title={full} arrow placement="top">
																								<Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
																									<Typography variant="body2">${display}</Typography>
																									{amount < 1 && amount > 0 && (
																										<InfoIcon fontSize="var(--icon-fontSize-xs)" style={{ opacity: 0.6 }} />
																									)}
																								</Stack>
																							</MuiTooltip>
																						);
																					})()}
																				</TableCell>
																					</>
																				)}
																			</TableRow>
																		))}
																	</TableBody>
																</Table>
																		<TablePagination
																			component="div"
																			count={filtered.length}
																			page={page}
																			onPageChange={(_, newPage) => {
																				setWalletTransactionsPage((prev) => ({
																					...prev,
																					[portfolio.id]: newPage,
																				}));
																			}}
																			rowsPerPage={rowsPerPage}
																			onRowsPerPageChange={(e) => {
																				const newRowsPerPage = parseInt(e.target.value, 10);
																				setWalletTransactionsRowsPerPage((prev) => ({
																					...prev,
																					[portfolio.id]: newRowsPerPage,
																				}));
																				setWalletTransactionsPage((prev) => ({
																					...prev,
																					[portfolio.id]: 0,
																				}));
																			}}
																			rowsPerPageOptions={[5, 10, 15, 20]}
																			labelRowsPerPage="Rows per page:"
																		/>
																	</>
																);
															})()}
														</Box>
													</Collapse>
												</TableCell>
											</TableRow>
										</React.Fragment>
										);
									})}
								</TableBody>
							</Table>
							</Box>
						)}
						{sortedWallets.length > 0 && (
							<TablePagination
								component="div"
								count={sortedWallets.length}
								onPageChange={(_, newPage) => setWalletPage(newPage)}
								onRowsPerPageChange={(e) => {
									setWalletRowsPerPage(parseInt(e.target.value, 10));
									setWalletPage(0);
								}}
								page={walletPage}
								rowsPerPage={walletRowsPerPage}
								rowsPerPageOptions={[3, 5, 10, 25, 50]}
								labelRowsPerPage="Rows per page:"
							/>
						)}
					</CardContent>
					<Divider />
					<CardActions>
						{portfolios.length > 0 && (
							<MuiTooltip title="Soon available" arrow placement="top">
								<span>
									<Button
										color="secondary"
										endIcon={<ArrowsLeftRightIcon />}
										size="small"
										disabled
										onClick={() => {
											// TODO: Implement transfer token functionality
											console.log("Transfer Token clicked");
										}}
									>
										Transfer Token
									</Button>
								</span>
							</MuiTooltip>
						)}
					</CardActions>
				</Card>


					</Grid>
				</Grid>

				{/* Transactions Section */}
				{portfolios.length > 0 && (
					<Card>
					<CardContent>
						<Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 2, sm: 2 }} sx={{ alignItems: { xs: "stretch", sm: "center" }, justifyContent: "space-between", mb: 3 }}>
							<Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
								<PlusIcon fontSize="var(--icon-fontSize-lg)" />
								<Typography variant="h6">Transactions</Typography>
								{portfolios.length >= 2 && (
									<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
										<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
											Wallet filter
										</Typography>
										<FormControl size="small" sx={{ minWidth: 150 }}>
											<Select
												value={transactionWalletFilter}
												onChange={(e) => {
													setTransactionWalletFilter(e.target.value);
													setTransactionPage(0); // Reset to first page on filter change
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
									</Stack>
								)}
								{selectedTransactionIds.size > 0 && (
									<Button
										color="error"
										onClick={() => setShowDeleteMultipleTransactionsModal(true)}
										size="small"
										startIcon={<TrashIcon />}
										variant="outlined"
									>
										Delete ({selectedTransactionIds.size})
									</Button>
								)}
							</Stack>
							{transactions.length > 0 && (
								<OutlinedInput
									onChange={(e) => {
										setTransactionSearchQuery(e.target.value);
										setTransactionPage(0); // Reset to first page on search
									}}
									placeholder="Search transactions..."
									size="small"
									startAdornment={
										<InputAdornment position="start">
											<MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
										</InputAdornment>
									}
									sx={{ maxWidth: "300px" }}
									value={transactionSearchQuery}
								/>
							)}
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
									setShowAddTransactionMethodModal(true);
									}}
									startIcon={<PlusIcon />}
									variant="contained"
								>
									Add Transaction
								</Button>
							</Box>
						) : filteredTransactions.length === 0 ? (
							<Box sx={{ py: 8, textAlign: "center" }}>
								<Typography color="text.secondary" variant="body1">
									No transactions found matching "{transactionSearchQuery}"
								</Typography>
							</Box>
						) : (
							<Box sx={{ overflowX: "auto", width: "100%" }}>
							<Table>
								<TableHead>
									<TableRow>
										<TableCell padding="checkbox">
											<Checkbox
												checked={paginatedTransactions.length > 0 && selectedTransactionIds.size === paginatedTransactions.length}
												indeterminate={selectedTransactionIds.size > 0 && selectedTransactionIds.size < paginatedTransactions.length}
												onChange={handleSelectAllTransactions}
											/>
										</TableCell>
										<TableCell>
											<TableSortLabel
												active={transactionOrderBy === "date"}
												direction={transactionOrderBy === "date" ? transactionOrder : "asc"}
												onClick={() => {
													if (transactionOrderBy === "date") {
														setTransactionOrder(transactionOrder === "asc" ? "desc" : "asc");
													} else {
														setTransactionOrder("asc");
														setTransactionOrderBy("date");
													}
													setTransactionPage(0);
												}}
											>
												Date
											</TableSortLabel>
										</TableCell>
										<TableCell>
											<TableSortLabel
												active={transactionOrderBy === "symbol"}
												direction={transactionOrderBy === "symbol" ? transactionOrder : "asc"}
												onClick={() => {
													if (transactionOrderBy === "symbol") {
														setTransactionOrder(transactionOrder === "asc" ? "desc" : "asc");
													} else {
														setTransactionOrder("asc");
														setTransactionOrderBy("symbol");
													}
													setTransactionPage(0);
												}}
											>
												Token
											</TableSortLabel>
										</TableCell>
										<TableCell align="right">
											<TableSortLabel
												active={transactionOrderBy === "type"}
												direction={transactionOrderBy === "type" ? transactionOrder : "asc"}
												onClick={() => {
													if (transactionOrderBy === "type") {
														setTransactionOrder(transactionOrder === "asc" ? "desc" : "asc");
													} else {
														setTransactionOrder("asc");
														setTransactionOrderBy("type");
													}
													setTransactionPage(0);
												}}
											>
												Type
											</TableSortLabel>
										</TableCell>
										<TableCell align="right">
											<TableSortLabel
												active={transactionOrderBy === "quantity"}
												direction={transactionOrderBy === "quantity" ? transactionOrder : "asc"}
												onClick={() => {
													if (transactionOrderBy === "quantity") {
														setTransactionOrder(transactionOrder === "asc" ? "desc" : "asc");
													} else {
														setTransactionOrder("asc");
														setTransactionOrderBy("quantity");
													}
													setTransactionPage(0);
												}}
											>
												Quantity
											</TableSortLabel>
										</TableCell>
										{!secretMode && (
											<>
										<TableCell align="right">
											<TableSortLabel
												active={transactionOrderBy === "averagePrice"}
												direction={transactionOrderBy === "averagePrice" ? transactionOrder : "asc"}
												onClick={() => {
													if (transactionOrderBy === "averagePrice") {
														setTransactionOrder(transactionOrder === "asc" ? "desc" : "asc");
													} else {
														setTransactionOrder("asc");
														setTransactionOrderBy("averagePrice");
													}
													setTransactionPage(0);
												}}
											>
												Price
											</TableSortLabel>
										</TableCell>
										<TableCell align="right">
											<TableSortLabel
												active={transactionOrderBy === "amountInvested"}
												direction={transactionOrderBy === "amountInvested" ? transactionOrder : "asc"}
												onClick={() => {
													if (transactionOrderBy === "amountInvested") {
														setTransactionOrder(transactionOrder === "asc" ? "desc" : "asc");
													} else {
														setTransactionOrder("asc");
														setTransactionOrderBy("amountInvested");
													}
													setTransactionPage(0);
												}}
											>
												Amount
											</TableSortLabel>
										</TableCell>
											</>
										)}
										<TableCell align="right">
											<TableSortLabel
												active={transactionOrderBy === "wallet"}
												direction={transactionOrderBy === "wallet" ? transactionOrder : "asc"}
												onClick={() => {
													if (transactionOrderBy === "wallet") {
														setTransactionOrder(transactionOrder === "asc" ? "desc" : "asc");
													} else {
														setTransactionOrder("asc");
														setTransactionOrderBy("wallet");
													}
													setTransactionPage(0);
												}}
											>
												Wallet
											</TableSortLabel>
										</TableCell>
										<TableCell align="right">Actions</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{paginatedTransactions.map((transaction) => (
										<TableRow key={transaction.id}>
											<TableCell padding="checkbox">
												<Checkbox
													checked={selectedTransactionIds.has(transaction.id)}
													onChange={() => handleSelectTransaction(transaction.id)}
												/>
											</TableCell>
											<TableCell>
												<Typography variant="body2">
													{new Date(transaction.transactionDate).toLocaleDateString()}
												</Typography>
											</TableCell>
											<TableCell>
												<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
													<Avatar
														src={getTokenLogoUrl(transaction.symbol, transaction.cmcId) || undefined}
														alt={transaction.symbol}
														sx={{
															width: 24,
															height: 24,
															fontSize: "0.625rem",
															bgcolor: "var(--mui-palette-primary-main)",
														}}
													>
														{transaction.symbol.charAt(0)}
													</Avatar>
													<Stack spacing={0}>
														<Typography variant="subtitle2">{transaction.symbol}</Typography>
														<Typography color="text.secondary" variant="caption">
															{transaction.name}
														</Typography>
													</Stack>
												</Stack>
											</TableCell>
											<TableCell align="right">
												<Chip
													color={transaction.type === "BUY" ? "success" : "error"}
													label={transaction.type}
													size="small"
												/>
											</TableCell>
											<TableCell align="right">
												{(() => {
													const { display, full, showInfo } = formatQuantityCompact(transaction.quantity, 8, secretMode);
													return (
														<MuiTooltip title={full} arrow placement="top">
															<Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
																<Typography variant="body2">{display}</Typography>
																{showInfo && (
																	<InfoIcon fontSize="var(--icon-fontSize-xs)" style={{ opacity: 0.6 }} />
																)}
															</Stack>
														</MuiTooltip>
													);
												})()}
											</TableCell>
											{!secretMode && (
												<>
											<TableCell align="right">
												{(() => {
													const price = transaction.averagePrice;
													const display = price < 1 && price > 0 ? "<1" : Math.round(price).toLocaleString();
													const full = formatCurrency(price, "$", 2);
													return (
														<MuiTooltip title={full} arrow placement="top">
															<Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
																<Typography variant="body2">${display}</Typography>
																{price < 1 && price > 0 && (
																	<InfoIcon fontSize="var(--icon-fontSize-xs)" style={{ opacity: 0.6 }} />
																)}
															</Stack>
														</MuiTooltip>
													);
												})()}
											</TableCell>
											<TableCell align="right">
												{(() => {
													const amount = transaction.amountInvested;
													const display = amount < 1 && amount > 0 ? "<1" : Math.round(amount).toLocaleString();
													const full = formatCurrency(amount, "$", 2, secretMode);
													return (
														<MuiTooltip title={full} arrow placement="top">
															<Stack direction="row" spacing={0.5} sx={{ alignItems: "center", justifyContent: "flex-end" }}>
																<Typography variant="body2">${display}</Typography>
																{amount < 1 && amount > 0 && (
																	<InfoIcon fontSize="var(--icon-fontSize-xs)" style={{ opacity: 0.6 }} />
																)}
															</Stack>
														</MuiTooltip>
													);
												})()}
											</TableCell>
												</>
											)}
											<TableCell align="right">
												<Typography variant="body2">{transaction.portfolio?.name || "-"}</Typography>
											</TableCell>
											<TableCell align="right">
												<IconButton onClick={() => openEditTransaction(transaction)} size="small">
													<PencilIcon fontSize="var(--icon-fontSize-sm)" />
												</IconButton>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
							</Box>
						)}
						{sortedTransactions.length > 0 && (
							<TablePagination
								component="div"
								count={sortedTransactions.length}
								onPageChange={(_, newPage) => setTransactionPage(newPage)}
								onRowsPerPageChange={(e) => {
									setTransactionRowsPerPage(parseInt(e.target.value, 10));
									setTransactionPage(0);
								}}
								page={transactionPage}
								rowsPerPage={transactionRowsPerPage}
								rowsPerPageOptions={[5, 10, 25, 50]}
								labelRowsPerPage="Rows per page:"
							/>
						)}
					</CardContent>
				</Card>
				)}
			</Stack>
			)}

			{/* Wallet Dialog */}
			<Dialog fullWidth maxWidth="sm" onClose={() => setShowPortfolioDialog(false)} open={showPortfolioDialog}>
				<DialogTitle>
					{editingPortfolioId ? "Edit Wallet" : "Create Wallet"}
					<IconButton
						onClick={() => {
							setShowPortfolioDialog(false);
							setEditingPortfolioId(null);
							setPortfolioName("");
							setPortfolioFormData({ name: "", description: "", isDefault: false });
						}}
						sx={{ position: "absolute", right: 8, top: 8 }}
					>
						<XIcon />
					</IconButton>
				</DialogTitle>
				<DialogContent>
					<Stack spacing={3} sx={{ mt: 1 }}>
						{editingPortfolioId ? (
							<TextField
								autoFocus
								fullWidth
								label="Name"
								onChange={(e) => setPortfolioFormData({ ...portfolioFormData, name: e.target.value })}
								required
								value={portfolioFormData.name}
							/>
						) : (
							<TextField
								autoFocus
								fullWidth
								label="Wallet Name"
								onChange={(e) => setPortfolioName(e.target.value)}
								onKeyDown={(e) => {
									if (e.key === "Enter" && portfolioName.trim()) {
										handleCreatePortfolio();
									}
								}}
								placeholder="Enter wallet name"
								required
								value={portfolioName}
							/>
						)}
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => {
							setShowPortfolioDialog(false);
							setEditingPortfolioId(null);
							setPortfolioName("");
							setPortfolioFormData({ name: "", description: "", isDefault: false });
						}}
					>
						Cancel
					</Button>
					<Button
						disabled={editingPortfolioId ? !portfolioFormData.name.trim() : !portfolioName.trim()}
						onClick={editingPortfolioId ? handleUpdatePortfolio : handleCreatePortfolio}
						variant="contained"
					>
						{editingPortfolioId ? "Update" : "Create"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Transaction Dialog */}
			<CreateTransactionModal
				editingTransaction={
					editingTransaction
						? {
								id: editingTransaction.id,
								symbol: editingTransaction.symbol,
								name: editingTransaction.name,
								cmcId: editingTransaction.cmcId,
								quantity: editingTransaction.quantity,
								amountInvested: editingTransaction.amountInvested,
								averagePrice: editingTransaction.averagePrice,
								type: editingTransaction.type as "BUY" | "SELL",
								transactionDate: editingTransaction.transactionDate,
								notes: editingTransaction.notes,
								portfolioId: editingTransaction.portfolioId || "",
							}
						: null
				}
				onClose={() => {
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
				onSuccess={async () => {
					// Reload transactions
					const response = await transactionsApi.getTransactions({ limit: 100 });
					setTransactions(response.transactions);
					// Reload portfolios
					await refreshPortfolios();
				}}
				open={showTransactionDialog}
				portfolios={portfolios}
			/>

			{/* Delete Wallet Confirmation Modal */}
			<Dialog
				fullWidth
				maxWidth="sm"
				onClose={() => {
					setShowDeleteWalletModal(false);
					setWalletToDelete(null);
				}}
				open={showDeleteWalletModal}
			>
				<DialogContent sx={{ border: "none", p: 0 }}>
					<Paper sx={{ border: "1px solid var(--mui-palette-divider)", boxShadow: "var(--mui-shadows-16)", p: 0 }}>
						<Stack direction="row" spacing={2} sx={{ display: "flex", p: 3 }}>
							<Avatar sx={{ bgcolor: "var(--mui-palette-error-50)", color: "var(--mui-palette-error-main)" }}>
								<WarningIcon fontSize="var(--icon-fontSize-lg)" />
							</Avatar>
							<Stack spacing={3} sx={{ flex: 1 }}>
								<Stack spacing={1}>
									<Typography variant="h5">Delete Wallet</Typography>
									<Typography color="text.secondary" variant="body2">
										Are you sure you want to delete this wallet? All transactions associated with this wallet will be
										permanently removed. This action cannot be undone.
									</Typography>
								</Stack>
								<Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
									<Button
										color="secondary"
										onClick={() => {
											setShowDeleteWalletModal(false);
											setWalletToDelete(null);
										}}
									>
										Cancel
									</Button>
									<Button color="error" onClick={confirmDeleteWallet} variant="contained">
										Delete
									</Button>
								</Stack>
							</Stack>
						</Stack>
					</Paper>
				</DialogContent>
			</Dialog>

			{/* Delete Transaction Confirmation Modal */}
			<Dialog
				fullWidth
				maxWidth="sm"
				onClose={() => {
					setShowDeleteTransactionModal(false);
					setTransactionToDelete(null);
				}}
				open={showDeleteTransactionModal}
			>
				<DialogContent sx={{ border: "none", p: 0 }}>
					<Paper sx={{ border: "1px solid var(--mui-palette-divider)", boxShadow: "var(--mui-shadows-16)", p: 0 }}>
						<Stack direction="row" spacing={2} sx={{ display: "flex", p: 3 }}>
							<Avatar sx={{ bgcolor: "var(--mui-palette-error-50)", color: "var(--mui-palette-error-main)" }}>
								<WarningIcon fontSize="var(--icon-fontSize-lg)" />
							</Avatar>
							<Stack spacing={3} sx={{ flex: 1 }}>
								<Stack spacing={1}>
									<Typography variant="h5">Delete Transaction</Typography>
									<Typography color="text.secondary" variant="body2">
										Are you sure you want to delete this transaction? This action cannot be undone and will affect your
										portfolio calculations.
									</Typography>
								</Stack>
								<Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
									<Button
										color="secondary"
										onClick={() => {
											setShowDeleteTransactionModal(false);
											setTransactionToDelete(null);
										}}
									>
										Cancel
									</Button>
									<Button color="error" onClick={confirmDeleteTransaction} variant="contained">
										Delete
									</Button>
								</Stack>
							</Stack>
						</Stack>
					</Paper>
				</DialogContent>
			</Dialog>

			{/* Delete Multiple Transactions Confirmation Modal */}
			<Dialog
				fullWidth
				maxWidth="sm"
				onClose={() => {
					setShowDeleteMultipleTransactionsModal(false);
				}}
				open={showDeleteMultipleTransactionsModal}
			>
				<DialogContent sx={{ border: "none", p: 0 }}>
					<Paper sx={{ border: "1px solid var(--mui-palette-divider)", boxShadow: "var(--mui-shadows-16)", p: 0 }}>
						<Stack direction="row" spacing={2} sx={{ display: "flex", p: 3 }}>
							<Avatar sx={{ bgcolor: "var(--mui-palette-error-50)", color: "var(--mui-palette-error-main)" }}>
								<WarningIcon fontSize="var(--icon-fontSize-lg)" />
							</Avatar>
							<Stack spacing={3} sx={{ flex: 1 }}>
								<Stack spacing={1}>
									<Typography variant="h5">Delete Transactions</Typography>
									<Typography color="text.secondary" variant="body2">
										Are you sure you want to delete {selectedTransactionIds.size} selected transaction{selectedTransactionIds.size > 1 ? "s" : ""}? This action cannot be undone and will affect your portfolio calculations.
									</Typography>
								</Stack>
								<Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
									<Button
										color="secondary"
										onClick={() => {
											setShowDeleteMultipleTransactionsModal(false);
										}}
									>
										Cancel
									</Button>
									<Button color="error" onClick={confirmDeleteMultipleTransactions} variant="contained">
										Delete {selectedTransactionIds.size} Transaction{selectedTransactionIds.size > 1 ? "s" : ""}
									</Button>
								</Stack>
							</Stack>
						</Stack>
					</Paper>
				</DialogContent>
			</Dialog>

			{/* Wallet Details Modal */}
			<Dialog
				fullWidth
				maxWidth="md"
				onClose={() => {
					setShowWalletDetailsModal(false);
					setSelectedWalletId(null);
				}}
				open={showWalletDetailsModal}
			>
				<DialogContent sx={{ p: 0 }}>
					{selectedWalletData && (
						<Card>
							<CardHeader
								avatar={
									<Avatar
										sx={{
											bgcolor: "var(--mui-palette-primary-main)",
											color: "var(--mui-palette-primary-contrastText)",
										}}
									>
										<WalletIcon fontSize="var(--icon-fontSize-lg)" />
									</Avatar>
								}
								action={
									<IconButton
										onClick={() => {
											setShowWalletDetailsModal(false);
											setSelectedWalletId(null);
										}}
									>
										<XIcon />
									</IconButton>
								}
								title={selectedWalletData.name}
								subheader={selectedWalletData.description || "Wallet details"}
							/>
							<Divider />
							{/* Wallet Statistics */}
							<Box sx={{ display: "flex" }}>
								<Box sx={{ flex: "1 1 auto", p: 3, textAlign: "center" }}>
									<Typography variant="h5">{formatCompactCurrency(selectedWalletData.value, "$", 2, secretMode)}</Typography>
									<Typography color="text.secondary" component="h4" variant="overline">
										Current Value
									</Typography>
								</Box>
								<Divider orientation="vertical" flexItem />
								<Box sx={{ flex: "1 1 auto", p: 3, textAlign: "center" }}>
									<Typography variant="h5">{formatCompactCurrency(selectedWalletData.invested, "$", 2, secretMode)}</Typography>
									<Typography color="text.secondary" component="h4" variant="overline">
										Invested
									</Typography>
								</Box>
								<Divider orientation="vertical" flexItem />
								<Box sx={{ flex: "1 1 auto", p: 3, textAlign: "center" }}>
									<Typography
										color={selectedWalletData.pnl >= 0 ? "success.main" : "error.main"}
										variant="h5"
									>
										{formatCompactCurrency(selectedWalletData.pnl, "$", 2, secretMode)}
									</Typography>
									<Typography color="text.secondary" component="h4" variant="overline">
										P&L
									</Typography>
								</Box>
								<Divider orientation="vertical" flexItem />
								<Box sx={{ flex: "1 1 auto", p: 3, textAlign: "center" }}>
									<Typography variant="h5">{selectedWalletData.holdingsCount}</Typography>
									<Typography color="text.secondary" component="h4" variant="overline">
										Positions
									</Typography>
								</Box>
							</Box>
							<Divider />
							{/* Transactions List */}
							<Box>
								<Box sx={{ px: 3, py: 2 }}>
									<Typography variant="h6">Transactions</Typography>
									<Typography color="text.secondary" variant="body2">
										{walletTransactions.length} transaction{walletTransactions.length !== 1 ? "s" : ""} found
									</Typography>
								</Box>
								{walletTransactions.length === 0 ? (
									<Box sx={{ p: 3, textAlign: "center" }}>
										<Typography color="text.secondary" variant="body2">
											No transactions found for this wallet
										</Typography>
									</Box>
								) : (
									<List disablePadding sx={{ "& .MuiListItem-root": { py: 2 } }}>
										{walletTransactions.map((transaction, index) => (
											<ListItem divider={index < walletTransactions.length - 1} key={transaction.id}>
												<ListItemAvatar>
													<Avatar
														sx={{
															bgcolor:
																transaction.type === "BUY"
																	? "var(--mui-palette-success-50)"
																	: "var(--mui-palette-error-50)",
															color:
																transaction.type === "BUY"
																	? "var(--mui-palette-success-main)"
																	: "var(--mui-palette-error-main)",
														}}
													>
														{transaction.type === "BUY" ? (
															<TrendUpIcon fontSize="var(--icon-fontSize-md)" />
														) : (
															<TrendDownIcon fontSize="var(--icon-fontSize-md)" />
														)}
													</Avatar>
												</ListItemAvatar>
												<ListItemText
													disableTypography
													primary={
														<Typography variant="subtitle2">
															{transaction.symbol} - {transaction.name}
														</Typography>
													}
													secondary={
														<Typography color="text.secondary" variant="body2">
															{new Date(transaction.transactionDate).toLocaleDateString("en-US", {
																year: "numeric",
																month: "short",
																day: "numeric",
															})}{" "}
															• {transaction.type}
														</Typography>
													}
												/>
												<Box sx={{ textAlign: "right" }}>
													<Typography
														color={
															transaction.type === "BUY"
																? "var(--mui-palette-success-main)"
																: "var(--mui-palette-error-main)"
														}
														sx={{ whiteSpace: "nowrap" }}
														variant="subtitle2"
													>
														{transaction.type === "BUY" ? "+" : "-"} {formatQuantity(transaction.quantity, 8, secretMode)} {transaction.symbol}
													</Typography>
													<Typography color="text.secondary" variant="body2">
														{formatCurrency(transaction.amountInvested, "$", 2, secretMode)}
													</Typography>
												</Box>
											</ListItem>
										))}
									</List>
								)}
							</Box>
						</Card>
					)}
				</DialogContent>
			</Dialog>

			{/* All Tokens Modal */}
			<AllTokensModal
				open={showAllTokensModal}
				onClose={() => setShowAllTokensModal(false)}
				tokens={allTokenData}
				searchQuery={allTokensSearchQuery}
				onSearchChange={setAllTokensSearchQuery}
				page={allTokensPage}
				onPageChange={setAllTokensPage}
				rowsPerPage={allTokensRowsPerPage}
				onRowsPerPageChange={setAllTokensRowsPerPage}
			/>

			{/* Exchange Modals */}
			<SelectExchangeModal
				open={showSelectExchangeModal}
				onClose={() => setShowSelectExchangeModal(false)}
				onSelectExchange={(exchange, method) => {
					if (method === "csv") {
						setSelectedExchange(exchange);
						setShowSelectExchangeModal(false);
						// Pour tous les exchanges, afficher un message "coming soon"
						toast.info(`${exchange} CSV import coming soon!`);
					} else {
						// API connection - coming soon
						toast.info("API connection coming soon!");
					}
				}}
			/>
			<SelectCsvModal
				open={showSelectCsvModal}
				onClose={() => setShowSelectCsvModal(false)}
				onSelectExchange={(exchange) => {
					// Seul Exstrat est disponible, ouvrir directement le modal d'import CSV
					setSelectedExchange(exchange);
					setShowSelectCsvModal(false);
					setShowImportCsvModal(true);
				}}
			/>
			{selectedExchange && (
				<ImportCsvModal
					open={showImportCsvModal}
					onClose={() => {
						setShowImportCsvModal(false);
						setSelectedExchange(null);
					}}
					exchange={selectedExchange || "coinbase"}
					onSuccess={async () => {
						// Refresh all data: portfolios, transactions, and holdings
						await refreshAllData();
					}}
				/>
			)}
			<AddTransactionMethodModal
				open={showAddTransactionMethodModal}
				onClose={() => setShowAddTransactionMethodModal(false)}
				onSuccess={async () => {
					// Refresh all data: portfolios, transactions, and holdings
					await refreshAllData();
				}}
				portfolios={portfolios}
			/>
		</Box>
	);
}

// Wallet Performance Tooltip Component
interface WalletPerformanceTooltipContentProps {
	active?: boolean;
	payload?: { name: string; dataKey: string; value: number; stroke: string }[];
	label?: string;
	wallets: Array<{ id: string; name: string }>;
}

function WalletPerformanceTooltipContent({
	active,
	payload,
	label,
	wallets,
}: WalletPerformanceTooltipContentProps): React.JSX.Element | null {
	const { secretMode } = useSecretMode();
	
	if (!active || !payload || payload.length === 0) {
		return null;
	}

	return (
		<Paper sx={{ border: "1px solid var(--mui-palette-divider)", boxShadow: "var(--mui-shadows-16)", p: 1 }}>
			<Stack spacing={2}>
				{label && (
					<Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
						{label}
					</Typography>
				)}
				{payload.map((entry) => {
					const wallet = wallets.find((w) => w.name.replace(/\s+/g, "_") === entry.dataKey);
					return (
						<Stack key={entry.dataKey} direction="row" spacing={3} sx={{ alignItems: "center" }}>
							<Stack direction="row" spacing={1} sx={{ alignItems: "center", flex: "1 1 auto" }}>
								<Box
									sx={{
										bgcolor: entry.stroke,
										borderRadius: "2px",
										height: "8px",
										width: "8px",
									}}
								/>
								<Typography sx={{ whiteSpace: "nowrap" }}>{wallet?.name || entry.name}</Typography>
							</Stack>
							<Typography color="text.secondary" variant="body2">
								{formatCompactCurrency(entry.value, "$", 2, secretMode)}
							</Typography>
						</Stack>
					);
				})}
			</Stack>
		</Paper>
	);
}

// Tooltip component for token chart
interface TokenTooltipContentProps {
	active?: boolean;
	payload?: { name: string; payload: { fill: string; quantity: number; tokenName: string }; value: number }[];
	label?: string;
}

function TokenTooltipContent({ active, payload }: TokenTooltipContentProps): React.JSX.Element | null {
	const { secretMode } = useSecretMode();
	
	if (!active || !payload || payload.length === 0) {
		return null;
	}

	const entry = payload[0];
	const data = entry.payload;

	return (
		<Paper sx={{ border: "1px solid var(--mui-palette-divider)", boxShadow: "var(--mui-shadows-16)", p: 1.5 }}>
			<Stack spacing={1.5}>
				<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
					<Box sx={{ bgcolor: entry.payload.fill, borderRadius: "2px", height: "8px", width: "8px" }} />
					<Typography sx={{ whiteSpace: "nowrap" }} variant="subtitle2">
						{entry.name}
					</Typography>
				</Stack>
				{data.tokenName && (
					<Typography color="text.secondary" variant="caption">
						{data.tokenName}
					</Typography>
				)}
				<Divider />
				<Stack spacing={1}>
					<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
						<Typography color="text.secondary" variant="body2">
							Quantity:
						</Typography>
						<Typography variant="body2">
							{formatQuantity(data.quantity, 8, secretMode)} {entry.name}
						</Typography>
					</Stack>
					<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
						<Typography color="text.secondary" variant="body2">
							Value:
						</Typography>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							{formatCompactCurrency(entry.value, "$", 2, secretMode)}
						</Typography>
					</Stack>
				</Stack>
			</Stack>
		</Paper>
	);
}

// Performance Tooltip Component
interface PerformanceTooltipContentProps {
	active?: boolean;
	payload?: { name: string; dataKey: string; value: number; stroke: string }[];
	label?: string;
}

function PerformanceTooltipContent({ active, payload }: PerformanceTooltipContentProps): React.JSX.Element | null {
	const { secretMode } = useSecretMode();
	
	if (!active || !payload || payload.length === 0) {
		return null;
	}

	const entry = payload[0];

	return (
		<Paper sx={{ border: "1px solid var(--mui-palette-divider)", boxShadow: "var(--mui-shadows-16)", p: 1 }}>
			<Stack spacing={2}>
				<Stack direction="row" spacing={3} sx={{ alignItems: "center" }}>
					<Stack direction="row" spacing={1} sx={{ alignItems: "center", flex: "1 1 auto" }}>
						<Box
							sx={{
								bgcolor: entry.stroke,
								borderRadius: "2px",
								height: "8px",
								width: "8px",
							}}
						/>
						<Typography sx={{ whiteSpace: "nowrap" }}>{entry.name}</Typography>
					</Stack>
					<Typography color="text.secondary" variant="body2">
						{formatCompactCurrency(entry.value, "$", 2, secretMode)}
					</Typography>
				</Stack>
			</Stack>
		</Paper>
	);
}

// All Tokens Modal Component
function AllTokensModal({
	open,
	onClose,
	tokens,
	searchQuery,
	onSearchChange,
	page,
	onPageChange,
	rowsPerPage,
	onRowsPerPageChange,
}: {
	open: boolean;
	onClose: () => void;
	tokens: Array<{ name: string; value: number; quantity: number; tokenName?: string; color: string }>;
	searchQuery: string;
	onSearchChange: (query: string) => void;
	page: number;
	onPageChange: (page: number) => void;
	rowsPerPage: number;
	onRowsPerPageChange: (rowsPerPage: number) => void;
}): React.JSX.Element {
	const { secretMode } = useSecretMode();
	const totalValue = tokens.reduce((sum, token) => sum + token.value, 0);

	// Filter tokens based on search query
	const filteredTokens = React.useMemo(() => {
		if (!searchQuery.trim()) return tokens;
		const query = searchQuery.toLowerCase();
		return tokens.filter(
			(token) =>
				token.name.toLowerCase().includes(query) ||
				token.tokenName?.toLowerCase().includes(query)
		);
	}, [tokens, searchQuery]);

	// Calculate percentage for each token
	const tokensWithPercentage = React.useMemo(() => {
		return filteredTokens.map((token) => ({
			...token,
			percentage: totalValue > 0 ? (token.value / totalValue) * 100 : 0,
		}));
	}, [filteredTokens, totalValue]);

	// Paginate tokens
	const paginatedTokens = React.useMemo(() => {
		const start = page * rowsPerPage;
		return tokensWithPercentage.slice(start, start + rowsPerPage);
	}, [tokensWithPercentage, page, rowsPerPage]);

	// Helper to get token logo - extract cmcId from tokenName if it's a number string
	const getTokenLogo = (symbol: string, tokenName?: string): string | null => {
		// Try to extract cmcId from tokenName if it contains a number
		let cmcId: number | undefined;
		if (tokenName) {
			const match = tokenName.match(/\d+/);
			if (match) {
				cmcId = parseInt(match[0], 10);
			}
		}
		return getTokenLogoUrl(symbol, cmcId);
	};

	return (
		<Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
			<DialogTitle>
				<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
					<Typography variant="h6">All Tokens ({filteredTokens.length})</Typography>
					<IconButton onClick={onClose} size="small">
						<XIcon />
					</IconButton>
				</Stack>
			</DialogTitle>
			<DialogContent>
				<Stack spacing={3}>
					{/* Search */}
					<OutlinedInput
						onChange={(e) => {
							onSearchChange(e.target.value);
							onPageChange(0); // Reset to first page on search
						}}
						placeholder="Search tokens..."
						size="small"
						startAdornment={
							<InputAdornment position="start">
								<MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
							</InputAdornment>
						}
						value={searchQuery}
					/>

					{/* Table */}
					<Box sx={{ overflowX: "auto" }}>
						<Table>
							<TableHead>
								<TableRow>
									<TableCell>Token</TableCell>
									<TableCell align="right">Percentage</TableCell>
									<TableCell align="right">Total Value (USD)</TableCell>
									<TableCell align="right">Quantity</TableCell>
								</TableRow>
							</TableHead>
							<TableBody>
								{paginatedTokens.length === 0 ? (
									<TableRow>
										<TableCell colSpan={4} sx={{ textAlign: "center", py: 4 }}>
											<Typography color="text.secondary" variant="body2">
												No tokens found
											</Typography>
										</TableCell>
									</TableRow>
								) : (
									paginatedTokens.map((token) => (
										<TableRow key={token.name}>
											<TableCell>
												<Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
													<Avatar
														src={getTokenLogo(token.name, token.tokenName) || undefined}
														sx={{ height: 32, width: 32 }}
													>
														{token.name.charAt(0)}
													</Avatar>
													<Stack>
														<Typography variant="subtitle2">{token.name}</Typography>
														{token.tokenName && token.tokenName !== `+${tokens.length - 10} more tokens` && (
															<Typography color="text.secondary" variant="caption">
																{token.tokenName}
															</Typography>
														)}
													</Stack>
												</Stack>
											</TableCell>
											<TableCell align="right">
												<Typography variant="body2">
													{token.percentage.toFixed(2)}%
												</Typography>
											</TableCell>
											<TableCell align="right">
												<Typography variant="body2" sx={{ fontWeight: 600 }}>
													{formatCompactCurrency(token.value, "$", 2, secretMode)}
												</Typography>
											</TableCell>
											<TableCell align="right">
												<Typography variant="body2" color="text.secondary">
													{formatQuantity(token.quantity, 8, secretMode)}
												</Typography>
											</TableCell>
										</TableRow>
									))
								)}
							</TableBody>
						</Table>
					</Box>

					{/* Pagination */}
					{filteredTokens.length > 0 && (
						<TablePagination
							component="div"
							count={filteredTokens.length}
							onPageChange={(_, newPage) => onPageChange(newPage)}
							onRowsPerPageChange={(e) => {
								onRowsPerPageChange(parseInt(e.target.value, 10));
								onPageChange(0);
							}}
							page={page}
							rowsPerPage={rowsPerPage}
							rowsPerPageOptions={[10]}
							labelRowsPerPage="Rows per page:"
						/>
					)}
				</Stack>
			</DialogContent>
		</Dialog>
	);
}