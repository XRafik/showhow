import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";
import { Logo } from "./Logo";

export interface SidebarProps {
	primary?: { label?: string; icon?: LucideIcon; onClick: () => void };
	libraryLabel?: string;
	children?: ReactNode;
	settings?: { label?: string; onClick: () => void };
	onPrimary?: () => void;
}

export function Sidebar({ primary, libraryLabel, children, settings, onPrimary }: SidebarProps) {
	return (
		<aside className="flex w-[272px] shrink-0 flex-col gap-6 bg-ds-panel px-[18px] py-[26px] font-ds-body text-ds-on-panel">
			<Logo withWordmark />
			{primary && (
				<Button
					className="w-full justify-center"
					variant="primary"
					icon={primary.icon}
					onClick={primary.onClick ?? onPrimary}
				>
					{primary.label ?? "New recording"}
				</Button>
			)}
			<div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
				{libraryLabel && (
					<span className="px-2 pb-2 font-ds-label text-[10px] tracking-[0.8px] uppercase text-ds-on-panel-muted">
						{libraryLabel}
					</span>
				)}
				{children}
			</div>
			<div className="flex-1" />
			{settings && (
				<Button variant="sidebar" onClick={settings.onClick}>
					{settings.label ?? "Settings"}
				</Button>
			)}
		</aside>
	);
}
