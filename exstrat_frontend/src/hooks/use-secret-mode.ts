"use client";

import { useSettings } from "@/components/core/settings/settings-context";

/**
 * Hook to access and toggle secret mode
 * Secret mode hides all amounts/quantities but keeps percentages visible
 */
export function useSecretMode(): { secretMode: boolean; toggleSecretMode: () => void } {
	const { settings, setSettings } = useSettings();
	const secretMode = settings.secretMode ?? false;

	const toggleSecretMode = () => {
		setSettings({
			...settings,
			secretMode: !secretMode,
		});
	};

	return { secretMode, toggleSecretMode };
}

