import { render, screen, waitFor } from "@joki-ui/vapor-testing";
import { userEvent } from "vite-plus/test/browser";
import { describe, expect, test } from "vite-plus/test";

import DetailsPopover from "./fixtures/DetailsPopover.vue";

const details = () => screen.getByRole("button", { name: "Details" });

describe("JokiPopover", () => {
  test("opening moves focus into the panel, and Escape returns it to the control", async () => {
    render(DetailsPopover);
    await userEvent.click(details());
    const dialog = await screen.findByRole("dialog", { name: "Details" });
    expect(details().getAttribute("aria-expanded")).toBe("true");
    expect(details().getAttribute("aria-controls")).toBe(dialog.id);
    await waitFor(() => expect(document.activeElement).toBe(screen.getByRole("button", { name: "Copy link" })));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(document.activeElement).toBe(details());
  });

  test("a pointer press outside the panel and its control closes it", async () => {
    render(DetailsPopover);
    await userEvent.click(details());
    await screen.findByRole("dialog", { name: "Details" });
    await userEvent.click(screen.getByRole("button", { name: "Elsewhere" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(details().getAttribute("aria-expanded")).toBe("false");
  });
});
