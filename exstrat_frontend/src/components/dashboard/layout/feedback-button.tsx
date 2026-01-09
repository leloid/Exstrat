"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import CircularProgress from "@mui/material/CircularProgress";
import { ChatCircleDotsIcon } from "@phosphor-icons/react/dist/ssr/ChatCircleDots";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

export function FeedbackButton(): React.JSX.Element {
	const { user } = useAuth();
	const [open, setOpen] = React.useState(false);
	const [name, setName] = React.useState("");
	const [email, setEmail] = React.useState("");
	const [message, setMessage] = React.useState("");
	const [isLoading, setIsLoading] = React.useState(false);
	const [error, setError] = React.useState("");
	const [success, setSuccess] = React.useState(false);

	React.useEffect(() => {
		if (user) {
			setEmail(user.email || "");
			if (user.firstName && user.lastName) {
				setName(`${user.firstName} ${user.lastName}`);
			} else if (user.firstName) {
				setName(user.firstName);
			} else if (user.lastName) {
				setName(user.lastName);
			}
		}
	}, [user]);

	const handleOpen = () => {
		setOpen(true);
		setError("");
		setSuccess(false);
	};

	const handleClose = () => {
		setOpen(false);
		setError("");
		setSuccess(false);
		setMessage("");
	};

	const handleSubmit = async () => {
		if (!email || !message.trim()) {
			setError("Email and message are required");
			return;
		}

		setIsLoading(true);
		setError("");
		setSuccess(false);

		try {
			await api.post("/email/feedback", {
				email,
				name: name || undefined,
				message: message.trim(),
			});

			setSuccess(true);
			setTimeout(() => {
				handleClose();
			}, 2000);
		} catch (error: unknown) {
			const axiosError = error as { response?: { data?: { message?: string }; status?: number }; message?: string };
			setError(axiosError.response?.data?.message || axiosError.message || "Failed to send feedback. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<Box
				sx={{
					position: "fixed",
					bottom: 24,
					right: 24,
					zIndex: 1000,
				}}
			>
				<Button
					variant="contained"
					onClick={handleOpen}
					startIcon={<ChatCircleDotsIcon />}
					sx={{
						borderRadius: "28px",
						px: 3,
						py: 1.5,
						boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
						"&:hover": {
							boxShadow: "0 6px 16px rgba(0, 0, 0, 0.2)",
						},
					}}
				>
					Submit a Feedback
				</Button>
			</Box>

			<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
				<DialogTitle>Submit Feedback</DialogTitle>
				<DialogContent>
					<Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
						{success && (
							<Alert severity="success">
								Thank you for your feedback! We'll get back to you soon.
							</Alert>
						)}
						{error && (
							<Alert severity="error" onClose={() => setError("")}>
								{error}
							</Alert>
						)}
						<TextField
							label="Email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							fullWidth
							disabled={isLoading}
						/>
						<TextField
							label="Name (optional)"
							type="text"
							value={name}
							onChange={(e) => setName(e.target.value)}
							fullWidth
							disabled={isLoading}
						/>
						<TextField
							label="Message"
							multiline
							rows={6}
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							required
							fullWidth
							disabled={isLoading}
							placeholder="Tell us what you think, report a bug, or suggest a feature..."
						/>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose} disabled={isLoading}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} variant="contained" disabled={isLoading || !email || !message.trim()}>
						{isLoading ? <CircularProgress size={20} /> : "Send Feedback"}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

