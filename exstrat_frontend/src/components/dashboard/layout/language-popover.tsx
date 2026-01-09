"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import { useTranslation } from "react-i18next";

import { setSettings as setPersistedSettings } from "@/lib/settings";
import { useSettings } from "@/components/core/settings/settings-context";
import { toast } from "@/components/core/toaster";

export type Language = "en" | "fr";

export const languageFlags = {
	en: "/assets/flag-uk.svg",
	fr: "/assets/flag-uk.svg", // Placeholder - will be replaced with flag-fr.svg
} as const;

const languageOptions = {
	en: { icon: "/assets/flag-uk.svg", label: "English", comingSoon: false },
	fr: { icon: "/assets/flag-uk.svg", label: "Français", comingSoon: true }, // Placeholder - will be replaced with flag-fr.svg
} as const;

export interface LanguagePopoverProps {
	anchorEl: null | Element;
	onClose?: () => void;
	open?: boolean;
}

export function LanguagePopover({ anchorEl, onClose, open = false }: LanguagePopoverProps): React.JSX.Element {
	const { settings } = useSettings();
	const { t, i18n } = useTranslation();
	const router = useRouter();

	const handleChange = React.useCallback(
		async (language: Language): Promise<void> => {
			const option = languageOptions[language];
			if (option.comingSoon) {
				return; // Don't change language if coming soon
			}
			onClose?.();
			await setPersistedSettings({ ...settings, language });
			await i18n.changeLanguage(language);
			toast.success(t("common:languageChanged"));
			router.refresh();
		},
		[onClose, t, i18n, settings, router]
	);

	return (
		<Menu
			anchorEl={anchorEl}
			anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
			onClose={onClose}
			open={open}
			slotProps={{ paper: { sx: { width: "220px" } } }}
			transformOrigin={{ horizontal: "right", vertical: "top" }}
		>
			{(Object.keys(languageOptions) as Language[]).map((language) => {
				const option = languageOptions[language];

				return (
					<MenuItem
						key={language}
						onClick={(): void => {
							handleChange(language).catch(() => {
								// ignore
							});
						}}
						disabled={option.comingSoon}
						sx={{
							opacity: option.comingSoon ? 0.5 : 1,
							cursor: option.comingSoon ? "not-allowed" : "pointer",
						}}
					>
						<Box sx={{ flex: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
							<Typography variant="subtitle2">{option.label}</Typography>
							{option.comingSoon && (
								<Typography variant="caption" color="text.secondary" sx={{ ml: 1, fontSize: "0.7rem" }}>
									To be soon
								</Typography>
							)}
						</Box>
					</MenuItem>
				);
			})}
		</Menu>
	);
}
