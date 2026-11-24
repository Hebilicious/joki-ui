import { render, screen, waitFor, withModel } from "@joki-ui/vapor-testing";
import { page, userEvent } from "vite-plus/test/browser";
import { afterEach, describe, expect, test } from "vite-plus/test";
import { nextTick } from "vue";

import { confirmCompositionWithEnter } from "./support/input-method.ts";
import SelectField, { type SelectOption } from "./fixtures/SelectField.vue";

const REGIONS: readonly SelectOption[] = [
  { value: "balenos", label: "Balenos" },
  { value: "calpheon", label: "Calpheon" },
  { value: "kamasylvia", label: "Kamasylvia", disabled: true },
  { value: "mediah", label: "Mediah" },
  { value: "valencia", label: "Valencia" },
];

function renderRegion(searchable = false, options: readonly SelectOption[] = REGIONS, container?: HTMLElement) {
  const field = withModel(
    SelectField,
    { options, label: "Region", searchable, modelValue: options[1]?.value },
    "modelValue",
  );
  return container === undefined ? render(field) : render(field, { container });
}

const trigger = () =>
  screen.queryByRole("combobox", { name: "Region" }) ?? screen.getByRole("button", { name: "Region" });
const option = (name: string) => screen.getByRole("option", { name });
const focusedOption = (name: string) => waitFor(() => expect(document.activeElement).toBe(option(name)));
async function closedShowing(label: string): Promise<void> {
  await waitFor(() => expect(screen.queryByRole("listbox")).toBeNull());
  expect(trigger().getAttribute("aria-expanded")).toBe("false");
  expect(trigger().textContent?.trim()).toBe(label);
  expect(document.activeElement).toBe(trigger());
}

afterEach(() => {
  document.head.querySelector("style[data-test-layer-offset]")?.remove();
});

describe("JokiSelect, select-only", () => {
  test("arrows move focus over options, Escape keeps the choice, and typing then Enter chooses", async () => {
    renderRegion();
    trigger().focus();
    await userEvent.keyboard("{ArrowDown}");
    const list = await screen.findByRole("listbox", { name: "Region" });
    expect(trigger().getAttribute("aria-controls")).toBe(list.id);
    expect(option("Calpheon").getAttribute("aria-selected")).toBe("true");
    await focusedOption("Calpheon");
    await userEvent.keyboard("{ArrowDown}");
    await focusedOption("Mediah");
    await userEvent.keyboard("{Escape}");
    await closedShowing("Calpheon");
    await userEvent.keyboard("{ArrowDown}");
    await screen.findByRole("listbox");
    await userEvent.keyboard("v");
    await focusedOption("Valencia");
    await userEvent.keyboard("{Enter}");
    await closedShowing("Valencia");
  });
  test("choosing the option already chosen reports the choice again", async () => {
    const view = render(SelectField, { props: { options: REGIONS, label: "Region", modelValue: "calpheon" } });
    await userEvent.click(trigger());
    await userEvent.click(option("Calpheon"));
    await closedShowing("Calpheon");
    expect(view.emitted("choose")).toEqual([["calpheon"]]);
  });
});

describe("JokiSelect, searchable", () => {
  test("typing filters the options, and Enter chooses the active one", async () => {
    renderRegion(true);
    await userEvent.click(trigger());
    const search = screen.getByRole("combobox", { name: "Search Region" });
    await waitFor(() => expect(document.activeElement).toBe(search));
    await userEvent.keyboard("me");
    await waitFor(() =>
      expect(screen.getAllByRole("option").map((item) => item.textContent?.trim())).toEqual(["Mediah"]),
    );
    expect(search.getAttribute("aria-activedescendant")).toBe(option("Mediah").id);
    await userEvent.keyboard("{ArrowDown}{Enter}");
    await closedShowing("Mediah");
  });

  test("Enter that confirms an input method composition chooses nothing, however the browser reports it", async () => {
    renderRegion(true);
    await userEvent.click(trigger());
    const search = screen.getByRole("combobox", { name: "Search Region" });
    await userEvent.keyboard("me");
    await waitFor(() =>
      expect(screen.getAllByRole("option").map((item) => item.textContent?.trim())).toEqual(["Mediah"]),
    );
    confirmCompositionWithEnter(search, "isComposing");
    confirmCompositionWithEnter(search, "safari-keycode-229");
    await nextTick();
    expect(screen.getByRole("listbox", { name: "Region" })).toBeTruthy();
    expect(trigger().textContent?.trim()).toBe("Calpheon");
  });

  test("Enter on a search that leaves only an unavailable option keeps the current choice", async () => {
    renderRegion(true);
    await userEvent.click(trigger());
    await userEvent.keyboard("kam");
    await waitFor(() =>
      expect(screen.getAllByRole("option").map((item) => item.textContent?.trim())).toEqual(["Kamasylvia"]),
    );
    expect(option("Kamasylvia").getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByRole("combobox", { name: "Search Region" }).getAttribute("aria-activedescendant")).toBeNull();
    await userEvent.keyboard("{Enter}");
    await closedShowing("Calpheon");
  });
});

