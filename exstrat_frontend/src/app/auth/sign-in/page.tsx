"use client";

import * as React from "react";
import RouterLink from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Link from "@mui/material/Link";
import OutlinedInput from "@mui/material/OutlinedInput";
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import { EyeIcon } from "@phosphor-icons/react/dist/ssr/Eye";
import { EyeSlashIcon } from "@phosphor-icons/react/dist/ssr/EyeSlash";
import { paths } from "@/paths";
import { CenteredLayout } from "@/components/auth/centered-layout";
import { AuthLogo } from "@/components/auth/auth-logo";
import { useAuth } from "@/contexts/AuthContext";
import type { SignInData } from "@/types/auth";

export default function Page(): React.JSX.Element {
	const router = useRouter();
	const { signIn, isAuthenticated } = useAuth();
	const [error, setError] = React.useState<string>("");
	const [isLoading, setIsLoading] = React.useState(false);
	const [isResendingEmail, setIsResendingEmail] = React.useState(false);
	const [resendSuccess, setResendSuccess] = React.useState(false);
	const [userEmail, setUserEmail] = React.useState<string>("");
	const [showPassword, setShowPassword] = React.useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		watch,
	} = useForm<SignInData>();

	// Watch email field to get the current email value
	const emailValue = watch("email");

	// Rediriger si déjà connecté
	React.useEffect(() => {
		if (isAuthenticated) {
			router.push(paths.dashboard.overview);
		}
	}, [isAuthenticated, router]);

	const onSubmit = async (data: SignInData) => {
		setIsLoading(true);
		setError("");
		setResendSuccess(false);
		setUserEmail(data.email);

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

	const handleResendVerification = async () => {
		if (!userEmail && !emailValue) return;

		const emailToUse = userEmail || emailValue;
		setIsResendingEmail(true);
		setResendSuccess(false);
		setError("");

		try {
			const api = (await import("@/lib/api")).api;
			await api.post("/auth/resend-verification-email", { email: emailToUse });
			setResendSuccess(true);
			setError("");
		} catch (error_: unknown) {
			const axiosError = error_ as { response?: { data?: { message?: string }; status?: number }; message?: string };
			setError(axiosError.response?.data?.message || "Error sending email. Please try again.");
		} finally {
			setIsResendingEmail(false);
		}
	};

	// Check if the error message is about email verification
	const isEmailVerificationError = React.useMemo(() => {
		if (!error) return false;
		const lowerError = error.toLowerCase();
		return (
			lowerError.includes("vérifier votre email") ||
			lowerError.includes("verify your email") ||
			lowerError.includes("email de vérification") ||
			lowerError.includes("verification email")
		);
	}, [error]);

	return (
		<CenteredLayout>
			<Stack spacing={4}>
				<AuthLogo />
				<Card>
					<CardHeader
						title={
							<Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
								Sign in
							</Typography>
						}
					/>
					<CardContent>
						<form onSubmit={handleSubmit(onSubmit)}>
							<Stack spacing={2}>
								{error && (
									<Alert severity="error" onClose={() => setError("")}>
										{isEmailVerificationError ? (
											<Stack spacing={1}>
												<Typography variant="body2">
													Veuillez vérifier votre email avant de vous connecter. Un email de vérification a été envoyé lors de votre inscription.
												</Typography>
												<Typography variant="body2">
													Vous n&apos;avez pas reçu l&apos;email ?{" "}
													<Link
														component="button"
														type="button"
														onClick={handleResendVerification}
														disabled={isResendingEmail}
														sx={{
															cursor: isResendingEmail ? "not-allowed" : "pointer",
															textDecoration: "underline",
															"&:hover": {
																textDecoration: "underline",
															},
														}}
													>
														{isResendingEmail ? "Sending..." : "Resend verification email"}
													</Link>
												</Typography>
											</Stack>
										) : (
											error
										)}
									</Alert>
								)}
								{resendSuccess && (
									<Alert severity="success" onClose={() => setResendSuccess(false)}>
										Verification email sent successfully. Please check your inbox.
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
											type={showPassword ? "text" : "password"}
											label="Password"
											endAdornment={
												<InputAdornment position="end">
													<IconButton
														onClick={() => setShowPassword(!showPassword)}
														onMouseDown={(e) => e.preventDefault()}
														edge="end"
														aria-label="toggle password visibility"
													>
														{showPassword ? (
															<EyeSlashIcon fontSize="var(--icon-fontSize-md)" />
														) : (
															<EyeIcon fontSize="var(--icon-fontSize-md)" />
														)}
													</IconButton>
												</InputAdornment>
											}
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
					<CardContent sx={{ pt: 0 }}>
						<Typography color="text.secondary" variant="body2" align="center">
							Don&apos;t have an account?{" "}
							<Link component={RouterLink} href={paths.auth.signUp} variant="subtitle2">
								Sign up
							</Link>
						</Typography>
					</CardContent>
				</Card>
			</Stack>
		</CenteredLayout>
	);
}

