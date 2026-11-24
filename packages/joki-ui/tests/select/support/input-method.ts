/** How a browser marks the keydown of the Enter that confirms an input method composition. */
export type CompositionEnterReport = "isComposing" | "safari-keycode-229";

/* BOUNDARY: Chromium and Firefox set `isComposing` on that keydown. Safari delivers
   `compositionend` first, so its keydown has `isComposing` false and only `keyCode` 229 marks it. */
export function confirmCompositionWithEnter(target: Element, report: CompositionEnterReport = "isComposing"): void {
  const event = new KeyboardEvent("keydown", {
    key: "Enter",
    isComposing: report === "isComposing",
    bubbles: true,
    cancelable: true,
  });
  if (report === "safari-keycode-229") Object.defineProperty(event, "keyCode", { value: 229 });
  target.dispatchEvent(event);
}
