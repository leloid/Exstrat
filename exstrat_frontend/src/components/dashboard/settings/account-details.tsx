"use client";

import * as React from "react";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Card from "@mui/material/Card";
import CardActions from "@mui/material/CardActions";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import FormControl from "@mui/material/FormControl";
import FormHelperText from "@mui/material/FormHelperText";
import InputAdornment from "@mui/material/InputAdornment";
import InputLabel from "@mui/material/InputLabel";
import Link from "@mui/material/Link";
import OutlinedInput from "@mui/material/OutlinedInput";
import Select from "@mui/material/Select";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import { CameraIcon } from "@phosphor-icons/react/dist/ssr/Camera";
import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";

import { Option } from "@/components/core/option";
import { useAuth } from "@/contexts/AuthContext";

export function AccountDetails(): React.JSX.Element {
	const { user } = useAuth();

	return (
		<Card>
			<CardHeader
				avatar={
					<Avatar>
						<UserIcon fontSize="var(--Icon-fontSize)" />
					</Avatar>
				}
				title="Basic details"
			/>
			<CardContent>
				<Stack spacing={3}>
					<Stack direction="row" spacing={2} sx={{ alignItems: "center", opacity: 0.5, cursor: "not-allowed" }}>
						<Box
							sx={{
								border: "1px dashed var(--mui-palette-divider)",
								borderRadius: "50%",
								display: "inline-flex",
								p: "4px",
							}}
						>
							<Box sx={{ borderRadius: "inherit", position: "relative" }}>
								<Box
									sx={{
										alignItems: "center",
										bgcolor: "rgba(0, 0, 0, 0.5)",
										borderRadius: "inherit",
										bottom: 0,
										color: "var(--mui-palette-common-white)",
										cursor: "not-allowed",
										display: "flex",
										justifyContent: "center",
										left: 0,
										opacity: 0.7,
										position: "absolute",
										right: 0,
										top: 0,
										zIndex: 1,
									}}
									onClick={(e) => {
										e.preventDefault();
										e.stopPropagation();
									}}
								>
									<Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
										<CameraIcon fontSize="var(--icon-fontSize-md)" />
										<Typography color="inherit" variant="subtitle2">
											Coming soon
										</Typography>
									</Stack>
								</Box>
								<Avatar sx={{ "--Avatar-size": "100px" }}>
									{user?.firstName?.charAt(0).toUpperCase() || user?.lastName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase() || "U"}
								</Avatar>
							</Box>
						</Box>
						<Button color="secondary" size="small" disabled>
							Remove
						</Button>
					</Stack>
					<Stack spacing={2}>
						<FormControl disabled>
							<InputLabel>Full name</InputLabel>
							<OutlinedInput defaultValue={user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : ""} name="fullName" />
							<FormHelperText>Coming soon</FormHelperText>
						</FormControl>
						<FormControl disabled>
							<InputLabel>Email address</InputLabel>
							<OutlinedInput name="email" type="email" value={user?.email || ""} />
							<FormHelperText>
								Please <Link variant="inherit">contact us</Link> to change your email
							</FormHelperText>
						</FormControl>
						<Stack direction="row" spacing={2}>
							<FormControl disabled sx={{ width: "160px" }}>
								<InputLabel>Dial code</InputLabel>
								<Select
									name="countryCode"
									startAdornment={
										<InputAdornment position="start">
											<Box
												alt="France"
												component="img"
												src="/assets/flag-uk.svg"
												sx={{ display: "block", height: "20px", width: "auto" }}
											/>
										</InputAdornment>
									}
									value="+33"
								>
									<Option value="+1">United States</Option>
									<Option value="+33">France</Option>
									<Option value="+44">United Kingdom</Option>
								</Select>
							</FormControl>
							<FormControl disabled sx={{ flex: "1 1 auto" }}>
								<InputLabel>Phone number</InputLabel>
								<OutlinedInput name="phone" placeholder="Enter your phone number" />
								<FormHelperText>Coming soon</FormHelperText>
							</FormControl>
						</Stack>
						<FormControl disabled>
							<InputLabel>Title</InputLabel>
							<OutlinedInput name="title" placeholder="e.g Crypto Trader" />
							<FormHelperText>Coming soon</FormHelperText>
						</FormControl>
						<FormControl disabled>
							<InputLabel>Biography (optional)</InputLabel>
							<OutlinedInput name="bio" placeholder="Describe yourself..." />
							<FormHelperText>Coming soon</FormHelperText>
						</FormControl>
					</Stack>
				</Stack>
			</CardContent>
			<CardActions sx={{ justifyContent: "flex-end" }}>
				<Button color="secondary" disabled>Cancel</Button>
				<Button variant="contained" disabled>Save changes</Button>
			</CardActions>
		</Card>
	);
}

