import { Button } from "@/components/showhow/Button";
import { Sheet } from "@/components/showhow/Sheet";
import { useScopedT } from "@/contexts/I18nContext";

export interface MoveRecordingToTrashSheetProps {
	open: boolean;
	title: string;
	busy?: boolean;
	onOpenChange: (open: boolean) => void;
	onConfirm: () => void;
}

export function MoveRecordingToTrashSheet({
	open,
	title,
	busy = false,
	onOpenChange,
	onConfirm,
}: MoveRecordingToTrashSheetProps) {
	const t = useScopedT("common");
	return (
		<Sheet
			open={open}
			onOpenChange={(nextOpen) => {
				if (!busy) onOpenChange(nextOpen);
			}}
			eyebrow={t("showhowTrash.eyebrow")}
			title={t("showhowTrash.title")}
			description={t("showhowTrash.body", { title })}
			footer={
				<>
					<Button variant="secondary" disabled={busy} onClick={() => onOpenChange(false)}>
						{t("actions.cancel")}
					</Button>
					<Button variant="rec" disabled={busy} onClick={onConfirm}>
						{t("showhowTrash.move")}
					</Button>
				</>
			}
		/>
	);
}
