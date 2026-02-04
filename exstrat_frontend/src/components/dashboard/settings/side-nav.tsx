"use client";

import * as React from "react";
import RouterLink from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { Icon } from "@phosphor-icons/react/dist/lib/types";
import { BellIcon } from "@phosphor-icons/react/dist/ssr/Bell";
import { CreditCardIcon } from "@phosphor-icons/react/dist/ssr/CreditCard";
import { LockKeyIcon } from "@phosphor-icons/react/dist/ssr/LockKey";
import { PlugsConnectedIcon } from "@phosphor-icons/react/dist/ssr/PlugsConnected";
import { UserCircleIcon } from "@phosphor-icons/react/dist/ssr/UserCircle";
import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";

import type { NavItemConfig } from "@/types/nav";
import { paths } from "@/paths";
import { isNavItemActive } from "@/lib/is-nav-item-active";
import { useAuth } from "@/contexts/AuthContext";
import Chip from "@mui/material/Chip";

const navItems = [
	{
		key: "personal",
		title: "Personal",
		items: [
			{ key: "account", title: "Account", href: paths.dashboard.settings.account, icon: "user-circle", comingSoon: false },
			{ key: "notifications", title: "Notifications", href: paths.dashboard.settings.notifications, icon: "bell", comingSoon: true },
			{ key: "security", title: "Security", href: paths.dashboard.settings.security, icon: "lock-key", comingSoon: true },
		],
	},
	{
		key: "organization",
		title: "Organization",
		items: [
			{ key: "billing", title: "Billing & plans", href: paths.dashboard.settings.billing, icon: "credit-card", comingSoon: false },
			{ key: "team", title: "Team", href: paths.dashboard.settings.team, icon: "users-three", comingSoon: true },
			{
				key: "integrations",
				title: "Integrations",
				href: paths.dashboard.settings.integrations,
				icon: "plugs-connected",
				comingSoon: true,
			},
		],
	},
] as Array<{
	key: string;
	title: string;
	items: Array<NavItemConfig & { comingSoon?: boolean }>;
}>;

const icons = {
	"credit-card": CreditCardIcon,
	"lock-key": LockKeyIcon,
	"plugs-connected": PlugsConnectedIcon,
	"user-circle": UserCircleIcon,
	"users-three": UsersThreeIcon,
	bell: BellIcon,
} as Record<string, Icon>;

export function SideNav(): React.JSX.Element {
	const pathname = usePathname();
	const { user } = useAuth();

	return (
		<div>
			<Stack
				spacing={3}
				sx={{
					flex: "0 0 auto",
					flexDirection: { xs: "column-reverse", md: "column" },
					position: { md: "sticky" },
					top: "64px",
					width: { xs: "100%", md: "240px" },
				}}
			>
				<Stack component="ul" spacing={3} sx={{ listStyle: "none", m: 0, p: 0 }}>
					{navItems.map((group) => (
						<Stack component="li" key={group.key} spacing={2}>
							{group.title ? (
								<div>
									<Typography color="text.secondary" variant="caption">
										{group.title}
									</Typography>
								</div>
							) : null}
							<Stack component="ul" spacing={1} sx={{ listStyle: "none", m: 0, p: 0 }}>
								{group.items.map((item) => (
									<NavItem {...item} key={item.key} pathname={pathname} comingSoon={(item as any).comingSoon || false} />
								))}
							</Stack>
						</Stack>
					))}
				</Stack>
				<Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
					<Avatar>
						{user?.firstName?.charAt(0).toUpperCase() || user?.lastName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
					</Avatar>
					<div>
						<Typography variant="subtitle1">
							{user?.firstName && user?.lastName
								? `${user.firstName} ${user.lastName}`
								: user?.firstName || user?.lastName || user?.email?.split("@")[0] || "User"}
						</Typography>
						<Typography color="text.secondary" variant="caption">
							{user?.email || ""}
						</Typography>
					</div>
				</Stack>
			</Stack>
		</div>
	);
}

interface NavItemProps extends NavItemConfig {
	pathname: string;
	comingSoon?: boolean;
}

function NavItem({ disabled, external, href, icon, pathname, title, comingSoon = false }: NavItemProps): React.JSX.Element {
	const active = isNavItemActive({ disabled, external, href, pathname });
	const Icon = icon ? icons[icon] : null;
	const isComingSoon = comingSoon;

	const handleClick = (e: React.MouseEvent) => {
		if (isComingSoon) {
			e.preventDefault();
			e.stopPropagation();
			console.log(`${title} - Coming soon`);
		}
	};

	return (
		<Box component="li" sx={{ userSelect: "none" }}>
			<Box
				{...(href && !isComingSoon
					? {
							component: external ? "a" : RouterLink,
							href,
							target: external ? "_blank" : undefined,
							rel: external ? "noreferrer" : undefined,
						}
					: { role: "button", onClick: handleClick })}
				sx={{
					alignItems: "center",
					borderRadius: 1,
					color: isComingSoon ? "var(--mui-palette-text-disabled)" : "var(--mui-palette-text-secondary)",
					cursor: isComingSoon ? "pointer" : "pointer",
					display: "flex",
					flex: "0 0 auto",
					gap: 1,
					p: "6px 16px",
					textDecoration: "none",
					whiteSpace: "nowrap",
					opacity: isComingSoon ? 0.6 : 1,
					...(disabled && { color: "var(--mui-palette-text-disabled)", cursor: "not-allowed" }),
					...(active && !isComingSoon && { bgcolor: "var(--mui-palette-action-selected)", color: "var(--mui-palette-text-primary)" }),
					"&:hover": {
						...(!active &&
							!disabled && { 
								bgcolor: isComingSoon ? "var(--mui-palette-action-hover)" : "var(--mui-palette-action-hover)", 
								color: isComingSoon ? "var(--mui-palette-text-disabled)" : "var(--mui-palette-text-primary)",
								opacity: isComingSoon ? 0.8 : 1,
							}),
					},
				}}
				tabIndex={0}
			>
				{Icon ? (
					<Box sx={{ alignItems: "center", display: "flex", justifyContent: "center", flex: "0 0 auto" }}>
						<Icon
							fill={active && !isComingSoon ? "var(--mui-palette-text-primary)" : isComingSoon ? "var(--mui-palette-text-disabled)" : "var(--mui-palette-text-secondary)"}
							fontSize="var(--icon-fontSize-md)"
							weight={active && !isComingSoon ? "fill" : undefined}
						/>
					</Box>
				) : null}
				<Box sx={{ flex: "1 1 auto", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
					<Typography
						component="span"
						sx={{ color: "inherit", fontSize: "0.875rem", fontWeight: 500, lineHeight: "28px" }}
					>
						{title}
					</Typography>
					{isComingSoon && (
						<Chip 
							label="Soon" 
							size="small" 
							color="primary"
							sx={{
								height: "18px",
								fontSize: "0.65rem",
								"& .MuiChip-label": {
									px: 0.75,
								},
							}}
						/>
					)}
				</Box>
			</Box>
		</Box>
	);
}

