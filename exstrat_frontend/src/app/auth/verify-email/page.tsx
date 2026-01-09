"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RouterLink from "next/link";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";

import { paths } from "@/paths";
import { CenteredLayout } from "@/components/auth/centered-layout";
import { AuthLogo } from "@/components/auth/auth-logo";
import api from "@/lib/api";

interface VerifyEmailResponse {
	message: string;
}

export default function Page(): React.JSX.Element {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [isLoading, setIsLoading] = React.useState(true);
	const [success, setSuccess] = React.useState(false);
	const [error, setError] = React.useState<string>("");

	React.useEffect(() => {
		const verifyEmail = async () => {
			if (!token) {
				setError("Token missing");
				setIsLoading(false);
				return;
			}

			try {
				await api.post<VerifyEmailResponse>("/auth/verify-email", { token });
				setSuccess(true);
				// Redirect to sign in page after 3 seconds
				setTimeout(() => {
					router.push(paths.auth.signIn);
				}, 3000);
			} catch (error_: unknown) {
				const axiosError = error_ as { response?: { data?: { message?: string }; status?: number }; message?: string };
				
				if (axiosError.response?.status === 400) {
					setError(axiosError.response.data?.message || "Invalid or expired token");
				} else if (axiosError.response?.status === 500) {
					setError("Server error. Please try again later.");
				} else if (axiosError.message) {
					setError(axiosError.message);
				} else {
					setError(axiosError.response?.data?.message || "An error occurred. Please try again.");
				}
			} finally {
				setIsLoading(false);
			}
		};

		verifyEmail();
	}, [token, router]);

	return (
		<CenteredLayout>
			<Stack spacing={4}>
				<AuthLogo />
				<Card>
					<CardHeader
						title={
							<Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
								Email verification
							</Typography>
						}
					/>
					<CardContent>
						{isLoading ? (
							<Stack spacing={2} alignItems="center">
								<CircularProgress />
								<Typography color="text.secondary" variant="body2">
									Verifying...
								</Typography>
							</Stack>
						) : success ? (
							<Stack spacing={2}>
								<Alert severity="success">
									Your email has been verified successfully! Redirecting to sign in page...
								</Alert>
								<Button component={RouterLink} href={paths.auth.signIn} variant="contained" fullWidth>
									Sign in now
								</Button>
							</Stack>
						) : (
							<Stack spacing={2}>
								<Alert severity="error">
									{error || "An error occurred while verifying your email."}
								</Alert>
								<Button component={RouterLink} href={paths.auth.signIn} variant="contained" fullWidth>
									Back to sign in
								</Button>
							</Stack>
						)}
					</CardContent>
				</Card>
			</Stack>
		</CenteredLayout>
	);
}

