"use client";

import * as React from "react";
import Divider from "@mui/material/Divider";

import { Faqs } from "@/components/marketing/pricing/faqs";
import { PlansTable } from "@/components/marketing/pricing/plans-table";

export default function Page(): React.JSX.Element {
	return (
		<div>
			<PlansTable />
			<Divider />
			<Faqs />
		</div>
	);
}

