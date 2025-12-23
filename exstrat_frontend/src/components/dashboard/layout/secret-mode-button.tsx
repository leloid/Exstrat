"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { EyeIcon } from "@phosphor-icons/react/dist/ssr/Eye";
import { EyeSlashIcon } from "@phosphor-icons/react/dist/ssr/EyeSlash";

import type { Settings } from "@/types/settings";
import { setSettings as setPersistedSettings } from "@/lib/settings";
import { useSettings } from "@/components/core/settings/settings-context";

export function SecretModeButton(): React.JSX.Element {
	const { settings } = useSettings();
	const router = useRouter();
	const secretMode = settings.secretMode ?? false;

	const handleToggle = async (): Promise<void> => {
		const updatedSettings: Partial<Settings> = {
			...settings,
			secretMode: !secretMode,
		};

		await setPersistedSettings(updatedSettings);
		router.refresh();
	};

	return (
		<Tooltip title={secretMode ? "Désactiver le mode secret" : "Activer le mode secret"}>
			<IconButton onClick={handleToggle}>
				{secretMode ? (
					<EyeSlashIcon color="var(--mui-palette-secondary-main)" />
				) : (
					<EyeIcon color="var(--mui-palette-secondary-main)" />
				)}
			</IconButton>
		</Tooltip>
	);
}

