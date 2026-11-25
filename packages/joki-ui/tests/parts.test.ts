import { render, screen, waitFor } from "@joki-ui/vapor-testing";
import { userEvent } from "vite-plus/test/browser";
import { describe, expect, test } from "vite-plus/test";

import AttributedMenu from "./fixtures/AttributedMenu.vue";

const trigger = () => screen.getByRole("button", { name: "Tools" });

describe("parts render their own elements", () => {
  test("a trigger is a button with the call site's attributes, and its listener runs beside the part's", async () => {
    const view = render(AttributedMenu);
    expect(trigger().tagName).toBe("BUTTON");
    expect(trigger().classList.contains("tools-button")).toBe(true);
    expect(trigger().getAttribute("title")).toBe("Tools");
    await userEvent.click(trigger());
    await screen.findByRole("menu", { name: "Tools" });
    expect(trigger().getAttribute("aria-expanded")).toBe("true");
    expect(view.emitted("triggerClick")).toEqual([[]]);
  });

  test("a content part renders the element `as` names with its menu role, and runs the call site's listener", async () => {
    const view = render(AttributedMenu);
    await userEvent.click(trigger());
    const panel = await screen.findByRole("menu", { name: "Tools" });
    expect(panel.tagName).toBe("SECTION");
    expect(panel.classList.contains("tools-panel")).toBe(true);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Rename" })));
    await userEvent.keyboard("{ArrowDown}");
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("menuitem", { name: "Delete" })));
    expect(view.emitted("panelKeydown")).toEqual([["ArrowDown"]]);
  });

  test("a trigger's template ref moves focus to it", async () => {
    render(AttributedMenu);
    await userEvent.click(screen.getByRole("button", { name: "Focus tools" }));
    expect(document.activeElement).toBe(trigger());
  });
});
