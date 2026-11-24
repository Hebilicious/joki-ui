import { render, screen, waitFor } from "@joki-ui/vapor-testing";
import { page, userEvent } from "vite-plus/test/browser";
import { afterEach, beforeEach, describe, expect, test, vi } from "vite-plus/test";

import type { PlacementOptions } from "../src/placement.js";
import type { PlacementAnchor } from "../src/use-anchored-placement.js";
import PlacedMenu from "./fixtures/PlacedMenu.vue";
import PlacedMenus, { type PlacedMenuAt } from "./fixtures/PlacedMenus.vue";

const GAP = { offset: 6, padding: 8 } as const;
const CSS_BELOW_START: PlacementOptions = { ...GAP, strategy: "css", align: "start" };

const containers: HTMLElement[] = [];

function at(left: number, top: number): HTMLElement {
  const container = document.body.appendChild(document.createElement("div"));
  Object.assign(container.style, { position: "absolute", left: `${left}px`, top: `${top}px` });
  containers.push(container);
  return container;
}

// One app: separate apps repeat `useId()` values, and with them the ids each family finds its parts by.
function renderMenus(...menus: readonly PlacedMenuAt[]) {
  return render(PlacedMenus, { props: { menus } });
}

const trigger = (label: string) => screen.getByRole("button", { name: label });
const panel = (label: string) => screen.getByRole("menu", { name: label });

async function openMenu(label: string): Promise<void> {
  trigger(label).focus();
  await userEvent.keyboard("{ArrowDown}");
  await screen.findByRole("menu", { name: label });
}

const round = (box: DOMRect) => ({
  left: Math.round(box.left),
  top: Math.round(box.top),
  right: Math.round(box.right),
  bottom: Math.round(box.bottom),
});

function boxes(label: string) {
  return { trigger: round(trigger(label).getBoundingClientRect()), panel: round(panel(label).getBoundingClientRect()) };
}

function sideOf(label: string): string | null {
  const { trigger: control, panel: box } = boxes(label);
  if (box.top === control.bottom + GAP.offset) return "bottom";
  if (box.bottom === control.top - GAP.offset) return "top";
  if (box.left === control.right + GAP.offset) return "right";
  if (box.right === control.left - GAP.offset) return "left";
  return null;
}

beforeEach(async () => {
  await page.viewport(1000, 800);
});

afterEach(() => {
  vi.restoreAllMocks();
  for (const container of containers.splice(0)) container.remove();
  document.body.style.removeProperty("min-height");
  window.scrollTo(0, 0);
});

interface PlacementCase {
  readonly name: string;
  readonly viewport?: readonly [width: number, height: number];
  readonly left: number;
  readonly top: number;
  readonly placement: PlacementOptions;
  readonly tall?: boolean;
}

const SCRIPT_PARITY: readonly PlacementCase[] = [
  { name: "below, aligned to its start", left: 100, top: 100, placement: { align: "start" } },
  { name: "below, aligned to its end", left: 500, top: 100, placement: { align: "end" } },
  { name: "flipped above, aligned to its start", left: 100, top: 700, placement: { align: "start" } },
  { name: "flipped above, aligned to its end", left: 500, top: 700, placement: { align: "end" } },
  { name: "above, aligned to its start", left: 100, top: 400, placement: { side: "top", align: "start" } },
  { name: "flipped below, aligned to its end", left: 500, top: 50, placement: { side: "top", align: "end" } },
  { name: "beside it", left: 100, top: 400, placement: { side: "right", align: "start" } },
  { name: "flipped to its other side", left: 850, top: 400, placement: { side: "right", align: "start" } },
  { name: "on its left", left: 500, top: 400, placement: { side: "left", align: "start" } },
  { name: "flipped from its left to its right", left: 100, top: 400, placement: { side: "left", align: "end" } },
  {
    name: "too tall for either side, capped to its available height, stays below shortened",
    left: 100,
    top: 300,
    placement: { align: "start" },
    tall: true,
  },
  { name: "centred below", left: 460, top: 100, placement: {} },
  { name: "centred, flipped above", left: 460, top: 700, placement: {} },
  { name: "centred above", left: 460, top: 400, placement: { side: "top" } },
  { name: "centred and slid inside the padding", left: 900, top: 100, placement: {} },
  { name: "below, overrunning the viewport's edge", left: 900, top: 100, placement: { align: "start" } },
  { name: "flipped above, overrunning the viewport's edge", left: 900, top: 700, placement: { align: "start" } },
  { name: "above, overrunning the viewport's edge", left: 900, top: 400, placement: { side: "top", align: "start" } },
  {
    name: "flipped below, overrunning the viewport's edge",
    left: 900,
    top: 50,
    placement: { side: "top", align: "start" },
  },
  {
    name: "wider than the room past either edge of its trigger",
    viewport: [240, 800],
    left: 40,
    top: 700,
    placement: { align: "end" },
  },
];

