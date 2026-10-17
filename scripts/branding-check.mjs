import { execFile } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const BRAND_RE = new RegExp(
	[
		["open", "screen"].join(""),
		["open", " screen"].join(""),
		["get", "open", "screen"].join(""),
	].join("|"),
	"gi",
);

export async function scanBrandingReferences(
	rootDir,
	policy,
	listFiles = async () => {
		const { stdout } = await execFileAsync(
			"git",
			["ls-files", "--cached", "--others", "--exclude-standard"],
			{ cwd: rootDir },
		);
		return [...new Set(stdout.split("\n").filter(Boolean))];
	},
) {
	const wholeFileAllowed = new Set(
		policy.allowed.filter((entry) => !entry.lines).map((entry) => entry.file),
	);
	const classifiedPaths = new Set(
		policy.allowed
			.filter((entry) => typeof entry.pathRole === "string" && entry.pathRole.trim())
			.map((entry) => entry.file),
	);
	const lineAllowances = new Map();
	for (const entry of policy.allowed.filter((item) => item.lines)) {
		const existing = lineAllowances.get(entry.file) ?? [];
		for (const line of entry.lines) {
			const prior = existing.find((item) => item.text === line.text);
			if (prior) prior.count = Math.max(prior.count, line.count);
			else existing.push({ ...line });
		}
		lineAllowances.set(entry.file, existing);
	}
	const files = await listFiles();
	const matches = [];
	for (const file of files) {
		if (
			wholeFileAllowed.has(file) ||
			file === "package-lock.json" ||
			file.split("/").some((part) => part.startsWith(".env"))
		)
			continue;
		BRAND_RE.lastIndex = 0;
		if (BRAND_RE.test(file) && !classifiedPaths.has(file))
			matches.push({ file, line: 0, text: "legacy name in path" });
		const contents = await fs.readFile(path.join(rootDir, file), "utf8").catch(() => null);
		if (contents === null || contents.includes("\0")) continue;
		const lines = contents.split("\n");
		const allowances = lineAllowances.get(file) ?? [];
		const allowanceCounts = new Map(
			allowances.map(({ text }) => [text, lines.filter((line) => line.trim() === text).length]),
		);
		for (const [index, line] of lines.entries()) {
			BRAND_RE.lastIndex = 0;
			if (!BRAND_RE.test(line)) continue;
			const text = line.trim();
			const allowance = allowances.find(
				(entry) => entry.text === text && allowanceCounts.get(text) <= entry.count,
			);
			if (!allowance) matches.push({ file, line: index + 1, text });
		}
	}
	return matches;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
	const root = process.cwd();
	const policy = JSON.parse(await fs.readFile(path.join(root, "config/branding-allowlist.json")));
	const upstreamPolicy = JSON.parse(
		await fs.readFile(path.join(root, "config/upstream-branding-allowlist.json")),
	);
	policy.allowed.push(...upstreamPolicy.allowed);
	const matches = await scanBrandingReferences(root, policy);
	if (matches.length) {
		for (const match of matches) console.error(`${match.file}:${match.line} ${match.text}`);
		process.exitCode = 1;
	} else {
		console.log("Branding check passed: all legacy-brand references are classified.");
	}
}
