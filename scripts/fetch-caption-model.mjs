// Build-time only. Pinned multilingual whisper.cpp base q5_1 and local Silero VAD.
// Existing and newly downloaded bytes must match SHA-256 before packaging.
import { createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { fileURLToPath } from "node:url";
import { BUNDLED_STT_FILES, sha256OfFile } from "../electron/stt/modelManager.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, "caption-assets");
async function exists(filePath) {
	try {
		const s = await stat(filePath);
		return s.isFile() && s.size > 0;
	} catch {
		return false;
	}
}

const MAX_ATTEMPTS = 6;
// HuggingFace rate-limits (429) when the parallel CI matrix builds all hit it at once; also retry the
// usual transient server errors.
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504]);

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function backoffMs(attempt, retryAfter) {
	// Honor Retry-After when the server sends it (seconds or an HTTP date).
	if (retryAfter) {
		const secs = Number(retryAfter);
		if (Number.isFinite(secs)) return Math.min(60_000, secs * 1000);
		const at = Date.parse(retryAfter);
		if (!Number.isNaN(at)) return Math.min(60_000, Math.max(0, at - Date.now()));
	}
	// Exponential backoff with jitter: ~2s, 4s, 8s, 16s, 32s, capped at 60s.
	return Math.min(60_000, 2000 * 2 ** (attempt - 1)) + Math.floor(Math.random() * 1000);
}

async function fetchWithRetry(url) {
	let lastErr;
	for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
		try {
			const res = await fetch(url, { headers: { "user-agent": "showhow-build" } });
			if (res.ok && res.body) return res;
			if (RETRYABLE_STATUS.has(res.status) && attempt < MAX_ATTEMPTS) {
				const wait = backoffMs(attempt, res.headers.get("retry-after"));
				console.log(
					`  … HTTP ${res.status}, retry ${attempt}/${MAX_ATTEMPTS - 1} in ${Math.round(wait / 1000)}s`,
				);
				await sleep(wait);
				continue;
			}
			throw new Error(`Failed to download ${url}: HTTP ${res.status} ${res.statusText}`);
		} catch (err) {
			lastErr = err;
			const isHttp = err instanceof Error && err.message.startsWith("Failed to download");
			if (isHttp || attempt >= MAX_ATTEMPTS) throw err;
			// Network/DNS error: back off and retry.
			const wait = backoffMs(attempt, null);
			console.log(
				`  … ${err.message}, retry ${attempt}/${MAX_ATTEMPTS - 1} in ${Math.round(wait / 1000)}s`,
			);
			await sleep(wait);
		}
	}
	throw lastErr;
}

async function download(url, dest, expectedSha256) {
	if ((await exists(dest)) && (await sha256OfFile(dest)) === expectedSha256) {
		console.log(`  ✓ cached  ${path.relative(OUT, dest)}`);
		return;
	}
	await mkdir(path.dirname(dest), { recursive: true });
	const res = await fetchWithRetry(url);
	const tmp = `${dest}.partial`;
	await pipeline(Readable.fromWeb(res.body), createWriteStream(tmp));
	const { rename, rm } = await import("node:fs/promises");
	const actual = await sha256OfFile(tmp);
	if (actual !== expectedSha256) {
		await rm(tmp, { force: true });
		throw new Error(`SHA-256 mismatch for ${dest}: expected ${expectedSha256}, got ${actual}`);
	}
	await rename(tmp, dest);
	const mb = ((await stat(dest)).size / 1_000_000).toFixed(1);
	console.log(`  ↓ ${path.relative(OUT, dest)} (${mb} MB)`);
}

async function main() {
	console.log(`Fetching pinned native base and VAD → ${OUT}`);
	for (const file of Object.values(BUNDLED_STT_FILES)) {
		await download(file.url, path.join(OUT, file.name), file.expectedSha256);
	}
	console.log("Native caption assets verified.");
}

main().catch((err) => {
	console.error(`\nfetch-caption-model failed: ${err.message}`);
	process.exit(1);
});
