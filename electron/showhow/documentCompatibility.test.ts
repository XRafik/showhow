import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { expect, it } from "vitest";
import { DocumentService } from "../ai-edition/document-service";

it("new v2 projects use .showhow while old document files remain readable and unchanged", async () => {
	const root = await fs.mkdtemp(path.join(os.tmpdir(), "showhow-document-"));
	try {
		const service = new DocumentService(root, root);
		const doc = await service.createProject("A Showhow project");
		expect(path.join(root, `${doc.project.id}.showhow`)).toBe(
			path.join(root, `${doc.project.id}.showhow`),
		);
		const bytes = await fs.readFile(path.join(root, `${doc.project.id}.showhow`));
		const old = path.join(root, `${doc.project.id}.openscreen`);
		await fs.rename(path.join(root, `${doc.project.id}.showhow`), old);
		const fresh = new DocumentService(root, root);
		expect((await fresh.getProject(doc.project.id)).project.title).toBe("A Showhow project");
		expect(await fs.readFile(old)).toEqual(bytes);
	} finally {
		await fs.rm(root, { recursive: true, force: true });
	}
});
