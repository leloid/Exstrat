"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { paths } from "@/paths";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
	children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps): React.JSX.Element {
	const { isAuthenticated, isLoading } = useAuth();
	const router = useRouter();

	React.useEffect(() => {
		if (!isLoading && !isAuthenticated) {
			// Utiliser replace pour éviter que l'utilisateur puisse revenir en arrière
			router.replace(paths.auth.signIn);
		}
	}, [isAuthenticated, isLoading, router]);

	if (isLoading) {
		return (
			<Box
				sx={{
					alignItems: "center",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					minHeight: "100vh",
				}}
			>
				<Stack spacing={2} alignItems="center">
					<CircularProgress />
					<Typography variant="body1" color="text.secondary">
						Verifying authentication...
					</Typography>
				</Stack>
			</Box>
		);
	}

	if (!isAuthenticated) {
		return null;
	}

	return <>{children}</>;
}

