"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import CircularProgress from "@mui/material/CircularProgress";
import Grid from "@mui/material/Grid";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { ChartPieIcon } from "@phosphor-icons/react/dist/ssr/ChartPie";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { PlusIcon } from "@phosphor-icons/react/dist/ssr/Plus";
import { PencilIcon } from "@phosphor-icons/react/dist/ssr/Pencil";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr/Trash";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";


import { strategiesApi } from "@/lib/strategies-api";
import { formatCurrency, formatPercentage } from "@/lib/format";
import type { StrategyResponse, StrategyStatus } from "@/types/strategies";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { CreateStrategyModal } from "./create-strategy-modal";

export default function Page(): React.JSX.Element {
	return (
		<ProtectedRoute>
			<StrategiesPageContent />
		</ProtectedRoute>
	);
}

function StrategiesPageContent(): React.JSX.Element {
	const [strategies, setStrategies] = React.useState<StrategyResponse[]>([]);
	const [isLoading, setIsLoading] = React.useState(true);
	const [searchQuery, setSearchQuery] = React.useState("");
	const [statusFilter, setStatusFilter] = React.useState<StrategyStatus | "all">("paused");
	const [showCreateModal, setShowCreateModal] = React.useState(false);
	const [isSubmitting, setIsSubmitting] = React.useState(false);

	// Load strategies
	React.useEffect(() => {
		loadStrategies();
	}, []);

	const loadStrategies = async () => {
		try {
			setIsLoading(true);
			const response = await strategiesApi.getStrategies({});
			setStrategies(response.strategies || []);
		} catch (error) {
			console.error("Error loading strategies:", error);
		} finally {
			setIsLoading(false);
		}
	};

	// Filter strategies
	const filteredStrategies = React.useMemo(() => {
		let result = strategies;

		// Filter by search query
		if (searchQuery.trim()) {
			const query = searchQuery.toLowerCase();
			result = result.filter(
				(strategy) =>
					strategy.name.toLowerCase().includes(query) ||
					strategy.symbol.toLowerCase().includes(query) ||
					strategy.tokenName.toLowerCase().includes(query)
			);
		}

		// Filter by status
		if (statusFilter === "active") {
			result = result.filter((strategy) => strategy.status === "active");
		} else if (statusFilter === "paused") {
			// "Desactive" includes both paused and completed
			result = result.filter((strategy) => strategy.status === "paused" || strategy.status === "completed");
		}

		return result;
	}, [strategies, searchQuery, statusFilter]);

	// Status counts
	const statusCounts = React.useMemo(() => {
		const counts = {
			all: strategies.length,
			active: 0,
			desactive: 0,
		};

		strategies.forEach((strategy) => {
			if (strategy.status === "active") {
				counts.active++;
			} else {
				// paused and completed are both considered "desactive"
				counts.desactive++;
			}
		});

		return counts;
	}, [strategies]);

	const handleCreateStrategy = () => {
		setShowCreateModal(true);
	};

	const handleCloseCreateModal = () => {
		setShowCreateModal(false);
	};

	const handleEditStrategy = (strategy: StrategyResponse) => {
		// TODO: Open edit strategy modal
		console.log("Edit strategy", strategy);
	};

	const handleDeleteStrategy = async (strategyId: string) => {
		if (window.confirm("Are you sure you want to delete this strategy?")) {
			try {
				await strategiesApi.deleteStrategy(strategyId);
				await loadStrategies();
			} catch (error) {
				console.error("Error deleting strategy:", error);
			}
		}
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
						<Typography variant="h4">Strategies</Typography>
						<Typography color="text.secondary" variant="body1">
							Manage your automated profit-taking strategies
						</Typography>
					</Box>
					<Button onClick={handleCreateStrategy} startIcon={<PlusIcon />} variant="contained">
						Create Strategy
					</Button>
				</Stack>

				{/* Filters */}
				<Card>
					<CardContent>
						<Stack direction="row" spacing={2} sx={{ alignItems: "center", flexWrap: "wrap" }}>
							<OutlinedInput
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder="Search strategies..."
								size="small"
								startAdornment={
									<InputAdornment position="start">
										<MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
									</InputAdornment>
								}
								sx={{ flex: "1 1 auto", maxWidth: "400px" }}
								value={searchQuery}
							/>
							<Stack direction="row" spacing={1}>
								<Chip
									clickable
									color={statusFilter === "all" ? "primary" : "default"}
									label={`All (${statusCounts.all})`}
									onClick={() => setStatusFilter("all")}
									variant={statusFilter === "all" ? "filled" : "outlined"}
								/>
								<Chip
									clickable
									color={statusFilter === "active" ? "primary" : "default"}
									label={`Active (${statusCounts.active})`}
									onClick={() => setStatusFilter("active")}
									variant={statusFilter === "active" ? "filled" : "outlined"}
								/>
								<Chip
									clickable
									color={statusFilter === "paused" ? "primary" : "default"}
									label={`Desactive (${statusCounts.desactive})`}
									onClick={() => setStatusFilter("paused")}
									variant={statusFilter === "paused" ? "filled" : "outlined"}
								/>
							</Stack>
						</Stack>
					</CardContent>
				</Card>

				{/* Strategies Grid */}
				{filteredStrategies.length === 0 ? (
					<Card>
						<CardContent sx={{ py: 8, textAlign: "center" }}>
							<Stack spacing={2} sx={{ alignItems: "center" }}>
								<Box
									sx={{
										alignItems: "center",
										bgcolor: "var(--mui-palette-background-level1)",
										borderRadius: "50%",
										display: "flex",
										height: "64px",
										justifyContent: "center",
										width: "64px",
									}}
								>
									<ChartPieIcon fontSize="var(--icon-fontSize-xl)" />
								</Box>
								<Stack spacing={1}>
									<Typography variant="h6">
										{strategies.length === 0 ? "No strategies yet" : "No strategies found"}
									</Typography>
									<Typography color="text.secondary" variant="body2">
										{strategies.length === 0
											? "Create your first automated profit-taking strategy to get started."
											: "Try adjusting your search or filter criteria."}
									</Typography>
								</Stack>
								{strategies.length === 0 && (
									<Button onClick={handleCreateStrategy} startIcon={<PlusIcon />} variant="contained">
										Create Strategy
									</Button>
								)}
							</Stack>
						</CardContent>
					</Card>
				) : (
					<Grid container spacing={3}>
						{filteredStrategies.map((strategy) => (
							<Grid key={strategy.id} size={{ xs: 12, sm: 6, md: 4 }}>
								<StrategyCard
									strategy={strategy}
									onDelete={handleDeleteStrategy}
									onEdit={handleEditStrategy}
								/>
							</Grid>
						))}
					</Grid>
				)}
			</Stack>

			{/* Create Strategy Modal */}
			<CreateStrategyModal onClose={handleCloseCreateModal} onSuccess={loadStrategies} open={showCreateModal} />
		</Box>
	);
}

