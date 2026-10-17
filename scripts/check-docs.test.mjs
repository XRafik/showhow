// check-docs.mjs gained `.harness/` because that tree rotted unwatched:
// `git-workflow.md` and `memory/MEMORY.md` both described the pre-#90
// `release/vX.Y.Z-rc.N` branch naming for a month, sending anyone who read them
// to a branch the workflows never create, while the same fact stayed correct
// under technical-documentation/ because this script was watching that tree.
//
// The failure mode worth guarding is not a missed doc — it is this script
// reporting OK while checking nothing. If the walk silently stops covering a
// tree, or a LEGACY entry stops matching, the output is still a green
// `check-docs: OK` and the rot resumes invisibly for months. So assert the
// script actually *rejects* something, not just that it exits 0.
//
// Run as a subprocess rather than imported: the script exits on failure and
// resolves its own root from `import.meta.dirname`, so it is not parameterisable
// without a refactor the guard does not need.

import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SCRIPT = path.join(ROOT, "scripts", "check-docs.mjs");

function runInIsolatedRoot(setup, only) {
	const root = mkdtempSync(path.join(tmpdir(), "showhow-check-docs-"));
	const scripts = path.join(root, "scripts");
	const docs = path.join(root, "technical-documentation");
	const script = path.join(scripts, "check-docs.mjs");
	const harness = path.join(root, ".harness");
	mkdirSync(scripts);
	mkdirSync(docs);
	copyFileSync(SCRIPT, script);
	try {
		setup(root);
		try {
			const out = execFileSync(process.execPath, [script, `--only=${only}`], {
				encoding: "utf8",
			});
			return { code: 0, out, harnessPresent: existsSync(harness) };
		} catch (e) {
			return {
				code: e.status ?? 1,
				out: `${e.stdout ?? ""}${e.stderr ?? ""}`,
				harnessPresent: existsSync(harness),
			};
		}
	} finally {
		rmSync(root, { recursive: true, force: true });
	}
}

const noSetup = () => undefined;

function withHarnessProbe(contents) {
	return runInIsolatedRoot((root) => {
		const docs = path.join(root, ".harness", "docs");
		mkdirSync(docs, { recursive: true });
		writeFileSync(path.join(docs, "_check-docs-probe.md"), contents, { flag: "wx" });
	}, ".harness/docs/_check-docs-probe.md");
}

/** @returns {{code: number, out: string}} */
function run() {
	try {
		return { code: 0, out: execFileSync(process.execPath, [SCRIPT], { encoding: "utf8" }) };
	} catch (e) {
		return { code: e.status ?? 1, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
	}
}

describe("check-docs", () => {
	it("passes when the optional upstream .harness tree is absent", () => {
		const { code, out, harnessPresent } = runInIsolatedRoot(
			noSetup,
			".harness/docs/_check-docs-probe.md",
		);
		expect(out).toContain("check-docs: OK");
		expect(code).toBe(0);
		expect(harnessPresent).toBe(false);
	});

	it("passes on the tree as committed", () => {
		const { code, out } = run();
		expect(out).toContain("check-docs: OK");
		expect(code).toBe(0);
	});

	// Both spellings, because the rot used both and the first version of this
	// guard only caught one. The prose said `release/vX.Y.Z-rc.N`, but the
	// copy-pasteable shell block said `release/v1.5.0-rc.1` — and that block is
	// what an operator restores from git history when the dispatch UI is down.
	// A substring check on the placeholder waves the concrete one straight
	// through, which is the more dangerous of the two.
	for (const naming of ["release/vX.Y.Z-rc.N", "release/v1.5.0-rc.1"]) {
		it(`rejects the retired release-branch naming "${naming}" inside .harness/`, () => {
			// .harness/ specifically: technical-documentation/ was never the tree that
			// went stale, so planting there would pass even if the walk lost .harness/.
			const { code, out } = withHarnessProbe(
				`# probe\n\n\`\`\`bash\ngit checkout ${naming}\n\`\`\`\n`,
			);
			expect(out).toContain("_check-docs-probe.md");
			expect(out).toContain(naming);
			expect(code).toBe(1);
		});
	}

	// A guard that over-fires gets switched off, so pin what must NOT trip it:
	// RC *tags* carry the `-rc.N` suffix and are current, the stable release
	// branch and its ephemeral sync branch are current, and backport lines use
	// `release/1.4.x`.
	it("rejects broken relative links inside a present .harness tree", () => {
		const { code, out } = withHarnessProbe("# probe\n\n[missing](missing.md)\n");
		expect(out).toContain("broken link");
		expect(out).toContain("_check-docs-probe.md");
		expect(code).toBe(1);
	});

	it("propagates non-ENOENT errors for the optional root", () => {
		const { code, out, harnessPresent } = runInIsolatedRoot((root) => {
			writeFileSync(path.join(root, ".harness"), "not a directory", { flag: "wx" });
		}, ".harness/docs/_check-docs-probe.md");
		expect(out).toContain("ENOTDIR");
		expect(code).not.toBe(0);
		expect(harnessPresent).toBe(true);
	});

	it("keeps required technical documentation mandatory", () => {
		const { code, out } = runInIsolatedRoot(noSetup, "technical-documentation/README.md");
		expect(out).toContain("missing: technical-documentation/README.md");
		expect(code).toBe(1);
	});

	it("accepts the naming that is still current", () => {
		const { code, out } = withHarnessProbe(
			"# probe\n\nTag `v1.6.0-rc.1` on `release/v1.6.0`, synced via `release/v1.6.0-sync`; backports on `release/1.4.x`.\n",
		);
		expect(out).toContain("check-docs: OK");
		expect(code).toBe(0);
	});
});
