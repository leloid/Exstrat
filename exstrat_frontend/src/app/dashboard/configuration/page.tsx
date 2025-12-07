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
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import * as configurationApi from "@/lib/configuration-api";
import { getForecasts } from "@/lib/portfolios-api";
import type { AlertConfiguration } from "@/types/configuration";
import { AddAlertModal } from "./add-alert-modal";

export default function Page(): React.JSX.Element {
	return (
		<ProtectedRoute>
			<ConfigurationPageContent />
		</ProtectedRoute>
	);
}

function ConfigurationPageContent(): React.JSX.Element {
	const [alertConfigurations, setAlertConfigurations] = React.useState<AlertConfiguration[]>([]);
	const [isLoading, setIsLoading] = React.useState(true);
	const [searchQuery, setSearchQuery] = React.useState("");
	const [showAddModal, setShowAddModal] = React.useState(false);
	const [page, setPage] = React.useState(0);
	const [rowsPerPage, setRowsPerPage] = React.useState(10);

	// Load alert configurations
	React.useEffect(() => {
		loadAlertConfigurations();
	}, []);

	const loadAlertConfigurations = async () => {
		try {
			setIsLoading(true);
			const allConfigs = await configurationApi.getAlertConfigurations();
			// Only show active configurations
			const activeConfigs = allConfigs.filter((config) => config.isActive);
			setAlertConfigurations(activeConfigs);
		} catch (error) {
			console.error("Error loading alert configurations:", error);
		} finally {
			setIsLoading(false);
		}
	};

	// Filter configurations based on search query
	const filteredConfigurations = React.useMemo(() => {
		if (!searchQuery.trim()) return alertConfigurations;
		const query = searchQuery.toLowerCase();
		return alertConfigurations.filter((config) => {
			// Search by forecast name (we'll need to load forecasts to get names)
			return true; // For now, return all
		});
	}, [alertConfigurations, searchQuery]);

	// Paginate configurations
	const paginatedConfigurations = React.useMemo(() => {
		const start = page * rowsPerPage;
		return filteredConfigurations.slice(start, start + rowsPerPage);
	}, [filteredConfigurations, page, rowsPerPage]);

	// Load forecast names for display
	const [forecastNames, setForecastNames] = React.useState<Record<string, string>>({});
	React.useEffect(() => {
		const loadForecastNames = async () => {
			try {
				const forecasts = await getForecasts();
				const namesMap: Record<string, string> = {};
				forecasts.forEach((forecast) => {
					namesMap[forecast.id] = forecast.name;
				});
				setForecastNames(namesMap);
			} catch (error) {
				console.error("Error loading forecast names:", error);
			}
		};
		if (alertConfigurations.length > 0) {
			loadForecastNames();
		}
	}, [alertConfigurations]);

	const handleDeleteAlert = async (configId: string) => {
		if (window.confirm("Are you sure you want to delete this alert configuration?")) {
			try {
				await configurationApi.deleteAlertConfiguration(configId);
				await loadAlertConfigurations();
			} catch (error) {
				console.error("Error deleting alert configuration:", error);
			}
		}
	};

	const [selectedConfig, setSelectedConfig] = React.useState<AlertConfiguration | null>(null);
	const [showEditModal, setShowEditModal] = React.useState(false);

	const handleEditAlert = (config: AlertConfiguration) => {
		setSelectedConfig(config);
		setShowEditModal(true);
	};

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
						<Typography variant="h4">Forecast Alerts</Typography>
						<Typography color="text.secondary" variant="body1">
							Manage your active alerts and configure profit-taking notifications for your forecasts.
						</Typography>
					</Box>
					<Button startIcon={<PlusIcon />} variant="contained" onClick={() => setShowAddModal(true)}>
						Add Alert
					</Button>
				</Stack>

				{/* Search */}
				<Card>
					<CardContent>
						<Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
							<OutlinedInput
								fullWidth
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search alerts by forecast name..."
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

				{/* Alerts Table */}
				{filteredConfigurations.length === 0 ? (
					<Card>
						<CardContent>
							<Stack spacing={2} sx={{ alignItems: "center", py: 4 }}>
								<Typography color="text.secondary" variant="body1">
									{searchQuery
										? "No alerts found matching your search."
										: "No active alerts yet. Create your first alert configuration to get started."}
								</Typography>
								{!searchQuery && (
									<Button onClick={() => setShowAddModal(true)} startIcon={<PlusIcon />} variant="contained">
										Add Alert
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
											<TableCell sx={{ fontWeight: 600 }}>Forecast</TableCell>
											<TableCell align="right" sx={{ fontWeight: 600 }}>
												Tokens
											</TableCell>
											<TableCell align="right" sx={{ fontWeight: 600 }}>
												TP Alerts
											</TableCell>
											<TableCell sx={{ fontWeight: 600 }}>Channels</TableCell>
											<TableCell align="right" sx={{ fontWeight: 600 }}>
												Created
											</TableCell>
											<TableCell align="right" sx={{ fontWeight: 600 }}>
												Actions
											</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{paginatedConfigurations.map((config) => (
											<TableRow
												key={config.id}
												hover
												onClick={() => handleEditAlert(config)}
												sx={{ cursor: "pointer" }}
											>
												<TableCell>
													<Typography variant="subtitle2">
														{forecastNames[config.forecastId] || "Unknown Forecast"}
													</Typography>
												</TableCell>
												<TableCell align="right">
													<Typography variant="body2">{config.tokenAlerts?.length || 0}</Typography>
												</TableCell>
												<TableCell align="right">
													<Typography variant="body2">
														{config.tokenAlerts?.reduce((sum, ta) => sum + (ta.tpAlerts?.length || 0), 0) || 0}
													</Typography>
												</TableCell>
												<TableCell>
													<Stack direction="row" spacing={1}>
														{config.notificationChannels.email && (
															<Chip label="Email" size="small" color="primary" />
														)}
														{config.notificationChannels.push && (
															<Chip label="Push" size="small" color="secondary" />
														)}
													</Stack>
												</TableCell>
												<TableCell align="right">
													<Typography color="text.secondary" variant="body2">
														{new Date(config.createdAt).toLocaleDateString("en-US", {
															year: "numeric",
															month: "short",
															day: "numeric",
														})}
													</Typography>
												</TableCell>
												<TableCell align="right">
													<Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
														<IconButton
															onClick={() => handleEditAlert(config)}
															size="small"
															title="Edit alert"
														>
															<PencilIcon fontSize="var(--icon-fontSize-md)" />
														</IconButton>
														<IconButton
															color="error"
															onClick={() => handleDeleteAlert(config.id)}
															size="small"
															title="Delete alert"
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
								count={filteredConfigurations.length}
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

				{/* Add Alert Modal */}
				<AddAlertModal
					open={showAddModal}
					onClose={() => setShowAddModal(false)}
					onSuccess={() => {
						setShowAddModal(false);
						loadAlertConfigurations();
					}}
				/>

				{/* Edit Alert Modal - Reuse AddAlertModal with existing config */}
				{selectedConfig && (
					<AddAlertModal
						open={showEditModal}
						onClose={() => {
							setShowEditModal(false);
							setSelectedConfig(null);
						}}
						onSuccess={() => {
							setShowEditModal(false);
							setSelectedConfig(null);
							loadAlertConfigurations();
						}}
						existingConfig={selectedConfig}
					/>
				)}
			</Stack>
		</Box>
	);
}
