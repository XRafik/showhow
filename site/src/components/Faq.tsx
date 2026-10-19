import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { FAQ } from "../lib/faq";
import { useAccordion } from "./vendor/interior/accordion";

const EASE = [0.23, 1, 0.32, 1] as const;

/** FAQ item (Q9CyA) list. Behaviour comes from interior's headless accordion hook; markup and classes are ours. */
export default function Faq() {
	const reduced = useReducedMotion();
	const { isOpen, headerProps, panelProps } = useAccordion({
		items: FAQ,
		type: "single",
		defaultOpen: ["free"],
	});

	return (
		<div className="faq">
			{FAQ.map((item) => {
				const open = isOpen(item.id);
				const { ref, ...header } = headerProps(item.id);
				return (
					<div className="faq-item" data-open={open} key={item.id}>
						<h3>
							<button ref={ref} className="faq-item__question" {...header}>
								<span>{item.question}</span>
								<motion.span
									className="faq-item__mark"
									aria-hidden="true"
									animate={{ rotate: open ? 45 : 0 }}
									transition={reduced ? { duration: 0 } : { duration: 0.2, ease: EASE }}
								>
									+
								</motion.span>
							</button>
						</h3>
						<AnimatePresence initial={false}>
							{open ? (
								<motion.div
									className="faq-item__panel"
									{...panelProps(item.id)}
									key="panel"
									initial={reduced ? false : { height: 0, opacity: 0 }}
									animate={{ height: "auto", opacity: 1 }}
									exit={reduced ? undefined : { height: 0, opacity: 0 }}
									transition={reduced ? { duration: 0 } : { duration: 0.28, ease: EASE }}
								>
									<p className="faq-item__answer">{item.answer}</p>
								</motion.div>
							) : null}
						</AnimatePresence>
					</div>
				);
			})}
		</div>
	);
}
