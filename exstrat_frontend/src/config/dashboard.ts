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
}

export const dashboardConfig = {
	layout: "vertical",
	navColor: "evident",
	navItems: [
		{
			key: "dashboards",
			title: "Dashboards",
			items: [{ key: "overview", title: "Overview", href: paths.dashboard.overview, icon: "house" }],
		},
		{
			key: "wallet",
			title: "Wallet",
			items: [
				{ key: "investissements", title: "Investments", href: paths.dashboard.investissements, icon: "shopping-bag-open" },
			],
		},
		{
			key: "trading",
			title: "Trading",
			items: [
				{ key: "strategies", title: "Profit Strategies", href: paths.dashboard.strategies, icon: "chart-pie" },
				{ key: "prevision", title: "Forecast", href: paths.dashboard.prevision, icon: "calendar-check" },
			],
		},
		{
			key: "settings",
			title: "Configuration",
			items: [
				{ key: "configuration", title: "Forecast Alerts", href: paths.dashboard.configuration, icon: "gear" },
			],
		},
		{
			key: "help",
			title: "Help",
			items: [
				{ key: "getting-started", title: "Getting Started", href: paths.dashboard.gettingStarted, icon: "graduation-cap" },
			],
		},
	],
} satisfies DashboardConfig;