interface CssCase extends PlacementCase {
  readonly expected: Partial<ReturnType<typeof round>>;
}

const CSS_ONLY: readonly CssCase[] = [
  {
    name: "a panel overrunning the viewport's edge by less than half its width centres on its trigger",
    left: 850,
    top: 100,
    placement: { align: "start" },
    expected: { left: 790, top: 136 },
  },
  {
    name: "a sideways panel that would have to slide down drops below its trigger, aligned to its end",
    left: 300,
    top: 20,
    placement: { side: "right", align: "end" },
    expected: { right: 380, top: 56 },
  },
  {
    name: "a sideways panel that would have to slide up rises above its trigger, aligned to its end",
    left: 300,
    top: 750,
    placement: { side: "right", align: "start" },
    expected: { right: 380, bottom: 744 },
  },
  {
    name: "a sideways panel with room on neither side or end centres below its trigger",
    viewport: [400, 800],
    left: 120,
    top: 100,
    placement: { side: "right", align: "start" },
    expected: { left: 60, top: 136 },
  },
  {
    name: "a sideways panel with room on neither side or end, low in the viewport, centres above its trigger",
    viewport: [400, 800],
    left: 120,
    top: 700,
    placement: { side: "right", align: "start" },
    expected: { left: 60, bottom: 694 },
  },
  {
    name: "a panel too tall for either side stays above, shortened to the room there",
    viewport: [1000, 200],
    left: 100,
    top: 100,
    placement: { side: "top", align: "start" },
    expected: { left: 100, top: 8, bottom: 94 },
  },
  {
    name: "a centred panel too tall for either side stays below, shortened",
    viewport: [1000, 200],
    left: 460,
    top: 80,
    placement: {},
    expected: { left: 400, top: 116, bottom: 192 },
  },
  {
    name: "a panel too tall for either side and overrunning the viewport's edge centres below, shortened",
    viewport: [1000, 200],
    left: 900,
    top: 80,
    placement: { align: "start" },
    expected: { left: 792, top: 116, bottom: 192 },
  },
  {
    name: "a panel too tall for either side and overrunning the viewport's edge centres above, shortened",
    viewport: [1000, 200],
    left: 900,
    top: 100,
    placement: { side: "top", align: "start" },
    expected: { left: 792, top: 8, bottom: 94 },
  },
];

