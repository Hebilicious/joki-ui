import { describe, expect, test } from "vite-plus/test";
import { shallowRef } from "vue";

import { fireEvent, harness, markup, render, screen, withModel } from "../src/index.ts";
import GreetingButton from "./fixtures/GreetingButton.vue";
import NameField from "./fixtures/NameField.vue";

describe("composers", () => {
  test("withModel keeps a two-way prop in local state, as v-model does", async () => {
    render(withModel(NameField, { modelValue: "Ada" }, "modelValue"));
    await fireEvent.update(screen.getByRole("textbox", { name: "Name" }), "Grace");
    expect(screen.getByRole("status").textContent).toBe("Grace");
  });

  test("harness mounts a child only while its props getter returns props", async () => {
    const shown = shallowRef(false);
    render(harness(() => [[GreetingButton, () => (shown.value ? { name: "Ada" } : null)]]));
    expect(screen.queryByRole("button")).toBeNull();
    shown.value = true;
    expect((await screen.findByRole("button")).textContent).toBe("Hello Ada");
  });

  test("markup renders fixed HTML through Vapor's template factory", () => {
    render(markup("<p>Static</p>"));
    expect(screen.getByText("Static").tagName).toBe("P");
  });
});
