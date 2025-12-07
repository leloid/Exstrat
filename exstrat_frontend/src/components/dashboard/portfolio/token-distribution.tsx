"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Divider from "@mui/material/Divider";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { WalletIcon } from "@phosphor-icons/react/dist/ssr/Wallet";
import { Cell, Pie, PieChart, Tooltip } from "recharts";

import { NoSsr } from "@/components/core/no-ssr";
import { formatCurrency } from "@/lib/format";
import type { Holding } from "@/types/portfolio";
// Helper function to get token logo URL
function getTokenLogoUrl(symbol: string, name?: string): string {
	// Common token symbols to CoinMarketCap IDs mapping
	const symbolToCmcId: Record<string, number> = {
		BTC: 1,
		ETH: 1027,
		BNB: 1839,
		SOL: 5426,
		XRP: 52,
		ADA: 2010,
		DOGE: 5,
		MATIC: 3890,
		DOT: 6636,
		AVAX: 5805,
		LINK: 1975,
		UNI: 7083,
		ATOM: 3794,
		LTC: 2,
		BCH: 1831,
		XLM: 512,
		ALGO: 4030,
		VET: 3077,
		FIL: 2280,
		TRX: 1958,
		ETC: 1321,
		EOS: 1765,
		AAVE: 7278,
		MKR: 1518,
		COMP: 5692,
		YFI: 5864,
		SNX: 2586,
		SUSHI: 6758,
		CRV: 6538,
		BAL: 5728,
		ZRX: 1896,
		BAT: 1697,
		ZEC: 1437,
		DASH: 131,
		XMR: 328,
		WAVES: 1274,
		OMG: 1808,
		ENJ: 2130,
		MANA: 1966,
		SAND: 6210,
		AXS: 6783,
		CHZ: 4066,
		FLOW: 4558,
		ICP: 8916,
		NEAR: 6535,
		FTM: 3513,
		HBAR: 4642,
		EGLD: 6892,
		THETA: 2416,
		XTZ: 2011,
		HOT: 2682,
		ZIL: 2469,
		IOTA: 1720,
		ONE: 3945,
		QTUM: 1684,
		ONT: 2566,
		ZEN: 1698,
		SC: 1042,
		STORJ: 1772,
		SKL: 5691,
		ANKR: 3783,
		OCEAN: 3911,
		BAND: 4679,
		KNC: 1982,
		REN: 2539,
		LRC: 1934,
		CTSI: 5444,
		OGN: 6719,
		POLY: 2496,
		GLM: 1455,
		UMA: 5617,
		MIR: 7694,
		ALPHA: 7232,
		VIDT: 3845,
		FRONT: 5893,
		ROSE: 7653,
		CFX: 7334,
		PERP: 6950,
		RAD: 6848,
		DYDX: 9129,
		ENS: 13855,
		LDO: 13573,
		ARB: 11841,
		OP: 11840,
		APT: 21794,
		SUI: 20947,
		SEI: 23149,
		TIA: 22861,
		INJ: 7226,
		PENDLE: 9481,
		GMX: 11857,
		MAGIC: 16250,
		RNDR: 5690,
		IMX: 10603,
		STX: 4847,
		MINA: 8646,
		FLUX: 3029,
		RUNE: 4157,
		KAVA: 4846,
		SCRT: 5604,
		AKT: 7431,
		OSMO: 12220,
		JUNO: 14299,
		EVMOS: 19891,
		STRD: 14754,
		IXO: 2930,
		UMEE: 12258,
		NGM: 15628,
		EEUR: 15629,
		BCNA: 15630,
		BOOT: 15631,
		XPRT: 7281,
		ATOM: 3794,
		LUNA: 4172,
		UST: 7129,
		KRT: 4173,
		SDT: 4174,
		MNT: 4175,
		EUT: 4176,
		CNT: 4177,
		JPT: 4178,
		GBT: 4179,
		IDT: 4180,
		PDT: 4181,
		CHT: 4182,
		CKT: 4183,
		HKT: 4184,
		SGT: 4185,
		THT: 4186,
		AUT: 4187,
		EST: 4188,
		EUT: 4189,
		GBP: 4190,
		CNY: 4191,
		JPY: 4192,
		KRW: 4193,
		TWD: 4194,
		HKD: 4195,
		SGD: 4196,
		MYR: 4197,
		INR: 4198,
		PHP: 4199,
		IDR: 4200,
		THB: 4201,
		VND: 4202,
		EUR: 4203,
		USD: 4204,
	};

	const cmcId = symbolToCmcId[symbol.toUpperCase()];

	// Priority 1: CoinMarketCap with cmcId
	if (cmcId) {
		return `https://s2.coinmarketcap.com/static/img/coins/64x64/${cmcId}.png`;
	}

	// Priority 2: Binance Assets CDN
	const binanceUrl = `https://assets.binance.com/files/logo/${symbol.toLowerCase()}.svg`;
	// Note: We can't verify if the URL exists, so we'll use it as a fallback

	// Priority 3: cryptologos.cc
	return `https://cryptologos.cc/logos/${symbol.toLowerCase()}-${name?.toLowerCase().replace(/\s+/g, "-") || symbol.toLowerCase()}-logo.svg`;
}

