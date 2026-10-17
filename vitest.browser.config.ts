import path from "node:path";
import { playwright } from "@vitest/browser-playwright";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import { defineConfig } from "vitest/config";

export default defineConfig({
	// Keep generated caches out of node_modules when dependencies are shared.
	cacheDir: path.resolve(__dirname, ".vitest-cache/browser"),
	optimizeDeps: {
		entries: ["src/**/*.browser.test.{ts,tsx}"],
		// These imports were discovered after cold startup and reloaded a running
		// browser test. Prebundle the exact observed list before tests begin.
		include: [
			"react-dom/client",
			"@tiptap/react",
			"@tiptap/starter-kit",
			"@radix-ui/react-tooltip",
			"sonner",
			"react-icons/md",
			"lucide-react",
			"react-dom",
			"react-icons/bs",
			"react-icons/fa",
			"react-icons/fa6",
			"react-icons/fi",
			"react-icons/rx",
			"@radix-ui/react-tabs",
			"@fix-webm-duration/fix",
		],
	},
	server: {
		fs: {
			allow: [__dirname],
		},
	},
	css: {
		postcss: {
			plugins: [tailwindcss(), autoprefixer()],
		},
	},
	test: {
		include: ["src/**/*.browser.test.{ts,tsx}"],
		// Process the real stylesheet (Tailwind + @font-face) for tests that render
		// ds-* components; other CSS imports keep the default stub behavior.
		css: {
			include: [
				/src\/index\.css$/,
				/src\/lib\/showhow\/upstreamTheme\.css$/,
				/src\/components\/ai-edition\/v4\/EditorShellV4\.module\.css$/,
				/src\/components\/launch\/LaunchWindow\.module\.css$/,
				/src\/assets\/fonts\/fonts\.css$/,
				/src\/assets\/fonts\/annotation-fonts\.css$/,
			],
		},
		// Real software encoders compete for the small Linux CI runner's resources.
		fileParallelism: false,
		browser: {
			enabled: true,
			provider: playwright({
				launchOptions: {
					args:
						process.platform === "darwin"
							? ["--use-angle=metal"]
							: ["--enable-unsafe-swiftshader", "--use-gl=angle", "--use-angle=swiftshader"],
				},
			}),
			headless: true,
			instances: [{ browser: "chromium" }],
		},
		testTimeout: 120_000,
		hookTimeout: 30_000,
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "src"),
		},
	},
	assetsInclude: ["**/*.webm"],
});
