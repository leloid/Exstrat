"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { TokenAlert, AlertConfiguration } from "@/types/configuration";
import type { TheoreticalStrategyResponse } from "@/types/strategies";

interface TokenAlertItemProps {
	holding: { id: string; token?: { symbol?: string; name?: string } };
	strategy: TheoreticalStrategyResponse | null;
	tokenAlert: TokenAlert | undefined;
	alertConfigurationId: string | undefined;
	isForecastActive: boolean;
	onClick: () => void;
}

export function TokenAlertItem({
	holding,
	strategy,
	tokenAlert,
	isForecastActive: _isForecastActive,
	onClick,
}: TokenAlertItemProps): React.JSX.Element {
	if (!strategy) {
		return <></>;
	}

	const numberOfTargets = strategy.profitTargets.length;

	return (
		<Box
			sx={{
				border: "1px solid var(--mui-palette-divider)",
				borderRadius: 1,
				overflow: "hidden",
				transition: "all 0.2s ease-in-out",
				bgcolor: "var(--mui-palette-background-paper)",
				cursor: "pointer",
				"&:hover": {
					borderColor: "var(--mui-palette-primary-main)",
					boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
					bgcolor: "var(--mui-palette-action-hover)",
				},
			}}
			onClick={onClick}
		>
			{/* Header - Compact and Clean */}
			<Box
				sx={{
					p: 1.5,
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					gap: 1.5,
				}}
			>
				{/* Token Info - Compact */}
				<Stack direction="row" spacing={1.5} sx={{ alignItems: "center", flex: 1, minWidth: 0 }}>
					<Typography variant="body2" sx={{ fontWeight: 600, minWidth: "60px" }}>
						{holding.token?.symbol || ""}
					</Typography>
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Typography variant="caption" color="text.secondary" noWrap>
							{holding.token?.name || ""}
						</Typography>
					</Box>
					<Typography variant="caption" color="text.secondary" sx={{ minWidth: "80px" }}>
						{strategy.name}
					</Typography>
					<Typography variant="caption" color="text.secondary" sx={{ minWidth: "50px" }}>
						{numberOfTargets} TP
					</Typography>
					{tokenAlert && (
						<Chip
							label={tokenAlert.isActive ? "Active" : "Inactive"}
							color={tokenAlert.isActive ? "success" : "default"}
							size="small"
							sx={{ height: "20px", fontSize: "0.65rem", fontWeight: 500 }}
						/>
					)}
				</Stack>
			</Box>
		</Box>
	);
}

