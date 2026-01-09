"use client";

import * as React from "react";
import RouterLink from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { AuthLogo } from "@/components/auth/auth-logo";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

const signUpSchema = z
	.object({
		firstName: z.string().min(1, "First name is required"),
		lastName: z.string().min(1, "Last name is required"),
		email: z.string().min(1, "Email is required").email("Invalid email format"),
		password: z
			.string()
			.min(8, "Password must contain at least 8 characters")
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
				"Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character"
			),
		confirmPassword: z.string().min(1, "Password confirmation is required"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Passwords do not match",
		path: ["confirmPassword"],
	});

type SignUpForm = z.infer<typeof signUpSchema>;

export default function Page(): React.JSX.Element {
	const router = useRouter();
	const { signUp, isAuthenticated } = useAuth();
	const [error, setError] = React.useState<string>("");
	const [isLoading, setIsLoading] = React.useState(false);
	const [showVerificationMessage, setShowVerificationMessage] = React.useState(false);
	const [userEmail, setUserEmail] = React.useState<string>("");

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SignUpForm>({
		resolver: zodResolver(signUpSchema),
	});

	// Rediriger si déjà connecté (mais seulement si on n'affiche pas le message de vérification)
	React.useEffect(() => {
		if (isAuthenticated && !showVerificationMessage) {
			router.push(paths.dashboard.overview);
		}
	}, [isAuthenticated, router, showVerificationMessage]);

	const onSubmit = async (data: SignUpForm) => {
		setIsLoading(true);
		setError("");
		setShowVerificationMessage(false);

		try {
			// Appeler signUp qui ne stockera pas le token si l'email n'est pas vérifié
			await signUp({
				firstName: data.firstName || undefined,
				lastName: data.lastName || undefined,
				email: data.email,
				password: data.password,
			});
			// Toujours afficher le message de vérification après l'inscription
			// car le backend envoie toujours un email de vérification
			setUserEmail(data.email);
			setShowVerificationMessage(true);
		} catch (error_: unknown) {
			const error = error_ as Error | { message?: string };
			const errorMessage = error instanceof Error ? error.message : error.message || "An error occurred during sign up";
			setError(errorMessage);
		} finally {
			setIsLoading(false);
		}
	};

	const handleResendVerification = async () => {
		if (!userEmail) return;

		setIsLoading(true);
		setError("");

		try {
			await api.post("/auth/resend-verification-email", { email: userEmail });
			setError(""); // Clear any previous errors
		} catch (error_: unknown) {
			const axiosError = error_ as { response?: { data?: { message?: string }; status?: number }; message?: string };
			setError(axiosError.response?.data?.message || "Error sending email. Please try again.");
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
								Sign up
							</Typography>
						}
					/>
					<CardContent>
						{showVerificationMessage ? (
							<Stack spacing={2}>
								<Alert severity="info">
									A verification email has been sent to <strong>{userEmail}</strong>.
									Please check your inbox and click on the link to activate your account.
								</Alert>
								<Typography variant="body2" color="text.secondary">
									Didn't receive the email?
								</Typography>
								<Button
									variant="outlined"
									onClick={handleResendVerification}
									disabled={isLoading}
									fullWidth
									sx={{
										"&:hover": {
											backgroundColor: "var(--mui-palette-primary-main)",
											color: "var(--mui-palette-primary-contrastText)",
											borderColor: "var(--mui-palette-primary-main)",
										},
									}}
								>
									{isLoading ? "Sending..." : "Resend verification email"}
								</Button>
								{error && (
									<Alert severity="error" onClose={() => setError("")}>
										{error}
									</Alert>
								)}
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
									<Stack spacing={2}>
									<FormControl error={!!errors.firstName}>
										<InputLabel>First name</InputLabel>
										<OutlinedInput
											{...register("firstName")}
											type="text"
											label="First name"
										/>
										{errors.firstName && (
											<Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
												{errors.firstName.message}
											</Typography>
										)}
									</FormControl>
									<FormControl error={!!errors.lastName}>
										<InputLabel>Last name</InputLabel>
										<OutlinedInput
											{...register("lastName")}
											type="text"
											label="Last name"
										/>
										{errors.lastName && (
											<Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
												{errors.lastName.message}
											</Typography>
										)}
									</FormControl>
									<FormControl error={!!errors.email}>
										<InputLabel>Email address</InputLabel>
										<OutlinedInput
											{...register("email")}
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
											{...register("password")}
											type="password"
											label="Password"
										/>
										{errors.password && (
											<Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
												{errors.password.message}
											</Typography>
										)}
									</FormControl>
									<FormControl error={!!errors.confirmPassword}>
										<InputLabel>Confirm password</InputLabel>
										<OutlinedInput
											{...register("confirmPassword")}
											type="password"
											label="Confirm password"
										/>
										{errors.confirmPassword && (
											<Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
												{errors.confirmPassword.message}
											</Typography>
										)}
									</FormControl>
									<Button type="submit" variant="contained" disabled={isLoading} fullWidth>
										{isLoading ? "Creating account..." : "Create account"}
									</Button>
								</Stack>
							</Stack>
						</form>
						)}
					</CardContent>
					<CardContent sx={{ pt: 0 }}>
						<Typography color="text.secondary" variant="body2" align="center">
							Already have an account?{" "}
							<Link component={RouterLink} href={paths.auth.signIn} variant="subtitle2">
								Sign in
							</Link>
						</Typography>
					</CardContent>
				</Card>
			</Stack>
		</CenteredLayout>
	);
}

