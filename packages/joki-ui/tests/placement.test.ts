import { describe, expect, test } from "vite-plus/test";

import { placePanel, type PlacementOptions, type Rect, type Side } from "../src/placement.js";

const viewport = { width: 1000, height: 800 };
const options: PlacementOptions = { align: "start", offset: 6, padding: 8 };

function place(control: Rect, width: number, height: number, side: Side) {
  return placePanel(control, { width, height }, viewport, { ...options, side });
}

describe("placePanel", () => {
  test("a panel that fits below its control opens below it", () => {
    expect(place({ left: 100, top: 100, width: 120, height: 30 }, 200, 100, "bottom")).toEqual({
      left: 100,
      top: 136,
      side: "bottom",
      height: 100,
    });
  });

  test("a panel that does not fit below its control opens above it", () => {
    expect(place({ left: 100, top: 700, width: 120, height: 30 }, 200, 100, "bottom")).toEqual({
      left: 100,
      top: 594,
      side: "top",
      height: 100,
    });
  });

  test("a panel too tall for either side stays on its side, shortened to the room there", () => {
    expect(place({ left: 100, top: 380, width: 120, height: 30 }, 200, 500, "bottom")).toEqual({
      left: 100,
      top: 416,
      side: "bottom",
      height: 376,
    });
  });

  test("a panel aligned past the viewport edge is kept inside it", () => {
    expect(place({ left: 900, top: 100, width: 80, height: 30 }, 200, 100, "bottom")).toEqual({
      left: 792,
      top: 136,
      side: "bottom",
      height: 100,
    });
  });

  test("a sideways panel with room on neither side drops below its control, aligned to its end", () => {
    expect(place({ left: 450, top: 100, width: 100, height: 30 }, 600, 100, "right")).toEqual({
      left: 8,
      top: 136,
      side: "bottom",
      height: 100,
    });
  });
});
