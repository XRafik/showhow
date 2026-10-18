import { Toaster, toast } from "sonner";

const showhowToastClass =
	"rounded-[6px] px-[18px] py-[11px] font-ds-body text-[13px] bg-ds-panel text-ds-on-panel shadow-[4px_4px_0_var(--ds-accent)] motion-reduce:!transition-none motion-reduce:!animate-none";

export function ShowhowToaster() {
	return (
		<Toaster
			position="bottom-right"
			toastOptions={{ unstyled: true, classNames: { toast: showhowToastClass } }}
		/>
	);
}

export function showhowToast(message: string) {
	toast(message, { unstyled: true, className: showhowToastClass });
}
