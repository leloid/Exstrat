"use client";

import * as React from "react";
import RouterLink from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Link from "@mui/material/Link";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { paths } from "@/paths";
import { CenteredLayout } from "@/components/auth/centered-layout";
import { useAuth } from "@/contexts/AuthContext";
import type { SignInData } from "@/types/auth";

export default function Page(): React.JSX.Element {
	const router = useRouter();
	const { signIn, isAuthenticated } = useAuth();
	const [error, setError] = React.useState<string>("");
	const [isLoading, setIsLoading] = React.useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SignInData>();

	// Rediriger si déjà connecté
	React.useEffect(() => {
		if (isAuthenticated) {
			router.push(paths.dashboard.overview);
		}
	}, [isAuthenticated, router]);

	const onSubmit = async (data: SignInData) => {
		setIsLoading(true);
		setError("");

		try {
			await signIn(data);
			router.push(paths.dashboard.overview);
		} catch (error_: unknown) {
			const error = error_ as Error | { message?: string };
			const errorMessage = error instanceof Error ? error.message : error.message || "An error occurred during sign in";
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<CenteredLayout>
			<Stack spacing={4}>
				<div>
					<Box component={RouterLink} href={paths.home} sx={{ display: "inline-block", fontSize: 0 }}>
						<Box
							component="img"
							src="/Full_logo.svg"
							alt="ExStrat"
							sx={{ height: "auto", maxWidth: "200px", width: "auto" }}
						/>
					</Box>
				</div>
				<Card>
					<CardHeader
						subheader={
							<Typography color="text.secondary" variant="body2">
								Don&apos;t have an account?{" "}
								<Link component={RouterLink} href={paths.auth.signUp} variant="subtitle2">
									Sign up
								</Link>
							</Typography>
						}
						title="Sign in"
					/>
					<CardContent>
						<form onSubmit={handleSubmit(onSubmit)}>
							<Stack spacing={2}>
								{error && (
									<Alert severity="error" onClose={() => setError("")}>
										{error}
									</Alert>
								)}
								<Stack spacing={2}>
									<FormControl error={!!errors.email}>
										<InputLabel>Email address</InputLabel>
										<OutlinedInput
											{...register("email", {
												required: "Email is required",
												pattern: {
													value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
													message: "Invalid email format",
												},
											})}
											type="email"
											label="Email address"
										/>
										{errors.email && (
											<Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
												{errors.email.message}
											</Typography>
										)}
									</FormControl>
									<FormControl error={!!errors.password}>
										<InputLabel>Password</InputLabel>
										<OutlinedInput
											{...register("password", {
												required: "Password is required",
												minLength: {
													value: 8,
													message: "Password must contain at least 8 characters",
												},
											})}
											type="password"
											label="Password"
										/>
										{errors.password && (
											<Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
												{errors.password.message}
											</Typography>
										)}
									</FormControl>
									<Button type="submit" variant="contained" disabled={isLoading} fullWidth>
										{isLoading ? "Signing in..." : "Sign in"}
									</Button>
								</Stack>
								<div>
									<Link component={RouterLink} href={paths.auth.resetPassword} variant="subtitle2">
										Forgot password?
									</Link>
								</div>
							</Stack>
						</form>
					</CardContent>
				</Card>
			</Stack>
		</CenteredLayout>
	);
}

