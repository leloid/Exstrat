"use client";

import * as React from "react";
import RouterLink from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import type { SignUpData } from "@/types/auth";

const signUpSchema = z
	.object({
		email: z.string().min(1, "L'email est requis").email("Format d'email invalide"),
		password: z
			.string()
			.min(8, "Le mot de passe doit contenir au moins 8 caractères")
			.regex(
				/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
				"Le mot de passe doit contenir au moins une minuscule, une majuscule, un chiffre et un caractère spécial"
			),
		confirmPassword: z.string().min(1, "La confirmation du mot de passe est requise"),
	})
	.refine((data) => data.password === data.confirmPassword, {
		message: "Les mots de passe ne correspondent pas",
		path: ["confirmPassword"],
	});

type SignUpForm = z.infer<typeof signUpSchema>;

export default function Page(): React.JSX.Element {
	const router = useRouter();
	const { signUp, isAuthenticated } = useAuth();
	const [error, setError] = React.useState<string>("");
	const [isLoading, setIsLoading] = React.useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<SignUpForm>({
		resolver: zodResolver(signUpSchema),
	});

	// Rediriger si déjà connecté
	React.useEffect(() => {
		if (isAuthenticated) {
			router.push(paths.dashboard.overview);
		}
	}, [isAuthenticated, router]);

	const onSubmit = async (data: SignUpForm) => {
		setIsLoading(true);
		setError("");

		try {
			await signUp({
				email: data.email,
				password: data.password,
			});
			// Nouvel utilisateur, rediriger vers le dashboard
			router.push(paths.dashboard.overview);
		} catch (err: unknown) {
			const error = err as Error | { message?: string };
			const errorMessage = error instanceof Error ? error.message : error.message || "Une erreur est survenue lors de l'inscription";
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
								Vous avez déjà un compte ?{" "}
								<Link component={RouterLink} href={paths.auth.signIn} variant="subtitle2">
									Se connecter
								</Link>
							</Typography>
						}
						title="Créer un compte"
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
										<InputLabel>Adresse email</InputLabel>
										<OutlinedInput
											{...register("email")}
											type="email"
											label="Adresse email"
										/>
										{errors.email && (
											<Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
												{errors.email.message}
											</Typography>
										)}
									</FormControl>
									<FormControl error={!!errors.password}>
										<InputLabel>Mot de passe</InputLabel>
										<OutlinedInput
											{...register("password")}
											type="password"
											label="Mot de passe"
										/>
										{errors.password && (
											<Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
												{errors.password.message}
											</Typography>
										)}
									</FormControl>
									<FormControl error={!!errors.confirmPassword}>
										<InputLabel>Confirmer le mot de passe</InputLabel>
										<OutlinedInput
											{...register("confirmPassword")}
											type="password"
											label="Confirmer le mot de passe"
										/>
										{errors.confirmPassword && (
											<Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
												{errors.confirmPassword.message}
											</Typography>
										)}
									</FormControl>
									<Button type="submit" variant="contained" disabled={isLoading} fullWidth>
										{isLoading ? "Création du compte..." : "Créer un compte"}
									</Button>
								</Stack>
							</Stack>
						</form>
					</CardContent>
				</Card>
			</Stack>
		</CenteredLayout>
	);
}

