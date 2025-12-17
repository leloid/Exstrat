import type { ColorSystemOptions, PaletteColorOptions } from "@mui/material/styles";

import { logger } from "@/lib/default-logger";

import {
	california,
	exstratBlue,
	exstratOrange,
	exstratBlack,
	exstratLightBackground,
	exstratDarkBackground,
	kepple,
	nevada,
	redOrange,
	shakespeare,
	stormGrey,
} from "./colors";
import type { ColorScheme, PrimaryColor } from "./types";

// Palette Exstrat unique
const primarySchemes: Record<PrimaryColor, Record<ColorScheme, PaletteColorOptions>> = {
	exstrat: {
		dark: {
			...exstratBlue,
			light: exstratBlue[300],
			main: exstratBlue[500], // #047DD5
			dark: exstratBlue[700], // #1665C0 (pressed)
			contrastText: "var(--mui-palette-common-white)",
			activated: "rgba(var(--mui-palette-primary-mainChannel) / var(--mui-palette-action-activatedOpacity))",
			hovered: exstratBlue[600], // #047DD6 (hover)
			selected: "rgba(var(--mui-palette-primary-mainChannel) / var(--mui-palette-action-selectedOpacity))",
		},
		light: {
			...exstratBlue,
			light: exstratBlue[400],
			main: exstratBlue[500], // #047DD5
			dark: exstratBlue[700], // #1665C0 (pressed)
			contrastText: "var(--mui-palette-common-white)",
			activated: "rgba(var(--mui-palette-primary-mainChannel) / var(--mui-palette-action-activatedOpacity))",
			hovered: exstratBlue[600], // #047DD6 (hover)
			selected: "rgba(var(--mui-palette-primary-mainChannel) / var(--mui-palette-action-selectedOpacity))",
		},
	},
};

interface Config {
	primaryColor: PrimaryColor;
}

