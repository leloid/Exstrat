"use client";

import * as React from "react";
import RouterLink from "next/link";
import { usePathname } from "next/navigation";
import Avatar from "@mui/material/Avatar";
import Badge from "@mui/material/Badge";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import { useColorScheme } from "@mui/material/styles";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";
import { ArrowSquareOutIcon } from "@phosphor-icons/react/dist/ssr/ArrowSquareOut";
import { BellIcon } from "@phosphor-icons/react/dist/ssr/Bell";
import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import { CaretRightIcon } from "@phosphor-icons/react/dist/ssr/CaretRight";
import { GlobeIcon } from "@phosphor-icons/react/dist/ssr/Globe";
import { ListIcon } from "@phosphor-icons/react/dist/ssr/List";
import { MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr/MagnifyingGlass";
import { UsersIcon } from "@phosphor-icons/react/dist/ssr/Users";

import type { NavItemConfig } from "@/types/nav";
import type { DashboardNavColor } from "@/types/settings";
import { paths } from "@/paths";
import { isNavItemActive } from "@/lib/is-nav-item-active";
import { useDialog } from "@/hooks/use-dialog";
import { usePopover } from "@/hooks/use-popover";
import { Dropdown } from "@/components/core/dropdown/dropdown";
import { DropdownPopover } from "@/components/core/dropdown/dropdown-popover";
import { DropdownTrigger } from "@/components/core/dropdown/dropdown-trigger";
import { SearchDialog } from "@/components/dashboard/layout/search-dialog";
import type { ColorScheme } from "@/styles/theme/types";

import { ContactsPopover } from "../contacts-popover";
import { LanguagePopover } from "../language-popover";
import { MobileNav } from "../mobile-nav";
import { icons } from "../nav-icons";
import { NotificationsPopover } from "../notifications-popover";
import { UserPopover } from "../user-popover";
import { useAuth } from "@/contexts/AuthContext";
import { navColorStyles } from "./styles";
import { SecretModeButton } from "../secret-mode-button";
import { useRouter } from "next/navigation";
import { appConfig } from "@/config/app";
import { dashboardConfig } from "@/config/dashboard";
import { setSettings as setPersistedSettings } from "@/lib/settings";
import { useSettings } from "@/components/core/settings/settings-context";
import type { Settings } from "@/types/settings";
import type { Mode } from "@/styles/theme/types";
import { SettingsDrawer } from "@/components/core/settings/settings-drawer";

const logoColors = {
	dark: { blend_in: "light", discrete: "light", evident: "light" },
	light: { blend_in: "dark", discrete: "dark", evident: "light" },
} as Record<ColorScheme, Record<DashboardNavColor, "dark" | "light">>;

export interface MainNavProps {
	color?: DashboardNavColor;
	items?: NavItemConfig[];
	gettingStartedItem?: NavItemConfig;
}

export function MainNav({ color = "evident", items = [], gettingStartedItem }: MainNavProps): React.JSX.Element {
	const pathname = usePathname();

	const [openNav, setOpenNav] = React.useState<boolean>(false);

	const { colorScheme = "light" } = useColorScheme();

	const styles = navColorStyles[colorScheme][color];
	const logoColor = logoColors[colorScheme][color];

	return (
		<React.Fragment>
			<Box
				component="header"
				sx={{
					...styles,
					bgcolor: "var(--MainNav-background)",
					border: "var(--MainNav-border)",
					color: "var(--MainNav-color)",
					left: 0,
					position: "sticky",
					top: 0,
					zIndex: "var(--MainNav-zIndex)",
				}}
			>
				<Box
					sx={{
						display: "flex",
						flex: "1 1 auto",
						minHeight: "var(--MainNav-height, 72px)",
						px: { xs: 2, sm: 3 },
						py: 1,
					}}
				>
					<Stack direction="row" spacing={2} sx={{ alignItems: "center", flex: "1 1 auto" }}>
						<IconButton
							onClick={(): void => {
								setOpenNav(true);
							}}
							sx={{ display: { md: "none" } }}
						>
							<ListIcon color="var(--mui-palette-secondary-main)" />
						</IconButton>
						<Box component={RouterLink} href={paths.home} sx={{ display: { xs: "none", md: "inline-block" } }}>
							<Box
								component="img"
							src={
								colorScheme === "dark"
									? "/logo_large_dark_theme.svg"
									: color === "blend_in" || color === "discrete"
										? "/DarkFullLogo.svg"
										: "/logo_large_dark_theme.svg"
							}
								alt="exStrat"
								sx={{ height: "auto", maxWidth: "200px", width: "auto" }}
							/>
						</Box>
					</Stack>
					<Stack
						direction="row"
						spacing={2}
						sx={{ alignItems: "center", flex: "1 1 auto", justifyContent: "flex-end" }}
					>
						<SearchButton />
						<SecretModeButton />
						<NotificationsButton />
						<ContactsButton />
						<Divider
							flexItem
							orientation="vertical"
							sx={{ borderColor: "var(--MainNav-divider)", display: { xs: "none", md: "block" } }}
						/>
						<LanguageSwitch />
						<UserButton />
					</Stack>
				</Box>
				<Box
					component="nav"
					sx={{
						borderTop: "1px solid var(--MainNav-divider)",
						display: { xs: "none", md: "flex" },
						minHeight: "56px",
						overflowX: "auto",
						justifyContent: "space-between",
						alignItems: "center",
						px: 2,
					}}
				>
					<Box sx={{ flex: "1 1 auto" }}>
						{renderNavGroups({ items, pathname })}
					</Box>
					{/* Getting Started et Settings tout à droite */}
					{gettingStartedItem && (
						<Box sx={{ ml: "auto" }}>
							{gettingStartedItem.items ? (
								// Si c'est un groupe avec items, afficher directement les items sans menu déroulant
								renderNavItems({ items: gettingStartedItem.items, pathname })
							) : (
								// Sinon, afficher l'item normalement
								renderNavItems({ items: [gettingStartedItem], pathname })
							)}
						</Box>
					)}
				</Box>
			</Box>
			<MobileNav
				color={color}
				items={items}
				onClose={() => {
					setOpenNav(false);
				}}
				open={openNav}
			/>
		</React.Fragment>
	);
}

function SearchButton(): React.JSX.Element {
	const dialog = useDialog();

	return (
		<React.Fragment>
			<Tooltip title="Search">
				<IconButton onClick={dialog.handleOpen} sx={{ display: { xs: "none", md: "inline-flex" } }}>
					<MagnifyingGlassIcon color="var(--mui-palette-secondary-main)" />
				</IconButton>
			</Tooltip>
			<SearchDialog onClose={dialog.handleClose} open={dialog.open} />
		</React.Fragment>
	);
}

function NotificationsButton(): React.JSX.Element {
	const popover = usePopover<HTMLButtonElement>();

	return (
		<React.Fragment>
			<Tooltip title="Notifications">
				<Badge
					color="error"
					sx={{ "& .MuiBadge-dot": { borderRadius: "50%", height: "10px", right: "6px", top: "6px", width: "10px" } }}
					variant="dot"
				>
					<IconButton onClick={popover.handleOpen} ref={popover.anchorRef}>
						<BellIcon color="var(--mui-palette-secondary-main)" />
					</IconButton>
				</Badge>
			</Tooltip>
			<NotificationsPopover anchorEl={popover.anchorRef.current} onClose={popover.handleClose} open={popover.open} />
		</React.Fragment>
	);
}

function ContactsButton(): React.JSX.Element {
	const popover = usePopover<HTMLButtonElement>();

	return (
		<React.Fragment>
			<Tooltip title="Contacts">
				<IconButton onClick={popover.handleOpen} ref={popover.anchorRef}>
					<UsersIcon color="var(--mui-palette-secondary-main)" />
				</IconButton>
			</Tooltip>
			<ContactsPopover anchorEl={popover.anchorRef.current} onClose={popover.handleClose} open={popover.open} />
		</React.Fragment>
	);
}

function LanguageSwitch(): React.JSX.Element {
	const popover = usePopover<HTMLButtonElement>();

	return (
		<React.Fragment>
			<Tooltip title="Language">
				<IconButton
					onClick={popover.handleOpen}
					ref={popover.anchorRef}
					sx={{ display: { xs: "none", md: "inline-flex" } }}
				>
					<GlobeIcon fontSize="var(--icon-fontSize-md)" />
				</IconButton>
			</Tooltip>
			<LanguagePopover anchorEl={popover.anchorRef.current} onClose={popover.handleClose} open={popover.open} />
		</React.Fragment>
	);
}

function UserButton(): React.JSX.Element {
	const popover = usePopover<HTMLButtonElement>();
	const { user } = useAuth();
	const userInitial = user?.firstName?.charAt(0).toUpperCase() || user?.lastName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U";

	return (
		<React.Fragment>
			<Box
				component="button"
				onClick={popover.handleOpen}
				ref={popover.anchorRef}
				sx={{ border: "none", background: "transparent", cursor: "pointer", p: 0 }}
			>
				<Badge
					anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
					color="success"
					sx={{
						"& .MuiBadge-dot": {
							border: "2px solid var(--MainNav-background)",
							borderRadius: "50%",
							bottom: "6px",
							height: "12px",
							right: "6px",
							width: "12px",
						},
					}}
					variant="dot"
				>
					<Avatar>{userInitial}</Avatar>
				</Badge>
			</Box>
			<UserPopover anchorEl={popover.anchorRef.current} onClose={popover.handleClose} open={popover.open} />
		</React.Fragment>
	);
}

function renderNavGroups({ items = [], pathname }: { items?: NavItemConfig[]; pathname: string }): React.JSX.Element {
	const children = items.reduce((acc: React.ReactNode[], curr: NavItemConfig): React.ReactNode[] => {
		// Aplatir tous les items sans afficher les titres de sections
		if (curr.items) {
			curr.items.forEach((item) => {
				const { key, ...itemProps } = item;
				acc.push(<NavItem key={key} pathname={pathname} {...itemProps} />);
			});
		}

		return acc;
	}, []);

	return (
		<Stack component="ul" direction="row" spacing={1.5} sx={{ listStyle: "none", m: 0, p: 0 }}>
			{children}
		</Stack>
	);
}

function renderNavItems({ items = [], pathname }: { items?: NavItemConfig[]; pathname: string }): React.JSX.Element {
	const children = items.reduce((acc: React.ReactNode[], curr: NavItemConfig): React.ReactNode[] => {
		const { key, ...item } = curr;

		acc.push(<NavItem key={key} pathname={pathname} {...item} />);

		return acc;
	}, []);

	return (
		<Stack component="ul" direction="row" spacing={2} sx={{ listStyle: "none", m: 0, p: 0 }}>
			{children}
		</Stack>
	);
}

interface NavItemProps extends NavItemConfig {
	pathname: string;
}

function NavItem({
	disabled,
	external,
	items,
	href,
	icon,
	label,
	matcher,
	pathname,
	title,
}: NavItemProps): React.JSX.Element {
	const [openSettingsDrawer, setOpenSettingsDrawer] = React.useState(false);
	const { settings } = useSettings();
	const { mode, setMode } = useColorScheme();
	const router = useRouter();
	
	const active = isNavItemActive({ disabled, external, href, matcher, pathname });
	const Icon = icon ? icons[icon] : null;
	const isBranch = Boolean(items);
	const isSettings = href === "#settings";

	const handleSettingsClick = () => {
		setOpenSettingsDrawer(true);
	};

	const handleSettingsUpdate = async (values: Partial<Settings> & { theme?: Mode }): Promise<void> => {
		const { theme, ...other } = values;

		if (theme) {
			setMode(theme);
		}

		const updatedSettings = { ...settings, ...other } satisfies Settings;

		await setPersistedSettings(updatedSettings);
		router.refresh();
	};

	const handleSettingsReset = async (): Promise<void> => {
		setMode(null);
		await setPersistedSettings({});
		router.refresh();
	};

	const element = (
		<Box component="li" sx={{ userSelect: "none" }}>
			<Box
				{...(isBranch
					? { role: "button" }
					: {
							...(isSettings
								? {
										onClick: handleSettingsClick,
										role: "button",
									}
								: href
									? {
											component: external ? "a" : RouterLink,
											href,
											target: external ? "_blank" : undefined,
											rel: external ? "noreferrer" : undefined,
										}
									: { role: "button" }),
						})}
				sx={{
					alignItems: "center",
					borderRadius: 1,
					color: "var(--NavItem-color)",
					cursor: "pointer",
					display: "flex",
					flex: "0 0 auto",
					gap: 1,
					p: "6px 16px",
					textDecoration: "none",
					whiteSpace: "nowrap",
					...(disabled && {
						bgcolor: "var(--NavItem-disabled-background)",
						color: "var(--NavItem-disabled-color)",
						cursor: "not-allowed",
					}),
					...(active && { bgcolor: "var(--NavItem-active-background)", color: "var(--NavItem-active-color)" }),
					"&:hover": {
						...(!disabled &&
							!active && { bgcolor: "var(--NavItem-hover-background)", color: "var(--NavItem-hover-color)" }),
					},
				}}
				tabIndex={0}
			>
				{Icon ? (
					<Box sx={{ alignItems: "center", display: "flex", justifyContent: "center", flex: "0 0 auto" }}>
						<Icon
							fill={active ? "var(--NavItem-icon-active-color)" : "var(--NavItem-icon-color)"}
							fontSize="var(--icon-fontSize-md)"
							weight={active ? "fill" : undefined}
						/>
					</Box>
				) : null}
				<Box sx={{ flex: "1 1 auto" }}>
					<Typography
						component="span"
						sx={{ color: "inherit", fontSize: "0.875rem", fontWeight: 500, lineHeight: "28px" }}
					>
						{title}
					</Typography>
				</Box>
				{label ? <Chip color="primary" label={label} size="small" /> : null}
				{external ? (
					<Box sx={{ alignItems: "center", display: "flex", flex: "0 0 auto" }}>
						<ArrowSquareOutIcon color="var(--NavItem-icon-color)" fontSize="var(--icon-fontSize-sm)" />
					</Box>
				) : null}
				{isBranch ? (
					<Box sx={{ alignItems: "center", display: "flex", flex: "0 0 auto" }}>
						<CaretDownIcon fontSize="var(--icon-fontSize-sm)" />
					</Box>
				) : null}
			</Box>
		</Box>
	);

	if (items) {
		return (
			<Dropdown>
				<DropdownTrigger>{element}</DropdownTrigger>
				<DropdownPopover
					PaperProps={{ sx: { minWidth: "200px", p: 1 } }}
					anchorOrigin={{ horizontal: "left", vertical: "bottom" }}
				>
					{renderDropdownItems({ pathname, items })}
				</DropdownPopover>
			</Dropdown>
		);
	}

	return (
		<>
			{element}
			{isSettings && (
				<SettingsDrawer
					onClose={() => {
						setOpenSettingsDrawer(false);
					}}
					onReset={handleSettingsReset}
					onUpdate={handleSettingsUpdate}
					open={openSettingsDrawer}
					values={{
						direction: settings.direction ?? appConfig.direction,
						theme: mode,
						primaryColor: settings.primaryColor ?? appConfig.primaryColor,
						dashboardLayout: settings.dashboardLayout ?? dashboardConfig.layout,
						dashboardNavColor: settings.dashboardNavColor ?? dashboardConfig.navColor,
					}}
				/>
			)}
		</>
	);
}

function renderDropdownItems({
	items = [],
	pathname,
}: {
	items?: NavItemConfig[];
	pathname: string;
}): React.JSX.Element {
	const children = items.reduce((acc: React.ReactNode[], curr: NavItemConfig): React.ReactNode[] => {
		const { key, ...item } = curr;

		acc.push(<DropdownItem key={key} pathname={pathname} {...item} />);

		return acc;
	}, []);

	return (
		<Stack component="ul" spacing={1} sx={{ listStyle: "none", m: 0, p: 0 }}>
			{children}
		</Stack>
	);
}

interface DropdownItemProps extends NavItemConfig {
	pathname: string;
}

function DropdownItem({
	disabled,
	external,
	items,
	href,
	matcher,
	pathname,
	title,
}: DropdownItemProps): React.JSX.Element {
	const active = isNavItemActive({ disabled, external, href, matcher, pathname });
	const isBranch = Boolean(items);

	const element = (
		<Box component="li" sx={{ userSelect: "none" }}>
			<Box
				{...(isBranch
					? { role: "button" }
					: {
							...(href
								? {
										component: external ? "a" : RouterLink,
										href,
										target: external ? "_blank" : undefined,
										rel: external ? "noreferrer" : undefined,
									}
								: { role: "button" }),
						})}
				sx={{
					alignItems: "center",
					borderRadius: 1,
					color: "var(--NavItem-color)",
					cursor: "pointer",
					display: "flex",
					flex: "0 0 auto",
					p: "6px 16px",
					textDecoration: "none",
					whiteSpace: "nowrap",
					...(disabled && {
						bgcolor: "var(--mui-palette-action-disabledBackground)",
						color: "var(--mui-action-disabled)",
						cursor: "not-allowed",
					}),
					...(active && { bgcolor: "var(--mui-palette-action-selected)", color: "var(--mui-palette-action-active)" }),
					"&:hover": {
						...(!disabled &&
							!active && { bgcolor: "var(--mui-palette-action-hover)", color: "var(--mui-palette-action-color)" }),
					},
				}}
				tabIndex={0}
			>
				<Box sx={{ flex: "1 1 auto" }}>
					<Typography
						component="span"
						sx={{ color: "inherit", fontSize: "0.875rem", fontWeight: 500, lineHeight: "28px" }}
					>
						{title}
					</Typography>
				</Box>
				{isBranch ? (
					<Box sx={{ flex: "0 0 auto" }}>
						<CaretRightIcon fontSize="var(--icon-fontSize-sm)" />
					</Box>
				) : null}
			</Box>
		</Box>
	);

	if (items) {
		return (
			<Dropdown>
				<DropdownTrigger>{element}</DropdownTrigger>
				<DropdownPopover
					PaperProps={{ sx: { minWidth: "200px", p: 1 } }}
					anchorOrigin={{ horizontal: "right", vertical: "top" }}
				>
					{renderDropdownItems({ pathname, items })}
				</DropdownPopover>
			</Dropdown>
		);
	}

	return element;
}
