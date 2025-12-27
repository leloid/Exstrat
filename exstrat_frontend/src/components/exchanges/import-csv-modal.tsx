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
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { XCircleIcon } from "@phosphor-icons/react/dist/ssr/XCircle";
import { transactionsApi } from "@/lib/transactions-api";
import { toast } from "@/components/core/toaster";
import type { ExchangeType } from "./select-exchange-modal";
import { usePortfolio } from "@/contexts/PortfolioContext";

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
					<Typography variant="h6">Import CSV - {exchange === "coinbase" ? "Coinbase" : "Crypto.com"}</Typography>
					<IconButton onClick={handleClose} size="small">
						<XIcon />
					</IconButton>
				</Stack>
			</DialogTitle>
			<DialogContent>
				<Stack spacing={3} sx={{ mt: 1 }}>
					{/* File Upload */}
					<Box>
						<Button
							variant="outlined"
							component="label"
							startIcon={<FileCsvIcon />}
							sx={{ mb: 2 }}
						>
							Select CSV File
							<input
								type="file"
								hidden
								accept=".csv"
								onChange={handleFileChange}
							/>
						</Button>
						{file && (
							<Typography variant="body2" color="text.secondary">
								Selected: {file.name}
							</Typography>
						)}
					</Box>

					{/* Portfolio Selection */}
					<FormControl fullWidth>
						<InputLabel>Wallet</InputLabel>
						<Select
							value={selectedPortfolioId}
							onChange={(e) => setSelectedPortfolioId(e.target.value)}
							label="Wallet"
						>
							{portfolios.map((portfolio) => (
								<MenuItem key={portfolio.id} value={portfolio.id}>
									{portfolio.name}
								</MenuItem>
							))}
						</Select>
					</FormControl>

					{/* Parse Button */}
					<Button
						variant="contained"
						onClick={handleParse}
						disabled={!csvContent || !selectedPortfolioId || isParsing}
						startIcon={isParsing ? <CircularProgress size={20} /> : <FileCsvIcon />}
					>
						{isParsing ? "Parsing..." : "Parse CSV"}
					</Button>

					{/* Parse Results */}
					{parseResult && (
						<>
							<Alert severity={parseResult.validCount > 0 ? "success" : "warning"}>
								<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
									<Typography>
										<strong>{parseResult.validCount}</strong> valid transactions
									</Typography>
									{parseResult.invalidCount > 0 && (
										<Typography>
											<strong>{parseResult.invalidCount}</strong> invalid transactions
										</Typography>
									)}
								</Stack>
							</Alert>

							{/* Valid Transactions Preview */}
							{parseResult.validTransactions.length > 0 && (
								<Box>
									<Typography variant="h6" sx={{ mb: 2 }}>
										Valid Transactions ({parseResult.validTransactions.length})
									</Typography>
									<Box sx={{ maxHeight: 400, overflow: "auto" }}>
										<Table size="small">
											<TableHead>
												<TableRow>
													<TableCell>Date</TableCell>
													<TableCell>Token</TableCell>
													<TableCell>Type</TableCell>
													<TableCell>Quantity</TableCell>
													<TableCell>Amount</TableCell>
													<TableCell>Price</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{parseResult.validTransactions.slice(0, 20).map((tx, index) => (
													<TableRow key={index}>
														<TableCell>
															{new Date(tx.transactionDate).toLocaleDateString()}
														</TableCell>
														<TableCell>{tx.symbol}</TableCell>
														<TableCell>
															<Chip label={tx.type} size="small" />
														</TableCell>
														<TableCell>{tx.quantity.toFixed(8)}</TableCell>
														<TableCell>${tx.amountInvested.toFixed(2)}</TableCell>
														<TableCell>${tx.averagePrice.toFixed(2)}</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
										{parseResult.validTransactions.length > 20 && (
											<Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: "center" }}>
												... and {parseResult.validTransactions.length - 20} more
											</Typography>
										)}
									</Box>
								</Box>
							)}

							{/* Invalid Transactions */}
							{parseResult.invalidTransactions.length > 0 && (
								<Box>
									<Typography variant="h6" sx={{ mb: 2, color: "error.main" }}>
										Invalid Transactions ({parseResult.invalidTransactions.length})
									</Typography>
									<Box sx={{ maxHeight: 300, overflow: "auto" }}>
										{parseResult.invalidTransactions.slice(0, 10).map((invalid, index) => (
											<Alert key={index} severity="error" sx={{ mb: 1 }}>
												<Stack spacing={0.5}>
													<Typography variant="body2">
														<strong>Row {invalid.row}:</strong> {invalid.errors.join(", ")}
													</Typography>
												</Stack>
											</Alert>
										))}
										{parseResult.invalidTransactions.length > 10 && (
											<Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: "center" }}>
												... and {parseResult.invalidTransactions.length - 10} more errors
											</Typography>
										)}
									</Box>
								</Box>
							)}
						</>
					)}
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose}>Cancel</Button>
				<Button
					variant="contained"
					onClick={handleImport}
					disabled={!parseResult || parseResult.validTransactions.length === 0 || isImporting}
					startIcon={isImporting ? <CircularProgress size={20} /> : <CheckCircleIcon />}
				>
					{isImporting ? "Importing..." : `Import ${parseResult?.validCount || 0} Transactions`}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

