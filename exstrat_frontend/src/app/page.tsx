import type * as React from "react";
import { redirect } from "next/navigation";

import { paths } from "@/paths";

export default function Page(): React.JSX.Element {
	redirect(paths.dashboard.overview);
}
