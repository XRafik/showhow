import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
const EASE_OUT = "power4.out";

const q = <T extends Element>(selector: string, scope: ParentNode = document) =>
	Array.from(scope.querySelectorAll<T>(selector));

/** Placeholder loops run only while on screen; hovering or focusing one replays it. */
function initLoops() {
	const loops = q<HTMLElement>("[data-loop]");
	for (const loop of loops) {
		loop.classList.add("loop-slot--paused");
		const replay = () => {
			loop.classList.add("loop-slot--restart");
			void loop.offsetWidth;
			loop.classList.remove("loop-slot--restart");
		};
		loop.addEventListener("mouseenter", replay);
		loop.addEventListener("focus", replay);
	}
	if (reduced) return;
	const io = new IntersectionObserver(
		(entries) => {
			for (const entry of entries) {
				entry.target.classList.toggle("loop-slot--paused", !entry.isIntersecting);
			}
		},
		{ threshold: 0.2 },
	);
	for (const loop of loops) io.observe(loop);
}

/** The hero loop is a muted video; with reduced motion it stays on its poster frame. */
function initHeroVideo() {
	const video = document.querySelector<HTMLVideoElement>(".hero__video");
	if (video && reduced) {
		video.removeAttribute("autoplay");
		video.pause();
	}
}

function initLenis() {
	const lenis = new Lenis({ lerp: 0.1, wheelMultiplier: 0.9 });
	window.__lenis = lenis;
	lenis.on("scroll", ScrollTrigger.update);
	gsap.ticker.add((time) => lenis.raf(time * 1000));
	gsap.ticker.lagSmoothing(0);
}

/** First paint: ten columns lift away like a darkroom shutter, then the hero assembles. */
function playIntro() {
	const done = () => {
		root.dataset.ready = "true";
		document.querySelector(".intro")?.remove();
	};
	const tl = gsap.timeline({ onComplete: done });
	tl.to(".intro i", {
		scaleY: 0,
		duration: 0.75,
		ease: "power4.inOut",
		stagger: { each: 0.05, from: "center" },
	});
	tl.to('[data-hero="eyebrow"]', { opacity: 1, y: 0, duration: 0.6, ease: EASE_OUT }, 0.35);
	tl.to(".hero__title .word > span", { y: 0, duration: 0.9, ease: EASE_OUT, stagger: 0.07 }, 0.45);
	tl.fromTo(
		".hero__dot",
		{ scale: 0.4 },
		{ scale: 1, duration: 0.5, ease: "back.out(2.4)", transformOrigin: "50% 80%" },
		1.05,
	);
	tl.to(
		'[data-hero="sub"], [data-hero="ctas"], [data-hero="micro"]',
		{ opacity: 1, y: 0, duration: 0.7, ease: EASE_OUT, stagger: 0.08 },
		0.85,
	);
	tl.to('[data-hero="stage"]', { opacity: 1, y: 0, duration: 1.1, ease: EASE_OUT }, 1.0);
	gsap.delayedCall(4, done);
}

/** Scroll scenes, one per section. */
function initScroll() {
	// Hero hands over to the page: copy lifts and softens, the stage settles back, the shader drifts.
	gsap.to(".hero__inner > :not(.hero__stage-wrap)", {
		y: -40,
		opacity: 0.25,
		ease: "none",
		scrollTrigger: { trigger: ".hero", start: "top top", end: "70% top", scrub: true },
	});
	gsap.fromTo(
		".hero__stage",
		{ scale: 1, transformOrigin: "50% 0%" },
		{
			scale: 0.94,
			ease: "none",
			scrollTrigger: {
				trigger: ".hero__stage-wrap",
				start: "top 35%",
				end: "bottom top",
				scrub: true,
			},
		},
	);
	gsap.to(".hero__shader", {
		y: 160,
		ease: "none",
		scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
	});

	for (const rule of q<HTMLElement>(".section__rule")) {
		gsap.to(rule, {
			scaleX: 1,
			duration: 1.2,
			ease: "power3.inOut",
			scrollTrigger: { trigger: rule, start: "top 92%", once: true },
		});
	}

	for (const heading of q<HTMLElement>("[data-split]:not(.hero__title)")) {
		gsap.to(q(".word > span", heading), {
			y: 0,
			duration: 0.9,
			ease: EASE_OUT,
			stagger: 0.05,
			scrollTrigger: { trigger: heading, start: "top 88%", once: true },
		});
	}

	for (const el of q<HTMLElement>("[data-reveal]")) {
		const x = Number(el.dataset.x ?? 0);
		gsap.fromTo(
			el,
			{ opacity: 0, y: 18, x },
			{
				opacity: 1,
				y: 0,
				x: 0,
				duration: 0.9,
				ease: EASE_OUT,
				delay: Number(el.dataset.delay ?? 0),
				scrollTrigger: { trigger: el, start: "top 90%", once: true },
			},
		);
	}

	// Loop slots develop top to bottom, like a print coming up in the tray.
	for (const slot of q<HTMLElement>("[data-develop]")) {
		gsap.to(slot, {
			clipPath: "inset(0% 0% 0% 0%)",
			duration: 1.1,
			ease: "power3.inOut",
			scrollTrigger: { trigger: slot, start: "top 90%", once: true },
		});
	}

	gsap.fromTo(
		"[data-footer-title]",
		{ scale: 0.9, opacity: 0.3 },
		{
			scale: 1,
			opacity: 1,
			ease: "none",
			scrollTrigger: { trigger: ".footer-cta", start: "top 85%", end: "center 60%", scrub: true },
		},
	);
}

initLoops();
initHeroVideo();

if (reduced) {
	root.dataset.ready = "true";
	document.querySelector(".intro")?.remove();
} else {
	initLenis();
	initScroll();
	playIntro();
}
import "./tweaks-boot";
