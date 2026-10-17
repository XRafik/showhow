import { useState } from "react";
import { useScopedT } from "@/contexts/I18nContext";
import { AiConnections } from "./AiConnections";
import { GuideSheet } from "./AiGuideSheets";
import { Button } from "./Button";
export function AiGuideSettings() {
	const [open, setOpen] = useState(false);
	const t = useScopedT("common");
	return (
		<>
			<Button type="button" variant="ghost" onClick={() => setOpen(true)}>
				{t("showhowGuide.settings")}
			</Button>
			{open && (
				<GuideSheet
					title={t("showhowGuide.settings")}
					description={t("showhowGuide.ownKey")}
					onClose={() => setOpen(false)}
				>
					<AiConnections />
				</GuideSheet>
			)}
		</>
	);
}
