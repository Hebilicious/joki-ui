/* BOUNDARY: Safari delivers `compositionend` before the keydown of the Enter that confirms
   the composition, so `isComposing` is already false there; its `keyCode` of 229 still marks it. */
export function isInputMethodKeydown(event: KeyboardEvent): boolean {
  return event.isComposing || event.keyCode === 229;
}
