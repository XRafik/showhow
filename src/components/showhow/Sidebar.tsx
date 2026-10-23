import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "./Button";
import { Logo } from "./Logo";

export interface SidebarProps {
	primary?: { label?: string; icon?: LucideIcon; onClick: () => void };
	secondaryAction?: ReactNode;
	libraryLabel?: string;
	onLibrarySelect?: () => void;
	children?: ReactNode;
	footer?: ReactNode;
	settings?: { label?: string; onClick: () => void };
	onPrimary?: () => void;
}

export function Sidebar({
	primary,
	secondaryAction,
	libraryLabel,
	children,
	settings,
	onPrimary,
	footer,
	onLibrarySelect,
}: SidebarProps) {
	return (
		<aside className="flex w-[272px] shrink-0 flex-col gap-6 bg-ds-panel px-[18px] py-[26px] font-ds-body text-ds-on-panel">
			<Logo withWordmark style={{ marginLeft: "var(--titlebar-inset-left, 0px)" }} />
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
			{secondaryAction}
			<div className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto">
				{libraryLabel &&
					(onLibrarySelect ? (
						<button
							type="button"
							onClick={onLibrarySelect}
							className="px-2 pb-2 text-left font-ds-label text-[10px] tracking-[0.8px] uppercase text-ds-on-panel-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-ds-accent"
						>
							{libraryLabel}
						</button>
					) : (
						<span className="px-2 pb-2 font-ds-label text-[10px] tracking-[0.8px] uppercase text-ds-on-panel-muted">
							{libraryLabel}
						</span>
					))}
				{children}
			</div>
			{footer && (
				<div className="[&>button]:w-full [&>button]:justify-start [&>button]:bg-ds-on-panel-wash [&>button]:text-ds-on-panel [&>button]:no-underline [&>button]:focus-visible:outline-ds-on-panel">
					{footer}
				</div>
			)}
			{settings && (
				<Button variant="sidebar" onClick={settings.onClick}>
					{settings.label ?? "Settings"}
				</Button>
			)}
		</aside>
	);
}