export function colorSchemes(config: Config): Partial<Record<ColorScheme, ColorSystemOptions>> {
	let primary = primarySchemes[config.primaryColor];

	if (!primary) {
		logger.warn(`No primary color found for ${config.primaryColor}. Using exstrat instead.`);
		primary = primarySchemes.exstrat;
	}

	return {
		dark: {
			palette: {
				action: { disabledBackground: "rgba(0, 0, 0, 0.12)" },
				background: {
					default: exstratDarkBackground.dark, // #141618 (DBG)
					defaultChannel: "20 22 24",
					paper: exstratDarkBackground.light, // #24272A (LBG)
					paperChannel: "36 39 42",
					level1: exstratDarkBackground.hoverDark, // #1D1F21
					level2: exstratDarkBackground.hoverLight, // #2D2F32
					level3: "var(--mui-palette-neutral-600)",
				},
				common: { black: "#000000", white: "#ffffff" },
				divider: "var(--mui-palette-neutral-700)",
				dividerChannel: "50 56 62",
				error: {
					...redOrange,
					light: redOrange[300],
					main: redOrange[400],
					dark: redOrange[500],
					contrastText: "var(--mui-palette-common-black)",
					activated: "rgba(var(--mui-palette-error-mainChannel) / var(--mui-palette-action-activatedOpacity))",
					hovered: "rgba(var(--mui-palette-error-mainChannel) / var(--mui-palette-action-hoverOpacity))",
					selected: "rgba(var(--mui-palette-error-mainChannel) / var(--mui-palette-action-selectedOpacity))",
				},
				info: {
					...shakespeare,
					light: shakespeare[300],
					main: shakespeare[400],
					dark: shakespeare[500],
					contrastText: "var(--mui-palette-common-black)",
					activated: "rgba(var(--mui-palette-info-mainChannel) / var(--mui-palette-action-activatedOpacity))",
					hovered: "rgba(var(--mui-palette-info-mainChannel) / var(--mui-palette-action-hoverOpacity))",
					selected: "rgba(var(--mui-palette-info-mainChannel) / var(--mui-palette-action-selectedOpacity))",
				},
				neutral: { ...nevada },
				primary: primary.dark,
				secondary: {
					...exstratOrange,
					light: exstratOrange[300],
					main: exstratOrange[500], // #F6851B
					dark: exstratOrange[700],
					contrastText: "var(--mui-palette-common-white)",
					activated: "rgba(var(--mui-palette-secondary-mainChannel) / var(--mui-palette-action-activatedOpacity))",
					hovered: "rgba(var(--mui-palette-secondary-mainChannel) / var(--mui-palette-action-hoverOpacity))",
					selected: "rgba(var(--mui-palette-secondary-mainChannel) / var(--mui-palette-action-selectedOpacity))",
				},
				success: {
					...kepple,
					light: kepple[300],
					main: kepple[400],
					dark: kepple[500],
					contrastText: "var(--mui-palette-common-black)",
					activated: "rgba(var(--mui-palette-success-mainChannel) / var(--mui-palette-action-activatedOpacity))",
					hovered: "rgba(var(--mui-palette-success-mainChannel) / var(--mui-palette-action-hoverOpacity))",
					selected: "rgba(var(--mui-palette-success-mainChannel) / var(--mui-palette-action-selectedOpacity))",
				},
				text: {
					primary: "var(--mui-palette-neutral-100)",
					primaryChannel: "240 244 248",
					secondary: "var(--mui-palette-neutral-400)",
					secondaryChannel: "159 166 173",
					disabled: "var(--mui-palette-neutral-600)",
				},
				warning: {
					...california,
					light: california[300],
					main: california[400],
					dark: california[500],
					contrastText: "var(--mui-palette-common-black)",
					activated: "rgba(var(--mui-palette-warning-mainChannel) / var(--mui-palette-action-activatedOpacity))",
					hovered: "rgba(var(--mui-palette-warning-mainChannel) / var(--mui-palette-action-hoverOpacity))",
					selected: "rgba(var(--mui-palette-warning-mainChannel) / var(--mui-palette-action-selectedOpacity))",
				},
				shadow: "rgba(0, 0, 0, 0.5)",
				Avatar: { defaultBg: "var(--mui-palette-neutral-200)" },
				Backdrop: { bg: "rgba(0, 0, 0, 0.5)" },
				OutlinedInput: { border: "var(--mui-palette-neutral-700)" },
				TableCell: { border: "var(--mui-palette-divider)" },
				Tooltip: { bg: "rgba(10, 13, 20, 0.75)" },
			},
		},
		light: {
			palette: {
				action: { disabledBackground: "rgba(0, 0, 0, 0.06)" },
				background: {
					default: exstratLightBackground.light, // #FFFFFF (LBG)
					defaultChannel: "255 255 255",
					paper: exstratLightBackground.dark, // #F7F9FB (DBG)
					paperChannel: "247 249 251",
					level1: exstratLightBackground.hoverLight, // #E6EAEE
					level2: exstratLightBackground.hoverDark, // #CFD0D2
					level3: "var(--mui-palette-neutral-200)",
				},
				common: { black: "#000000", white: "#ffffff" },
				divider: "var(--mui-palette-neutral-200)",
				dividerChannel: "220 223 228",
				error: {
					...redOrange,
					light: redOrange[400],
					main: redOrange[500],
					dark: redOrange[600],
					contrastText: "var(--mui-palette-common-white)",
					activated: "rgba(var(--mui-palette-error-mainChannel) / var(--mui-palette-action-activatedOpacity))",
					hovered: "rgba(var(--mui-palette-error-mainChannel) / var(--mui-palette-action-hoverOpacity))",
					selected: "rgba(var(--mui-palette-error-mainChannel) / var(--mui-palette-action-selectedOpacity))",
				},
				info: {
					...shakespeare,
					light: shakespeare[400],
					main: shakespeare[500],
					dark: shakespeare[600],
					contrastText: "var(--mui-palette-common-white)",
					activated: "rgba(var(--mui-palette-info-mainChannel) / var(--mui-palette-action-activatedOpacity))",
					hovered: "rgba(var(--mui-palette-info-mainChannel) / var(--mui-palette-action-hoverOpacity))",
					selected: "rgba(var(--mui-palette-info-mainChannel) / var(--mui-palette-action-selectedOpacity))",
				},
				neutral: { ...stormGrey },
				primary: primary.light,
				secondary: {
					...exstratOrange,
					light: exstratOrange[400],
					main: exstratOrange[500], // #F6851B
					dark: exstratOrange[700],
					contrastText: "var(--mui-palette-common-white)",
					activated: "rgba(var(--mui-palette-secondary-mainChannel) / var(--mui-palette-action-activatedOpacity))",
					hovered: "rgba(var(--mui-palette-secondary-mainChannel) / var(--mui-palette-action-hoverOpacity))",
					selected: "rgba(var(--mui-palette-secondary-mainChannel) / var(--mui-palette-action-selectedOpacity))",
				},
				success: {
					...kepple,
					light: kepple[400],
					main: kepple[500],
					dark: kepple[600],
					contrastText: "var(--mui-palette-common-white)",
					activated: "rgba(var(--mui-palette-success-mainChannel) / var(--mui-palette-action-activatedOpacity))",
					hovered: "rgba(var(--mui-palette-success-mainChannel) / var(--mui-palette-action-hoverOpacity))",
					selected: "rgba(var(--mui-palette-success-mainChannel) / var(--mui-palette-action-selectedOpacity))",
				},
				text: {
					primary: "var(--mui-palette-neutral-900)",
					primaryChannel: "33 38 54",
					secondary: "var(--mui-palette-neutral-500)",
					secondaryChannel: "102 112 133",
					disabled: "var(--mui-palette-neutral-400)",
				},
				warning: {
					...california,
					light: california[400],
					main: california[500],
					dark: california[600],
					contrastText: "var(--mui-palette-common-white)",
					activated: "rgba(var(--mui-palette-warning-mainChannel) / var(--mui-palette-action-activatedOpacity))",
					hovered: "rgba(var(--mui-palette-warning-mainChannel) / var(--mui-palette-action-hoverOpacity))",
					selected: "rgba(var(--mui-palette-warning-mainChannel) / var(--mui-palette-action-selectedOpacity))",
				},
				shadow: "rgba(0, 0, 0, 0.08)",
				Avatar: { defaultBg: "var(--mui-palette-neutral-600)" },
				Backdrop: { bg: "rgb(18, 22, 33, 0.8)" },
				OutlinedInput: { border: "var(--mui-palette-neutral-200)" },
				TableCell: { border: "var(--mui-palette-divider)" },
				Tooltip: { bg: "rgba(10, 13, 20, 0.75)" },
			},
		},
	};
}