describe("JokiSelect placement", () => {
  function nearBottom(fromBottom: number): HTMLElement {
    const container = document.body.appendChild(document.createElement("div"));
    Object.assign(container.style, { position: "fixed", left: "40px", bottom: `${fromBottom}px` });
    return container;
  }

  function panel(): HTMLElement {
    const element = screen.getByRole("listbox", { name: "Region" }).closest<HTMLElement>("[data-side]");
    expect(element).not.toBeNull();
    return element!;
  }

  test("a list too tall for the room below opens above its control at its full height", async () => {
    const twelve = Array.from({ length: 12 }, (_, index) => ({ value: `r${index + 1}`, label: `Region ${index + 1}` }));
    await page.viewport(1000, 800);
    renderRegion(false, twelve, nearBottom(140));
    await userEvent.click(trigger());
    await waitFor(() => {
      const box = panel().getBoundingClientRect();
      expect({
        side: panel().dataset.side,
        above: box.bottom <= trigger().getBoundingClientRect().top,
        height: Math.round(box.height),
      }).toEqual({
        side: "top",
        above: true,
        height: 286,
      });
    });
  });

  test("a list lines up with its control when the top layer is offset from the viewport", async () => {
    // Reserved scrollbar gutters put the top layer's origin this far in; headless Chromium draws overlay scrollbars,
    // so the offset is set on the panel itself.
    const style = document.head.appendChild(document.createElement("style"));
    style.dataset.testLayerOffset = "";
    style.textContent = "[data-joki-panel] { margin-left: 10px !important; }";
    renderRegion(false, REGIONS, nearBottom(400));
    await userEvent.click(trigger());
    await waitFor(() => {
      const box = panel().getBoundingClientRect();
      const control = trigger().getBoundingClientRect();
      expect({
        side: panel().dataset.side,
        leftOffset: Math.round(box.left - control.left),
        below: box.top >= control.bottom,
      }).toEqual({
        side: "bottom",
        leftOffset: 0,
        below: true,
      });
    });
  });

  test("a panel as wide as the viewport's padding allows stays inside it when the top layer is offset", async () => {
    const style = document.head.appendChild(document.createElement("style"));
    style.dataset.testLayerOffset = "";
    style.textContent = "[data-joki-panel] { margin-left: 10px !important; width: calc(100dvw - 16px) !important; }";
    await page.viewport(390, 800);
    renderRegion(false, REGIONS, nearBottom(400));
    await userEvent.click(trigger());
    await waitFor(() => {
      const box = panel().getBoundingClientRect();
      expect({ left: Math.round(box.left), right: Math.round(box.right) }).toEqual({ left: 8, right: 382 });
    });
  });

  test("a list opening with a transform animation is placed where it ends up", async () => {
    const style = document.head.appendChild(document.createElement("style"));
    style.dataset.testLayerOffset = "";
    style.textContent = [
      "@keyframes joki-test-open { from { transform: translate(40px, 40px) scale(0.5); } }",
      "[data-joki-panel] { animation: joki-test-open 60s linear; }",
    ].join("\n");
    renderRegion(false, REGIONS, nearBottom(400));
    await userEvent.click(trigger());
    await waitFor(() => {
      const control = trigger().getBoundingClientRect();
      expect({
        left: Math.round(Number.parseFloat(panel().style.left)),
        top: Math.round(Number.parseFloat(panel().style.top)),
      }).toEqual({ left: Math.round(control.left), top: Math.round(control.bottom + 6) });
    });
  });
});
