"use client";

import type * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardHeader from "@mui/material/CardHeader";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Typography from "@mui/material/Typography";
import { DotsThreeIcon } from "@phosphor-icons/react/dist/ssr/DotsThree";
import { TrendDownIcon } from "@phosphor-icons/react/dist/ssr/TrendDown";
import { TrendUpIcon } from "@phosphor-icons/react/dist/ssr/TrendUp";
import { WalletIcon } from "@phosphor-icons/react/dist/ssr/Wallet";

import { formatCurrency, formatPercentage, formatQuantity } from "@/lib/format";
import type { Holding } from "@/types/portfolio";

export interface HoldingsTableProps {
	holdings: Holding[];
	onTokenClick?: (holding: Holding) => void;
}

export function HoldingsTable({ holdings, onTokenClick }: HoldingsTableProps): React.JSX.Element {
	if (!holdings || holdings.length === 0) {
		return (
			<Card>
				<CardHeader
					avatar={
						<Avatar>
							<WalletIcon fontSize="var(--Icon-fontSize)" />
						</Avatar>
					}
					title="Holdings"
				/>
				<Box sx={{ py: 8, textAlign: "center" }}>
					<Typography color="text.secondary" variant="body2">
						No holdings available
					</Typography>
				</Box>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader
				avatar={
					<Avatar>
						<WalletIcon fontSize="var(--Icon-fontSize)" />
					</Avatar>
				}
				title="Holdings"
			/>
			<Box sx={{ overflowX: "auto" }}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Token</TableCell>
							<TableCell align="right">Quantity</TableCell>
							<TableCell align="right">Invested</TableCell>
							<TableCell align="right">Current Value</TableCell>
							<TableCell align="right">P&L</TableCell>
							<TableCell align="right">P&L %</TableCell>
							<TableCell align="right" />
						</TableRow>
					</TableHead>
					<TableBody>
						{holdings.map((holding) => {
							// IMPORTANT: Utiliser currentValue du backend qui est calculé avec currentPrice (prix actuel du marché)
							const currentValue = holding.currentValue || 0;
							const profitLoss = holding.profitLoss || currentValue - holding.investedAmount;
							const profitLossPercentage =
								holding.profitLossPercentage ||
								(holding.investedAmount > 0 ? (profitLoss / holding.investedAmount) * 100 : 0);
							const isPositive = profitLoss >= 0;

							return (
								<TableRow
									key={holding.id}
									hover
									onClick={() => onTokenClick?.(holding)}
									sx={{ cursor: onTokenClick ? "pointer" : "default" }}
								>
									<TableCell>
										<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
											<Avatar
												src={holding.token.logoUrl}
												alt={holding.token.symbol}
												sx={{ height: "32px", width: "32px" }}
											>
												{holding.token.symbol.charAt(0)}
											</Avatar>
											<Stack>
												<Typography variant="subtitle2">{holding.token.symbol}</Typography>
												<Typography color="text.secondary" variant="body2">
													{holding.token.name}
												</Typography>
											</Stack>
										</Stack>
									</TableCell>
									<TableCell align="right">
										<Typography variant="body2">{formatQuantity(holding.quantity)}</Typography>
									</TableCell>
									<TableCell align="right">
										<Typography variant="body2">{formatCurrency(holding.investedAmount, "$", 2)}</Typography>
									</TableCell>
									<TableCell align="right">
										<Typography variant="body2">{formatCurrency(currentValue, "$", 2)}</Typography>
									</TableCell>
									<TableCell align="right">
										<Chip
											color={isPositive ? "success" : "error"}
											icon={isPositive ? <TrendUpIcon /> : <TrendDownIcon />}
											label={formatCurrency(profitLoss, "$", 2)}
											size="small"
											variant="outlined"
										/>
									</TableCell>
									<TableCell align="right">
										<Typography
											color={isPositive ? "success.main" : "error.main"}
											variant="body2"
										>
											{isPositive ? "+" : ""}
											{formatPercentage(profitLossPercentage)}
										</Typography>
									</TableCell>
									<TableCell align="right">
										<IconButton size="small">
											<DotsThreeIcon weight="bold" />
										</IconButton>
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</Box>
		</Card>
	);
}

