"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import { EyeIcon } from "@phosphor-icons/react/dist/ssr/Eye";
import { EyeSlashIcon } from "@phosphor-icons/react/dist/ssr/EyeSlash";

import { paths } from "@/paths";
import { CenteredLayout } from "@/components/auth/centered-layout";
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
				setError(axiosError.response.data?.message || "Email invalide");
			} else if (axiosError.response?.status === 500) {
				setError("Erreur serveur. Veuillez réessayer plus tard.");
			} else if (axiosError.message) {
				setError(axiosError.message);
			} else {
				setError(axiosError.response?.data?.message || "Une erreur est survenue. Veuillez réessayer.");
			}
		} finally {
			setIsLoading(false);
		}
	};

	const onSubmitResetPassword = async (data: ResetPasswordForm) => {
		if (data.password !== data.confirmPassword) {
			setError("Les mots de passe ne correspondent pas");
			return;
		}

		if (!token) {
			setError("Token manquant");
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
			// Rediriger vers la page de connexion après 2 secondes
			setTimeout(() => {
				router.push(paths.auth.signIn);
			}, 2000);
		} catch (error_: unknown) {
			const axiosError = error_ as { response?: { data?: { message?: string }; status?: number }; message?: string };
			
			if (axiosError.response?.status === 400) {
				setError(axiosError.response.data?.message || "Token invalide ou expiré");
			} else if (axiosError.response?.status === 500) {
				setError("Erreur serveur. Veuillez réessayer plus tard.");
			} else if (axiosError.message) {
				setError(axiosError.message);
			} else {
				setError(axiosError.response?.data?.message || "Une erreur est survenue. Veuillez réessayer.");
			}
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
							src="/logo_large_dark_theme.svg"
							alt="ExStrat"
							sx={{ height: "auto", maxWidth: "300px", width: "auto" }}
						/>
					</Box>
				</div>
				<Card>
					<CardHeader title={isResetMode ? "Nouveau mot de passe" : "Réinitialisation du mot de passe"} />
					<CardContent>
						{success ? (
							<Stack spacing={2}>
								<Alert severity="success">
									{isResetMode
										? "Votre mot de passe a été réinitialisé avec succès. Redirection vers la page de connexion..."
										: "Si un compte existe avec cet email, un lien de réinitialisation a été envoyé."}
								</Alert>
								{!isResetMode && (
									<Button component={RouterLink} href={paths.auth.signIn} variant="contained" fullWidth>
										Retour à la connexion
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
										<InputLabel>Nouveau mot de passe</InputLabel>
										<OutlinedInput
											{...resetPasswordForm.register("password", {
												required: "Le mot de passe est requis",
												minLength: {
													value: 8,
													message: "Le mot de passe doit contenir au moins 8 caractères",
												},
												pattern: {
													value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
													message: "Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial",
												},
											})}
											type={showPassword ? "text" : "password"}
											label="Nouveau mot de passe"
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
										<InputLabel>Confirmer le mot de passe</InputLabel>
										<OutlinedInput
											{...resetPasswordForm.register("confirmPassword", {
												required: "La confirmation du mot de passe est requise",
											})}
											type={showConfirmPassword ? "text" : "password"}
											label="Confirmer le mot de passe"
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
										{isLoading ? "Réinitialisation..." : "Réinitialiser le mot de passe"}
									</Button>
									<div>
										<Typography variant="body2" color="text.secondary" align="center">
											Vous vous souvenez de votre mot de passe ?{" "}
											<RouterLink href={paths.auth.signIn} style={{ textDecoration: "none" }}>
												<Typography component="span" variant="subtitle2" color="primary">
													Se connecter
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
										<InputLabel>Adresse email</InputLabel>
										<OutlinedInput
											{...forgotPasswordForm.register("email", {
												required: "L'email est requis",
												pattern: {
													value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
													message: "Format d'email invalide",
												},
											})}
											type="email"
											label="Adresse email"
										/>
										{forgotPasswordForm.formState.errors.email && (
											<Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
												{forgotPasswordForm.formState.errors.email.message}
											</Typography>
										)}
									</FormControl>
									<Button type="submit" variant="contained" disabled={isLoading} fullWidth>
										{isLoading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
									</Button>
									<div>
										<Typography variant="body2" color="text.secondary" align="center">
											Vous vous souvenez de votre mot de passe ?{" "}
											<RouterLink href={paths.auth.signIn} style={{ textDecoration: "none" }}>
												<Typography component="span" variant="subtitle2" color="primary">
													Se connecter
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

