/**
 * Shows a `popover="manual"` element in the browser top layer. Re-showing an open popover moves it above top-layer
 * elements opened since, such as a modal dialog.
 */
export function promoteToTopLayer(element: HTMLElement): void {
  if (!("showPopover" in element)) return;
  if (element.matches(":popover-open")) element.hidePopover();
  element.showPopover();
}

export function leaveTopLayer(element: HTMLElement): void {
  if ("hidePopover" in element && element.matches(":popover-open")) element.hidePopover();
}
