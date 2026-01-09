"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";

import { paths } from "@/paths";
import { useAuth } from "@/contexts/AuthContext";

export default function Page(): React.JSX.Element {
	const router = useRouter();
	const { signOut } = useAuth();
	const [hasSignedOut, setHasSignedOut] = React.useState(false);

	React.useEffect(() => {
		const handleSignOut = async () => {
			if (hasSignedOut) return;

			setHasSignedOut(true);
			try {
				await signOut();
			} catch (error) {
				console.error("Error during sign out:", error);
			} finally {
				// Redirect to sign in page after sign out
				router.push(paths.auth.signIn);
			}
		};

		handleSignOut();
	}, [hasSignedOut, signOut, router]);

	return (
		<Box
			sx={{
				alignItems: "center",
				display: "flex",
				flexDirection: "column",
				justifyContent: "center",
				minHeight: "100%",
			}}
		>
			<Stack spacing={2} alignItems="center">
				<CircularProgress />
				<Typography variant="body1" color="text.secondary">
					Signing out...
				</Typography>
			</Stack>
		</Box>
	);
}

