import { expect, test } from "@playwright/test";

const REPO_URL = "https://github.com/bedarstudios/showhow";

test.describe("landing page", () => {
	test("has no horizontal scroll at desktop and mobile widths", async ({ browser }) => {
		for (const viewport of [
			{ width: 1440, height: 900 },
			{ width: 390, height: 844 },
		]) {
			const page = await browser.newPage({ viewport });
			await page.goto("/");
			await page.waitForSelector("html[data-ready=true]");
			const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
			expect(scrollWidth).toBe(viewport.width);
			await page.close();
		}
	});

	test("shows the seven sections in order with the approved headings", async ({ page }) => {
		await page.goto("/");
		await page.waitForSelector("html[data-ready=true]");
		const order = await page.evaluate(() => {
			const pick = (selector: string) => document.querySelector(selector);
			const nodes = [
				pick("nav.nav"),
				pick("header.hero"),
				pick("#how"),
				pick("#next"),
				pick("#open"),
				pick("#faq"),
				pick(".footer-cta"),
			];
			return nodes.map((node) => (node ? node.getBoundingClientRect().top + scrollY : null));
		});
		expect(order.every((top) => top !== null)).toBe(true);
		expect(order).toEqual([...order].sort((a, b) => (a ?? 0) - (b ?? 0)));

		await expect(page.locator("h1")).toHaveText("Show how it’s done.");
		await expect(page.locator("#how h2")).toHaveText("Record once. Get the guide.");
		await expect(page.locator("#next h2")).toHaveText("One guide. Two handoffs.");
		await expect(page.locator("#open h3.open__title")).toHaveText(
			"It’s an unsigned build. Here’s the 30-second fix.",
		);
		await expect(page.locator(".footer-cta h2")).toHaveText(
			"Next time a client messages, record it.",
		);
	});

	test("primary button names the early build and links to the repository", async ({ page }) => {
		await page.goto("/");
		const primary = page.locator(".hero .button--primary");
		await expect(primary).toHaveText("DOWNLOAD EARLY BUILD FOR MAC");
		await expect(primary).toHaveAttribute("href", REPO_URL);
	});

	test("Coming next marks both handoffs as soon and disabled", async ({ page }) => {
		await page.goto("/");
		await expect(page.locator("#next .soon-pill")).toHaveCount(2);
		const chips = page.locator("#next .button");
		await expect(chips).toHaveCount(2);
		await expect(chips.nth(0)).toHaveAttribute("aria-disabled", "true");
		await expect(chips.nth(1)).toHaveAttribute("aria-disabled", "true");
	});

	test("FAQ holds six items and the fork answer credits OpenScreen", async ({ page }) => {
		await page.goto("/");
		await page.locator("#faq").scrollIntoViewIfNeeded();
		await expect(page.locator(".faq-item")).toHaveCount(6);
		await page.getByRole("button", { name: "Is Showhow a new app or a fork?" }).click();
		const answer = page
			.locator(".faq-item", { hasText: "new app or a fork" })
			.locator(".faq-item__answer");
		await expect(answer).toContainText("OpenScreen");
		await expect(answer).toContainText("Siddharth Vaddem");
	});

	test("reduced motion keeps the hero video on its poster without autoplay", async ({
		browser,
	}) => {
		const context = await browser.newContext({ reducedMotion: "reduce" });
		const page = await context.newPage();
		await page.goto("/");
		const video = page.locator(".hero__video");
		await expect(video).not.toHaveAttribute("autoplay", /.*/);
		await expect(video).toHaveAttribute("poster", /hero-make-guide-poster\.png$/);
		expect(await video.evaluate((el: HTMLVideoElement) => el.paused)).toBe(true);
		await context.close();
	});

	test("the progress card is on screen at 3.0 s in the first viewport", async ({ browser }) => {
		const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
		await page.goto("/");
		await page.waitForSelector("html[data-ready=true]");
		const video = page.locator(".hero__video");
		await video.evaluate(async (el: HTMLVideoElement) => {
			el.pause();
			await new Promise<void>((resolve) => {
				el.addEventListener("seeked", () => resolve(), { once: true });
				el.currentTime = 3;
			});
		});
		const box = await video.boundingBox();
		if (!box) throw new Error("hero video has no box");
		// The loop places the progress card's top edge 130 of 580 logical px down (see the Remotion hero config).
		const cardTop = box.y + box.height * (130 / 580);
		expect(cardTop).toBeGreaterThan(0);
		expect(cardTop).toBeLessThan(900);
		await page.close();
	});

	test("loads only its own scripts and sets no cookie", async ({ page, context }) => {
		const requests: string[] = [];
		page.on("request", (request) => requests.push(request.url()));
		await page.goto("/");
		await page.waitForSelector("html[data-ready=true]");
		const external = requests.filter(
			(url) =>
				!url.startsWith("http://127.0.0.1:4321/") &&
				!url.startsWith("data:") &&
				!url.startsWith("blob:"),
		);
		expect(external).toEqual([]);
		const scriptSrcs = await page.$$eval("script[src]", (nodes) =>
			nodes.map((node) => (node as HTMLScriptElement).src),
		);
		for (const src of scriptSrcs) expect(new URL(src).origin).toBe("http://127.0.0.1:4321");
		expect(await context.cookies()).toEqual([]);
	});

	test("reports no console errors", async ({ page }) => {
		const errors: string[] = [];
		page.on("pageerror", (error) => errors.push(error.message));
		page.on("console", (message) => {
			if (message.type() === "error") errors.push(message.text());
		});
		await page.goto("/");
		await page.waitForSelector("html[data-ready=true]");
		expect(errors).toEqual([]);
	});
});
