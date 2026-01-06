"use client";

import * as React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardActionArea from "@mui/material/CardActionArea";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Link from "@mui/material/Link";
import Image from "next/image";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { FileCsvIcon } from "@phosphor-icons/react/dist/ssr/FileCsv";
import { PlugsConnectedIcon } from "@phosphor-icons/react/dist/ssr/PlugsConnected";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";

export type ExchangeType = "coinbase" | "crypto.com" | "exstrat";

interface SelectExchangeModalProps {
	open: boolean;
	onClose: () => void;
	onSelectExchange: (exchange: ExchangeType, method: "api" | "csv") => void;
}

export function SelectExchangeModal({
	open,
	onClose,
	onSelectExchange,
}: SelectExchangeModalProps): React.JSX.Element {
	const [selectedExchange, setSelectedExchange] = React.useState<ExchangeType | null>(null);
	const [searchQuery, setSearchQuery] = React.useState("");

	const allExchanges: Array<{ id: ExchangeType | "binance"; name: string; logo: string; color: string; available: boolean }> = [
		{ id: "coinbase", name: "Coinbase", logo: "/CoinbaseLogo.jpeg", color: "#0052FF", available: true },
		{ id: "crypto.com", name: "Crypto.com", logo: "/Cryptocomlogo.jpeg", color: "#103F68", available: true },
		{ id: "binance", name: "Binance", logo: "/binance.jpeg", color: "#F0B90B", available: false },
	];

	// Filter exchanges based on search query
	const exchanges = React.useMemo(() => {
		if (!searchQuery.trim()) {
			return allExchanges;
		}
		const query = searchQuery.toLowerCase();
		return allExchanges.filter((exchange) => exchange.name.toLowerCase().includes(query));
	}, [searchQuery]);

	const handleExchangeClick = (exchange: ExchangeType) => {
		setSelectedExchange(exchange);
	};

	const handleBack = () => {
		setSelectedExchange(null);
	};

	const handleMethodSelect = (method: "api" | "csv") => {
		if (selectedExchange) {
			onSelectExchange(selectedExchange, method);
			setSelectedExchange(null);
		}
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>
				<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
					<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
						{selectedExchange && (
							<IconButton onClick={handleBack} size="small" sx={{ mr: 1 }}>
								<ArrowRightIcon style={{ transform: "rotate(180deg)" }} />
							</IconButton>
						)}
						<Typography variant="h6" fontWeight={600}>
							{selectedExchange ? exchanges.find((e) => e.id === selectedExchange)?.name : "Add my exchange"}
						</Typography>
					</Stack>
					<IconButton onClick={onClose} size="small">
						<XIcon />
					</IconButton>
				</Stack>
			</DialogTitle>
			<DialogContent>
				{!selectedExchange ? (
					// Step 1: Select Exchange
					<Stack spacing={3} sx={{ mt: 1 }}>
						{/* Search Bar */}
						<TextField
							fullWidth
							placeholder="Search your platform on"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							variant="outlined"
							size="medium"
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<MagnifyingGlassIcon size={20} color="var(--mui-palette-text-secondary)" />
									</InputAdornment>
								),
								endAdornment: (
									<InputAdornment position="end">
										{searchQuery ? (
											<IconButton
												size="small"
												onClick={() => setSearchQuery("")}
												sx={{ p: 0.5 }}
											>
												<XIcon size={16} />
											</IconButton>
										) : (
											<Link
												href="#"
												onClick={(e) => {
													e.preventDefault();
													// TODO: Ouvrir modal avec liste complète des intégrations
												}}
												sx={{
													color: "var(--mui-palette-primary-main)",
													textDecoration: "none",
													fontSize: "0.875rem",
													fontWeight: 500,
													"&:hover": {
														textDecoration: "underline",
													},
												}}
											>
												+700 integrations
											</Link>
										)}
									</InputAdornment>
								),
							}}
							sx={{
								"& .MuiOutlinedInput-root": {
									borderRadius: 3,
									backgroundColor: "var(--mui-palette-background-paper)",
									"&:hover": {
										"& .MuiOutlinedInput-notchedOutline": {
											borderColor: "var(--mui-palette-primary-main)",
										},
									},
									"&.Mui-focused": {
										"& .MuiOutlinedInput-notchedOutline": {
											borderColor: "var(--mui-palette-primary-main)",
											borderWidth: 2,
										},
									},
								},
							}}
						/>
						{exchanges.length > 0 ? (
							exchanges.map((exchange) => (
							<Card
								key={exchange.id}
								variant="outlined"
								sx={{
									cursor: exchange.available ? "pointer" : "not-allowed",
									transition: "all 0.2s",
									borderRadius: 3,
									opacity: exchange.available ? 1 : 0.6,
									position: "relative",
									"&:hover": exchange.available ? {
										boxShadow: 6,
										transform: "translateY(-2px)",
										borderColor: "var(--mui-palette-primary-main)",
									} : {
										boxShadow: 2,
									},
								}}
							>
								<CardActionArea 
									onClick={() => exchange.available && handleExchangeClick(exchange.id as ExchangeType)} 
									disabled={!exchange.available}
								>
									<CardContent sx={{ py: 2.5, px: 3 }}>
										<Stack direction="row" spacing={2.5} sx={{ alignItems: "center" }}>
											<Box
												sx={{
													width: 56,
													height: 56,
													borderRadius: 2,
													overflow: "hidden",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													bgcolor: "var(--mui-palette-background-paper)",
													border: "1px solid var(--mui-palette-divider)",
												}}
											>
												<Image
													src={exchange.logo}
													alt={exchange.name}
													width={48}
													height={48}
													style={{
														objectFit: "contain",
														borderRadius: "8px",
													}}
												/>
											</Box>
											<Box sx={{ flex: 1 }}>
												<Typography variant="h6" fontWeight={600}>
													{exchange.name}
												</Typography>
											</Box>
											{exchange.available && (
												<ArrowRightIcon size={24} color="var(--mui-palette-text-secondary)" />
											)}
										</Stack>
									</CardContent>
								</CardActionArea>
								{!exchange.available && (
									<Box
										sx={{
											position: "absolute",
											top: 8,
											right: 8,
											bgcolor: "warning.main",
											color: "white",
											px: 1,
											py: 0.5,
											borderRadius: 1,
											fontSize: "0.7rem",
											fontWeight: 600,
										}}
									>
										SOON
									</Box>
								)}
							</Card>
							))
						) : (
							<Box sx={{ textAlign: "center", py: 4 }}>
								<Typography variant="body1" color="text.secondary">
									No exchanges found matching "{searchQuery}"
								</Typography>
							</Box>
						)}
					</Stack>
				) : (
					// Step 2: Select Method
					<Stack spacing={2.5} sx={{ mt: 1 }}>
						{/* Connect API Option */}
						<Card
							variant="outlined"
							sx={{
								cursor: "not-allowed",
								transition: "all 0.2s",
								borderRadius: 3,
								opacity: 0.6,
								position: "relative",
								"&:hover": {
									boxShadow: 2,
								},
							}}
						>
							<CardActionArea onClick={() => handleMethodSelect("api")} disabled>
								<CardContent sx={{ py: 2.5, px: 3 }}>
									<Stack direction="row" spacing={2.5} sx={{ alignItems: "center" }}>
										<Box
											sx={{
												width: 48,
												height: 48,
												borderRadius: 2,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												bgcolor: "var(--mui-palette-secondary-main)",
											}}
										>
											<PlugsConnectedIcon size={24} color="white" />
										</Box>
										<Box sx={{ flex: 1 }}>
											<Typography variant="body1" fontWeight={600}>
												Connect my API
											</Typography>
										</Box>
										<Chip
											label="Recommended"
											size="small"
											icon={<CheckIcon size={16} />}
											sx={{
												bgcolor: "var(--mui-palette-secondary-main)",
												color: "white",
												fontWeight: 600,
												height: 24,
												"& .MuiChip-icon": {
													color: "white",
												},
											}}
										/>
										<ArrowRightIcon size={24} color="var(--mui-palette-text-secondary)" />
									</Stack>
								</CardContent>
							</CardActionArea>
							<Box
								sx={{
									position: "absolute",
									top: 8,
									right: 8,
									bgcolor: "warning.main",
									color: "white",
									px: 1,
									py: 0.5,
									borderRadius: 1,
									fontSize: "0.7rem",
									fontWeight: 600,
								}}
							>
								SOON
							</Box>
						</Card>

						{/* Import CSV Option */}
						<Card
							variant="outlined"
							sx={{
								cursor: "pointer",
								transition: "all 0.2s",
								borderRadius: 3,
								"&:hover": {
									boxShadow: 6,
									transform: "translateY(-2px)",
									borderColor: "var(--mui-palette-primary-main)",
								},
							}}
						>
							<CardActionArea onClick={() => handleMethodSelect("csv")}>
								<CardContent sx={{ py: 2.5, px: 3 }}>
									<Stack direction="row" spacing={2.5} sx={{ alignItems: "center" }}>
										<Box
											sx={{
												width: 48,
												height: 48,
												borderRadius: 2,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												bgcolor: "var(--mui-palette-primary-main)",
											}}
										>
											<FileCsvIcon size={24} color="white" />
										</Box>
										<Box sx={{ flex: 1 }}>
											<Typography variant="body1" fontWeight={600}>
												Import a file
											</Typography>
										</Box>
										<ArrowRightIcon size={24} color="var(--mui-palette-text-secondary)" />
									</Stack>
								</CardContent>
							</CardActionArea>
						</Card>
					</Stack>
				)}
			</DialogContent>
		</Dialog>
	);
}

