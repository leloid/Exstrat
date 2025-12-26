"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { TrendDownIcon } from "@phosphor-icons/react/dist/ssr/TrendDown";
import { TrendUpIcon } from "@phosphor-icons/react/dist/ssr/TrendUp";
import { WalletIcon } from "@phosphor-icons/react/dist/ssr/Wallet";
import { CalendarIcon } from "@phosphor-icons/react/dist/ssr/Calendar";
import { CurrencyDollarIcon } from "@phosphor-icons/react/dist/ssr/CurrencyDollar";
import { CoinsIcon } from "@phosphor-icons/react/dist/ssr/Coins";

import { TokenSearch } from "@/components/transactions/token-search";
import { transactionsApi } from "@/lib/transactions-api";
import { formatCurrency } from "@/lib/format";
import { getTokenLogoUrl } from "@/lib/utils";
import type { TokenSearchResult, CreateTransactionDto } from "@/types/transactions";
import type { Portfolio } from "@/types/portfolio";
import { useColorScheme } from "@mui/material/styles";

interface CreateTransactionModalProps {
	onClose: () => void;
	onSuccess: () => void;
	open: boolean;
	portfolios: Portfolio[];
	editingTransaction?: {
		id: string;
		symbol: string;
		name: string;
		cmcId: number;
		quantity: number;
		amountInvested: number;
		averagePrice: number;
		type: "BUY" | "SELL";
		transactionDate: string;
		notes?: string;
		portfolioId: string;
	} | null;
}

