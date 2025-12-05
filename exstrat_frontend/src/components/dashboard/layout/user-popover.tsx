"use client";

import * as React from "react";
import RouterLink from "next/link";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItemIcon from "@mui/material/ListItemIcon";
import MenuItem from "@mui/material/MenuItem";
import Popover from "@mui/material/Popover";
import Typography from "@mui/material/Typography";
import { CreditCardIcon } from "@phosphor-icons/react/dist/ssr/CreditCard";
import { LockKeyIcon } from "@phosphor-icons/react/dist/ssr/LockKey";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";

import { appConfig } from "@/config/app";
import { paths } from "@/paths";
import { AuthStrategy } from "@/lib/auth-strategy";
import { useAuth } from "@/contexts/AuthContext";

const user = {
	id: "USR-000",
	name: "Sofia Rivers",
	avatar: "/assets/avatar.png",
	email: "sofia@devias.io",
} as const;

function SignOutButton({ onClose }: { onClose?: () => void }): React.JSX.Element {
	const router = useRouter();
	const { signOut } = useAuth();
	const [isLoading, setIsLoading] = React.useState(false);

	const handleSignOut = async () => {
		if (isLoading) return;
		
		setIsLoading(true);
		onClose?.();

		try {
			await signOut();
			// Utiliser replace pour éviter que l'utilisateur puisse revenir en arrière
			router.replace(paths.auth.signIn);
		} catch (error) {
			console.error("Erreur lors de la déconnexion:", error);
			// Rediriger quand même vers la page de connexion
			router.replace(paths.auth.signIn);
		} finally {
			setIsLoading(false);
		}
	};

	// Pour les autres stratégies d'auth, utiliser l'ancien comportement
	if (
		appConfig.authStrategy === AuthStrategy.AUTH0 ||
		appConfig.authStrategy === AuthStrategy.CLERK ||
		appConfig.authStrategy === AuthStrategy.COGNITO ||
		appConfig.authStrategy === AuthStrategy.SUPABASE
	) {
		let signOutUrl: string = paths.auth.signOut;

		if (appConfig.authStrategy === AuthStrategy.AUTH0) {
			signOutUrl = paths.auth.auth0.signOut;
		}

		if (appConfig.authStrategy === AuthStrategy.CLERK) {
			signOutUrl = paths.auth.clerk.signOut;
		}

		if (appConfig.authStrategy === AuthStrategy.COGNITO) {
			signOutUrl = paths.auth.cognito.signOut;
		}

		if (appConfig.authStrategy === AuthStrategy.SUPABASE) {
			signOutUrl = paths.auth.supabase.signOut;
		}

		return (
			<MenuItem component="a" href={signOutUrl} sx={{ justifyContent: "center" }}>
				Sign out
			</MenuItem>
		);
	}

	return (
		<MenuItem onClick={handleSignOut} disabled={isLoading} sx={{ justifyContent: "center" }}>
			{isLoading ? "Déconnexion..." : "Sign out"}
		</MenuItem>
	);
}

export interface UserPopoverProps {
	anchorEl: null | Element;
	onClose?: () => void;
	open: boolean;
}

export function UserPopover({ anchorEl, onClose, open }: UserPopoverProps): React.JSX.Element {
	return (
		<Popover
			anchorEl={anchorEl}
			anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
			onClose={onClose}
			open={Boolean(open)}
			slotProps={{ paper: { sx: { width: "280px" } } }}
			transformOrigin={{ horizontal: "right", vertical: "top" }}
		>
			<Box sx={{ p: 2 }}>
				<Typography>{user.name}</Typography>
				<Typography color="text.secondary" variant="body2">
					{user.email}
				</Typography>
			</Box>
			<Divider />
			<List sx={{ p: 1 }}>
				<MenuItem component={RouterLink} href={paths.dashboard.settings.account} onClick={onClose}>
					<ListItemIcon>
						<UserIcon />
					</ListItemIcon>
					Account
				</MenuItem>
				<MenuItem component={RouterLink} href={paths.dashboard.settings.security} onClick={onClose}>
					<ListItemIcon>
						<LockKeyIcon />
					</ListItemIcon>
					Security
				</MenuItem>
				<MenuItem component={RouterLink} href={paths.dashboard.settings.billing} onClick={onClose}>
					<ListItemIcon>
						<CreditCardIcon />
					</ListItemIcon>
					Billing
				</MenuItem>
			</List>
			<Divider />
			<Box sx={{ p: 1 }}>
				<SignOutButton onClose={onClose} />
			</Box>
		</Popover>
	);
}
