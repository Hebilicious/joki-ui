import { render, screen, waitFor } from "@joki-ui/vapor-testing";
import { userEvent } from "vite-plus/test/browser";
import { describe, expect, test } from "vite-plus/test";

import JokiMenuTrigger from "../../src/menu/JokiMenuTrigger.vue";
import ActionsMenu from "./fixtures/ActionsMenu.vue";

const button = () => screen.getByRole("button", { name: "Actions" });
const focused = (name: string) =>
  waitFor(() => expect(document.activeElement).toBe(screen.getByRole("menuitem", { name })));

describe("JokiMenu", () => {
  test("opens from the keyboard, moves past unavailable items, and closes back onto its button", async () => {
    const view = render(ActionsMenu);
    button().focus();
    await userEvent.keyboard("{ArrowDown}");
    const menu = await screen.findByRole("menu", { name: "Actions" });
    expect(button().getAttribute("aria-expanded")).toBe("true");
    expect(button().getAttribute("aria-controls")).toBe(menu.id);
    await focused("Rename");
    await userEvent.keyboard("{ArrowDown}");
    await focused("Archive");
    await userEvent.keyboard("{End}");
    await focused("Delete");
    await userEvent.keyboard("{Home}");
    await focused("Rename");
    await userEvent.keyboard("d");
    await focused("Delete");
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(button().getAttribute("aria-expanded")).toBe("false");
    expect(document.activeElement).toBe(button());
    expect(view.emitted("choose")).toBeUndefined();
  });

  test("Enter on an item runs it and closes the menu", async () => {
    const view = render(ActionsMenu);
    button().focus();
    await userEvent.keyboard("{ArrowUp}");
    await focused("Delete");
    await userEvent.keyboard("{Enter}");
    expect(view.emitted("choose")).toEqual([["delete"]]);
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(document.activeElement).toBe(button());
  });

  test("a part rendered outside its root names the root it needs", () => {
    expect(() => render(JokiMenuTrigger)).toThrow("<JokiMenuTrigger> must be used inside <JokiMenu>");
  });
});
