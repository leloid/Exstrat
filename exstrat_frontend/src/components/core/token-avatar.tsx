"use client";

import * as React from "react";
import Avatar, { type AvatarProps } from "@mui/material/Avatar";
import { getTokenLogoUrl } from "@/lib/utils";

export interface TokenAvatarProps extends Omit<AvatarProps, "src"> {
	symbol: string;
	cmcId?: number | null;
	fallbackText?: string;
}

/**
 * TokenAvatar component with automatic fallback handling
 * Tries multiple logo sources and falls back to first letter if all fail
 */
export function TokenAvatar({ symbol, cmcId, fallbackText, ...avatarProps }: TokenAvatarProps): React.JSX.Element {
	const [imageError, setImageError] = React.useState(false);
	const [currentSrcIndex, setCurrentSrcIndex] = React.useState(0);
	
	const symbolLower = symbol.toLowerCase();
	
	// Generate multiple fallback URLs to try
	const logoUrls = React.useMemo(() => {
		const urls: string[] = [];
		
		// Primary: Use getTokenLogoUrl (CoinMarketCap or cryptologos.cc)
		const primaryUrl = getTokenLogoUrl(symbol, cmcId);
		if (primaryUrl) {
			urls.push(primaryUrl);
		}
		
		// Fallback 1: cryptologos.cc with different formats
		urls.push(`https://cryptologos.cc/logos/${symbolLower}-${symbolLower}-logo.png`);
		urls.push(`https://cryptologos.cc/logos/${symbolLower}-logo.svg`);
		urls.push(`https://cryptologos.cc/logos/${symbolLower}-logo.png`);
		
		// Fallback 2: Trust Wallet assets (good coverage)
		urls.push(`https://assets.trustwalletapp.com/blockchains/smartchain/assets/${symbolLower}/logo.png`);
		
		// Fallback 3: CoinGecko (alternative source)
		// Note: CoinGecko requires specific IDs, so this is less reliable
		// But we include it as a last resort
		
		return urls.filter((url, index, self) => self.indexOf(url) === index); // Remove duplicates
	}, [symbol, cmcId, symbolLower]);
	
	const currentSrc = logoUrls[currentSrcIndex] || null;
	
	const handleImageError = React.useCallback(() => {
		if (currentSrcIndex < logoUrls.length - 1) {
			// Try next URL in the fallback list
			setCurrentSrcIndex((prev) => prev + 1);
		} else {
			// All URLs failed, show fallback
			setImageError(true);
		}
	}, [currentSrcIndex, logoUrls.length]);
	
	const handleImageLoad = React.useCallback(() => {
		// Reset error state if image loads successfully
		setImageError(false);
	}, []);
	
	// Reset when symbol or cmcId changes
	React.useEffect(() => {
		setImageError(false);
		setCurrentSrcIndex(0);
	}, [symbol, cmcId]);
	
	const displayText = fallbackText || symbol.charAt(0).toUpperCase();
	
	return (
		<Avatar
			{...avatarProps}
			src={!imageError && currentSrc ? currentSrc : undefined}
			onError={handleImageError}
			onLoad={handleImageLoad}
		>
			{displayText}
		</Avatar>
	);
}

