/**
 * Loads the tweak pane only when asked, so visitors never download it.
 * Open with `?tweak` or Shift+T. Hide with Shift+T or `?tweak=0`.
 */
const FLAG = "showhow-tweaks";

function stored() {
	try {
		return localStorage.getItem(FLAG);
	} catch {
		return null;
	}
}

async function mount() {
	if (document.getElementById("tweaks-root")) return;
	const host = document.createElement("div");
	host.id = "tweaks-root";
	document.body.append(host);
	const [{ createRoot }, { createElement }, { default: Tweaks }] = await Promise.all([
		import("react-dom/client"),
		import("react"),
		import("../components/Tweaks"),
	]);
	createRoot(host).render(createElement(Tweaks));
}

const param = new URLSearchParams(location.search).get("tweak");
if (param === "0") {
	try {
		localStorage.setItem(FLAG, "0");
	} catch {
		// storage unavailable: the pane still works for this page view
	}
} else if (param !== null) {
	try {
		localStorage.setItem(FLAG, "1");
	} catch {
		// storage unavailable: the pane still works for this page view
	}
	void mount();
} else if (stored() === "1") {
	void mount();
}

window.addEventListener("keydown", (event) => {
	const target = event.target as HTMLElement | null;
	if (target?.closest("input, textarea, select, [contenteditable]")) return;
	// Shift+T only works after `?tweak` has been used once in this browser.
	if (
		stored() !== null &&
		event.shiftKey &&
		event.key.toLowerCase() === "t" &&
		!document.getElementById("tweaks-root")
	) {
		try {
			localStorage.setItem(FLAG, "1");
		} catch {
			// storage unavailable: the pane still works for this page view
		}
		void mount();
	}
});
