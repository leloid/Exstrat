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
import InputAdornment from "@mui/material/InputAdornment";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Box from "@mui/material/Box";
import Divider from "@mui/material/Divider";
import { EyeIcon } from "@phosphor-icons/react/dist/ssr/Eye";
import { EyeSlashIcon } from "@phosphor-icons/react/dist/ssr/EyeSlash";

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
		acceptTerms: z.boolean().refine((val) => val === true, {
			message: "You must accept the Terms and Conditions to create an account",
		}),
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
	const [showPassword, setShowPassword] = React.useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
	const [showTermsModal, setShowTermsModal] = React.useState(false);

	const {
		register,
		handleSubmit,
		formState: { errors },
		watch,
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
									<FormControl error={!!errors.confirmPassword}>
										<InputLabel>Confirm password</InputLabel>
										<OutlinedInput
											{...register("confirmPassword")}
											type={showConfirmPassword ? "text" : "password"}
											label="Confirm password"
											endAdornment={
												<InputAdornment position="end">
													<IconButton
														onClick={() => setShowConfirmPassword(!showConfirmPassword)}
														onMouseDown={(e) => e.preventDefault()}
														edge="end"
														aria-label="toggle confirm password visibility"
													>
														{showConfirmPassword ? (
															<EyeSlashIcon fontSize="var(--icon-fontSize-md)" />
														) : (
															<EyeIcon fontSize="var(--icon-fontSize-md)" />
														)}
													</IconButton>
												</InputAdornment>
											}
										/>
										{errors.confirmPassword && (
											<Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
												{errors.confirmPassword.message}
											</Typography>
										)}
									</FormControl>
									<FormControl error={!!errors.acceptTerms}>
										<FormControlLabel
											control={
												<Checkbox
													{...register("acceptTerms")}
													checked={watch("acceptTerms") || false}
												/>
											}
											label={
												<Typography variant="body2">
													I accept the{" "}
													<Link
														component="button"
														type="button"
														onClick={(e) => {
															e.preventDefault();
															setShowTermsModal(true);
														}}
														sx={{
															cursor: "pointer",
															textDecoration: "underline",
															"&:hover": {
																textDecoration: "underline",
															},
														}}
													>
														Terms and Conditions
													</Link>
												</Typography>
											}
										/>
										{errors.acceptTerms && (
											<Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 4.5 }}>
												{errors.acceptTerms.message}
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

			{/* Terms and Conditions Modal */}
			<Dialog open={showTermsModal} onClose={() => setShowTermsModal(false)} maxWidth="md" fullWidth>
				<DialogTitle sx={{ fontWeight: 600 }}>
					Conditions Générales d'Utilisation
				</DialogTitle>
				<DialogContent>
					<Box sx={{ maxHeight: "70vh", overflowY: "auto", pr: 1 }}>
						<Stack spacing={3}>
							<Typography variant="body2" color="text.secondary">
								Les présentes Conditions Générales d'Utilisation (CGU) régissent l'accès et l'utilisation de la plateforme exStrat (désignée ci-après « la plateforme » ou « exStrat ») par tout utilisateur.
							</Typography>
							<Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
								L'acceptation des présentes CGU est une condition préalable à l'utilisation du service.
							</Typography>

							<Divider />

							<Box>
								<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
									1. OBJET, POSITIONNEMENT ET NATURE DU SERVICE
								</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
									exStrat est une plateforme web d'aide à la formalisation et à la simulation de stratégies de prise de profits sur crypto-actifs.
								</Typography>
								<Typography variant="body2" color="text.secondary">
									exStrat n'est ni un Prestataire de Services sur Actifs Numériques (PSAN), ni un Prestataire de Services d'Investissement (PSI), ni un conseiller en investissements financiers. exStrat n'intervient pas dans la gestion, l'exécution, la réception ou la transmission de conseils ou d'ordres personnalisés sur instruments financiers ou crypto-actifs. Aucune des fonctionnalités décrites ci-après ne pourra être interprétée comme la fourniture d'un service réglementé relevant des articles L. 54-10-2 et suivants du Code Monétaire et Financier.
								</Typography>
							</Box>

							<Box>
								<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
									2. CONSEIL EN INVESTISSEMENT – ABSENCE DE PERSONNALISATION
								</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
									exStrat ne fournit aucun conseil personnalisé en investissement.
								</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
									La plateforme propose exclusivement :
								</Typography>
								<Box component="ul" sx={{ pl: 3, mb: 1 }}>
									<Typography component="li" variant="body2" color="text.secondary">
										des modèles et exemples génériques de stratégies de prise de profits (templates pédagogiques),
									</Typography>
									<Typography component="li" variant="body2" color="text.secondary">
										des outils d'aide à la réflexion et à la modélisation,
									</Typography>
									<Typography component="li" variant="body2" color="text.secondary">
										sans analyse individuelle de la situation ou des besoins de l'utilisateur,
									</Typography>
									<Typography component="li" variant="body2" color="text.secondary">
										sans établissement, suggestion ou validation de profil d'investisseur, ni présélection de modèle.
									</Typography>
								</Box>
								<Typography variant="body2" color="text.secondary">
									L'utilisateur demeure le seul responsable de ses choix, simulations et décisions relatives à ses investissements.
								</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
									exStrat ne peut être assimilée à aucune activité de gestion de portefeuille, de conseil en investissement, de transmission d'ordres ou d'exécution pour compte de tiers.
								</Typography>
							</Box>

							<Box>
								<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
									3. TRANSMISSION D'ORDRES VIA API
								</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
									La plateforme permet à l'utilisateur d'interfacer son compte personnel auprès d'un exchange partenaire (Binance, Coinbase, etc.) par l'intégration manuelle d'une clé API personnelle.
								</Typography>
								<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
									L'utilisateur peut ainsi, s'il le souhaite :
								</Typography>
								<Box component="ul" sx={{ pl: 3, mb: 1 }}>
									<Typography component="li" variant="body2" color="text.secondary">
										paramétrer ses propres ordres LIMITES pour chacun des actifs de son choix,
									</Typography>
									<Typography component="li" variant="body2" color="text.secondary">
										et déclencher, par une action volontaire, la transmission simultanée (groupée) de ces ordres à l'exchange relié.
									</Typography>
								</Box>
								<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
									En aucun cas exStrat :
								</Typography>
								<Box component="ul" sx={{ pl: 3 }}>
									<Typography component="li" variant="body2" color="text.secondary">
										ne déclenche d'ordre sans action expresse de l'utilisateur,
									</Typography>
									<Typography component="li" variant="body2" color="text.secondary">
										n'automatise ou ne traite d'ordres différés,
									</Typography>
									<Typography component="li" variant="body2" color="text.secondary">
										n'émet de recommandations personnalisées,
									</Typography>
									<Typography component="li" variant="body2" color="text.secondary">
										ne modifie, n'agrège ou ne sélectionne d'ordres pour le compte de l'utilisateur,
									</Typography>
									<Typography component="li" variant="body2" color="text.secondary">
										ne détient ni n'a accès aux actifs ou fonds de l'utilisateur.
									</Typography>
								</Box>
							</Box>

							<Box>
								<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
									4. RESPONSABILITÉS ET CLAUSES DE NON-RESPONSABILITÉ
								</Typography>
								<Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
									Stratégies, modèles et résultats
								</Typography>
								<Box component="ul" sx={{ pl: 3, mb: 2 }}>
									<Typography component="li" variant="body2" color="text.secondary">
										Les modèles, outils et templates présentés sont fournis à titre exclusivement pédagogique et illustratif.
									</Typography>
									<Typography component="li" variant="body2" color="text.secondary">
										exStrat ne garantit aucun résultat, rendement ou réussite de stratégie.
									</Typography>
									<Typography component="li" variant="body2" color="text.secondary">
										Aucune information disponible sur la plateforme ne saurait être interprétée comme une recommandation d'achat, de vente ou de conservation d'un crypto-actif, ou plus généralement comme un conseil en investissement.
									</Typography>
								</Box>
								<Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
									Ordres et interactions API
								</Typography>
								<Box component="ul" sx={{ pl: 3, mb: 2 }}>
									<Typography component="li" variant="body2" color="text.secondary">
										La transmission groupée des ordres est réalisée uniquement à l'initiative et sous la responsabilité exclusive de l'utilisateur.
									</Typography>
									<Typography component="li" variant="body2" color="text.secondary">
										exStrat n'intervient pas dans l'exécution, l'annulation, la gestion ou la modification postérieure à la transmission technique de l'ordre.
									</Typography>
									<Typography component="li" variant="body2" color="text.secondary">
										Les risques liés à l'usage de l'API, au fonctionnement des exchanges partenaires, à la latence réseau, à la complétude ou au rejet des ordres, sont assumés par l'utilisateur. exStrat décline toute responsabilité en cas de pertes, exécution défaillante, blocage ou indisponibilité du service tiers.
									</Typography>
								</Box>
								<Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
									Limitation générale
								</Typography>
								<Typography variant="body2" color="text.secondary">
									La responsabilité d'exStrat ne saurait être engagée en dehors des obligations légales impératives, et ne pourra jamais couvrir des pertes indirectes, immatérielles ou spéculatives résultant de l'utilisation des outils ou de la fonctionnalité d'ordre via API.
								</Typography>
							</Box>

							<Box>
								<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
									5. DROITS ET OBLIGATIONS DE L'UTILISATEUR
								</Typography>
								<Box component="ul" sx={{ pl: 3 }}>
									<Typography component="li" variant="body2" color="text.secondary">
										L'utilisateur s'engage à utiliser exStrat dans le respect des lois en vigueur.
									</Typography>
									<Typography component="li" variant="body2" color="text.secondary">
										Il reste responsable du paramétrage de ses stratégies, de ses décisions, ainsi que de la sécurité, de la confidentialité et de la gestion de ses propres clés API.
									</Typography>
									<Typography component="li" variant="body2" color="text.secondary">
										Toute tentative d'utilisation abusive, de contournement des règles techniques, ou d'atteinte à la sécurité du service, pourra entraîner la suspension d'accès, sans préjudice des voies de droit applicables.
									</Typography>
								</Box>
							</Box>

							<Box>
								<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
									6. MODIFICATIONS ET DURÉE
								</Typography>
								<Typography variant="body2" color="text.secondary">
									Les présentes CGU sont en vigueur à compter de leur dernière date de mise à jour et peuvent être modifiées unilatéralement par l'éditeur, à tout moment. Tout utilisateur sera informé des modifications majeures lors de sa prochaine connexion.
								</Typography>
							</Box>

							<Divider sx={{ my: 2 }} />

							<Box>
								<Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 2 }}>
									MENTIONS LÉGALES
								</Typography>

								<Box sx={{ mb: 2 }}>
									<Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
										Éditeur
									</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
										exStrat, [structure juridique à compléter]
									</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
										Siège social : [adresse à compléter]
									</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
										SIREN/SIRET : [à compléter]
									</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
										Directeur de publication : [à compléter]
									</Typography>
									<Typography variant="body2" color="text.secondary">
										Contact : [email à compléter]
									</Typography>
								</Box>

								<Box sx={{ mb: 2 }}>
									<Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
										Hébergement
									</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
										Hébergeur : [nom, RCS et coordonnées de l'hébergeur]
									</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
										Adresse : [adresse complète à compléter]
									</Typography>
									<Typography variant="body2" color="text.secondary">
										Contact technique : [email technique]
									</Typography>
								</Box>

								<Box sx={{ mb: 2 }}>
									<Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
										Limitation de responsabilité & nature du service
									</Typography>
									<Typography variant="body2" color="text.secondary">
										exStrat est un service d'aide à la réflexion sur les stratégies de prise de profits sur crypto-actifs.
									</Typography>
									<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
										exStrat n'est ni PSI (Prestataire de Services d'Investissement), ni PSAN (Prestataire de Services sur Actifs Numériques), ni CIF (Conseiller en investissements financiers) et n'intervient ni dans la gestion ni dans la conservation de fonds ou d'actifs.
									</Typography>
								</Box>

								<Box>
									<Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
										Absence de conseil – Clause de non-responsabilité
									</Typography>
									<Typography variant="body2" color="text.secondary">
										L'ensemble des contenus, outils et solutions proposés ne constitue en aucun cas un conseil financier, fiscal, ni un service d'investissement et ne saurait engager la responsabilité d'exStrat au titre d'une perte ou d'un préjudice résultant d'une utilisation inadaptée, indépendante ou mal comprise du service.
									</Typography>
								</Box>
							</Box>
						</Stack>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setShowTermsModal(false)} variant="contained">
						Close
					</Button>
				</DialogActions>
			</Dialog>
		</CenteredLayout>
	);
}

