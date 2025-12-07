"use client";

import * as React from "react";
import RouterLink from "next/link";
import { useForm } from "react-hook-form";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import OutlinedInput from "@mui/material/OutlinedInput";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";

import { paths } from "@/paths";
import { CenteredLayout } from "@/components/auth/centered-layout";

interface ResetPasswordForm {
	email: string;
}

export default function Page(): React.JSX.Element {
	const [isLoading, setIsLoading] = React.useState(false);
	const [success, setSuccess] = React.useState(false);
	const [error, setError] = React.useState<string>("");

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<ResetPasswordForm>();

	const onSubmit = async (_data: ResetPasswordForm) => {
		setIsLoading(true);
		setError("");
		setSuccess(false);

		try {
			// TODO: Implémenter l'appel API pour réinitialiser le mot de passe
			// await api.post("/auth/reset-password", { email: _data.email });
			
			// Simulation pour l'instant
			await new Promise((resolve) => setTimeout(resolve, 1000));
			setSuccess(true);
		} catch (error_: unknown) {
			const error = error_ as Error | { message?: string };
			const errorMessage = error instanceof Error ? error.message : error.message || "An error occurred. Please try again.";
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
					<CardHeader title="Reset password" />
					<CardContent>
						{success ? (
							<Stack spacing={2}>
								<Alert severity="success">
									If an account exists with this email address, you will receive a password recovery link.
								</Alert>
								<Button component={RouterLink} href={paths.auth.signIn} variant="contained" fullWidth>
									Back to sign in
								</Button>
							</Stack>
						) : (
							<form onSubmit={handleSubmit(onSubmit)}>
								<Stack spacing={2}>
									{error && (
										<Alert severity="error" onClose={() => setError("")}>
											{error}
										</Alert>
									)}
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
									<Button type="submit" variant="contained" disabled={isLoading} fullWidth>
										{isLoading ? "Sending..." : "Send recovery link"}
									</Button>
									<div>
										<Typography variant="body2" color="text.secondary" align="center">
											Remember your password?{" "}
											<RouterLink href={paths.auth.signIn} style={{ textDecoration: "none" }}>
												<Typography component="span" variant="subtitle2" color="primary">
													Sign in
												</Typography>
											</RouterLink>
										</Typography>
									</div>
								</Stack>
							</form>
						)}
					</CardContent>
				</Card>
			</Stack>
		</CenteredLayout>
	);
}

