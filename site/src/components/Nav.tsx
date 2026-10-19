import { useEffect, useState } from "react";
import { REPO_URL } from "../lib/site";
import Cta from "./Cta";
import { useScrollSpy } from "./vendor/interior/scroll-spy";

const SECTIONS = [
	{ id: "how", label: "How it works" },
	{ id: "open", label: "How to open" },
	{ id: "faq", label: "FAQ" },
];

/** Nav (W2SgD). Sticky; gains a blurred background after 8px and marks the section in view. */
export default function Nav() {
	const [stuck, setStuck] = useState(false);
	const { activeId, getLinkProps } = useScrollSpy({ sections: SECTIONS, offset: 120 });

	useEffect(() => {
		const onScroll = () => setStuck(window.scrollY > 8);
		onScroll();
		window.addEventListener("scroll", onScroll, { passive: true });
		return () => window.removeEventListener("scroll", onScroll);
	}, []);

	return (
		<nav className={`nav${stuck ? " nav--stuck" : ""}`} aria-label="Primary">
			<div className="wrap nav__inner">
				<a className="nav__brand" href="#top">
					<img src="/assets/logo.png" alt="" width="34" height="34" />
					Showhow
				</a>
				<div className="nav__links mono">
					{SECTIONS.map((section) => {
						const { href } = getLinkProps(section.id);
						return (
							<a
								key={section.id}
								className="nav__link"
								href={href}
								onClick={(event) => {
									const lenis = window.__lenis;
									if (!lenis) return;
									event.preventDefault();
									lenis.scrollTo(`#${section.id}`, { offset: -72 });
								}}
								aria-current={activeId === section.id ? "true" : undefined}
							>
								{section.label}
							</a>
						);
					})}
					<a className="nav__link" href={REPO_URL}>
						GitHub
					</a>
				</div>
				<Cta className="nav__cta" href={REPO_URL} label="Download" />
			</div>
		</nav>
	);
}
