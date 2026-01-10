"use client";

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { FileCsvIcon } from "@phosphor-icons/react/dist/ssr/FileCsv";
import { DownloadIcon } from "@phosphor-icons/react/dist/ssr/Download";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { XCircleIcon } from "@phosphor-icons/react/dist/ssr/XCircle";
import { transactionsApi } from "@/lib/transactions-api";
import { toast } from "@/components/core/toaster";
import type { ExchangeType } from "./select-exchange-modal";
import { usePortfolio } from "@/contexts/PortfolioContext";
import api from "@/lib/api";

interface ImportCsvModalProps {
	open: boolean;
	onClose: () => void;
	exchange: ExchangeType;
	onSuccess: () => void;
}

export function ImportCsvModal({
	open,
	onClose,
	exchange,
	onSuccess,
}: ImportCsvModalProps): React.JSX.Element {
	const { portfolios } = usePortfolio();
	const [csvContent, setCsvContent] = React.useState("");
	const [selectedPortfolioId, setSelectedPortfolioId] = React.useState("");
	const [isParsing, setIsParsing] = React.useState(false);
	const [isImporting, setIsImporting] = React.useState(false);
	const [parseResult, setParseResult] = React.useState<{
		validTransactions: any[];
		invalidTransactions: Array<{ row: number; data: any; errors: string[] }>;
		totalRows: number;
		validCount: number;
		invalidCount: number;
	} | null>(null);
	const [file, setFile] = React.useState<File | null>(null);

	// Set default portfolio on mount
	React.useEffect(() => {
		if (portfolios.length > 0 && !selectedPortfolioId) {
			const defaultPortfolio = portfolios.find((p) => p.isDefault) || portfolios[0];
			setSelectedPortfolioId(defaultPortfolio.id);
		}
	}, [portfolios, selectedPortfolioId]);

	const handleDownloadTemplate = async () => {
		// Fonction helper pour télécharger le template
		const downloadTemplateFile = () => {
			const csvHeader = "Date,Symbol,Type,Quantity,Price,Amount,Notes\n";
			const csvExample = "2024-01-15,BTC,BUY,0.5,50000,25000,Initial purchase\n";
			const csvContent = csvHeader + csvExample;
			const blob = new Blob([csvContent], { type: "text/csv" });
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "exstrat-transactions-template.csv";
			document.body.appendChild(a);
			a.click();
			window.URL.revokeObjectURL(url);
			document.body.removeChild(a);
			toast.success("Template downloaded successfully");
		};

		// Essayer d'abord l'API, sinon utiliser le fallback silencieusement
		try {
			const response = await api.get("/transactions/csv-template", {
				responseType: "blob",
			}).catch((error) => {
				// Intercepter l'erreur silencieusement et retourner null
				// Ne pas logger l'erreur car on utilise le fallback
				return null;
			});

			if (response && response.data) {
				const blob = new Blob([response.data], { type: "text/csv" });
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = "exstrat-transactions-template.csv";
				document.body.appendChild(a);
				a.click();
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);
				toast.success("Template downloaded successfully");
			} else {
				// Fallback: créer le template côté client
				downloadTemplateFile();
			}
		} catch (error: any) {
			// En cas d'erreur, utiliser le fallback silencieusement
			// Ne pas logger l'erreur car le fallback fonctionne
			downloadTemplateFile();
		}
	};

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = event.target.files?.[0];
		if (selectedFile) {
			setFile(selectedFile);
			const reader = new FileReader();
			reader.onload = (e) => {
				const content = e.target?.result as string;
				setCsvContent(content);
			};
			reader.readAsText(selectedFile);
		}
	};

	const handleParse = async () => {
		if (!csvContent.trim()) {
			toast.error("Please select a CSV file first");
			return;
		}

		if (!selectedPortfolioId) {
			toast.error("Please select a wallet");
			return;
		}

		setIsParsing(true);
		try {
			const result = await transactionsApi.parseCsv({
				exchange,
				csvContent,
				portfolioId: selectedPortfolioId,
			});
			setParseResult(result);
			if (result.validCount > 0) {
				toast.success(`Parsed ${result.validCount} valid transactions`);
			}
			if (result.invalidCount > 0) {
				toast.warning(`${result.invalidCount} transactions have errors`);
			}
		} catch (error: any) {
			toast.error(error.response?.data?.message || error.message || "Failed to parse CSV");
		} finally {
			setIsParsing(false);
		}
	};

	const handleImport = async () => {
		if (!parseResult || parseResult.validTransactions.length === 0) {
			toast.error("No valid transactions to import");
			return;
		}

		setIsImporting(true);
		try {
			const result = await transactionsApi.createBatchTransactions({
				transactions: parseResult.validTransactions.map((tx) => ({
					symbol: tx.symbol,
					name: tx.name || tx.symbol,
					cmcId: tx.cmcId || 0,
					quantity: tx.quantity,
					amountInvested: tx.amountInvested,
					averagePrice: tx.averagePrice,
					type: tx.type,
					transactionDate: tx.transactionDate,
					notes: tx.notes,
					exchangeId: tx.exchangeId,
					portfolioId: selectedPortfolioId,
				})),
				defaultPortfolioId: selectedPortfolioId,
			});

			if (result.successCount > 0) {
				toast.success(`Successfully imported ${result.successCount} transactions`);
			}
			if (result.failedCount > 0) {
				toast.warning(`${result.failedCount} transactions failed to import`);
			}

			onSuccess();
			handleClose();
		} catch (error: any) {
			toast.error(error.response?.data?.message || error.message || "Failed to import transactions");
		} finally {
			setIsImporting(false);
		}
	};

	const handleClose = () => {
		setCsvContent("");
		setFile(null);
		setParseResult(null);
		setIsParsing(false);
		setIsImporting(false);
		onClose();
	};

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
			<DialogTitle>
				<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
					{exchange === "exstrat" ? (
						<Box>
							<Typography variant="h6">Import CSV - ExStrat Custom</Typography>
							<Typography color="text.secondary" variant="body2">
								Upload your CSV file using our custom template
							</Typography>
						</Box>
					) : (
						<Typography variant="h6">
							Import CSV - {exchange === "coinbase" ? "Coinbase" : "Crypto.com"}
						</Typography>
					)}
					<IconButton onClick={handleClose} size="small">
						<XIcon />
					</IconButton>
				</Stack>
			</DialogTitle>
			<DialogContent>
				<Stack spacing={3} sx={{ mt: 1 }}>
					{/* Download Template - Only for Exstrat */}
					{exchange === "exstrat" && (
						<Box>
							<Button
								variant="outlined"
								startIcon={<DownloadIcon />}
								onClick={handleDownloadTemplate}
								sx={{ textTransform: "none" }}
							>
								Download ExStrat Template
							</Button>
							<Typography color="text.secondary" variant="caption" sx={{ display: "block", mt: 1 }}>
								Download the template, fill it with your transactions, and upload it here
							</Typography>
						</Box>
					)}

					{/* Wallet Selection */}
					<FormControl fullWidth>
						<InputLabel>Select Wallet</InputLabel>
						<Select
							value={selectedPortfolioId}
							onChange={(e) => setSelectedPortfolioId(e.target.value)}
							label="Select Wallet"
						>
							{portfolios.map((portfolio) => (
								<MenuItem key={portfolio.id} value={portfolio.id}>
									{portfolio.name}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					{/* File Upload */}
					<Box>
						<Button variant="outlined" component="label" startIcon={<FileCsvIcon />} sx={{ textTransform: "none" }}>
							{file ? file.name : "Select CSV File"}
							<input type="file" accept=".csv" hidden onChange={handleFileChange} />
						</Button>
						{file && (
							<Typography color="text.secondary" variant="caption" sx={{ display: "block", mt: 1 }}>
								File selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
							</Typography>
						)}
					</Box>

					{/* Parse Button */}
					{csvContent && (
						<Button
							variant="contained"
							onClick={handleParse}
							disabled={isParsing || !selectedPortfolioId}
							startIcon={isParsing ? <CircularProgress size={16} /> : <FileCsvIcon />}
							sx={{ textTransform: "none" }}
						>
							{isParsing ? "Parsing..." : "Parse CSV"}
						</Button>
					)}

					{/* Parse Results */}
					{parseResult && (
						<>
							<Alert severity={parseResult.invalidCount > 0 ? "warning" : "success"}>
								{parseResult.validCount} valid transaction(s) found
								{parseResult.invalidCount > 0 && `, ${parseResult.invalidCount} with errors`}
							</Alert>

							{parseResult.validTransactions.length > 0 && (
								<Box>
									<Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
										Valid Transactions ({parseResult.validCount})
									</Typography>
									<Box sx={{ maxHeight: 300, overflow: "auto" }}>
										<Table size="small">
											<TableHead>
												<TableRow>
													<TableCell>Date</TableCell>
													<TableCell>Symbol</TableCell>
													<TableCell>Type</TableCell>
													<TableCell align="right">Quantity</TableCell>
													<TableCell align="right">Amount</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{parseResult.validTransactions.map((tx, index) => (
													<TableRow key={index}>
														<TableCell>
															{new Date(tx.transactionDate).toLocaleDateString()}
														</TableCell>
														<TableCell>{tx.symbol}</TableCell>
														<TableCell>
															<Chip label={tx.type} size="small" color="primary" variant="outlined" />
														</TableCell>
														<TableCell align="right">{tx.quantity}</TableCell>
														<TableCell align="right">${tx.amountInvested.toFixed(2)}</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</Box>
								</Box>
							)}

							{parseResult.invalidTransactions.length > 0 && (
								<Box>
									<Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1, color: "error.main" }}>
										Invalid Transactions ({parseResult.invalidCount})
									</Typography>
									<Box sx={{ maxHeight: 200, overflow: "auto" }}>
										<Stack spacing={1}>
											{parseResult.invalidTransactions.map((invalid, index) => (
												<Alert key={index} severity="error" sx={{ py: 0.5 }}>
													<Typography variant="caption">
														Row {invalid.row}: {invalid.errors.join(", ")}
													</Typography>
												</Alert>
											))}
										</Stack>
									</Box>
								</Box>
							)}
						</>
					)}
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} disabled={isImporting}>
					Cancel
				</Button>
				<Button
					variant="contained"
					onClick={handleImport}
					disabled={!parseResult || parseResult.validTransactions.length === 0 || isImporting}
					startIcon={isImporting ? <CircularProgress size={16} /> : <CheckCircleIcon />}
				>
					{isImporting ? "Importing..." : `Import ${parseResult?.validCount || 0} Transaction(s)`}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

