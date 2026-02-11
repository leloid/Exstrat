"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
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
import Step from "@mui/material/Step";
import StepContent from "@mui/material/StepContent";
import type { StepIconProps } from "@mui/material/StepIcon";
import StepLabel from "@mui/material/StepLabel";
import Stepper from "@mui/material/Stepper";
import LinearProgress from "@mui/material/LinearProgress";

import { TokenSearch } from "@/components/transactions/token-search";
import { transactionsApi } from "@/lib/transactions-api";
import { formatCurrency } from "@/lib/format";
import { getTokenLogoUrl } from "@/lib/utils";
import type { TokenSearchResult, CreateTransactionDto } from "@/types/transactions";
import type { Portfolio } from "@/types/portfolio";
import { useColorScheme } from "@mui/material/styles";
import { toast } from "@/components/core/toaster";

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
	const [activeStep, setActiveStep] = React.useState(0);

	function StepIcon({ active, completed, icon }: StepIconProps & { icon: number }): React.JSX.Element {
		const highlight = active || completed;

		return (
			<Avatar
				sx={{
					...(highlight && {
						bgcolor: "var(--mui-palette-primary-main)",
						color: "var(--mui-palette-primary-contrastText)",
					}),
					variant: "rounded",
				}}
			>
				{completed ? <CheckIcon /> : icon}
			</Avatar>
		);
	}

	const steps = [
		{
			label: "Select Token",
			description: "Choose the cryptocurrency for this transaction",
		},
		{
			label: "Transaction Details",
			description: "Configure your transaction parameters",
		},
		{
			label: "Review & Confirm",
			description: "Review your transaction before submitting",
		},
	];

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
				toast.success("Transaction updated successfully");
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
				toast.success("Transaction created successfully");
			}

			onSuccess();
			onClose();
		} catch (error_: unknown) {
			const axiosError = error_ as { response?: { data?: { message?: string } }; message?: string };
			const errorMessage =
				axiosError.response?.data?.message || axiosError.message || "An error occurred while saving the transaction";
			setError(errorMessage);
			toast.error("Failed to save transaction. Please try again.");
		} finally {
			setIsSubmitting(false);
		}
	};

	const tokenLogoUrl = selectedToken ? getTokenLogoUrl(selectedToken.symbol, selectedToken.id) : null;

	return (
		<Dialog fullWidth maxWidth="md" onClose={onClose} open={open}>
			<DialogTitle sx={{ pb: 2, pt: 3, px: 3 }}>
				<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
					<Box>
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
			<DialogContent sx={{ px: 3, py: 2 }}>
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

					{/* Stepper */}
					<Stepper activeStep={activeStep} orientation="vertical">
						{steps.map((step, index) => (
							<Step key={step.label}>
								<StepLabel
									StepIconComponent={(props) => <StepIcon {...props} icon={index + 1} />}
									optional={<Typography variant="caption">{step.description}</Typography>}
									onClick={() => {
										// Allow clicking on completed or current step to navigate
										if (index <= activeStep) {
											setActiveStep(index);
										}
									}}
									sx={{
										cursor: index <= activeStep ? "pointer" : "default",
										"&:hover": index <= activeStep ? {
											opacity: 0.7,
										} : {},
									}}
								>
									{step.label}
								</StepLabel>
								<StepContent>
									<Box sx={{ mt: 2 }}>
										{index === 0 && (
											<Card variant="outlined" sx={{ mb: 3 }}>
												<CardContent>
													<Stack spacing={3}>
														<TokenSearch
															onTokenSelect={(token) => {
																setSelectedToken(token);
																if (token && fieldErrors.token) {
																	setFieldErrors((prev) => ({ ...prev, token: false }));
																}
																if (token) {
																	setActiveStep(1);
																}
															}}
															selectedToken={selectedToken}
															error={fieldErrors.token}
															helperText={fieldErrors.token ? "Ce champ est requis" : undefined}
														/>
														{selectedToken && (
															<>
																<Box
																	onClick={() => setActiveStep(1)}
																	sx={{
																		p: 2.5,
																		bgcolor: "action.hover",
																		borderRadius: 2,
																		display: "flex",
																		alignItems: "center",
																		gap: 2,
																		border: "1px solid",
																		borderColor: "divider",
																		cursor: "pointer",
																		transition: "all 0.2s",
																		"&:hover": {
																			bgcolor: "action.selected",
																			borderColor: "primary.main",
																			transform: "translateY(-2px)",
																			boxShadow: 2,
																		},
																	}}
																>
																	{tokenLogoUrl ? (
																		<Avatar src={tokenLogoUrl} sx={{ width: 48, height: 48 }} />
																	) : (
																		<Avatar sx={{ width: 48, height: 48, bgcolor: "primary.main" }}>
																			{selectedToken.symbol.charAt(0)}
																		</Avatar>
																	)}
																	<Box sx={{ flex: 1 }}>
																		<Typography variant="subtitle1" fontWeight={600}>
																			{selectedToken.symbol} - {selectedToken.name}
																		</Typography>
																		{selectedToken.quote?.USD?.price && (
																			<Typography color="text.secondary" variant="body2" sx={{ mt: 0.5 }}>
																				Current price: {formatCurrency(selectedToken.quote.USD.price, "$", 2)}
																			</Typography>
																		)}
																	</Box>
																	<Chip
																		icon={<CheckIcon />}
																		label="Selected"
																		color="success"
																		size="small"
																	/>
																</Box>
																<Button
																	variant="contained"
																	fullWidth
																	size="large"
																	onClick={() => setActiveStep(1)}
																	endIcon={<CheckIcon />}
																	sx={{ mt: 2 }}
																>
																	Continue with {selectedToken.symbol}
																</Button>
															</>
														)}
													</Stack>
												</CardContent>
											</Card>
										)}

										{index === 1 && (
											<Card variant="outlined" sx={{ mb: 3 }}>
												<CardContent>
													<Stack spacing={3}>

														<Grid container spacing={2.5}>
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
																				<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
																					<WalletIcon size={18} />
																					<span>{portfolio.name}</span>
																					{portfolio.isDefault && (
																						<Chip label="Default" size="small" color="primary" sx={{ ml: 1, height: 20 }} />
																					)}
																				</Stack>
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
																	<InputLabel>Transaction Type</InputLabel>
																	<Select
																		label="Transaction Type"
																		onChange={(e) => setTransactionType(e.target.value as "BUY" | "SELL")}
																		value={transactionType}
																	>
																		<MenuItem value="BUY">BUY</MenuItem>
																		<MenuItem value="SELL">SELL</MenuItem>
																	</Select>
																</FormControl>
															</Grid>
														</Grid>

														<Divider />

														<Grid container spacing={2.5}>
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

														{selectedToken && quantity && amountInvested && averagePrice && (
															<Button
																variant="contained"
																fullWidth
																size="large"
																onClick={() => setActiveStep(2)}
																endIcon={<CheckIcon />}
															>
																Continue to Review
															</Button>
														)}
													</Stack>
												</CardContent>
											</Card>
										)}

										{index === 2 && (
											<Card
												variant="outlined"
												sx={{
													bgcolor: colorScheme === "dark" ? "rgba(255, 255, 255, 0.05)" : "background.paper",
													border: "1px solid",
													borderColor: "divider",
												}}
											>
												<CardContent>
													<Stack spacing={3}>
														{/* Header */}
														<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
															<Avatar
																sx={{
																	bgcolor: "primary.main",
																	color: "primary.contrastText",
																	width: 48,
																	height: 48,
																}}
															>
																<CheckIcon fontSize="var(--icon-fontSize-lg)" />
															</Avatar>
															<Box sx={{ flex: 1 }}>
																<Typography variant="h6" fontWeight={600}>
																	Transaction Summary
																</Typography>
																<Typography color="text.secondary" variant="body2">
																	Review your transaction details before confirming
																</Typography>
															</Box>
														</Stack>

														{selectedToken && (
															<>
																{/* Token & Transaction Info Section */}
																<Box
																	sx={{
																		p: 2.5,
																		bgcolor: "action.hover",
																		borderRadius: 2,
																		border: "1px solid",
																		borderColor: "divider",
																	}}
																>
																	<Stack spacing={2.5}>
																		{/* Token Info */}
																		<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
																		{tokenLogoUrl ? (
																				<Avatar src={tokenLogoUrl} sx={{ width: 48, height: 48 }} />
																		) : (
																				<Avatar sx={{ width: 48, height: 48, bgcolor: "primary.main" }}>
																				{selectedToken.symbol.charAt(0)}
																			</Avatar>
																		)}
																			<Box sx={{ flex: 1 }}>
																				<Typography variant="h6" fontWeight={600}>
																				{selectedToken.symbol}
																			</Typography>
																			<Typography color="text.secondary" variant="body2">
																				{selectedToken.name}
																			</Typography>
																		</Box>
																	<Chip
																		label={transactionType}
																		size="medium"
																		sx={{ 
																			fontWeight: 600,
																					bgcolor: transactionType === "BUY" ? "success.light" : "error.light",
																					color: transactionType === "BUY" ? "success.dark" : "error.dark",
																		}}
																	/>
																		</Stack>

																		<Divider />

																		{/* Wallet Info */}
																		<Stack direction="row" spacing={1.5} sx={{ alignItems: "center" }}>
																			<WalletIcon size={24} color="var(--mui-palette-primary-main)" />
																			<Box>
																				<Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, display: "block" }}>
																					Wallet
																				</Typography>
																				<Typography variant="subtitle1" fontWeight={600}>
																					{portfolios.find((p) => p.id === selectedPortfolioId)?.name || "N/A"}
																				</Typography>
																			</Box>
																		</Stack>
																	</Stack>
																</Box>

																{/* Financial Details Section */}
																<Box
																	sx={{
																		p: 2.5,
																		bgcolor: "background.paper",
																		borderRadius: 2,
																		border: "1px solid",
																		borderColor: "divider",
																	}}
																>
																	<Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2, color: "text.secondary" }}>
																		Financial Details
																	</Typography>
																	<Grid container spacing={3}>
																		<Grid size={{ xs: 12, sm: 4 }}>
																			<Box
																				sx={{
																					p: 1.5,
																					bgcolor: "action.hover",
																					borderRadius: 1.5,
																					textAlign: "center",
																				}}
																			>
																				<Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>
																					Quantity
																				</Typography>
																				<Typography variant="h6" fontWeight={700}>
																		{quantity}
																	</Typography>
																			</Box>
																</Grid>
																<Grid size={{ xs: 12, sm: 4 }}>
																			<Box
																				sx={{
																					p: 1.5,
																					bgcolor: "action.hover",
																					borderRadius: 1.5,
																					textAlign: "center",
																				}}
																			>
																				<Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>
																		Amount Invested
																	</Typography>
																				<Typography variant="h6" fontWeight={700} color="primary.main">
																		{formatCurrency(parseFloat(amountInvested), "$", 2)}
																	</Typography>
																			</Box>
																</Grid>
																<Grid size={{ xs: 12, sm: 4 }}>
																			<Box
																				sx={{
																					p: 1.5,
																					bgcolor: "action.hover",
																					borderRadius: 1.5,
																					textAlign: "center",
																				}}
																			>
																				<Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>
																		Average Price
																	</Typography>
																				<Typography variant="h6" fontWeight={700}>
																		{formatCurrency(parseFloat(averagePrice), "$", 8)}
																	</Typography>
																			</Box>
																		</Grid>
																</Grid>
																</Box>

																{/* Notes Section */}
																{notes && (
																	<Box
																		sx={{
																			p: 2,
																			bgcolor: "action.hover",
																			borderRadius: 2,
																			border: "1px solid",
																			borderColor: "divider",
																		}}
																	>
																		<Typography color="text.secondary" variant="caption" sx={{ fontWeight: 600, display: "block", mb: 1 }}>
																			Notes
																		</Typography>
																		<Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
																			{notes}
																		</Typography>
																	</Box>
																)}
															</>
														)}
													</Stack>
												</CardContent>
											</Card>
										)}
									</Box>
								</StepContent>
							</Step>
						))}
					</Stepper>

				</Stack>
			</DialogContent>
			<DialogActions sx={{ p: 3, pt: 0 }}>
				<Stack direction="row" spacing={2} sx={{ width: "100%", justifyContent: "space-between" }}>
					<Button
						onClick={() => {
							if (activeStep > 0) {
								setActiveStep(activeStep - 1);
							} else {
								onClose();
							}
						}}
						size="large"
						sx={{
							color: "text.primary",
							"&:hover": {
								backgroundColor: "action.hover",
								color: "text.primary",
							},
						}}
					>
						{activeStep > 0 ? "Back" : "Cancel"}
					</Button>
					<Stack direction="row" spacing={2}>
						{activeStep < steps.length - 1 ? (
							<Button
								disabled={!selectedToken || activeStep === 0}
								onClick={() => setActiveStep(activeStep + 1)}
								size="large"
								variant="outlined"
							>
								Next
							</Button>
						) : (
							<Button disabled={isSubmitting} onClick={handleSubmit} size="large" variant="contained">
								{isSubmitting ? (
									<>
										<CircularProgress size={20} sx={{ mr: 1 }} />
										Processing...
									</>
								) : editingTransaction ? (
									"Update Transaction"
								) : (
									"Create Transaction"
								)}
							</Button>
						)}
					</Stack>
				</Stack>
			</DialogActions>
		</Dialog>
	);
}

