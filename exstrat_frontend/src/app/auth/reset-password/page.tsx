"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import RouterLink from "next/link";
import { useForm } from "react-hook-form";
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
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import { EyeIcon } from "@phosphor-icons/react/dist/ssr/Eye";
import { EyeSlashIcon } from "@phosphor-icons/react/dist/ssr/EyeSlash";

import { paths } from "@/paths";
import { CenteredLayout } from "@/components/auth/centered-layout";
import { AuthLogo } from "@/components/auth/auth-logo";
import api from "@/lib/api";

interface ForgotPasswordForm {
	email: string;
}

interface ResetPasswordForm {
	password: string;
	confirmPassword: string;
}

interface ForgotPasswordResponse {
	message: string;
}

interface ResetPasswordResponse {
	message: string;
}

export default function Page(): React.JSX.Element {
	const router = useRouter();
	const searchParams = useSearchParams();
	const token = searchParams.get("token");

	const [isLoading, setIsLoading] = React.useState(false);
	const [success, setSuccess] = React.useState(false);
	const [error, setError] = React.useState<string>("");
	const [showPassword, setShowPassword] = React.useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

	const forgotPasswordForm = useForm<ForgotPasswordForm>();
	const resetPasswordForm = useForm<ResetPasswordForm>();

	// Si un token est présent, on est en mode réinitialisation
	const isResetMode = !!token;

	const onSubmitForgotPassword = async (data: ForgotPasswordForm) => {
		setIsLoading(true);
		setError("");
		setSuccess(false);

		try {
			await api.post<ForgotPasswordResponse>("/auth/forgot-password", { email: data.email });
			setSuccess(true);
		} catch (error_: unknown) {
			const axiosError = error_ as { response?: { data?: { message?: string }; status?: number }; message?: string };
			
			if (axiosError.response?.status === 400) {
				setError(axiosError.response.data?.message || "Invalid email");
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

	const onSubmitResetPassword = async (data: ResetPasswordForm) => {
		if (data.password !== data.confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		if (!token) {
			setError("Token missing");
			return;
		}

		setIsLoading(true);
		setError("");
		setSuccess(false);

		try {
			await api.post<ResetPasswordResponse>("/auth/reset-password", {
				token,
				password: data.password,
			});
			setSuccess(true);
			// Redirect to sign in page after 2 seconds
			setTimeout(() => {
				router.push(paths.auth.signIn);
			}, 2000);
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

	return (
		<CenteredLayout>
			<Stack spacing={4}>
				<AuthLogo />
				<Card>
					<CardHeader
						title={
							<Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
								{isResetMode ? "New password" : "Reset password"}
							</Typography>
						}
					/>
					<CardContent>
						{success ? (
							<Stack spacing={2}>
								<Alert severity="success">
									{isResetMode
										? "Your password has been reset successfully. Redirecting to sign in page..."
										: "If an account exists with this email, a reset link has been sent."}
								</Alert>
								{!isResetMode && (
									<Button component={RouterLink} href={paths.auth.signIn} variant="contained" fullWidth>
										Back to sign in
									</Button>
								)}
							</Stack>
						) : isResetMode ? (
							<form onSubmit={resetPasswordForm.handleSubmit(onSubmitResetPassword)}>
								<Stack spacing={2}>
									{error && (
										<Alert severity="error" onClose={() => setError("")}>
											{error}
										</Alert>
									)}
									<FormControl error={!!resetPasswordForm.formState.errors.password}>
										<InputLabel>New password</InputLabel>
										<OutlinedInput
											{...resetPasswordForm.register("password", {
												required: "Password is required",
												minLength: {
													value: 8,
													message: "Password must contain at least 8 characters",
												},
												pattern: {
													value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
													message: "Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character",
												},
											})}
											type={showPassword ? "text" : "password"}
											label="New password"
											endAdornment={
												<InputAdornment position="end">
													<IconButton
														onClick={() => setShowPassword(!showPassword)}
														edge="end"
														aria-label="toggle password visibility"
													>
														{showPassword ? <EyeSlashIcon /> : <EyeIcon />}
													</IconButton>
												</InputAdornment>
											}
										/>
										{resetPasswordForm.formState.errors.password && (
											<Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
												{resetPasswordForm.formState.errors.password.message}
											</Typography>
										)}
									</FormControl>
									<FormControl error={!!resetPasswordForm.formState.errors.confirmPassword}>
										<InputLabel>Confirm password</InputLabel>
										<OutlinedInput
											{...resetPasswordForm.register("confirmPassword", {
												required: "Password confirmation is required",
											})}
											type={showConfirmPassword ? "text" : "password"}
											label="Confirm password"
											endAdornment={
												<InputAdornment position="end">
													<IconButton
														onClick={() => setShowConfirmPassword(!showConfirmPassword)}
														edge="end"
														aria-label="toggle password visibility"
													>
														{showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
													</IconButton>
												</InputAdornment>
											}
										/>
										{resetPasswordForm.formState.errors.confirmPassword && (
											<Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
												{resetPasswordForm.formState.errors.confirmPassword.message}
											</Typography>
										)}
									</FormControl>
									<Button type="submit" variant="contained" disabled={isLoading} fullWidth>
										{isLoading ? "Resetting..." : "Reset password"}
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
						) : (
							<form onSubmit={forgotPasswordForm.handleSubmit(onSubmitForgotPassword)}>
								<Stack spacing={2}>
									{error && (
										<Alert severity="error" onClose={() => setError("")}>
											{error}
										</Alert>
									)}
									<FormControl error={!!forgotPasswordForm.formState.errors.email}>
										<InputLabel>Email address</InputLabel>
										<OutlinedInput
											{...forgotPasswordForm.register("email", {
												required: "Email is required",
												pattern: {
													value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
													message: "Invalid email format",
												},
											})}
											type="email"
											label="Email address"
										/>
										{forgotPasswordForm.formState.errors.email && (
											<Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
												{forgotPasswordForm.formState.errors.email.message}
											</Typography>
										)}
									</FormControl>
									<Button type="submit" variant="contained" disabled={isLoading} fullWidth>
										{isLoading ? "Sending..." : "Send reset link"}
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

