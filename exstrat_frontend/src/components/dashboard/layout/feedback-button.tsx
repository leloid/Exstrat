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
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import { ChatCircleDotsIcon } from "@phosphor-icons/react/dist/ssr/ChatCircleDots";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { ImageIcon } from "@phosphor-icons/react/dist/ssr/Image";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

export function FeedbackButton(): React.JSX.Element {
	const { user } = useAuth();
	const [open, setOpen] = React.useState(false);
	const [name, setName] = React.useState("");
	const [email, setEmail] = React.useState("");
	const [message, setMessage] = React.useState("");
	const [images, setImages] = React.useState<File[]>([]);
	const [imagePreviews, setImagePreviews] = React.useState<string[]>([]);
	const [isLoading, setIsLoading] = React.useState(false);
	const [error, setError] = React.useState("");
	const [success, setSuccess] = React.useState(false);
	const fileInputRef = React.useRef<HTMLInputElement>(null);

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
		setImages([]);
		setImagePreviews([]);
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
		const files = event.target.files;
		if (!files) return;

		const newFiles: File[] = [];
		const newPreviews: string[] = [];

		Array.from(files).forEach((file) => {
			// Validate file type
			if (!file.type.startsWith("image/")) {
				setError(`File ${file.name} is not an image. Please select only image files.`);
				return;
			}

			// Validate file size (5MB max)
			if (file.size > 5 * 1024 * 1024) {
				setError(`File ${file.name} exceeds 5MB limit. Please select a smaller image.`);
				return;
			}

			// Check total files limit (5 max)
			if (images.length + newFiles.length >= 5) {
				setError("Maximum 5 images allowed");
				return;
			}

			newFiles.push(file);

			// Create preview
			const reader = new FileReader();
			reader.onload = (e) => {
				if (e.target?.result) {
					newPreviews.push(e.target.result as string);
					if (newPreviews.length === newFiles.length) {
						setImagePreviews([...imagePreviews, ...newPreviews]);
					}
				}
			};
			reader.readAsDataURL(file);
		});

		setImages([...images, ...newFiles]);
	};

	const handleRemoveImage = (index: number) => {
		const newImages = images.filter((_, i) => i !== index);
		const newPreviews = imagePreviews.filter((_, i) => i !== index);
		setImages(newImages);
		setImagePreviews(newPreviews);
	};

	const handleSubmit = async () => {
		if (!email || !message.trim()) {
			setError("Message is required");
			return;
		}

		const charCount = message.trim().length;
		if (charCount < 20) {
			setError(`Message must contain at least 20 characters. Current: ${charCount} characters.`);
			return;
		}

		setIsLoading(true);
		setError("");
		setSuccess(false);

		try {
			const formData = new FormData();
			formData.append("email", email);
			if (name) {
				formData.append("name", name);
			}
			formData.append("message", message.trim());
			
			images.forEach((image) => {
				formData.append("images", image);
			});

			await api.post("/email/feedback", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
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
							placeholder="Tell us what you think, report a bug, or suggest a feature... (Minimum 20 characters required)"
							helperText={`${message.trim().length} characters (minimum 20 required)`}
							error={message.trim().length > 0 && message.trim().length < 20}
						/>
						<Box>
							<input
								ref={fileInputRef}
								type="file"
								accept="image/*"
								multiple
								onChange={handleImageSelect}
								style={{ display: "none" }}
								disabled={isLoading || images.length >= 5}
							/>
							<Button
								variant="outlined"
								startIcon={<ImageIcon />}
								onClick={() => fileInputRef.current?.click()}
								disabled={isLoading || images.length >= 5}
								fullWidth
								sx={{ mb: 2 }}
							>
								{images.length >= 5
									? "Maximum 5 images reached"
									: images.length > 0
									? `Add More Images (${images.length}/5)`
									: "Add Screenshots/Images (Optional)"}
							</Button>
							{images.length > 0 && (
								<Box sx={{ mt: 2 }}>
									<Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
										{images.length} image{images.length > 1 ? "s" : ""} selected (max 5MB each)
									</Typography>
									<Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
										{imagePreviews.map((preview, index) => (
											<Box
												key={index}
												sx={{
													position: "relative",
													width: 100,
													height: 100,
													borderRadius: 1,
													overflow: "hidden",
													border: "1px solid",
													borderColor: "divider",
												}}
											>
												<img
													src={preview}
													alt={`Preview ${index + 1}`}
													style={{
														width: "100%",
														height: "100%",
														objectFit: "cover",
													}}
												/>
												<IconButton
													size="small"
													onClick={() => handleRemoveImage(index)}
													disabled={isLoading}
													sx={{
														position: "absolute",
														top: 4,
														right: 4,
														backgroundColor: "rgba(0, 0, 0, 0.5)",
														color: "white",
														"&:hover": {
															backgroundColor: "rgba(0, 0, 0, 0.7)",
														},
													}}
												>
													<XIcon fontSize="small" />
												</IconButton>
												<Chip
													label={images[index].name.length > 15 ? `${images[index].name.substring(0, 15)}...` : images[index].name}
													size="small"
													sx={{
														position: "absolute",
														bottom: 4,
														left: 4,
														maxWidth: "calc(100% - 8px)",
														fontSize: "0.65rem",
														height: 20,
														backgroundColor: "rgba(0, 0, 0, 0.6)",
														color: "white",
													}}
												/>
											</Box>
										))}
									</Stack>
								</Box>
							)}
						</Box>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose} disabled={isLoading}>
						Cancel
					</Button>
					<Button 
						onClick={handleSubmit} 
						variant="contained" 
						disabled={isLoading || !email || !message.trim() || message.trim().length < 20}
					>
						{isLoading ? <CircularProgress size={20} /> : "Send Feedback"}
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

