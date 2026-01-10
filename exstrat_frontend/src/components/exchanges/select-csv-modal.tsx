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
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Image from "next/image";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { FileCsvIcon } from "@phosphor-icons/react/dist/ssr/FileCsv";
import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import type { ExchangeType } from "./select-exchange-modal";

interface SelectCsvModalProps {
	open: boolean;
	onClose: () => void;
	onSelectExchange: (exchange: ExchangeType) => void;
}

export function SelectCsvModal({
	open,
	onClose,
	onSelectExchange,
}: SelectCsvModalProps): React.JSX.Element {
	const csvExchanges: Array<{ id: ExchangeType | "binance"; name: string; logo: string; available: boolean }> = [
		{ id: "coinbase", name: "Coinbase", logo: "/CoinbaseLogo.jpeg", available: true },
		{ id: "crypto.com", name: "Crypto.com", logo: "/Cryptocomlogo.jpeg", available: true },
		{ id: "binance", name: "Binance", logo: "/binance.jpeg", available: false },
		{ id: "exstrat", name: "Exstrat", logo: "/logo_dark.svg", available: true },
	];

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>
				<Stack direction="row" spacing={2} sx={{ alignItems: "center", justifyContent: "space-between" }}>
					<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
						<FileCsvIcon size={24} />
						<Typography variant="h6" fontWeight={600}>
							Import CSV
						</Typography>
					</Stack>
					<IconButton onClick={onClose} size="small">
						<XIcon />
					</IconButton>
				</Stack>
			</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ mt: 1 }}>
					{csvExchanges.map((exchange) => (
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
								onClick={() => exchange.available && onSelectExchange(exchange.id as ExchangeType)} 
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
											{exchange.logo.endsWith('.svg') ? (
												<Box
													component="img"
													src={exchange.logo}
													alt={exchange.name}
													sx={{
														width: 48,
														height: 48,
														objectFit: "contain",
													}}
												/>
											) : (
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
											)}
										</Box>
										<Box sx={{ flex: 1 }}>
											<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
												<Typography variant="h6" fontWeight={600}>
													{exchange.name}
												</Typography>
												{exchange.id === "exstrat" && (
													<Chip
														label="Custom"
														size="small"
														sx={{
															height: 20,
															fontSize: "0.65rem",
															fontWeight: 600,
															bgcolor: "var(--mui-palette-primary-main)",
															color: "white",
														}}
													/>
												)}
											</Stack>
											{exchange.id === "exstrat" && (
												<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
													Using our CSV template
												</Typography>
											)}
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
					))}
				</Stack>
			</DialogContent>
		</Dialog>
	);
}

