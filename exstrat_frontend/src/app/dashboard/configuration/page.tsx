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
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import * as configurationApi from "@/lib/configuration-api";
import { getForecasts } from "@/lib/portfolios-api";
import type { AlertConfiguration } from "@/types/configuration";
import { AddAlertModal } from "./add-alert-modal";
import { TokenAlertsList } from "./token-alerts-list";
import { useDebounce } from "@/hooks/use-debounce";

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
	const debouncedSearchQuery = useDebounce(searchQuery, 300);
	const [showAddModal, setShowAddModal] = React.useState(false);
	const [expandedAlertId, setExpandedAlertId] = React.useState<string | null>(null);
	const [page, setPage] = React.useState(0);
	const [rowsPerPage, setRowsPerPage] = React.useState(10);

	// OPTIMIZATION: Load forecasts and configs in parallel
	const [forecastNames, setForecastNames] = React.useState<Record<string, string>>({});
	const [forecasts, setForecasts] = React.useState<any[]>([]);

	// Load alert configurations and forecasts in parallel
	const loadAlertConfigurations = React.useCallback(async () => {
		try {
			setIsLoading(true);
			// OPTIMIZATION: Load configs and forecasts in parallel
			const [allConfigs, allForecasts] = await Promise.all([
				configurationApi.getAlertConfigurations(true), // Only active configs
				getForecasts().catch((error) => {
					console.error("Error loading forecasts:", error);
					return [];
				}),
			]);

			// Build forecast names map
			const namesMap: Record<string, string> = {};
			allForecasts.forEach((forecast) => {
				namesMap[forecast.id] = forecast.name;
			});

			setForecastNames(namesMap);
			setForecasts(allForecasts);
			setAlertConfigurations(allConfigs);
		} catch (error) {
			console.error("Error loading alert configurations:", error);
		} finally {
			setIsLoading(false);
		}
	}, []);

	// Load on mount
	React.useEffect(() => {
		loadAlertConfigurations();
	}, [loadAlertConfigurations]);

	// Filter configurations based on search query - MEMOIZED
	const filteredConfigurations = React.useMemo(() => {
		if (!debouncedSearchQuery.trim()) return alertConfigurations;
		const query = debouncedSearchQuery.toLowerCase();
		return alertConfigurations.filter((config) => {
			const forecastName = forecastNames[config.forecastId] || "";
			return forecastName.toLowerCase().includes(query);
		});
	}, [alertConfigurations, debouncedSearchQuery, forecastNames]);

	// Paginate configurations - MEMOIZED
	const paginatedConfigurations = React.useMemo(() => {
		const start = page * rowsPerPage;
		return filteredConfigurations.slice(start, start + rowsPerPage);
	}, [filteredConfigurations, page, rowsPerPage]);

	// Reset page when search changes
	React.useEffect(() => {
		setPage(0);
	}, [debouncedSearchQuery]);

	// Memoized handlers
	const handleDeleteAlert = React.useCallback(
		async (configId: string) => {
			if (window.confirm("Êtes-vous sûr de vouloir supprimer cette configuration d'alertes ?")) {
				try {
					await configurationApi.deleteAlertConfiguration(configId);
					await loadAlertConfigurations();
					// Remove from details cache
					setAlertConfigurationsDetails((prev) => {
						const newDetails = { ...prev };
						delete newDetails[configId];
						return newDetails;
					});
				} catch (error) {
					console.error("Error deleting alert configuration:", error);
				}
			}
		},
		[loadAlertConfigurations]
	);

	const handleToggleExpand = React.useCallback(
		async (configId: string) => {
			if (expandedAlertId === configId) {
				setExpandedAlertId(null);
			} else {
				setExpandedAlertId(configId);
				// OPTIMIZATION: Load full configuration details only if not already cached
				if (!alertConfigurationsDetails[configId]) {
					try {
						// OPTIMIZATION: Direct API call instead of loading all configs
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
		},
		[expandedAlertId, alertConfigurationsDetails]
	);

	const handleConfigurationUpdate = React.useCallback(
		async (config: AlertConfiguration) => {
			setAlertConfigurationsDetails((prev) => ({
				...prev,
				[config.id]: config,
			}));
			// Reload the list to update counts
			await loadAlertConfigurations();
		},
		[loadAlertConfigurations]
	);

	const handleNotificationChannelChange = React.useCallback(
		async (configId: string, channel: "email" | "push", checked: boolean) => {
			const configDetails = alertConfigurationsDetails[configId];
			if (!configDetails) return;

			try {
				const updated = await configurationApi.updateAlertConfiguration(configId, {
					notificationChannels: {
						...configDetails.notificationChannels,
						[channel]: checked,
					},
				});
				handleConfigurationUpdate(updated);
			} catch (error) {
				console.error("Error updating notification channels:", error);
			}
		},
		[alertConfigurationsDetails, handleConfigurationUpdate]
	);

	const handlePageChange = React.useCallback((_: unknown, newPage: number) => {
		setPage(newPage);
	}, []);

	const handleRowsPerPageChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		setRowsPerPage(parseInt(e.target.value, 10));
		setPage(0);
	}, []);

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
						<Typography variant="h4">Alertes de Prévision</Typography>
						<Typography color="text.secondary" variant="body1">
							Gérez vos alertes actives et configurez les notifications de prise de profit pour vos prévisions.
						</Typography>
					</Box>
					<Button startIcon={<PlusIcon />} variant="contained" onClick={() => setShowAddModal(true)}>
						Ajouter une alerte
					</Button>
				</Stack>

				{/* Search */}
				<Card>
					<CardContent>
						<Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
							<OutlinedInput
								fullWidth
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Rechercher des alertes par nom de prévision..."
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
										? "Aucune alerte trouvée correspondant à votre recherche."
										: "Aucune alerte active pour le moment. Créez votre première configuration d'alertes pour commencer."}
								</Typography>
								{!searchQuery && (
									<Button onClick={() => setShowAddModal(true)} startIcon={<PlusIcon />} variant="contained">
										Ajouter une alerte
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
											<TableCell sx={{ fontWeight: 600 }}>Prévision</TableCell>
											<TableCell align="right" sx={{ fontWeight: 600 }}>
												Tokens
											</TableCell>
											<TableCell align="right" sx={{ fontWeight: 600 }}>
												Alertes TP
											</TableCell>
											<TableCell sx={{ fontWeight: 600 }}>Canaux</TableCell>
											<TableCell align="right" sx={{ fontWeight: 600 }}>
												Créé le
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
																	color: isExpanded
																		? "var(--mui-palette-primary-main)"
																		: "var(--mui-palette-text-secondary)",
																	transition: "color 0.2s ease-in-out, transform 0.2s ease-in-out",
																	transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)",
																}}
															>
																<CaretDownIcon fontSize="var(--icon-fontSize-md)" />
															</IconButton>
														</TableCell>
														<TableCell>
															<Typography variant="subtitle2">
																{forecastNames[config.forecastId] || "Prévision inconnue"}
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
																{new Date(config.createdAt).toLocaleDateString("fr-FR", {
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
																	title="Supprimer l'alerte"
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
																					Configuration d'Alertes
																				</Typography>
																				<Typography color="text.secondary" variant="body2">
																					Gérez les alertes de tokens et les préférences de notification
																				</Typography>
																			</Box>
																			{/* Notification Channels Checkboxes */}
																			<Stack direction="row" spacing={2}>
																				<FormControlLabel
																					control={
																						<Checkbox
																							checked={configDetails.notificationChannels.email}
																							onChange={(e) =>
																								handleNotificationChannelChange(configDetails.id, "email", e.target.checked)
																							}
																						/>
																					}
																					label={<Typography variant="body2">Email</Typography>}
																					sx={{ m: 0 }}
																				/>
																				<FormControlLabel
																					control={
																						<Checkbox
																							checked={configDetails.notificationChannels.push}
																							onChange={(e) =>
																								handleNotificationChannelChange(configDetails.id, "push", e.target.checked)
																							}
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
																							Alertes de Tokens
																						</Typography>
																						<Typography color="text.secondary" variant="caption">
																							Configurez les alertes pour chaque token avec une stratégie associée
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
								onPageChange={handlePageChange}
								onRowsPerPageChange={handleRowsPerPageChange}
								page={page}
								rowsPerPage={rowsPerPage}
								rowsPerPageOptions={[5, 10, 25, 50]}
								labelRowsPerPage="Lignes par page :"
								labelDisplayedRows={({ from, to, count }) =>
									`${from}-${to} sur ${count !== -1 ? count : `plus de ${to}`}`
								}
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
