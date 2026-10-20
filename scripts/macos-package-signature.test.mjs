import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, expect, it } from "vitest";
import { parse } from "yaml";

const workflow = parse(
	readFileSync(new URL("../.github/workflows/build.yml", import.meta.url), "utf8"),
);
const steps = workflow.jobs["build-macos"].steps;
const roots = [];
afterEach(() => {
	for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});

// Execute the production steps through DMG creation; fake only the external packaging tools.
function packageApp(arch, signed, verifyExit = 0) {
	const root = mkdtempSync(path.join(process.env.TEST_SCRATCH_ROOT || tmpdir(), "mac-signature-"));
	roots.push(root);
	const bin = path.join(root, "bin");
	mkdirSync(bin);
	writeFileSync(path.join(root, "package.json"), '{"version":"1.6.0"}');
	const tools = {
		npx: 'printf "builder:%s\\nidentity:%s;discovery:%s\\n" "$*" "$CSC_NAME" "$CSC_IDENTITY_AUTO_DISCOVERY" >> "$TRACE"\nmkdir -p release/1.6.0/mac/Showhow.app',
		codesign: 'printf "codesign:%s\\n" "$*" >> "$TRACE"\nexit "$VERIFY_EXIT"',
		hdiutil: 'printf "dmg:%s\\n" "$*" >> "$TRACE"',
	};
	for (const [name, body] of Object.entries(tools)) {
		writeFileSync(path.join(bin, name), `#!/bin/bash\nset -euo pipefail\n${body}\n`, {
			mode: 0o755,
		});
	}
	const values = {
		"matrix.arch": arch,
		"secrets.MAC_CSC_NAME": signed ? "Developer ID Application: Fixture" : "",
		"steps.signing.outputs.enabled": String(signed),
		"steps.signing.outputs.enabled == 'true' && 'true' || 'false'": String(signed),
	};
	const expand = (text) =>
		text.replace(/\$\{\{\s*(.*?)\s*\}\}/g, (_, key) => {
			if (!(key in values)) throw new Error(`Unhandled workflow expression: ${key}`);
			return values[key];
		});
	let result;
	const start = steps.findIndex((step) => step.name === "Package .app bundle");
	const end = steps.findIndex((step) => step.name === "Create DMG");
	expect(start).toBeGreaterThanOrEqual(0);
	expect(end).toBeGreaterThan(start);
	for (const step of steps.slice(start, end + 1)) {
		if (step.if) {
			expect(step.if).toBe("steps.signing.outputs.enabled == 'true'");
			if (!signed) continue;
		}
		const output = path.join(root, "outputs");
		writeFileSync(output, "");
		result = spawnSync(
			"/bin/bash",
			["--noprofile", "--norc", "-eo", "pipefail", "-c", expand(step.run)],
			{
				cwd: root,
				encoding: "utf8",
				env: {
					PATH: `${bin}:${path.dirname(process.execPath)}:/usr/bin:/bin`,
					TRACE: path.join(root, "trace"),
					VERIFY_EXIT: String(verifyExit),
					GITHUB_OUTPUT: output,
					...Object.fromEntries(
						Object.entries(step.env || {}).map(([key, value]) => [key, expand(value)]),
					),
				},
			},
		);
		if (result.status !== 0) break;
		for (const line of readFileSync(output, "utf8").trim().split("\n").filter(Boolean)) {
			const index = line.indexOf("=");
			values[`steps.${step.id}.outputs.${line.slice(0, index)}`] = line.slice(index + 1);
		}
	}
	return {
		...result,
		trace: readFileSync(path.join(root, "trace"), "utf8").split("\n").filter(Boolean),
	};
}

it.each([
	"arm64",
	"x64",
])("packages %s with ad-hoc fallback or the configured Developer ID", (arch) => {
	for (const signed of [false, true]) {
		const result = packageApp(arch, signed);
		expect(result.status, result.stderr).toBe(0);
		expect(result.trace[0]).toBe(
			`builder:electron-builder --mac --${arch} --dir --publish never${signed ? "" : " --config.mac.identity=-"}`,
		);
		expect(result.trace[1]).toBe(
			signed
				? "identity:Developer ID Application: Fixture;discovery:true"
				: "identity:;discovery:false",
		);
		expect(result.trace[2]).toBe("codesign:--verify --deep --strict release/1.6.0/mac/Showhow.app");
		expect(result.trace.some((line) => line.startsWith("dmg:"))).toBe(true);
	}
});

it.each([
	["arm64", false],
	["arm64", true],
	["x64", false],
	["x64", true],
])("stops before creating a %s DMG when verification fails (signed=%s)", (arch, signed) => {
	const result = packageApp(arch, signed, 42);
	expect(result.status, result.stderr).toBe(42);
	expect(result.trace).toContain("codesign:--verify --deep --strict release/1.6.0/mac/Showhow.app");
	expect(result.trace.some((line) => line.startsWith("dmg:"))).toBe(false);
});
