"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import IconButton from "@mui/material/IconButton";
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
import { formatCurrency, formatPercentage } from "@/lib/format";
import { getForecasts, deleteForecast } from "@/lib/portfolios-api";
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

	const handleEditForecast = (forecast: ForecastResponse) => {
		// TODO: Implement edit functionality
		console.log("Edit forecast:", forecast);
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
						<CardContent sx={{ p: 0 }}>
							<Box sx={{ overflowX: "auto" }}>
								<Table>
									<TableHead>
										<TableRow>
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
										{paginatedForecasts.map((forecast) => (
											<TableRow key={forecast.id} hover>
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
													<Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
														<IconButton
															onClick={() => handleEditForecast(forecast)}
															size="small"
															title="Edit forecast"
														>
															<PencilIcon fontSize="var(--icon-fontSize-md)" />
														</IconButton>
														<IconButton
															color="error"
															onClick={() => handleDeleteForecast(forecast.id)}
															size="small"
															title="Delete forecast"
														>
															<TrashIcon fontSize="var(--icon-fontSize-md)" />
														</IconButton>
													</Stack>
												</TableCell>
											</TableRow>
										))}
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
		</Box>
	);
}
