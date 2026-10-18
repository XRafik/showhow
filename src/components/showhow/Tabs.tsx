import type { ComponentProps } from "react";
import {
	TabsList as BaseTabsList,
	TabsTrigger as BaseTabsTrigger,
	Tabs,
	TabsContent,
} from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export { Tabs, TabsContent };

export function TabsList({ className, ...props }: ComponentProps<typeof BaseTabsList>) {
	return (
		<BaseTabsList
			className={cn(
				"h-auto justify-start gap-6 rounded-none border-b border-ds-line bg-transparent p-0",
				className,
			)}
			{...props}
		/>
	);
}

export function TabsTrigger({ className, ...props }: ComponentProps<typeof BaseTabsTrigger>) {
	return (
		<BaseTabsTrigger
			className={cn(
				"rounded-none border-b-2 border-transparent px-0 pb-[10px] pt-[6px] font-ds-label text-[11px] font-medium uppercase tracking-[1px] text-ds-ink-soft transition-colors data-[state=active]:border-ds-ink data-[state=active]:bg-transparent data-[state=active]:text-ds-ink data-[state=active]:shadow-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-ds-ink motion-reduce:transition-none",
				className,
			)}
			{...props}
		/>
	);
}
