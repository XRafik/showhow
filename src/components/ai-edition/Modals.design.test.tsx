// @vitest-environment jsdom
// Editor-07 (#147): the unsaved-changes sheet in the Final look, with keyboard behaviour that
// never lands on the destructive choice by accident.
import "@testing-library/jest-dom";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/contexts/I18nContext", () => ({
	useScopedT: (scope: string) => (key: string) => `${scope}.${key}`,
}));

import { UnsavedChangesModal } from "./Modals";

afterEach(() => cleanup());

function renderModal(busy = false) {
	const onChoose = vi.fn();
	const onClose = vi.fn();
	render(
		<UnsavedChangesModal open onClose={onClose} action="close" busy={busy} onChoose={onChoose} />,
	);
	return { onChoose, onClose, dialog: screen.getByRole("dialog") };
}

describe("UnsavedChangesModal (Editor-07)", () => {
	it("is named by its question and carries the Unsaved changes eyebrow", () => {
		const { dialog } = renderModal();
		expect(dialog).toHaveAccessibleName("dialogs.unsavedChanges.modal.closeTitle");
		expect(screen.getByText("dialogs.unsavedChanges.modal.eyebrow")).toBeInTheDocument();
		expect(screen.getByText(/dialogs\.unsavedChanges\.modal\.originalSafe/)).toBeInTheDocument();
	});

	it("offers Discard apart from Cancel and Save, and each answers once", () => {
		const { onChoose } = renderModal();
		fireEvent.click(screen.getByRole("button", { name: "dialogs.unsavedChanges.modal.discard" }));
		fireEvent.click(screen.getByRole("button", { name: "common.actions.cancel" }));
		fireEvent.click(screen.getByRole("button", { name: "dialogs.unsavedChanges.modal.save" }));
		expect(onChoose.mock.calls.map(([choice]) => choice)).toEqual(["discard", "cancel", "save"]);
	});

	it("starts focus on Save, never on Discard", () => {
		renderModal();
		expect(screen.getByRole("button", { name: "dialogs.unsavedChanges.modal.save" })).toHaveFocus();
	});

	it("cancels on Escape", () => {
		const { onClose, onChoose } = renderModal();
		fireEvent.keyDown(window, { key: "Escape" });
		expect(onClose).toHaveBeenCalledTimes(1);
		expect(onChoose).not.toHaveBeenCalledWith("discard");
	});

	it("keeps Tab inside the sheet, wrapping both ways", () => {
		const { dialog } = renderModal();
		const save = screen.getByRole("button", { name: "dialogs.unsavedChanges.modal.save" });
		const close = screen.getByRole("button", { name: "common.actions.close" });
		fireEvent.keyDown(dialog, { key: "Tab" });
		expect(close).toHaveFocus();
		fireEvent.keyDown(dialog, { key: "Tab", shiftKey: true });
		expect(save).toHaveFocus();
	});

	it("locks every choice while the save runs", () => {
		renderModal(true);
		for (const name of [
			"dialogs.unsavedChanges.modal.discard",
			"common.actions.cancel",
			"dialogs.unsavedChanges.modal.saving",
		]) {
			expect(screen.getByRole("button", { name })).toBeDisabled();
		}
	});
});
