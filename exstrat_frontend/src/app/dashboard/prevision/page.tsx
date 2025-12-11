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
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Paper from "@mui/material/Paper";
import InputAdornment from "@mui/material/InputAdornment";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TablePagination from "@mui/material/TablePagination";
import Typography from "@mui/material/Typography";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { PencilIcon } from "@phosphor-icons/react/dist/ssr/Pencil";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import Collapse from "@mui/material/Collapse";
import Divider from "@mui/material/Divider";
import Checkbox from "@mui/material/Checkbox";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";
import { formatCurrency, formatPercentage } from "@/lib/format";
import { getForecasts, deleteForecast, getForecastById, getForecastDetails } from "@/lib/portfolios-api";
import type { ForecastResponse } from "@/types/portfolio";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CreateForecastModal } from "./create-forecast-modal";

export default function Page(): React.JSX.Element {
	return (
		<ProtectedRoute>
			<ForecastPageContent />
		</ProtectedRoute>
	);
}

function ForecastPageContent(): React.JSX.Element {
	const [forecasts, setForecasts] = React.useState<ForecastResponse[]>([]);
	const [isLoading, setIsLoading] = React.useState(true);
	const [searchQuery, setSearchQuery] = React.useState("");
	const [showCreateModal, setShowCreateModal] = React.useState(false);
	const [expandedForecastId, setExpandedForecastId] = React.useState<string | null>(null);
	const [expandedTokens, setExpandedTokens] = React.useState<Set<string>>(new Set());
	const [forecastDetails, setForecastDetails] = React.useState<Record<string, any>>({});
	const [selectedForecastIds, setSelectedForecastIds] = React.useState<Set<string>>(new Set());
	const [showDeleteMultipleForecastsModal, setShowDeleteMultipleForecastsModal] = React.useState(false);
	
	// Pagination states
	const [page, setPage] = React.useState(0);
	const [rowsPerPage, setRowsPerPage] = React.useState(10);

	// Load forecasts
	React.useEffect(() => {
		loadForecasts();
	}, []);

	const loadForecasts = async () => {
		try {
			setIsLoading(true);
			const data = await getForecasts();
			setForecasts(data || []);
		} catch (error) {
			console.error("Error loading forecasts:", error);
		} finally {
			setIsLoading(false);
		}
	};

	const handleCreateForecast = () => {
		setShowCreateModal(true);
	};

	const handleCloseCreateModal = () => {
		setShowCreateModal(false);
	};

	const handleDeleteForecast = async (forecastId: string) => {
		if (window.confirm("Are you sure you want to delete this forecast?")) {
			try {
				await deleteForecast(forecastId);
				await loadForecasts();
			} catch (error) {
				console.error("Error deleting forecast:", error);
			}
		}
	};

	const handleSelectForecast = (forecastId: string) => {
		setSelectedForecastIds((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(forecastId)) {
				newSet.delete(forecastId);
			} else {
				newSet.add(forecastId);
			}
			return newSet;
		});
	};

	const handleSelectAllForecasts = () => {
		if (selectedForecastIds.size === paginatedForecasts.length) {
			setSelectedForecastIds(new Set());
		} else {
			setSelectedForecastIds(new Set(paginatedForecasts.map((f) => f.id)));
		}
	};

	const confirmDeleteMultipleForecasts = async () => {
		if (selectedForecastIds.size === 0) return;
		try {
			// Delete all selected forecasts in parallel
			await Promise.all(Array.from(selectedForecastIds).map((id) => deleteForecast(id)));
			await loadForecasts();
			setShowDeleteMultipleForecastsModal(false);
			setSelectedForecastIds(new Set());
		} catch (error) {
			console.error("Error deleting forecasts:", error);
		}
	};

	// Reset selections when search query changes
	React.useEffect(() => {
		setSelectedForecastIds(new Set());
	}, [searchQuery]);

	const handleEditForecast = (forecast: ForecastResponse) => {
		// TODO: Implement edit functionality
		console.log("Edit forecast:", forecast);
	};

	const handleToggleExpand = async (forecastId: string) => {
		if (expandedForecastId === forecastId) {
			setExpandedForecastId(null);
			// Clear expanded tokens when closing forecast
			setExpandedTokens(new Set());
		} else {
			setExpandedForecastId(forecastId);
			// Load forecast details if not already loaded
			if (!forecastDetails[forecastId]) {
				await loadForecastDetails(forecastId);
			}
		}
	};

	const handleToggleTokenExpand = (tokenKey: string) => {
		setExpandedTokens((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(tokenKey)) {
				newSet.delete(tokenKey);
			} else {
				newSet.add(tokenKey);
			}
			return newSet;
		});
	};

	const loadForecastDetails = async (forecastId: string) => {
		try {
			// Utiliser le nouvel endpoint optimisé qui retourne tout en une seule requête
			const data = await getForecastDetails(forecastId);
			
			setForecastDetails((prev) => ({
				...prev,
				[forecastId]: data,
			}));
		} catch (error) {
			console.error("Error loading forecast details:", error);
		}
	};

	// Filter forecasts based on search query
	const filteredForecasts = React.useMemo(() => {
		if (!searchQuery.trim()) return forecasts;
		const query = searchQuery.toLowerCase();
		return forecasts.filter(
			(forecast) =>
				forecast.name.toLowerCase().includes(query) ||
				forecast.portfolioName?.toLowerCase().includes(query)
		);
	}, [forecasts, searchQuery]);

	// Paginate forecasts
	const paginatedForecasts = React.useMemo(() => {
		const start = page * rowsPerPage;
		return filteredForecasts.slice(start, start + rowsPerPage);
	}, [filteredForecasts, page, rowsPerPage]);

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
						<Typography variant="h4">Forecast</Typography>
						<Typography color="text.secondary" variant="body1">
							Create and manage forecasts by applying strategies to your wallets.
							<br />
							Select a wallet and assign strategies to each token to generate profit projections.
						</Typography>
					</Box>
					<Button onClick={handleCreateForecast} startIcon={<PlusIcon />} variant="contained">
						Create Forecast
					</Button>
				</Stack>

				{/* Search */}
				<Card>
					<CardContent>
						<Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
							<OutlinedInput
								fullWidth
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search forecasts by name or wallet..."
								startAdornment={
									<InputAdornment position="start">
										<MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
									</InputAdornment>
								}
								value={searchQuery}
								sx={{ maxWidth: { sm: "400px" } }}
							/>
						</Stack>
					</CardContent>
				</Card>

				{/* Forecasts Table */}
				{filteredForecasts.length === 0 ? (
					<Card>
						<CardContent>
							<Stack spacing={2} sx={{ alignItems: "center", py: 4 }}>
								<Typography color="text.secondary" variant="body1">
									{searchQuery ? "No forecasts found matching your search." : "No forecasts yet. Create your first forecast to get started."}
								</Typography>
								{!searchQuery && (
									<Button onClick={handleCreateForecast} startIcon={<PlusIcon />} variant="contained">
										Create Forecast
									</Button>
								)}
							</Stack>
						</CardContent>
					</Card>
				) : (
					<Card>
						{selectedForecastIds.size > 0 && (
							<Box sx={{ p: 2, borderBottom: "1px solid var(--mui-palette-divider)" }}>
								<Button
									color="error"
									onClick={() => setShowDeleteMultipleForecastsModal(true)}
									size="small"
									startIcon={<TrashIcon />}
									variant="outlined"
								>
									Delete ({selectedForecastIds.size})
								</Button>
							</Box>
						)}
						<CardContent sx={{ p: 0 }}>
							<Box sx={{ overflowX: "auto" }}>
								<Table>
									<TableHead>
										<TableRow>
											<TableCell padding="checkbox" sx={{ width: "40px", fontWeight: 600 }}>
												<Checkbox
													checked={paginatedForecasts.length > 0 && selectedForecastIds.size === paginatedForecasts.length}
													indeterminate={selectedForecastIds.size > 0 && selectedForecastIds.size < paginatedForecasts.length}
													onChange={handleSelectAllForecasts}
												/>
											</TableCell>
											<TableCell sx={{ width: "40px", fontWeight: 600 }} />
											<TableCell sx={{ fontWeight: 600 }}>Forecast Name</TableCell>
											<TableCell sx={{ fontWeight: 600 }}>Wallet</TableCell>
											<TableCell align="right" sx={{ fontWeight: 600 }}>Tokens</TableCell>
											<TableCell align="right" sx={{ fontWeight: 600 }}>Total Invested</TableCell>
											<TableCell align="right" sx={{ fontWeight: 600 }}>Total Collected</TableCell>
											<TableCell align="right" sx={{ fontWeight: 600 }}>Total Profit</TableCell>
											<TableCell align="right" sx={{ fontWeight: 600 }}>Return %</TableCell>
											<TableCell align="right" sx={{ fontWeight: 600 }}>Created</TableCell>
											<TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{paginatedForecasts.map((forecast) => {
											const isExpanded = expandedForecastId === forecast.id;
											const details = forecastDetails[forecast.id];
											return (
												<React.Fragment key={forecast.id}>
													<TableRow
														hover
														onClick={() => handleToggleExpand(forecast.id)}
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
														<TableCell padding="checkbox" onClick={(e) => e.stopPropagation()}>
															<Checkbox
																checked={selectedForecastIds.has(forecast.id)}
																onChange={() => handleSelectForecast(forecast.id)}
															/>
														</TableCell>
														<TableCell>
															<IconButton
																onClick={(e) => {
																	e.stopPropagation();
																	handleToggleExpand(forecast.id);
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
															<Typography variant="subtitle2">{forecast.name}</Typography>
														</TableCell>
														<TableCell>
															<Typography variant="body2">{forecast.portfolioName || "Unknown"}</Typography>
														</TableCell>
														<TableCell align="right">
															<Typography variant="body2">{forecast.summary.tokenCount}</Typography>
														</TableCell>
														<TableCell align="right">
															<Typography variant="body2">{formatCurrency(forecast.summary.totalInvested, "$", 2)}</Typography>
														</TableCell>
														<TableCell align="right">
															<Typography color="success.main" variant="body2">
																{formatCurrency(forecast.summary.totalCollected, "$", 2)}
															</Typography>
														</TableCell>
														<TableCell align="right">
															<Typography
																color={forecast.summary.totalProfit >= 0 ? "success.main" : "error.main"}
																variant="body2"
															>
																{formatCurrency(forecast.summary.totalProfit, "$", 2)}
															</Typography>
														</TableCell>
														<TableCell align="right">
															<Chip
																color={forecast.summary.returnPercentage >= 0 ? "success" : "error"}
																label={formatPercentage(forecast.summary.returnPercentage)}
																size="small"
															/>
														</TableCell>
														<TableCell align="right">
															<Typography color="text.secondary" variant="body2">
																{new Date(forecast.createdAt).toLocaleDateString("en-US", {
																	year: "numeric",
																	month: "short",
																	day: "numeric",
																})}
															</Typography>
														</TableCell>
														<TableCell align="right">
															<IconButton
																onClick={(e) => {
																	e.stopPropagation();
																	handleEditForecast(forecast);
																}}
																size="small"
																title="Edit forecast"
															>
																<PencilIcon fontSize="var(--icon-fontSize-md)" />
															</IconButton>
														</TableCell>
													</TableRow>
													<TableRow>
														<TableCell colSpan={11} sx={{ py: 0, borderBottom: isExpanded ? "1px solid var(--mui-palette-divider)" : "none" }}>
															<Collapse in={isExpanded} timeout="auto" unmountOnExit>
																{details ? (
																	<Box sx={{ py: 3 }}>
																		<Typography variant="h6" sx={{ mb: 2 }}>
																			Profit-taking strategies by token
																		</Typography>
																		<Table size="small" sx={{ mt: 2 }}>
																			<TableHead>
																				<TableRow>
																					<TableCell sx={{ width: "40px", fontWeight: 600 }} />
																					<TableCell sx={{ fontWeight: 600 }}>Token</TableCell>
																					<TableCell sx={{ fontWeight: 600 }}>Strategy</TableCell>
																					<TableCell align="right" sx={{ fontWeight: 600 }}>Quantity</TableCell>
																					<TableCell align="right" sx={{ fontWeight: 600 }}>Invested</TableCell>
																				</TableRow>
																			</TableHead>
																			<TableBody>
																				{details.holdings
																					.filter((holding: any) => holding.strategy)
																					.map((holding: any) => {
																						const strategy = holding.strategy;
																						const quantity = holding.quantity || 0;
																						const averagePrice = holding.averagePrice || 0;
																						const tokenKey = `${forecast.id}-${holding.id}`;
																						const isTokenExpanded = expandedTokens.has(tokenKey);
																						return (
																							<React.Fragment key={holding.id}>
																								<TableRow
																									hover
																									onClick={() => handleToggleTokenExpand(tokenKey)}
																									sx={{
																										cursor: "pointer",
																										transition: "background-color 0.2s ease-in-out",
																										...(isTokenExpanded && {
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
																												handleToggleTokenExpand(tokenKey);
																											}}
																											size="small"
																											sx={{
																												padding: "4px",
																												color: isTokenExpanded ? "var(--mui-palette-primary-main)" : "var(--mui-palette-text-secondary)",
																												transition: "color 0.2s ease-in-out, transform 0.2s ease-in-out",
																												transform: isTokenExpanded ? "rotate(0deg)" : "rotate(-90deg)",
																											}}
																										>
																											<CaretDownIcon fontSize="var(--icon-fontSize-sm)" />
																										</IconButton>
																									</TableCell>
																									<TableCell>
																										<Typography variant="subtitle2">
																											{holding.token?.symbol || holding.symbol || "Unknown"}
																										</Typography>
																									</TableCell>
																									<TableCell>
																										<Typography variant="body2">{strategy.name}</Typography>
																									</TableCell>
																									<TableCell align="right">
																										<Typography variant="body2">
																											{quantity.toLocaleString(undefined, {
																												maximumFractionDigits: 8,
																											})}
																										</Typography>
																									</TableCell>
																									<TableCell align="right">
																										<Typography variant="body2">
																											{formatCurrency(quantity * averagePrice, "$", 2)}
																										</Typography>
																									</TableCell>
																								</TableRow>
																								<TableRow>
																									<TableCell colSpan={5} sx={{ py: 0, borderBottom: isTokenExpanded ? "1px solid var(--mui-palette-divider)" : "none" }}>
																										<Collapse in={isTokenExpanded} timeout="auto" unmountOnExit>
																											<Box sx={{ py: 2, pl: 4 }}>
																												<Card variant="outlined" sx={{ bgcolor: "var(--mui-palette-background-level1)" }}>
																													<CardContent>
																														<Stack spacing={2}>
																															<Typography variant="subtitle2">
																																Profit takings for strategy {strategy.name} on {holding.token?.symbol || holding.symbol}
																															</Typography>
																															<List dense>
																																{strategy.profitTargets.map((target) => {
																																	const targetPrice =
																																		target.targetType === "percentage"
																																			? averagePrice * (1 + target.targetValue / 100)
																																			: target.targetValue;
																																	return (
																																		<ListItem key={target.order} sx={{ py: 0.5 }}>
																																			<Checkbox checked size="small" sx={{ p: 0, mr: 1 }} />
																																			<ListItemText
																																				primary={
																																					<Typography variant="body2">
																																						TP {target.order}: {holding.token?.symbol || holding.symbol} = {formatCurrency(targetPrice, "$", 2)} Sell {target.sellPercentage.toFixed(1)}%
																																					</Typography>
																																				}
																																			/>
																																		</ListItem>
																																	);
																																})}
																															</List>
																														</Stack>
																													</CardContent>
																												</Card>
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
																) : (
																	<Box sx={{ py: 3, textAlign: "center" }}>
																		<CircularProgress size={24} />
																	</Box>
																)}
															</Collapse>
														</TableCell>
													</TableRow>
												</React.Fragment>
											);
										})}
									</TableBody>
								</Table>
							</Box>
							<TablePagination
								component="div"
								count={filteredForecasts.length}
								onPageChange={(_, newPage) => setPage(newPage)}
								onRowsPerPageChange={(e) => {
									setRowsPerPage(parseInt(e.target.value, 10));
									setPage(0);
								}}
								page={page}
								rowsPerPage={rowsPerPage}
								rowsPerPageOptions={[5, 10, 25, 50]}
							/>
						</CardContent>
					</Card>
				)}
			</Stack>

			{/* Create Forecast Modal */}
			<CreateForecastModal onClose={handleCloseCreateModal} onSuccess={loadForecasts} open={showCreateModal} />

			{/* Delete Multiple Forecasts Confirmation Modal */}
			<Dialog
				fullWidth
				maxWidth="sm"
				onClose={() => {
					setShowDeleteMultipleForecastsModal(false);
				}}
				open={showDeleteMultipleForecastsModal}
			>
				<DialogContent>
					<Paper sx={{ border: "1px solid var(--mui-palette-divider)", boxShadow: "var(--mui-shadows-16)", p: 0 }}>
						<Stack direction="row" spacing={2} sx={{ display: "flex", p: 3 }}>
							<Avatar sx={{ bgcolor: "var(--mui-palette-error-50)", color: "var(--mui-palette-error-main)" }}>
								<WarningIcon fontSize="var(--icon-fontSize-lg)" />
							</Avatar>
							<Stack spacing={3} sx={{ flex: 1 }}>
								<Stack spacing={1}>
									<Typography variant="h5">Delete Forecasts</Typography>
									<Typography color="text.secondary" variant="body2">
										Are you sure you want to delete {selectedForecastIds.size} selected forecast{selectedForecastIds.size > 1 ? "s" : ""}? This action cannot be undone and will permanently remove all associated data.
									</Typography>
								</Stack>
								<Stack direction="row" spacing={2} sx={{ justifyContent: "flex-end" }}>
									<Button
										color="secondary"
										onClick={() => {
											setShowDeleteMultipleForecastsModal(false);
										}}
									>
										Cancel
									</Button>
									<Button color="error" onClick={confirmDeleteMultipleForecasts} variant="contained">
										Delete {selectedForecastIds.size} Forecast{selectedForecastIds.size > 1 ? "s" : ""}
									</Button>
								</Stack>
							</Stack>
						</Stack>
					</Paper>
				</DialogContent>
			</Dialog>
		</Box>
	);
}
