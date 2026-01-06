/**
 * General Utilities
 * Common utility functions used across the application
 */

/**
 * Combines class names using clsx and tailwind-merge
 * Useful for conditional styling in React components
 */
export function cn(...inputs: (string | undefined | null | boolean)[]): string {
	// Simple implementation - can be enhanced with clsx and tailwind-merge if needed
	return inputs.filter(Boolean).join(" ");
}

/**
 * Get token logo URL with comprehensive fallback mechanism
 * Priority: CoinMarketCap (with cmcId) > Common token mapping > Multiple CDN sources
 * Returns a URL string (browser will handle 404s and show Avatar fallback)
 * 
 * This function tries multiple sources to maximize logo coverage:
 * 1. CoinMarketCap (most reliable, requires cmcId)
 * 2. Common token mapping (fallback for known tokens without cmcId)
 * 3. cryptologos.cc (good coverage for many tokens)
 * 4. Trust Wallet assets (alternative source)
 * 5. CoinGecko (alternative source)
 */
export function getTokenLogoUrl(symbol: string, cmcId?: number | null): string | null {
	const symbolLower = symbol.toLowerCase();
	
	// Priority 1: CoinMarketCap (if cmcId is available and valid) - most reliable
	if (cmcId && cmcId > 0) {
		return `https://s2.coinmarketcap.com/static/img/coins/64x64/${cmcId}.png`;
	}
	
	// Priority 2: Mapping of common tokens to CoinMarketCap IDs
	// This is a fallback when cmcId is not available but we know the symbol
	const commonTokenIds: Record<string, number> = {
		btc: 1,        // Bitcoin
		eth: 1027,     // Ethereum
		usdt: 825,     // Tether
		bnb: 1839,     // Binance Coin
		sol: 4128,     // Solana
		usdc: 3408,    // USD Coin
		xrp: 52,       // Ripple
		ada: 2010,     // Cardano
		doge: 5,       // Dogecoin
		matic: 4713,   // Polygon (MATIC)
		dot: 6636,     // Polkadot
		avax: 5805,    // Avalanche
		shib: 11939,   // Shiba Inu
		ltc: 2,        // Litecoin
		link: 1975,    // Chainlink
		trx: 1958,     // TRON
		atom: 3794,    // Cosmos
		etc: 1321,     // Ethereum Classic
		xlm: 512,      // Stellar
		algo: 4030,    // Algorand
		vet: 3077,     // VeChain
		fil: 5488,     // Filecoin
		icp: 8916,     // Internet Computer
		uni: 12504,    // Uniswap
		bat: 1697,     // Basic Attention Token
		strk: 22691,   // Starknet
		sand: 6210,    // The Sandbox
		cro: 3635,     // Crypto.com Coin
		near: 6535,
		ftm: 3513,
		hbar: 4642,
		egld: 6892,
		theta: 2416,
		xtz: 2011,
		zil: 2469,
		iota: 1720,
		one: 3945,
		qtum: 1684,
		ont: 2566,
		zen: 1698,
		sc: 1042,
		storj: 1772,
		skl: 5691,
		ankr: 3783,
		ocean: 3911,
		band: 4679,
		knc: 1982,
		ren: 2539,
		lrc: 1934,
		ctsi: 5444,
		ogn: 6719,
		poly: 2496,
		glm: 1455,
		uma: 5617,
		mir: 7694,
		alpha: 7232,
		vidt: 3845,
		front: 5893,
		rose: 7653,
		cfx: 7334,
		perp: 6950,
		rad: 6848,
		dydx: 9129,
		ens: 13855,
		ldo: 13573,
		arb: 11841,
		op: 11840,
		apt: 21794,
		sui: 20947,
		sei: 23149,
		tia: 22861,
		inj: 7226,
		pendle: 9481,
		gmx: 11857,
		magic: 16250,
		rndr: 5690,
		imx: 10603,
		stx: 4847,
		mina: 8646,
		flux: 3029,
		rune: 4157,
		kava: 4846,
		scrt: 5604,
		akt: 7431,
		osmo: 12220,
		juno: 14299,
		evmos: 19891,
		strd: 14754,
		ixo: 2930,
		umee: 12258,
		ngm: 15628,
		eeur: 15629,
		bcna: 15630,
		boot: 15631,
		xprt: 7281,
	};
	
	if (commonTokenIds[symbolLower]) {
		return `https://s2.coinmarketcap.com/static/img/coins/64x64/${commonTokenIds[symbolLower]}.png`;
	}
	
	// Priority 3: Multiple fallback sources for maximum coverage
	// Try cryptologos.cc first (best coverage with double symbol format)
	// This format works for most tokens including less known ones
	return `https://cryptologos.cc/logos/${symbolLower}-${symbolLower}-logo.png`;
}

