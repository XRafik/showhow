import fs from "node:fs";
import { describe, expect, it } from "vitest";

const workflow = fs.readFileSync(new URL("../workflows/build.yml", import.meta.url), "utf8");
const publisher = workflow.slice(workflow.indexOf("  publish-release:"));

describe("preserved Showhow release publication contract", () => {
	it("requires all three existing installer jobs", () => {
		for (const job of ["build-windows", "build-macos", "build-linux"])
			expect(publisher).toContain(`- ${job}`);
	});
	it("preserves generated notes and the explicit previous stable tag", () => {
		expect(publisher).toContain("--generate-notes");
		expect(publisher).toContain('--notes-start-tag "$NOTES_START_TAG"');
	});
	it("preserves prerelease and stable publication flags", () => {
		expect(publisher).toContain('PRERELEASE_FLAG="--prerelease"');
		expect(publisher).toContain("--latest=false");
		expect(publisher).toContain("--latest \\");
	});
	it("preserves existing release-token compatibility without upstream release branches", () => {
		expect(publisher).toContain(
			"secrets.SHOWHOW_RELEASE_TOKEN || secrets.OPENSCREEN_RELEASE_TOKEN",
		);
		expect(publisher).not.toContain("release/v");
		expect(publisher).toContain('gh release create "$TAG"');
	});
});