describe("CSS placement", () => {
  test.each(SCRIPT_PARITY)(
    "lands where script placement does: $name",
    async ({ viewport, left, top, placement, tall }) => {
      if (viewport) await page.viewport(...viewport);
      renderMenus(
        { label: "CSS", left, top, tall: tall === true, placement: { ...GAP, ...placement, strategy: "css" } },
        { label: "Script", left, top, tall: tall === true, placement: { ...GAP, ...placement, strategy: "script" } },
      );
      await openMenu("CSS");
      await openMenu("Script");
      await waitFor(() => {
        expect(boxes("CSS").panel).toEqual(boxes("Script").panel);
        expect(sideOf("CSS")).not.toBeNull();
      });
    },
  );

  test.each(CSS_ONLY)("$name", async ({ viewport, left, top, placement, expected }) => {
    if (viewport) await page.viewport(...viewport);
    renderMenus({ label: "CSS", left, top, placement: { ...GAP, ...placement, strategy: "css" } });
    await openMenu("CSS");
    await waitFor(() => expect(boxes("CSS").panel).toMatchObject(expected));
  });

  test("a flipped panel names the side it asked for", async () => {
    renderMenus({ label: "Low", left: 100, top: 700, placement: CSS_BELOW_START });
    await openMenu("Low");
    await waitFor(() => expect(sideOf("Low")).toBe("top"));
    expect(panel("Low").dataset.side).toBe("bottom");
    expect(getComputedStyle(panel("Low")).getPropertyValue("--joki-transform-origin")).toBe("top");
  });

  test("a panel stays beside its trigger while the page scrolls, and leaves the viewport with it", async () => {
    document.body.style.minHeight = "3000px";
    renderMenus({ label: "Scrolled", left: 100, top: 300, placement: CSS_BELOW_START });
    await openMenu("Scrolled");
    window.scrollTo(0, 200);
    await waitFor(() =>
      expect(boxes("Scrolled")).toMatchObject({ trigger: { top: 100 }, panel: { left: 100, top: 136 } }),
    );
    window.scrollTo(0, 500);
    await waitFor(() =>
      expect(boxes("Scrolled")).toMatchObject({ trigger: { top: -200 }, panel: { left: 100, top: -164 } }),
    );
  });

  test("two open panels each stay beside their own trigger", async () => {
    renderMenus(
      { label: "First", left: 100, top: 100, placement: CSS_BELOW_START },
      { label: "Second", left: 500, top: 300, placement: CSS_BELOW_START },
    );
    await openMenu("First");
    await openMenu("Second");
    await waitFor(() => {
      for (const label of ["First", "Second"]) {
        const { trigger: control, panel: box } = boxes(label);
        expect({ label, left: box.left, top: box.top }).toEqual({ label, left: control.left, top: control.bottom + 6 });
      }
    });
  });

  test("closing the panel takes its name off the trigger", async () => {
    renderMenus({ label: "Closing", left: 100, top: 100, placement: CSS_BELOW_START });
    await userEvent.click(trigger("Closing"));
    await waitFor(() => expect(trigger("Closing").style.getPropertyValue("anchor-name")).not.toBe(""));
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("menu")).toBeNull());
    expect(trigger("Closing").style.getPropertyValue("anchor-name")).toBe("");
  });
});

describe("CSS placement falls back to script placement", () => {
  test("for a point-like anchor, such as a context menu's pointer", async () => {
    const anchor: PlacementAnchor = { getBoundingClientRect: () => new DOMRect(300, 200, 0, 0) };
    render(PlacedMenu, {
      props: { label: "Context", placement: { strategy: "css", align: "start", offset: 0, padding: 8 }, anchor },
      container: at(100, 100),
    });
    await userEvent.click(trigger("Context"));
    await waitFor(() => expect(round(panel("Context").getBoundingClientRect())).toMatchObject({ left: 300, top: 200 }));
  });

  test("in a browser without anchor positioning, holding the panel inside the padding as its trigger scrolls away", async () => {
    vi.spyOn(CSS, "supports").mockReturnValue(false);
    document.body.style.minHeight = "3000px";
    renderMenus({ label: "Unsupported", left: 100, top: 300, placement: CSS_BELOW_START });
    await openMenu("Unsupported");
    await waitFor(() => expect(sideOf("Unsupported")).toBe("bottom"));
    window.scrollTo(0, 500);
    await waitFor(() =>
      expect(boxes("Unsupported")).toMatchObject({ trigger: { top: -200 }, panel: { left: 100, top: 8 } }),
    );
    expect(trigger("Unsupported").style.getPropertyValue("anchor-name")).toBe("");
  });
});
