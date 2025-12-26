/**
 * Formatting Utilities
 * Utility functions for formatting crypto data, prices, and currencies
 */

/**
 * Format a price safely
 * @param price - The price to format (can be null or undefined)
 * @param fallback - Fallback value if price is null/undefined
 * @param hideAmount - If true, returns "•••" instead of the price
 * @returns Formatted price or fallback value or "•••" if hideAmount is true
 */
export const formatPrice = (price: number | null | undefined, fallback: string = "N/A", hideAmount: boolean = false): string => {
	if (hideAmount) {
		return "•••";
	}
	if (price === null || price === undefined || Number.isNaN(price)) {
		return fallback;
	}
	return price.toLocaleString();
};

/**
 * Format a percentage safely
 * @param percentage - The percentage to format (can be null or undefined)
 * @param decimals - Number of decimals (default: 2)
 * @returns Formatted percentage or '0.00%'
 */
export const formatPercentage = (percentage: number | null | undefined, decimals: number = 2): string => {
	if (percentage === null || percentage === undefined || Number.isNaN(percentage)) {
		return "0.00%";
	}
	return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(decimals)}%`;
};

/**
 * Format a quantity safely
 * @param quantity - The quantity to format (can be null or undefined)
 * @param decimals - Number of decimals (default: 8)
 * @param hideAmount - If true, returns "•••" instead of the quantity
 * @returns Formatted quantity or '0.00000000' or "•••" if hideAmount is true
 */
export const formatQuantity = (quantity: number | null | undefined, decimals: number = 8, hideAmount: boolean = false): string => {
	if (hideAmount) {
		return "•••";
	}
	if (quantity === null || quantity === undefined || Number.isNaN(quantity)) {
		return "0.00000000";
	}
	return quantity.toFixed(decimals);
};

/**
 * Format an amount in USD safely
 * @param amount - The amount to format (can be null or undefined)
 * @param prefix - Prefix to add (default: '$')
 * @param hideAmount - If true, returns "•••" instead of the amount
 * @returns Formatted amount with prefix or "•••" if hideAmount is true
 */
export const formatUSD = (amount: number | null | undefined, prefix: string = "$", hideAmount: boolean = false): string => {
	if (hideAmount) {
		return "•••";
	}
	if (amount === null || amount === undefined || Number.isNaN(amount)) {
		return `${prefix}0.00`;
	}
	return `${prefix}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

/**
 * Format an amount in currency safely
 * @param amount - The amount to format (can be null or undefined)
 * @param currency - Currency symbol (default: '€')
 * @param decimals - Number of decimals (default: 2)
 * @param hideAmount - If true, returns "•••" instead of the amount
 * @returns Formatted amount with currency or "•••" if hideAmount is true
 */
export const formatCurrency = (
	amount: number | null | undefined,
	currency: string = "€",
	decimals: number = 2,
	hideAmount: boolean = false
): string => {
	if (hideAmount) {
		return "•••";
	}
	if (amount === null || amount === undefined || Number.isNaN(amount)) {
		return `${currency}0.00`;
	}
	return `${currency}${amount.toLocaleString("fr-FR", {
		minimumFractionDigits: decimals,
		maximumFractionDigits: decimals,
	})}`;
};

/**
 * Format an amount in currency with compact notation (k for thousands, M for millions)
 * @param amount - The amount to format (can be null or undefined)
 * @param currency - Currency symbol (default: '$')
 * @param decimals - Number of decimals (default: 2)
 * @param hideAmount - If true, returns "•••" instead of the amount
 * @returns Formatted amount with currency and compact notation or "•••" if hideAmount is true
 */
export const formatCompactCurrency = (
	amount: number | null | undefined,
	currency: string = "$",
	decimals: number = 2,
	hideAmount: boolean = false
): string => {
	if (hideAmount) {
		return "•••";
	}
	if (amount === null || amount === undefined || Number.isNaN(amount)) {
		return `${currency}0.00`;
	}

	const absAmount = Math.abs(amount);
	const sign = amount < 0 ? "-" : "";

	// For amounts >= 1 million, use "M" notation
	if (absAmount >= 1_000_000) {
		const millions = absAmount / 1_000_000;
		return `${sign}${currency}${millions.toFixed(decimals)} M`;
	}

	// For amounts >= 1,000, use "k" notation
	if (absAmount >= 1000) {
		const thousands = absAmount / 1000;
		return `${sign}${currency}${thousands.toFixed(decimals)}k`;
	}

	// For amounts < 1,000, display full number
	return `${sign}${currency}${absAmount.toFixed(decimals)}`;
};

/**
 * Format a quantity with compact display (integer only) and full detail on hover
 * @param quantity - The quantity to format (can be null or undefined)
 * @param decimals - Number of decimals for full detail (default: 8)
 * @param hideAmount - If true, returns "•••" instead of the quantity
 * @returns Object with display (compact) and full (detailed) values
 */
export const formatQuantityCompact = (
	quantity: number | null | undefined,
	decimals: number = 8,
	hideAmount: boolean = false
): { display: string; full: string; showInfo: boolean } => {
	if (hideAmount) {
		return { display: "•••", full: "•••", showInfo: false };
	}
	if (quantity === null || quantity === undefined || Number.isNaN(quantity)) {
		return { display: "0", full: "0.00000000", showInfo: false };
	}

	const rounded = Math.round(quantity);
	const full = quantity.toFixed(decimals);
	const showInfo = quantity < 1 && quantity > 0;

	if (showInfo) {
		return { display: "<1", full, showInfo: true };
	}

	return { display: rounded.toLocaleString(), full, showInfo: false };
};

