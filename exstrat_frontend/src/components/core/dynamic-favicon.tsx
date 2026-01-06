"use client";

import * as React from "react";
import { useColorScheme } from "@mui/material/styles";

export function DynamicFavicon(): React.JSX.Element | null {
	const { mode } = useColorScheme();
	
	React.useEffect(() => {
		if (typeof window === "undefined") return;
		
		const updateFavicon = () => {
			// Trouver ou créer le lien favicon
			let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
			
			if (!favicon) {
				favicon = document.createElement("link");
				favicon.rel = "icon";
				document.head.appendChild(favicon);
			}
			
			// Déterminer si le thème est dark
			// mode peut être 'light', 'dark', ou null (system)
			let isDark = false;
			
			if (mode === "dark") {
				isDark = true;
			} else if (mode === "light") {
				isDark = false;
			} else {
				// Mode system - vérifier la préférence système
				isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
			}
			
			favicon.href = isDark ? "/logo_dark.svg" : "/logo_light.svg";
			favicon.type = "image/svg+xml";
		};
		
		updateFavicon();
		
		// Écouter les changements de préférence système si mode est null
		if (mode === null) {
			const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
			mediaQuery.addEventListener("change", updateFavicon);
			
			return () => {
				mediaQuery.removeEventListener("change", updateFavicon);
			};
		}
	}, [mode]);
	
	return null;
}

