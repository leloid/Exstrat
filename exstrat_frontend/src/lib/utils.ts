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
 * Get token logo URL with fallback mechanism
 * Priority: CoinMarketCap (with cmcId) > Common token mapping > Binance Assets > cryptologos.cc
 */
export function getTokenLogoUrl(symbol: string, cmcId?: number | null): string {
	const symbolLower = symbol.toLowerCase();

	// Priority 1: CoinMarketCap (if cmcId is available and valid) - most reliable
	if (cmcId && cmcId > 0) {
		return `https://s2.coinmarketcap.com/static/img/coins/64x64/${cmcId}.png`;
	}

	// Priority 2: Mapping of common tokens to CoinMarketCap IDs
	const commonTokenIds: Record<string, number> = {
		btc: 1,
		eth: 1027,
		usdt: 825,
		bnb: 1839,
		sol: 4128,
		usdc: 3408,
		xrp: 52,
		ada: 2010,
		doge: 5,
		matic: 4713,
		dot: 6636,
		avax: 5805,
		shib: 11_939,
		ltc: 2,
		link: 1975,
		trx: 1958,
		atom: 3794,
		etc: 1321,
		xlm: 512,
		algo: 4030,
		vet: 3077,
		fil: 2280,
		icp: 8916,
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
		ens: 13_855,
		ldo: 13_573,
		arb: 11_841,
		op: 11_840,
		apt: 21_794,
		sui: 20_947,
		sei: 23_149,
		tia: 22_861,
		inj: 7226,
		pendle: 9481,
		gmx: 11_857,
		magic: 16_250,
		rndr: 5690,
		imx: 10_603,
		stx: 4847,
		mina: 8646,
		flux: 3029,
		rune: 4157,
		kava: 4846,
		scrt: 5604,
		akt: 7431,
		osmo: 12_220,
		juno: 14_299,
		evmos: 19_891,
		strd: 14_754,
		ixo: 2930,
		umee: 12_258,
		ngm: 15_628,
		eeur: 15_629,
		bcna: 15_630,
		boot: 15_631,
		xprt: 7281,
	};

	const commonCmcId = commonTokenIds[symbolLower];
	if (commonCmcId) {
		return `https://s2.coinmarketcap.com/static/img/coins/64x64/${commonCmcId}.png`;
	}

	// Priority 3: Binance Assets CDN (commented out as fallback, but not used directly)
	// const binanceUrl = `https://assets.binance.com/files/logo/${symbolLower}.svg`;

	// Priority 4: cryptologos.cc (general fallback)
	return `https://cryptologos.cc/logos/${symbolLower}-logo.svg`;
}