interface StrategyCardProps {
	strategy: StrategyResponse;
	onEdit?: (strategy: StrategyResponse) => void;
	onDelete?: (strategyId: string) => void;
}

function StrategyCard({ strategy, onEdit, onDelete }: StrategyCardProps): React.JSX.Element {
	const getStatusColor = (status: StrategyStatus): "success" | "warning" | "default" => {
		switch (status) {
			case "active":
				return "success";
			case "paused":
				return "warning";
			case "completed":
				return "default";
			default:
				return "default";
		}
	};

	const getStatusLabel = (status: StrategyStatus): string => {
		switch (status) {
			case "active":
				return "Active";
			case "paused":
				return "Paused";
			case "completed":
				return "Completed";
			default:
				return status;
		}
	};

	const totalSteps = strategy.steps?.length || 0;
	const completedSteps = strategy.steps?.filter((step) => step.state === "done").length || 0;
	const totalSellPercentage = strategy.steps?.reduce((sum, step) => sum + step.sellPercentage, 0) || 0;

	return (
		<Card
			sx={{
				display: "flex",
				flexDirection: "column",
				height: "100%",
				transition: "box-shadow 200ms cubic-bezier(0.4, 0, 0.2, 1) 0ms",
				"&:hover": { boxShadow: "var(--mui-shadows-16)" },
			}}
		>
			<CardContent sx={{ display: "flex", flex: "1 1 auto", flexDirection: "column", p: 3 }}>
				<Stack spacing={2} sx={{ flex: "1 1 auto" }}>
					{/* Header */}
					<Stack direction="row" spacing={2} sx={{ alignItems: "flex-start", justifyContent: "space-between" }}>
						<Stack spacing={0.5} sx={{ flex: "1 1 auto" }}>
							<Typography variant="h6">{strategy.name}</Typography>
							<Typography color="text.secondary" variant="body2">
								{strategy.symbol} - {strategy.tokenName}
							</Typography>
						</Stack>
						<Chip color={getStatusColor(strategy.status)} label={getStatusLabel(strategy.status)} size="small" />
					</Stack>

					{/* Stats */}
					<Stack spacing={1}>
						<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
							<Typography color="text.secondary" variant="body2">
								Base Quantity
							</Typography>
							<Typography variant="body2">{strategy.baseQuantity}</Typography>
						</Stack>
						<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
							<Typography color="text.secondary" variant="body2">
								Reference Price
							</Typography>
							<Typography variant="body2">{formatCurrency(strategy.referencePrice, "$", 2)}</Typography>
						</Stack>
						<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
							<Typography color="text.secondary" variant="body2">
								Steps
							</Typography>
							<Typography variant="body2">
								{completedSteps}/{totalSteps} completed
							</Typography>
						</Stack>
						<Stack direction="row" spacing={2} sx={{ justifyContent: "space-between" }}>
							<Typography color="text.secondary" variant="body2">
								Total Sell %
							</Typography>
							<Typography variant="body2">{formatPercentage(totalSellPercentage)}</Typography>
						</Stack>
					</Stack>
				</Stack>

				{/* Actions */}
				<Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end", mt: 2, pt: 2, borderTop: "1px solid var(--mui-palette-divider)" }}>
					<IconButton onClick={() => onEdit?.(strategy)} size="small">
						<PencilIcon fontSize="var(--icon-fontSize-sm)" />
					</IconButton>
					<IconButton color="error" onClick={() => onDelete?.(strategy.id)} size="small">
						<TrashIcon fontSize="var(--icon-fontSize-sm)" />
					</IconButton>
				</Stack>
			</CardContent>
		</Card>
	);
}