export function CreateTransactionModal({
	onClose,
	onSuccess,
	open,
	portfolios,
	editingTransaction,
}: CreateTransactionModalProps): React.JSX.Element {
	const { colorScheme = "light" } = useColorScheme();
	const [selectedToken, setSelectedToken] = React.useState<TokenSearchResult | null>(null);
	const [selectedPortfolioId, setSelectedPortfolioId] = React.useState<string>("");
	const [transactionType, setTransactionType] = React.useState<"BUY" | "SELL">("BUY");
	const [quantity, setQuantity] = React.useState<string>("");
	const [amountInvested, setAmountInvested] = React.useState<string>("");
	const [transactionDate, setTransactionDate] = React.useState<string>(new Date().toISOString().split("T")[0]);
	const [notes, setNotes] = React.useState<string>("");
	const [error, setError] = React.useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = React.useState<{
		token?: boolean;
		wallet?: boolean;
		quantity?: boolean;
		amountInvested?: boolean;
		transactionDate?: boolean;
	}>({});
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	// Calculate average price
	const averagePrice = React.useMemo(() => {
		const qty = parseFloat(quantity);
		const amount = parseFloat(amountInvested);
		if (!isNaN(qty) && !isNaN(amount) && qty > 0) {
			return (amount / qty).toFixed(8);
		}
		return "";
	}, [quantity, amountInvested]);

	// Initialize form when editing
	React.useEffect(() => {
		if (editingTransaction && open) {
			setSelectedToken({
				id: editingTransaction.cmcId,
				symbol: editingTransaction.symbol,
				name: editingTransaction.name,
			} as TokenSearchResult);
			setSelectedPortfolioId(editingTransaction.portfolioId);
			setTransactionType(editingTransaction.type);
			setQuantity(editingTransaction.quantity.toString());
			setAmountInvested(editingTransaction.amountInvested.toString());
			setTransactionDate(editingTransaction.transactionDate.split("T")[0]);
			setNotes(editingTransaction.notes || "");
		} else if (open && !editingTransaction) {
			// Reset form for new transaction
			setSelectedToken(null);
			setSelectedPortfolioId(portfolios[0]?.id || "");
			setTransactionType("BUY");
			setQuantity("");
			setAmountInvested("");
			setTransactionDate(new Date().toISOString().split("T")[0]);
			setNotes("");
			setError(null);
		}
	}, [editingTransaction, open, portfolios]);

	const handleSubmit = async () => {
		setError(null);
		setFieldErrors({});

		// Validation des champs obligatoires
		const errors: typeof fieldErrors = {};
		const missingFields: string[] = [];

		if (!selectedToken) {
			errors.token = true;
			missingFields.push("Token");
		}

		if (!selectedPortfolioId) {
			errors.wallet = true;
			missingFields.push("Wallet");
		}

		if (!quantity || quantity.trim() === "") {
			errors.quantity = true;
			missingFields.push("Quantity");
		}

		if (!amountInvested || amountInvested.trim() === "") {
			errors.amountInvested = true;
			missingFields.push("Amount Invested");
		}

		if (!transactionDate || transactionDate.trim() === "") {
			errors.transactionDate = true;
			missingFields.push("Transaction Date");
		}

		// Si des champs sont manquants, afficher les erreurs
		if (Object.keys(errors).length > 0) {
			setFieldErrors(errors);
			const fieldsList = missingFields.join(", ");
			setError(`Les champs suivants sont requis : ${fieldsList}. Veuillez compléter tous les champs obligatoires avant de continuer.`);
			return;
		}

		// Validation des valeurs numériques
		const qty = parseFloat(quantity);
		const amount = parseFloat(amountInvested);

		if (isNaN(qty) || qty <= 0) {
			setFieldErrors({ quantity: true });
			setError("La quantité doit être supérieure à 0");
			return;
		}

		if (isNaN(amount) || amount <= 0) {
			setFieldErrors({ amountInvested: true });
			setError("Le montant investi doit être supérieur à 0");
			return;
		}

		// Vérification TypeScript : selectedToken et selectedPortfolioId ne peuvent pas être null ici
		// car on a déjà vérifié et retourné si ils étaient null
		if (!selectedToken || !selectedPortfolioId) {
			// Cette vérification ne devrait jamais être atteinte, mais TypeScript l'exige
			setError("Une erreur inattendue s'est produite. Veuillez réessayer.");
			return;
		}

		setIsSubmitting(true);

		try {
			if (editingTransaction) {
				// Update transaction
				const updateData = {
					quantity: qty,
					amountInvested: amount,
					averagePrice: parseFloat(averagePrice),
					type: transactionType,
					transactionDate: new Date(transactionDate).toISOString(),
					notes: notes || undefined,
				};
				await transactionsApi.updateTransaction(editingTransaction.id, updateData);
			} else {
				// Create transaction
				const transactionData: CreateTransactionDto = {
					symbol: selectedToken.symbol,
					name: selectedToken.name,
					cmcId: selectedToken.id,
					quantity: qty,
					amountInvested: amount,
					averagePrice: parseFloat(averagePrice),
					type: transactionType,
					transactionDate: new Date(transactionDate).toISOString(),
					notes: notes || undefined,
					portfolioId: selectedPortfolioId,
				};
				await transactionsApi.createTransaction(transactionData);
			}

			onSuccess();
			onClose();
		} catch (error_: unknown) {
			const axiosError = error_ as { response?: { data?: { message?: string } }; message?: string };
			const errorMessage =
				axiosError.response?.data?.message || axiosError.message || "An error occurred while saving the transaction";
			setError(errorMessage);
		} finally {
			setIsSubmitting(false);
		}
	};

	const tokenLogoUrl = selectedToken ? getTokenLogoUrl(selectedToken.symbol, selectedToken.id) : null;

	return (
		<Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
			<DialogTitle>
				<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
					<Avatar
						sx={{
							bgcolor: transactionType === "BUY" ? "success.main" : "error.main",
							color: "white",
						}}
					>
						{transactionType === "BUY" ? (
							<TrendUpIcon fontSize="var(--icon-fontSize-lg)" />
						) : (
							<TrendDownIcon fontSize="var(--icon-fontSize-lg)" />
						)}
					</Avatar>
					<Box sx={{ flex: 1 }}>
						<Typography variant="h6">{editingTransaction ? "Edit Transaction" : "Create Transaction"}</Typography>
						<Typography color="text.secondary" variant="body2">
							{editingTransaction ? "Update your transaction details" : "Add a new transaction to your portfolio"}
						</Typography>
					</Box>
					<IconButton onClick={onClose} size="small">
						<XIcon />
					</IconButton>
				</Stack>
			</DialogTitle>
			<DialogContent>
				<Stack spacing={4} sx={{ mt: 2 }}>
					{error && (
						<Box
							sx={{
								p: 2,
								bgcolor: "error.50",
								borderRadius: 2,
								border: "1px solid",
								borderColor: "error.200",
								display: "flex",
								alignItems: "flex-start",
								gap: 1,
							}}
						>
							<Box
								sx={{
									mt: 0.5,
									color: "error.main",
								}}
							>
								<XIcon fontSize="small" />
							</Box>
							<Box sx={{ flex: 1 }}>
								<Typography color="error.main" variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
									Champs manquants
								</Typography>
							<Typography color="error.main" variant="body2">
								{error}
							</Typography>
							</Box>
						</Box>
					)}

					{/* Token Selection Card */}
					<Card variant="outlined">
						<CardContent>
							<Stack spacing={2}>
								<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
									<Avatar
										sx={{
											bgcolor: "primary.main",
											color: "white",
										}}
									>
										<CoinsIcon fontSize="var(--icon-fontSize-lg)" />
									</Avatar>
									<Box sx={{ flex: 1 }}>
										<Typography variant="h6">Select Token</Typography>
										<Typography color="text.secondary" variant="body2">
											Choose the cryptocurrency for this transaction
										</Typography>
									</Box>
								</Stack>
								<TokenSearch
									onTokenSelect={(token) => {
										setSelectedToken(token);
										if (token && fieldErrors.token) {
											setFieldErrors((prev) => ({ ...prev, token: false }));
										}
									}}
									selectedToken={selectedToken}
									error={fieldErrors.token}
									helperText={fieldErrors.token ? "Ce champ est requis" : undefined}
								/>
								{selectedToken && (
									<Box
										sx={{
											p: 2,
											bgcolor: "action.hover",
											borderRadius: 2,
											display: "flex",
											alignItems: "center",
											gap: 2,
										}}
									>
										{tokenLogoUrl ? (
											<Avatar src={tokenLogoUrl} sx={{ width: 40, height: 40 }} />
										) : (
											<Avatar sx={{ width: 40, height: 40, bgcolor: "primary.main" }}>
												{selectedToken.symbol.charAt(0)}
											</Avatar>
										)}
										<Box sx={{ flex: 1 }}>
											<Typography variant="subtitle1">
												{selectedToken.symbol} - {selectedToken.name}
											</Typography>
											{selectedToken.quote?.USD?.price && (
												<Typography color="text.secondary" variant="body2">
													Current price: {formatCurrency(selectedToken.quote.USD.price, "$", 2)}
												</Typography>
											)}
										</Box>
									</Box>
								)}
							</Stack>
						</CardContent>
					</Card>

					{/* Transaction Details Card */}
					<Card variant="outlined">
						<CardContent>
							<Stack spacing={3}>
								<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
									<Avatar
										sx={{
											bgcolor: "primary.main",
											color: "white",
										}}
									>
										<WalletIcon fontSize="var(--icon-fontSize-lg)" />
									</Avatar>
									<Box sx={{ flex: 1 }}>
										<Typography variant="h6">Transaction Details</Typography>
										<Typography color="text.secondary" variant="body2">
											Configure your transaction parameters
										</Typography>
									</Box>
								</Stack>

								<Grid container spacing={2}>
									<Grid size={{ xs: 12, sm: 6 }}>
										<FormControl fullWidth required error={fieldErrors.wallet}>
											<InputLabel>Wallet</InputLabel>
											<Select
												label="Wallet"
												onChange={(e) => {
													setSelectedPortfolioId(e.target.value);
													if (e.target.value && fieldErrors.wallet) {
														setFieldErrors((prev) => ({ ...prev, wallet: false }));
													}
												}}
												value={selectedPortfolioId}
											>
												{portfolios.map((portfolio) => (
													<MenuItem key={portfolio.id} value={portfolio.id}>
														{portfolio.name} {portfolio.isDefault && "(Default)"}
													</MenuItem>
												))}
											</Select>
											{fieldErrors.wallet && (
												<FormHelperText error>Ce champ est requis</FormHelperText>
											)}
										</FormControl>
									</Grid>
									<Grid size={{ xs: 12, sm: 6 }}>
										<FormControl fullWidth required>
											<InputLabel>Type</InputLabel>
											<Select
												label="Type"
												onChange={(e) => setTransactionType(e.target.value as "BUY" | "SELL")}
												value={transactionType}
											>
												<MenuItem value="BUY">
													<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
														<TrendUpIcon />
														<span>BUY</span>
													</Stack>
												</MenuItem>
												<MenuItem value="SELL">
													<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
														<TrendDownIcon />
														<span>SELL</span>
													</Stack>
												</MenuItem>
											</Select>
										</FormControl>
									</Grid>
								</Grid>

								<Divider />

								<Grid container spacing={2}>
									<Grid size={{ xs: 12, sm: 6 }}>
										<TextField
											error={fieldErrors.quantity}
											fullWidth
											helperText={fieldErrors.quantity ? "Ce champ est requis" : undefined}
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<CoinsIcon />
													</InputAdornment>
												),
											}}
											label="Quantity"
											onChange={(e) => {
												setQuantity(e.target.value);
												if (e.target.value && fieldErrors.quantity) {
													setFieldErrors((prev) => ({ ...prev, quantity: false }));
												}
											}}
											required
											type="number"
											inputProps={{ step: "0.00000001", min: 0 }}
											value={quantity}
										/>
									</Grid>
									<Grid size={{ xs: 12, sm: 6 }}>
										<TextField
											error={fieldErrors.amountInvested}
											fullWidth
											helperText={fieldErrors.amountInvested ? "Ce champ est requis" : undefined}
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<CurrencyDollarIcon />
													</InputAdornment>
												),
											}}
											label="Amount Invested (USD)"
											onChange={(e) => {
												setAmountInvested(e.target.value);
												if (e.target.value && fieldErrors.amountInvested) {
													setFieldErrors((prev) => ({ ...prev, amountInvested: false }));
												}
											}}
											required
											type="number"
											inputProps={{ step: "0.01", min: 0 }}
											value={amountInvested}
										/>
									</Grid>
								</Grid>

								<TextField
									fullWidth
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<CurrencyDollarIcon />
											</InputAdornment>
										),
									}}
									disabled
									helperText="Calculated automatically from quantity and amount invested"
									label="Average Price (USD)"
									value={averagePrice}
								/>

								<TextField
									error={fieldErrors.transactionDate}
									fullWidth
									helperText={fieldErrors.transactionDate ? "Ce champ est requis" : undefined}
									InputProps={{
										startAdornment: (
											<InputAdornment position="start">
												<CalendarIcon />
											</InputAdornment>
										),
									}}
									label="Transaction Date"
									onChange={(e) => {
										setTransactionDate(e.target.value);
										if (e.target.value && fieldErrors.transactionDate) {
											setFieldErrors((prev) => ({ ...prev, transactionDate: false }));
										}
									}}
									required
									type="date"
									value={transactionDate}
								/>

								<TextField
									fullWidth
									label="Notes (optional)"
									multiline
									onChange={(e) => setNotes(e.target.value)}
									placeholder="Add any additional notes about this transaction..."
									rows={3}
									value={notes}
								/>
							</Stack>
						</CardContent>
					</Card>

					{/* Summary Card */}
					{selectedToken && quantity && amountInvested && averagePrice && (
						<Card
							sx={{
								bgcolor:
									colorScheme === "dark"
										? transactionType === "BUY"
											? "rgba(76, 175, 80, 0.15)"
											: "rgba(244, 67, 54, 0.15)"
										: transactionType === "BUY"
											? "success.50"
											: "error.50",
								border: "1px solid",
								borderColor:
									colorScheme === "dark"
										? transactionType === "BUY"
											? "success.dark"
											: "error.dark"
										: transactionType === "BUY"
											? "success.200"
											: "error.200",
							}}
							variant="outlined"
						>
							<CardContent>
								<Stack spacing={2}>
									<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
										<Avatar
											sx={{
												bgcolor: transactionType === "BUY" ? "success.main" : "error.main",
												color: "white",
											}}
										>
											{transactionType === "BUY" ? (
												<TrendUpIcon fontSize="var(--icon-fontSize-lg)" />
											) : (
												<TrendDownIcon fontSize="var(--icon-fontSize-lg)" />
											)}
										</Avatar>
										<Typography variant="h6">Transaction Summary</Typography>
									</Stack>
									<Divider />
									<Grid container spacing={2}>
										<Grid size={{ xs: 6 }}>
											<Typography color="text.secondary" variant="caption">
												Token
											</Typography>
											<Typography variant="subtitle1">
												{selectedToken.symbol} - {selectedToken.name}
											</Typography>
										</Grid>
										<Grid size={{ xs: 6 }}>
											<Typography color="text.secondary" variant="caption">
												Type
											</Typography>
											<Chip
												color={transactionType === "BUY" ? "success" : "error"}
												icon={transactionType === "BUY" ? <TrendUpIcon /> : <TrendDownIcon />}
												label={transactionType}
												size="small"
											/>
										</Grid>
										<Grid size={{ xs: 4 }}>
											<Typography color="text.secondary" variant="caption">
												Quantity
											</Typography>
											<Typography variant="subtitle1">{quantity}</Typography>
										</Grid>
										<Grid size={{ xs: 4 }}>
											<Typography color="text.secondary" variant="caption">
												Amount Invested
											</Typography>
											<Typography variant="subtitle1">{formatCurrency(parseFloat(amountInvested), "$", 2)}</Typography>
										</Grid>
										<Grid size={{ xs: 4 }}>
											<Typography color="text.secondary" variant="caption">
												Average Price
											</Typography>
											<Typography variant="subtitle1">{formatCurrency(parseFloat(averagePrice), "$", 8)}</Typography>
										</Grid>
									</Grid>
								</Stack>
							</CardContent>
						</Card>
					)}
				</Stack>
			</DialogContent>
			<DialogActions sx={{ p: 3, pt: 0 }}>
				<Button
					onClick={onClose}
					size="large"
					sx={{
						color: "text.primary",
						"&:hover": {
							backgroundColor: "action.hover",
							color: "text.primary",
						},
					}}
				>
					Cancel
				</Button>
				<Button disabled={isSubmitting} onClick={handleSubmit} size="large" variant="contained">
					{isSubmitting ? "Processing..." : editingTransaction ? "Update Transaction" : "Create Transaction"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

