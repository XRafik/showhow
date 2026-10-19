import { defineConfig } from "@playwright/test";

// `--project=landing` serves the built landing page from `site/`; the app specs need no web server.
const landingRun = process.argv.some((arg) => arg.includes("landing"));

export default defineConfig({
	timeout: 120_000, // GIF encoding is CPU-bound; give it room
	retries: 0,
	reporter: "list",
	projects: [
		{ name: "app", testDir: "./tests/e2e", testIgnore: "landing.spec.ts" },
		{
			name: "landing",
			testDir: "./tests/e2e",
			testMatch: "landing.spec.ts",
			timeout: 30_000,
			use: { baseURL: "http://127.0.0.1:4321" },
		},
	],
	webServer: landingRun
		? {
				command:
					"npm --prefix site ci && npm --prefix site run build && npm --prefix site run preview",
				url: "http://127.0.0.1:4321",
				reuseExistingServer: true,
				timeout: 180_000,
			}
		: undefined,
});
