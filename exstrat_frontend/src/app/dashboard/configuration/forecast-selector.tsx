"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { formatCurrency, formatPercentage } from "@/lib/format";
import type { ForecastResponse } from "@/types/portfolio";

interface ForecastSelectorProps {
	forecasts: ForecastResponse[];
	selectedForecastId: string | null;
	activeForecastId: string | null;
	onForecastSelect: (forecastId: string) => void;
}

export function ForecastSelector({
	forecasts,
	selectedForecastId,
	activeForecastId,
	onForecastSelect,
}: ForecastSelectorProps): React.JSX.Element {
	const selectedForecast = forecasts.find((f) => f.id === selectedForecastId);

	return (
		<FormControl fullWidth>
			<InputLabel>Select a forecast</InputLabel>
			<Select
				value={selectedForecastId || ""}
				onChange={(e) => onForecastSelect(e.target.value)}
				label="Select a forecast"
				renderValue={(value) => {
					const forecast = forecasts.find((f) => f.id === value);
					if (!forecast) return "-- Select a forecast --";
					return (
						<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
							<Typography variant="body2">{forecast.name}</Typography>
							{activeForecastId === forecast.id && (
								<Chip label="Active" color="success" size="small" sx={{ height: "20px", fontSize: "0.7rem" }} />
							)}
						</Stack>
					);
				}}
			>
				<MenuItem value="">
					<em>-- Select a forecast --</em>
				</MenuItem>
				{forecasts.map((forecast) => {
					const summary = forecast.summary || {};
					const isSelected = selectedForecastId === forecast.id;
					const isActive = activeForecastId === forecast.id;

					return (
						<MenuItem key={forecast.id} value={forecast.id}>
							<Stack spacing={0.5} sx={{ width: "100%" }}>
								<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
									<Typography variant="body2" sx={{ fontWeight: isSelected ? 600 : 400 }}>
										{forecast.name}
									</Typography>
									{isSelected && <CheckIcon fontSize="var(--icon-fontSize-sm)" />}
									{isActive && (
										<Chip label="Active" color="success" size="small" sx={{ height: "20px", fontSize: "0.7rem" }} />
									)}
								</Stack>
								<Stack direction="row" spacing={2} sx={{ fontSize: "0.75rem" }}>
									<Typography color="text.secondary" variant="caption">
										Invested: {formatCurrency(summary.totalInvested || 0, "$", 2)}
									</Typography>
									<Typography color="text.secondary" variant="caption">
										Return: {formatPercentage(summary.returnPercentage || 0)}
									</Typography>
								</Stack>
							</Stack>
						</MenuItem>
					);
				})}
			</Select>
		</FormControl>
	);
}