export interface TokenDistributionProps {
	holdings: Holding[];
}

export function TokenDistribution({ holdings }: TokenDistributionProps): React.JSX.Element {
	const chartSize = 200;
	const chartThickness = 30;

	// Calculate distribution
	const distribution = React.useMemo(() => {
		if (!holdings || holdings.length === 0) return [];

		const totalValue = holdings.reduce((sum, h) => {
			const currentValue = h.currentValue || (h.currentPrice || h.averagePrice) * h.quantity;
			return sum + currentValue;
		}, 0);

		if (totalValue === 0) return [];

		// Group by token and calculate total value per token
		const tokenMap = new Map<string, { symbol: string; name: string; value: number; color: string }>();

		holdings.forEach((holding) => {
			const currentValue = holding.currentValue || (holding.currentPrice || holding.averagePrice) * holding.quantity;
			const tokenId = holding.token.id;
			const existing = tokenMap.get(tokenId);

			if (existing) {
				tokenMap.set(tokenId, {
					...existing,
					value: existing.value + currentValue,
				});
			} else {
				// Generate color based on token symbol
				const colors = [
					"var(--mui-palette-primary-main)",
					"var(--mui-palette-success-main)",
					"var(--mui-palette-warning-main)",
					"var(--mui-palette-error-main)",
					"var(--mui-palette-info-main)",
				];
				const colorIndex = tokenMap.size % colors.length;

				tokenMap.set(tokenId, {
					symbol: holding.token.symbol,
					name: holding.token.name || holding.token.symbol,
					value: currentValue,
					color: colors[colorIndex],
				});
			}
		});

		// Sort by value descending and take top 6, group rest as "Others"
		const sorted = Array.from(tokenMap.values())
			.sort((a, b) => b.value - a.value)
			.slice(0, 6);

		const othersValue = Array.from(tokenMap.values())
			.slice(6)
			.reduce((sum, token) => sum + token.value, 0);

		if (othersValue > 0) {
			sorted.push({
				symbol: "Others",
				name: "Others",
				value: othersValue,
				color: "var(--mui-palette-text-secondary)",
			});
		}

		return sorted;
	}, [holdings]);

	const total = distribution.reduce((acc, curr) => acc + curr.value, 0);

	if (distribution.length === 0) {
		return (
			<Card>
				<CardHeader
					avatar={
						<Avatar>
							<WalletIcon fontSize="var(--Icon-fontSize)" />
						</Avatar>
					}
					subheader="Token distribution across your portfolio"
					title="Token Distribution"
				/>
				<CardContent>
					<Box sx={{ py: 4, textAlign: "center" }}>
						<Typography color="text.secondary" variant="body2">
							No tokens to display
						</Typography>
					</Box>
				</CardContent>
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
				subheader="Token distribution across your portfolio"
				title="Token Distribution"
			/>
			<CardContent>
				<Stack direction="row" spacing={3} sx={{ alignItems: "center", flexWrap: "wrap" }}>
					<NoSsr fallback={<Box sx={{ height: `${chartSize}px`, width: `${chartSize}px` }} />}>
						<PieChart height={chartSize} margin={{ top: 0, right: 0, bottom: 0, left: 0 }} width={chartSize}>
							<Pie
								animationDuration={300}
								cx={chartSize / 2}
								cy={chartSize / 2}
								data={distribution}
								dataKey="value"
								innerRadius={chartSize / 2 - chartThickness}
								nameKey="symbol"
								outerRadius={chartSize / 2}
								strokeWidth={0}
							>
								{distribution.map(
									(entry): React.JSX.Element => (
										<Cell fill={entry.color} key={entry.symbol} />
									)
								)}
							</Pie>
							<Tooltip animationDuration={50} content={<TooltipContent />} />
						</PieChart>
					</NoSsr>
					<Stack spacing={3} sx={{ flex: "1 1 auto" }}>
						<Stack spacing={1}>
							<Typography color="text.secondary" variant="overline">
								Total balance
							</Typography>
							<Typography variant="h4">{formatCurrency(total, "$", 2)}</Typography>
						</Stack>
						<Stack spacing={1}>
							<Typography color="text.secondary" variant="overline">
								Token allocation
							</Typography>
							<Stack component="ul" spacing={2} sx={{ listStyle: "none", m: 0, p: 0 }}>
								{distribution.map((entry) => {
									const percentage = total > 0 ? (entry.value / total) * 100 : 0;
									return (
										<Stack component="li" direction="row" key={entry.symbol} spacing={1} sx={{ alignItems: "center" }}>
											<Box sx={{ bgcolor: entry.color, borderRadius: "2px", height: "4px", width: "16px" }} />
											<Stack direction="row" spacing={1} sx={{ alignItems: "center", flex: "1 1 auto" }}>
												{entry.symbol !== "Others" && (
													<Box
														component="img"
														src={getTokenLogoUrl(entry.symbol, entry.name)}
														alt={entry.symbol}
														sx={{ height: "16px", width: "16px", borderRadius: "50%" }}
													/>
												)}
												<Typography sx={{ flex: "1 1 auto" }} variant="subtitle2">
													{entry.name}
												</Typography>
											</Stack>
											<Typography color="text.secondary" variant="body2">
												{percentage.toFixed(1)}%
											</Typography>
											<Typography color="text.secondary" variant="body2">
												{formatCurrency(entry.value, "$", 2)}
											</Typography>
										</Stack>
									);
								})}
							</Stack>
						</Stack>
					</Stack>
				</Stack>
			</CardContent>
		</Card>
	);
}

interface TooltipContentProps {
	active?: boolean;
	payload?: { name: string; payload: { fill: string; name: string; value: number }; value: number }[];
	label?: string;
}

function TooltipContent({ active, payload }: TooltipContentProps): React.JSX.Element | null {
	if (!active || !payload || payload.length === 0) {
		return null;
	}

	const entry = payload[0];
	if (!entry) return null;

	return (
		<Box
			sx={{
				border: "1px solid var(--mui-palette-divider)",
				boxShadow: "var(--mui-shadows-16)",
				p: 1.5,
				bgcolor: "var(--mui-palette-background-paper)",
				borderRadius: 1,
			}}
		>
			<Stack spacing={1}>
				<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
					<Box sx={{ bgcolor: entry.payload.fill, borderRadius: "2px", height: "8px", width: "8px" }} />
					<Typography sx={{ whiteSpace: "nowrap" }} variant="body2">
						{entry.payload.name}
					</Typography>
				</Stack>
				<Typography color="text.secondary" variant="body2">
					{formatCurrency(entry.value, "$", 2)}
				</Typography>
			</Stack>
		</Box>
	);
}

