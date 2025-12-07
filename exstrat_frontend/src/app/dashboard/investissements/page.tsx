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

import { usePortfolio } from "@/contexts/PortfolioContext";
import * as portfoliosApi from "@/lib/portfolios-api";
import { transactionsApi } from "@/lib/transactions-api";
import { formatCurrency, formatPercentage, formatCompactCurrency } from "@/lib/format";
import { TokenSearch } from "@/components/transactions/token-search";
import type { Holding, CreatePortfolioDto, UpdatePortfolioDto } from "@/types/portfolio";
import type { TransactionResponse, CreateTransactionDto, TokenSearchResult } from "@/types/transactions";
import { Area, AreaChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { NoSsr } from "@/components/core/no-ssr";
import CardActions from "@mui/material/CardActions";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import { ArrowDownRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowDownRight";
import { ArrowUpRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowUpRight";

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
	const [showDeleteTransactionModal, setShowDeleteTransactionModal] = React.useState(false);
	const [transactionToDelete, setTransactionToDelete] = React.useState<string | null>(null);
	const [showWalletDetailsModal, setShowWalletDetailsModal] = React.useState(false);
	const [selectedWalletId, setSelectedWalletId] = React.useState<string | null>(null);
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

	// View all tokens modal state
	const [showAllTokensModal, setShowAllTokensModal] = React.useState(false);
	const [allTokensSearchQuery, setAllTokensSearchQuery] = React.useState("");
	const [allTokensPage, setAllTokensPage] = React.useState(0);
	const [allTokensRowsPerPage, setAllTokensRowsPerPage] = React.useState(10);

	// Wallet performance view mode
	const [walletPerformanceView, setWalletPerformanceView] = React.useState<"global" | "byWallet">("global");

	// Calculate aggregated token data for chart
	// Full token data (all tokens, no limit)
	const allTokenData = React.useMemo(() => {
		const tokenMap = new Map<string, { symbol: string; name: string; quantity: number; value: number; color: string }>();

		// Aggregate all holdings from all portfolios
		Object.values(portfolioData).forEach((portfolio) => {
			portfolio.holdings.forEach((holding) => {
				const symbol = holding.token.symbol.toUpperCase();
				const currentValue = holding.currentValue || (holding.currentPrice || holding.averagePrice) * holding.quantity;

				if (tokenMap.has(symbol)) {
					const existing = tokenMap.get(symbol)!;
					existing.quantity += holding.quantity;
					existing.value += currentValue;
				} else {
					// Generate a color based on symbol
					const colors = [
						"var(--mui-palette-primary-main)",
						"var(--mui-palette-success-main)",
						"var(--mui-palette-warning-main)",
						"var(--mui-palette-error-main)",
						"var(--mui-palette-info-main)",
						"#9c27b0",
						"#f50057",
						"#00acc1",
						"#ff9800",
						"#795548",
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
		if (!transactionSearchQuery.trim()) {
			return transactions;
		}
		const query = transactionSearchQuery.toLowerCase();
		return transactions.filter(
			(transaction) =>
				transaction.symbol.toLowerCase().includes(query) ||
				transaction.name.toLowerCase().includes(query) ||
				transaction.portfolio?.name.toLowerCase().includes(query)
		);
	}, [transactions, transactionSearchQuery]);

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

		// Group transactions by date and calculate cumulative value
		const transactionsByDate = new Map<string, number>();
		const sortedTransactions = [...transactions].sort((a, b) => {
			const dateA = new Date(a.transactionDate).getTime();
			const dateB = new Date(b.transactionDate).getTime();
			return dateA - dateB;
		});

		let cumulativeValue = 0;
		const now = new Date();
		const days = 30;
		const data: Array<{ name: string; value: number }> = [];

		// Calculate cumulative value for each transaction date
		for (const transaction of sortedTransactions) {
			const transactionDate = new Date(transaction.transactionDate);
			const daysDiff = Math.floor((now.getTime() - transactionDate.getTime()) / (1000 * 60 * 60 * 24));
			if (daysDiff <= days) {
				if (transaction.type === "BUY") {
					cumulativeValue += transaction.amountInvested || 0;
				} else {
					cumulativeValue -= transaction.amountInvested || 0;
				}
				const monthName = transactionDate.toLocaleDateString("en-US", { month: "short" });
				const day = transactionDate.getDate();
				transactionsByDate.set(`${monthName} ${day}`, cumulativeValue);
			}
		}

		// Fill in missing dates with interpolated values
		for (let i = days; i >= 0; i--) {
			const date = new Date(now);
			date.setDate(date.getDate() - i);
			const monthName = date.toLocaleDateString("en-US", { month: "short" });
			const day = date.getDate();
			const dateKey = `${monthName} ${day}`;

			if (transactionsByDate.has(dateKey)) {
				data.push({
					name: dateKey,
					value: transactionsByDate.get(dateKey)!,
				});
			} else {
				// Interpolate based on current total value
				const progress = i / days;
				const simulatedValue = globalStats.totalValue * (0.7 + 0.3 * progress);
				data.push({
					name: dateKey,
					value: simulatedValue,
				});
			}
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

		// Generate data points for each date
		for (let i = days; i >= 0; i--) {
			const date = new Date(now);
			date.setDate(date.getDate() - i);
			const monthName = date.toLocaleDateString("en-US", { month: "short" });
			const day = date.getDate();
			const dateKey = `${monthName} ${day}`;

			const dataPoint: { name: string; [key: string]: string | number } = { name: dateKey };

			// Calculate value for each wallet
			topWallets.forEach((wallet) => {
				const progress = i / days;
				// Simulate wallet value evolution
				const simulatedValue = wallet.value * (0.7 + 0.3 * progress);
				// Use wallet name as key (sanitized)
				const walletKey = wallet.name.replace(/\s+/g, "_");
				dataPoint[walletKey] = simulatedValue;
			});

			data.push(dataPoint);
		}

		return { data, wallets: topWallets };
	}, [portfolioData]);

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
		} catch (error) {
			console.error("Error deleting portfolio:", error);
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

	const openWalletDetails = (portfolioId: string) => {
		setSelectedWalletId(portfolioId);
		setShowWalletDetailsModal(true);
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
		} catch (error) {
			console.error("Error deleting transaction:", error);
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
						<Typography variant="h4">Investments</Typography>
						<Typography color="text.secondary" variant="body1">
							Manage your wallets and transactions
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

				{/* Global Stats - Analytics Style */}
				<Card>
					<Box
						sx={{
							display: "grid",
							gap: 2,
							gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
							p: 3,
						}}
					>
						<Stack
							spacing={1}
							sx={{
								borderRight: { xs: "none", md: "1px solid var(--mui-palette-divider)" },
								borderBottom: { xs: "1px solid var(--mui-palette-divider)", md: "none" },
								pb: { xs: 2, md: 0 },
							}}
						>
							<Typography color="text.secondary">Total Value</Typography>
							<Typography variant="h3">{formatCompactCurrency(globalStats.totalValue, "$", 2)}</Typography>
						</Stack>
						<Stack
							spacing={1}
							sx={{
								borderRight: { xs: "none", lg: "1px solid var(--mui-palette-divider)" },
								borderBottom: { xs: "1px solid var(--mui-palette-divider)", md: "none" },
								pb: { xs: 2, md: 0 },
							}}
						>
							<Typography color="text.secondary">Total Invested</Typography>
							<Typography variant="h3">{formatCompactCurrency(globalStats.totalInvested, "$", 2)}</Typography>
						</Stack>
						<Stack
							spacing={1}
							sx={{
								borderRight: { xs: "none", md: "1px solid var(--mui-palette-divider)" },
								borderBottom: { xs: "1px solid var(--mui-palette-divider)", md: "none" },
								pb: { xs: 2, md: 0 },
							}}
						>
							<Typography color="text.secondary">Profit / Loss</Typography>
							<Typography
								color={globalStats.totalPNL >= 0 ? "success.main" : "error.main"}
								variant="h3"
							>
								{formatCompactCurrency(globalStats.totalPNL, "$", 2)}
							</Typography>
							<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
								{globalStats.totalPNL >= 0 ? (
									<TrendUpIcon color="var(--mui-palette-success-main)" fontSize="var(--icon-fontSize-md)" />
								) : (
									<TrendDownIcon color="var(--mui-palette-error-main)" fontSize="var(--icon-fontSize-md)" />
								)}
								<Typography color="text.secondary" variant="body2">
									<Typography
										color={globalStats.totalPNLPercentage >= 0 ? "success.main" : "error.main"}
										component="span"
										variant="subtitle2"
									>
										{formatPercentage(globalStats.totalPNLPercentage)}
									</Typography>{" "}
									return
								</Typography>
							</Stack>
						</Stack>
					</Box>
				</Card>

				{/* Token Distribution and Wallets - Side by Side */}
				<Grid container spacing={3}>
					{/* Token Distribution Chart */}
					{aggregatedTokenData.length > 0 && (
						<Grid size={{ xs: 12, md: 4 }}>
							<Card sx={{ height: "100%" }}>
								<CardHeader
									avatar={
										<Avatar>
											<WalletIcon fontSize="var(--Icon-fontSize)" />
										</Avatar>
									}
									subheader="Balance across all your wallets"
									title="Token Distribution"
								/>
								<CardContent>
									<Stack spacing={3}>
										{/* Centered Chart */}
										<Box
											sx={{
												display: "flex",
												justifyContent: "center",
												alignItems: "center",
												width: "100%",
											}}
										>
											<NoSsr fallback={<Box sx={{ height: "200px", width: "200px" }} />}>
												<PieChart height={200} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} width={200}>
													<Pie
														animationDuration={300}
														cx={100}
														cy={100}
														data={aggregatedTokenData}
														dataKey="value"
														innerRadius={70}
														nameKey="name"
														outerRadius={100}
														strokeWidth={0}
													>
														{aggregatedTokenData.map(
															(entry): React.JSX.Element => (
																<Cell fill={entry.color} key={entry.name} />
															)
														)}
													</Pie>
													<Tooltip animationDuration={50} content={<TokenTooltipContent />} />
												</PieChart>
											</NoSsr>
										</Box>
										{/* Text Content */}
										<Stack spacing={3}>
											<Stack spacing={1}>
												<Typography color="text.secondary" variant="overline">
													Total balance
												</Typography>
												<Typography variant="h4">
													{formatCompactCurrency(
														allTokenData.reduce((sum, item) => sum + item.value, 0),
														"$",
														2
													)}
												</Typography>
											</Stack>
											<Stack spacing={1}>
												<Typography color="text.secondary" variant="overline">
													Available tokens {allTokenData.length > 6 && `(showing top 6 of ${allTokenData.length})`}
												</Typography>
												<Stack component="ul" spacing={2} sx={{ listStyle: "none", m: 0, p: 0 }}>
													{aggregatedTokenData.slice(0, 6).map((entry) => (
														<Stack component="li" direction="row" key={entry.name} spacing={1} sx={{ alignItems: "center" }}>
															<Box sx={{ bgcolor: entry.color, borderRadius: "2px", height: "4px", width: "16px" }} />
															<Typography sx={{ flex: "1 1 auto" }} variant="subtitle2">
																{entry.name}
															</Typography>
															<Typography color="text.secondary" variant="body2">
																{formatCompactCurrency(entry.value, "$", 2)}
															</Typography>
														</Stack>
													))}
													{allTokenData.length > 6 && (
														<Stack
															component="li"
															direction="row"
															spacing={1}
															sx={{ alignItems: "center", opacity: 0.6 }}
														>
															<Box
																sx={{
																	bgcolor: "var(--mui-palette-text-secondary)",
																	borderRadius: "2px",
																	height: "4px",
																	width: "16px",
																}}
															/>
															<Typography color="text.secondary" sx={{ flex: "1 1 auto" }} variant="subtitle2">
																+{allTokenData.length - 4} more tokens
															</Typography>
															<Typography color="text.secondary" variant="body2">
																{formatCompactCurrency(
																	allTokenData
																		.slice(4)
																		.reduce((sum, token) => sum + token.value, 0),
																	"$",
																	2
																)}
															</Typography>
														</Stack>
													)}
												</Stack>
											</Stack>
										</Stack>
									</Stack>
								</CardContent>
								<Divider />
								<CardActions>
									<Button
										color="secondary"
										endIcon={<ArrowUpRightIcon />}
										size="small"
										onClick={() => {
											setShowAllTokensModal(true);
											setAllTokensSearchQuery("");
											setAllTokensPage(0);
										}}
									>
										View All Tokens
									</Button>
								</CardActions>
							</Card>
						</Grid>
					)}

					{/* Wallets Section */}
					<Grid size={{ xs: 12, md: aggregatedTokenData.length > 0 ? 8 : 12 }}>
				<Card>
					<CardContent>
						<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
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
								sx={{ maxWidth: "300px" }}
								value={walletSearchQuery}
							/>
						</Stack>
						{portfolios.length === 0 ? (
							<Box sx={{ py: 8, textAlign: "center" }}>
								<Typography color="text.secondary" variant="body1" sx={{ mb: 2 }}>
									No wallets yet. Create your first wallet to get started.
								</Typography>
								<Button
									onClick={() => {
										setEditingPortfolioId(null);
										setPortfolioName("");
										setPortfolioFormData({ name: "", description: "", isDefault: false });
										setShowPortfolioDialog(true);
									}}
									startIcon={<PlusIcon />}
									variant="contained"
								>
									Create Wallet
								</Button>
							</Box>
						) : filteredWallets.length === 0 ? (
							<Box sx={{ py: 8, textAlign: "center" }}>
								<Typography color="text.secondary" variant="body1">
									No wallets found matching "{walletSearchQuery}"
								</Typography>
							</Box>
						) : (
							<Box sx={{ overflowX: "auto", width: "100%" }}>
								<Table sx={{ tableLayout: "fixed", width: "100%" }}>
									<TableHead>
										<TableRow>
											<TableCell sx={{ width: "30%", minWidth: "150px", maxWidth: "200px" }}>
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
											<TableCell align="right" sx={{ width: "15%", minWidth: "100px" }}>
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
											<TableCell align="right" sx={{ width: "15%", minWidth: "100px" }}>
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
											<TableCell align="right" sx={{ width: "20%", minWidth: "120px" }}>
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
											<TableCell align="right" sx={{ width: "10%", minWidth: "80px" }}>Actions</TableCell>
										</TableRow>
									</TableHead>
								<TableBody>
									{paginatedWallets.map((portfolio) => {
										const data = portfolioData[portfolio.id];
										if (!data) return null;

										return (
											<TableRow
												key={portfolio.id}
												hover
												onClick={() => openWalletDetails(portfolio.id)}
												sx={{ cursor: "pointer" }}
											>
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
												<TableCell align="right">
													<Typography variant="body2" sx={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>
														{formatCompactCurrency(data.value, "$", 2)}
													</Typography>
												</TableCell>
												<TableCell align="right">
													<Typography variant="body2" sx={{ fontSize: "0.875rem", whiteSpace: "nowrap" }}>
														{formatCompactCurrency(data.invested, "$", 2)}
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
																sx={{ fontSize: "0.8rem", whiteSpace: "nowrap" }}
															>
																{formatCompactCurrency(data.pnl, "$", 2)}
															</Typography>
														</Stack>
														<Typography
															color={data.pnlPercentage >= 0 ? "success.main" : "error.main"}
															variant="caption"
															sx={{ fontSize: "0.65rem" }}
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
						<Button
							color="secondary"
							endIcon={<ArrowUpRightIcon />}
							size="small"
							onClick={() => {
								setEditingPortfolioId(null);
								setPortfolioName("");
								setPortfolioFormData({ name: "", description: "", isDefault: false });
								setShowPortfolioDialog(true);
							}}
						>
							Add Wallet
						</Button>
						<Button
							color="secondary"
							endIcon={<ArrowUpRightIcon />}
							size="small"
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
						>
							Add Transaction
						</Button>
						<Button
							color="secondary"
							endIcon={<ArrowDownRightIcon />}
							size="small"
							onClick={() => {
								// TODO: Implement transfer token functionality
								console.log("Transfer Token clicked");
							}}
						>
							Transfer Token
						</Button>
					</CardActions>
				</Card>

				{/* Portfolio Performance Chart */}
				<Card sx={{ mt: 3 }}>
					<CardHeader
						title="Wallet Performance"
						action={
							<ToggleButtonGroup
								color="primary"
								exclusive
								onChange={(_, value) => {
									if (value !== null) {
										setWalletPerformanceView(value);
									}
								}}
								size="small"
								value={walletPerformanceView}
							>
								<ToggleButton value="global">
									<Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
										<GlobeIcon fontSize="var(--icon-fontSize-md)" />
										<Typography variant="body2">Global</Typography>
									</Stack>
								</ToggleButton>
								<ToggleButton value="byWallet">
									<Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
										<ChartLineIcon fontSize="var(--icon-fontSize-md)" />
										<Typography variant="body2">Top Wallets</Typography>
									</Stack>
								</ToggleButton>
							</ToggleButtonGroup>
						}
					/>
					<CardContent>
						{walletPerformanceView === "global" ? (
							<NoSsr fallback={<Box sx={{ height: "240px" }} />}>
								<ResponsiveContainer height={240} width="100%">
									<AreaChart data={portfolioPerformanceData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
										<defs>
											<linearGradient id="area-performance" x1="0" x2="0" y1="0" y2="1">
												<stop offset="0" stopColor="var(--mui-palette-primary-main)" stopOpacity={0.3} />
												<stop offset="100%" stopColor="var(--mui-palette-primary-main)" stopOpacity={0} />
											</linearGradient>
										</defs>
										<CartesianGrid strokeDasharray="2 4" vertical={false} />
										<XAxis
											axisLine={false}
											dataKey="name"
											tickLine={false}
											type="category"
											interval="preserveStartEnd"
										/>
										<YAxis
											axisLine={false}
											tickLine={false}
											type="number"
											tickFormatter={(value) => formatCompactCurrency(value, "$", 0).replace("$", "")}
										/>
										<Area
											animationDuration={300}
											dataKey="value"
											fill="url(#area-performance)"
											fillOpacity={1}
											name="Total Value"
											stroke="var(--mui-palette-primary-main)"
											strokeWidth={3}
											type="natural"
										/>
										<Tooltip
											animationDuration={50}
											content={<PerformanceTooltipContent />}
											cursor={false}
										/>
									</AreaChart>
								</ResponsiveContainer>
							</NoSsr>
						) : (
							<Stack spacing={2}>
								<NoSsr fallback={<Box sx={{ height: "240px" }} />}>
									<ResponsiveContainer height={240} width="100%">
										<LineChart
											data={walletPerformanceByWalletData.data}
											margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
										>
											<CartesianGrid strokeDasharray="2 4" vertical={false} />
											<XAxis
												axisLine={false}
												dataKey="name"
												tickLine={false}
												type="category"
												interval="preserveStartEnd"
											/>
											<YAxis
												axisLine={false}
												tickLine={false}
												type="number"
												tickFormatter={(value) => formatCompactCurrency(value, "$", 0).replace("$", "")}
											/>
											{walletPerformanceByWalletData.wallets.map((wallet, index) => {
												const walletKey = wallet.name.replace(/\s+/g, "_");
												const colors = [
													"var(--mui-palette-primary-main)",
													"var(--mui-palette-success-main)",
													"var(--mui-palette-warning-main)",
												];
												return (
													<Line
														key={wallet.id}
														animationDuration={300}
														dataKey={walletKey}
														name={wallet.name}
														stroke={colors[index % colors.length]}
														strokeWidth={3}
														type="natural"
													/>
												);
											})}
											<Tooltip
												animationDuration={50}
												content={<WalletPerformanceTooltipContent wallets={walletPerformanceByWalletData.wallets} />}
												cursor={false}
											/>
										</LineChart>
									</ResponsiveContainer>
								</NoSsr>
								{walletPerformanceByWalletData.wallets.length > 0 && (
									<Stack direction="row" spacing={2} sx={{ flexWrap: "wrap", justifyContent: "center" }}>
										{walletPerformanceByWalletData.wallets.map((wallet, index) => {
											const colors = [
												"var(--mui-palette-primary-main)",
												"var(--mui-palette-success-main)",
												"var(--mui-palette-warning-main)",
											];
											return (
												<Stack key={wallet.id} direction="row" spacing={1} sx={{ alignItems: "center" }}>
													<Box
														sx={{
															bgcolor: colors[index % colors.length],
															borderRadius: "2px",
															height: "4px",
															width: "16px",
														}}
													/>
													<Typography variant="body2">{wallet.name}</Typography>
												</Stack>
											);
										})}
									</Stack>
								)}
							</Stack>
						)}
					</CardContent>
				</Card>
					</Grid>
				</Grid>

				{/* Transactions Section */}
				<Card>
					<CardContent>
						<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between", mb: 3 }}>
							<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
								<PlusIcon fontSize="var(--icon-fontSize-lg)" />
								<Typography variant="h6">Transactions</Typography>
							</Stack>
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
						) : filteredTransactions.length === 0 ? (
							<Box sx={{ py: 8, textAlign: "center" }}>
								<Typography color="text.secondary" variant="body1">
									No transactions found matching "{transactionSearchQuery}"
								</Typography>
							</Box>
						) : (
							<Table>
								<TableHead>
									<TableRow>
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
			</Stack>

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
							<>
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
									label="Default Wallet"
								/>
							</>
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
							<InputLabel>Wallet</InputLabel>
							<Select
								label="Wallet"
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
				<DialogContent>
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
				<DialogContent>
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
									<Typography variant="h5">{formatCompactCurrency(selectedWalletData.value, "$", 2)}</Typography>
									<Typography color="text.secondary" component="h4" variant="overline">
										Current Value
									</Typography>
								</Box>
								<Divider orientation="vertical" flexItem />
								<Box sx={{ flex: "1 1 auto", p: 3, textAlign: "center" }}>
									<Typography variant="h5">{formatCompactCurrency(selectedWalletData.invested, "$", 2)}</Typography>
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
										{formatCompactCurrency(selectedWalletData.pnl, "$", 2)}
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
														{transaction.type === "BUY" ? "+" : "-"} {transaction.quantity} {transaction.symbol}
													</Typography>
													<Typography color="text.secondary" variant="body2">
														{formatCurrency(transaction.amountInvested, "$", 2)}
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
								{formatCompactCurrency(entry.value, "$", 2)}
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
							{data.quantity?.toLocaleString(undefined, { maximumFractionDigits: 8 })} {entry.name}
						</Typography>
					</Stack>
					<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
						<Typography color="text.secondary" variant="body2">
							Value:
						</Typography>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							{formatCompactCurrency(entry.value, "$", 2)}
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
						{formatCompactCurrency(entry.value, "$", 2)}
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
													{formatCompactCurrency(token.value, "$", 2)}
												</Typography>
											</TableCell>
											<TableCell align="right">
												<Typography variant="body2" color="text.secondary">
													{token.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })}
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
