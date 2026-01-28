import type { NavItemConfig } from "@/types/nav";
import { paths } from "@/paths";

// NOTE: We did not use React Components for Icons, because
//  you may one to get the config from the server.

// NOTE: First level elements are groups.

export interface DashboardConfig {
	// Overriden by Settings Context.
	layout: "horizontal" | "vertical";
	// Overriden by Settings Context.
	navColor: "blend_in" | "discrete" | "evident";
	navItems: NavItemConfig[];
	gettingStartedItem?: NavItemConfig;
}

export const dashboardConfig = {
	layout: "vertical",
	navColor: "evident",
	navItems: [
		{
			key: "dashboard",
			title: undefined, // Pas de titre de section
			items: [{ key: "overview", title: "Dashboard", href: paths.dashboard.overview, icon: "chart-bar" }],
		},
		{
			key: "investissements",
			title: undefined,
			items: [
				{ key: "investissements", title: "Investissement", href: paths.dashboard.investissements, icon: "pencil" },
			],
		},
		{
			key: "strategies",
			title: undefined,
			items: [
				{ key: "strategies", title: "Token Strategies", href: paths.dashboard.strategies, icon: "sliders" },
			],
		},
		{
			key: "forecast",
			title: undefined,
			items: [
				{ key: "prevision", title: "Forecast", href: paths.dashboard.prevision, icon: "chart-line" },
			],
		},
		{
			key: "configuration",
			title: undefined,
			items: [
				{ key: "configuration", title: "Alert Configuration", href: paths.dashboard.configuration, icon: "bell-ringing" },
			],
		},
	],
	// Getting Started et Settings séparés pour être affichés en bas
	gettingStartedItem: {
		key: "bottom-nav",
		title: undefined,
		items: [
			{
				key: "getting-started",
				title: "Getting Started",
				href: paths.dashboard.gettingStarted,
				icon: "graduation-cap",
			},
			{
				key: "settings",
				title: "Settings",
				href: "#settings", // Utilisé comme identifiant pour ouvrir le drawer
				icon: "gear",
			},
		],
	},
} satisfies DashboardConfig;
