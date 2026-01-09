"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import { useColorScheme } from "@mui/material/styles";

export function AuthLogo(): React.JSX.Element {
	const { colorScheme = "light" } = useColorScheme();

	return (
		<Box
			sx={{
				display: "flex",
				justifyContent: "center",
				alignItems: "center",
				width: "100%",
				mb: 2,
			}}
		>
			<Box
				component="img"
				src={colorScheme === "light" ? "/DarkFullLogo.svg" : "/logo_large_dark_theme.svg"}
				alt="ExStrat"
				sx={{
					height: "auto",
					maxWidth: "300px",
					width: "auto",
					pointerEvents: "none", // Empêche le clic
				}}
			/>
		</Box>
	);
}

