"use client";

import * as React from "react";
import Autocomplete from "@mui/material/Autocomplete";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import InputAdornment from "@mui/material/InputAdornment";

import { transactionsApi } from "@/lib/transactions-api";
import { formatCurrency, formatPercentage } from "@/lib/format";
import type { TokenSearchResult } from "@/types/transactions";

// Type partiel pour les tokens disponibles depuis les holdings
type AvailableToken = Pick<TokenSearchResult, "id" | "symbol" | "name"> & {
	quote: {
		USD: {
			price: number | null;
		};
	};
};

type TokenLike = TokenSearchResult | AvailableToken;

interface TokenSearchProps {
	onTokenSelect: (token: TokenSearchResult | null) => void;
	selectedToken?: TokenLike | null;
	error?: boolean;
	helperText?: string;
}

// Cache simple pour éviter les requêtes répétées
const searchCache = new Map<string, { data: TokenSearchResult[]; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export function TokenSearch({ onTokenSelect, selectedToken, error, helperText }: TokenSearchProps): React.JSX.Element {
	const [open, setOpen] = React.useState(false);
	const [options, setOptions] = React.useState<TokenSearchResult[]>([]);
	const [loading, setLoading] = React.useState(false);
	const [inputValue, setInputValue] = React.useState("");
	const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
	const lastSearchRef = React.useRef<string>("");

	// Fonction pour extraire le symbole de la recherche
	const extractSymbol = (query: string): string => {
		const trimmed = query.trim();
		// Si le format est "SYMBOL - Name", extraire juste le symbole
		if (trimmed.includes(" - ")) {
			return trimmed.split(" - ")[0].trim().toUpperCase();
		}
		// Sinon, retourner la requête telle quelle (en majuscules pour les symboles)
		return trimmed.toUpperCase();
	};

	const searchTokens = React.useCallback(async (searchQuery: string) => {
		if (!searchQuery.trim()) {
			setOptions([]);
			return;
		}

		// Extraire uniquement le symbole de la recherche
		const symbol = extractSymbol(searchQuery);

		// Vérifier le cache
		const cacheKey = symbol.toLowerCase();
		const cached = searchCache.get(cacheKey);
		if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
			setOptions(cached.data);
			return;
		}

		// Éviter les recherches identiques consécutives
		if (lastSearchRef.current === cacheKey) {
			return;
		}

		setLoading(true);
		lastSearchRef.current = cacheKey;

		try {
			// Utiliser uniquement le symbole pour la recherche
			const results = await transactionsApi.searchTokens(symbol);
			setOptions(results);
			// Mettre en cache les résultats
			searchCache.set(cacheKey, { data: results, timestamp: Date.now() });
		} catch (error_: unknown) {
			console.error("Error searching tokens:", error_);
			const _axiosError = error_ as { response?: { status?: number } };
			// Ne pas afficher d'erreur pour les erreurs réseau/backend (502, 503, etc.)
			// L'utilisateur verra simplement qu'aucun résultat n'est trouvé
			setOptions([]);
		} finally {
			setLoading(false);
		}
	}, []);

	React.useEffect(() => {
		if (debounceTimeoutRef.current) {
			clearTimeout(debounceTimeoutRef.current);
		}

		if (inputValue.trim()) {
			debounceTimeoutRef.current = setTimeout(() => {
				searchTokens(inputValue);
			}, 500);
		} else {
			setOptions([]);
		}

		return () => {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}
		};
	}, [inputValue, searchTokens]);

	React.useEffect(() => {
		if (!open) {
			setOptions([]);
		}
	}, [open]);

	return (
		<Autocomplete
			fullWidth
			open={open}
			onOpen={() => {
				setOpen(true);
			}}
			onClose={() => {
				setOpen(false);
			}}
			value={
				selectedToken
					? ("slug" in selectedToken
							? selectedToken
							: ({
									...selectedToken,
									slug: selectedToken.symbol.toLowerCase(),
									num_market_pairs: 0,
									date_added: new Date().toISOString(),
									tags: [],
									max_supply: 0,
									circulating_supply: 0,
									total_supply: 0,
									is_active: 1,
									infinite_supply: false,
									platform: null,
									cmc_rank: 0,
									is_fiat: 0,
									self_reported_circulating_supply: null,
									self_reported_market_cap: null,
									tvl_ratio: null,
									last_updated: new Date().toISOString(),
									quote: {
										USD: {
											...selectedToken.quote.USD,
											volume_24h: null,
											volume_change_24h: null,
											percent_change_1h: null,
											percent_change_24h: null,
											percent_change_7d: null,
											percent_change_30d: null,
											percent_change_60d: null,
											percent_change_90d: null,
											market_cap: null,
											market_cap_dominance: null,
											fully_diluted_market_cap: null,
											tvl: null,
											last_updated: new Date().toISOString(),
										},
									},
								} as TokenSearchResult))
					: null
			}
			onChange={(event, newValue) => {
				onTokenSelect(newValue);
				// Réinitialiser l'inputValue quand un token est sélectionné
				if (newValue) {
					setInputValue(`${newValue.symbol} - ${newValue.name}`);
				} else {
					setInputValue("");
				}
			}}
			inputValue={inputValue}
			onInputChange={(event, newInputValue, reason) => {
				// Ne pas mettre à jour l'inputValue si c'est une sélection (pour éviter les conflits)
				if (reason !== "reset") {
					setInputValue(newInputValue);
				}
			}}
			options={options}
			getOptionLabel={(option) => `${option.symbol} - ${option.name}`}
			isOptionEqualToValue={(option, value) => option.id === value.id}
			loading={loading}
			renderInput={(params) => (
				<TextField
					{...params}
					error={error}
					helperText={helperText}
					label="Search Token"
					placeholder="Search for a token (e.g., BTC, ETH, ADA...)"
					InputProps={{
						...params.InputProps,
						endAdornment: (
							<React.Fragment>
								{loading ? <CircularProgress color="inherit" size={20} /> : null}
								{params.InputProps.endAdornment}
							</React.Fragment>
						),
						startAdornment: (
							<InputAdornment position="start">
								<MagnifyingGlassIcon fontSize="var(--icon-fontSize-md)" />
							</InputAdornment>
						),
					}}
				/>
			)}
			renderOption={(props, option) => {
				const { key, ...otherProps } = props;
				return (
					<Box component="li" key={key} {...otherProps}>
						<Box sx={{ flex: "1 1 auto", minWidth: 0 }}>
							<Typography variant="body2" sx={{ fontWeight: 500 }}>
								{option.symbol} - {option.name}
							</Typography>
							<Typography color="text.secondary" variant="caption">
								Rank #{option.cmc_rank} • {formatCurrency(option.quote?.USD?.price || 0, "$", 2)}
							</Typography>
						</Box>
						<Box sx={{ ml: 2, textAlign: "right" }}>
							<Typography variant="body2" sx={{ fontWeight: 500 }}>
								{formatCurrency(option.quote?.USD?.price || 0, "$", 2)}
							</Typography>
							<Typography
								color={(option.quote?.USD?.percent_change_24h || 0) >= 0 ? "success.main" : "error.main"}
								variant="caption"
							>
								{formatPercentage(option.quote?.USD?.percent_change_24h || 0)}
							</Typography>
						</Box>
					</Box>
				);
			}}
		/>
	);
}

