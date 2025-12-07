"use client";

import * as React from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import type { Portfolio } from "@/types/portfolio";

interface WalletSelectorProps {
	portfolios: Portfolio[];
	selectedPortfolioId: string;
	onPortfolioChange: (portfolioId: string) => void;
}

export function WalletSelector({ portfolios, selectedPortfolioId, onPortfolioChange }: WalletSelectorProps): React.JSX.Element {
	return (
		<FormControl fullWidth>
			<InputLabel>Select a wallet</InputLabel>
			<Select
				value={selectedPortfolioId}
				onChange={(e) => onPortfolioChange(e.target.value)}
				label="Select a wallet"
			>
				<MenuItem value="">
					<em>-- Select a wallet --</em>
				</MenuItem>
				{portfolios.map((portfolio) => (
					<MenuItem key={portfolio.id} value={portfolio.id}>
						{portfolio.name}
						{portfolio.isDefault && " (default)"}
					</MenuItem>
				))}
			</Select>
		</FormControl>
	);
}

