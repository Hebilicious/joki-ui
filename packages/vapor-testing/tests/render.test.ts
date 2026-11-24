import { describe, expect, test } from "vite-plus/test";
import { defineVaporComponent } from "@vue/runtime-vapor";

import { cleanup, fireEvent, render, screen } from "../src/index.ts";
import GreetingCard from "./fixtures/GreetingCard.vue";
import GreetingButton from "./fixtures/GreetingButton.vue";

describe("render", () => {
  test("mounts a component with its props in the page", () => {
    render(GreetingButton, { props: { name: "Ada" } });
    expect(screen.getByRole("button").textContent).toBe("Hello Ada");
  });

  test("rerender reaches the mounted component's props", async () => {
    const view = render(GreetingButton, { props: { name: "Ada" } });
    await view.rerender({ name: "Grace" });
    expect(screen.getByRole("button").textContent).toBe("Hello Grace");
  });

  test("records each emit the component declares, with its arguments", async () => {
    const view = render(GreetingButton, { props: { name: "Ada" } });
    expect(view.emitted("greet")).toBeUndefined();
    await fireEvent.click(screen.getByRole("button"));
    expect(view.emitted("greet")).toEqual([["Ada"]]);
  });

  test("renders slot HTML and reaches inject through global provide", () => {
    render(GreetingCard, { slots: { default: "<p>Slotted</p>" }, global: { provide: { tone: "warm" } } });
    expect(screen.getByText("Slotted").tagName).toBe("P");
    expect(screen.getByRole("region", { name: "Card" }).dataset.tone).toBe("warm");
  });

  test("cleanup unmounts every rendered component and removes its container", () => {
    const view = render(GreetingButton, { props: { name: "Ada" } });
    cleanup();
    expect(view.container.isConnected).toBe(false);
    expect(screen.queryByRole("button")).toBeNull();
  });

  test("cleanup removes the container of a component that threw while it mounted", () => {
    const before = document.body.childElementCount;
    const Broken = defineVaporComponent({
      setup() {
        throw new Error("broken setup");
      },
    });
    expect(() => render(Broken)).toThrow("broken setup");
    cleanup();
    expect(document.body.childElementCount).toBe(before);
  });
});

describe("stubs", () => {
  test("a stubbable child renders its real component unless the mount stubs it", () => {
    render(GreetingCard);
    expect(screen.getByRole("button").textContent).toBe("Hello Ada");
  });

  test("a stub of true renders an empty element named after the component", () => {
    const view = render(GreetingCard, { global: { stubs: { GreetingButton: true } } });
    expect(view.container.querySelector("greeting-button-stub")).not.toBeNull();
    expect(screen.queryByRole("button")).toBeNull();
  });

  test("a replacement component renders in the stubbed one's place, with its props", () => {
    const Replacement = defineVaporComponent({
      props: { name: String },
      setup: (props) => {
        const element = document.createElement("strong");
        element.textContent = `Stubbed ${props.name}`;
        return element;
      },
    });
    render(GreetingCard, { global: { stubs: { GreetingButton: Replacement } } });
    expect(screen.getByText("Stubbed Ada").tagName).toBe("STRONG");
  });
});
