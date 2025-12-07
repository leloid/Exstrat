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
import Collapse from "@mui/material/Collapse";
import Grid from "@mui/material/Grid";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { PencilIcon } from "@phosphor-icons/react/dist/ssr/Pencil";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import * as configurationApi from "@/lib/configuration-api";
import { getForecasts } from "@/lib/portfolios-api";
import type { AlertConfiguration } from "@/types/configuration";
import { AddAlertModal } from "./add-alert-modal";
import { TokenAlertsList } from "./token-alerts-list";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";

export default function Page(): React.JSX.Element {
	return (
		<ProtectedRoute>
			<ConfigurationPageContent />
		</ProtectedRoute>
	);
}

function ConfigurationPageContent(): React.JSX.Element {
	const [alertConfigurations, setAlertConfigurations] = React.useState<AlertConfiguration[]>([]);
	const [alertConfigurationsDetails, setAlertConfigurationsDetails] = React.useState<Record<string, AlertConfiguration>>({});
	const [isLoading, setIsLoading] = React.useState(true);
	const [searchQuery, setSearchQuery] = React.useState("");
	const [showAddModal, setShowAddModal] = React.useState(false);
	const [expandedAlertId, setExpandedAlertId] = React.useState<string | null>(null);
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

	// Load forecast names and data for display
	const [forecastNames, setForecastNames] = React.useState<Record<string, string>>({});
	const [forecasts, setForecasts] = React.useState<any[]>([]);
	React.useEffect(() => {
		const loadForecastData = async () => {
			try {
				const allForecasts = await getForecasts();
				const namesMap: Record<string, string> = {};
				allForecasts.forEach((forecast) => {
					namesMap[forecast.id] = forecast.name;
				});
				setForecastNames(namesMap);
				setForecasts(allForecasts);
			} catch (error) {
				console.error("Error loading forecast data:", error);
			}
		};
		if (alertConfigurations.length > 0) {
			loadForecastData();
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

	const handleToggleExpand = async (configId: string) => {
		if (expandedAlertId === configId) {
			setExpandedAlertId(null);
		} else {
			setExpandedAlertId(configId);
			// Load full configuration details if not already loaded
			if (!alertConfigurationsDetails[configId]) {
				try {
					const fullConfig = await configurationApi.getAlertConfigurationById(configId);
					setAlertConfigurationsDetails((prev) => ({
						...prev,
						[configId]: fullConfig,
					}));
				} catch (error) {
					console.error("Error loading alert configuration details:", error);
				}
			}
		}
	};

	const handleConfigurationUpdate = async (config: AlertConfiguration) => {
		setAlertConfigurationsDetails((prev) => ({
			...prev,
			[config.id]: config,
		}));
		// Reload the list to update counts
		await loadAlertConfigurations();
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
											<TableCell sx={{ width: "40px", fontWeight: 600 }} />
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
										{paginatedConfigurations.map((config) => {
											const isExpanded = expandedAlertId === config.id;
											const configDetails = alertConfigurationsDetails[config.id] || config;
											// Get portfolio ID from forecast
											const forecast = forecasts.find((f) => f.id === config.forecastId);
											const portfolioId = forecast?.portfolioId || "";

											return (
												<React.Fragment key={config.id}>
													<TableRow
														hover
														onClick={() => handleToggleExpand(config.id)}
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
																	handleToggleExpand(config.id);
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
																	onClick={(e) => {
																		e.stopPropagation();
																		handleDeleteAlert(config.id);
																	}}
																	color="error"
																	size="small"
																	title="Delete alert"
																>
																	<TrashIcon fontSize="var(--icon-fontSize-md)" />
																</IconButton>
															</Stack>
														</TableCell>
													</TableRow>
													<TableRow>
														<TableCell
															colSpan={7}
															sx={{
																py: 0,
																borderBottom: isExpanded ? "1px solid var(--mui-palette-divider)" : "none",
																bgcolor: isExpanded ? "var(--mui-palette-background-default)" : "transparent",
															}}
														>
															<Collapse
																in={isExpanded}
																timeout={{ enter: 300, exit: 200 }}
																unmountOnExit
															>
																<Box
																	sx={{
																		py: 3,
																		px: 3,
																		bgcolor: "var(--mui-palette-background-paper)",
																		borderTop: "1px solid var(--mui-palette-divider)",
																	}}
																>
																	<Stack spacing={3}>
																		{/* Header Section */}
																		<Box
																			sx={{
																				display: "flex",
																				alignItems: "center",
																				justifyContent: "space-between",
																				pb: 2,
																				borderBottom: "2px solid var(--mui-palette-divider)",
																			}}
																		>
																			<Box>
																				<Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
																					Alert Configuration
																				</Typography>
																				<Typography color="text.secondary" variant="body2">
																					Manage token alerts and notification preferences
																				</Typography>
																			</Box>
																			{/* Notification Channels Checkboxes */}
																			<Stack direction="row" spacing={2}>
																				<FormControlLabel
																					control={
																						<Checkbox
																							checked={configDetails.notificationChannels.email}
																							onChange={async (e) => {
																								try {
																									const updated = await configurationApi.updateAlertConfiguration(configDetails.id, {
																										notificationChannels: {
																											...configDetails.notificationChannels,
																											email: e.target.checked,
																										},
																									});
																									handleConfigurationUpdate(updated);
																								} catch (error) {
																									console.error("Error updating notification channels:", error);
																								}
																							}}
																						/>
																					}
																					label={<Typography variant="body2">Email</Typography>}
																					sx={{ m: 0 }}
																				/>
																				<FormControlLabel
																					control={
																						<Checkbox
																							checked={configDetails.notificationChannels.push}
																							onChange={async (e) => {
																								try {
																									const updated = await configurationApi.updateAlertConfiguration(configDetails.id, {
																										notificationChannels: {
																											...configDetails.notificationChannels,
																											push: e.target.checked,
																										},
																									});
																									handleConfigurationUpdate(updated);
																								} catch (error) {
																									console.error("Error updating notification channels:", error);
																								}
																							}}
																						/>
																					}
																					label={<Typography variant="body2">Push</Typography>}
																					sx={{ m: 0 }}
																				/>
																			</Stack>
																		</Box>

																		{/* Main Content - Token Alerts */}
																		{portfolioId && (
																			<Card
																				variant="outlined"
																				sx={{
																					boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
																				}}
																			>
																				<CardContent>
																					<Stack spacing={2}>
																						<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
																							Token Alerts
																						</Typography>
																						<Typography color="text.secondary" variant="caption">
																							Configure alerts for each token with an associated strategy
																						</Typography>
																						<Box sx={{ pt: 1 }}>
																							<TokenAlertsList
																								forecastId={config.forecastId}
																								portfolioId={portfolioId}
																								alertConfiguration={configDetails}
																								onConfigurationUpdate={handleConfigurationUpdate}
																							/>
																						</Box>
																					</Stack>
																				</CardContent>
																			</Card>
																		)}
																	</Stack>
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
			</Stack>
		</Box>
	);
}
