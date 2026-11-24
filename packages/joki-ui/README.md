# joki-ui

Accessible, unstyled menus, selects and popovers for Vue 3.6 Vapor. Each panel opens in the browser's top layer, so
no ancestor's `overflow`, `z-index` or `transform` clips it. joki-ui ships behavior, ARIA wiring and placement only;
the markup and every style are the consumer's.

At runtime it needs Vue and XState only; the rest of its manifest runs its own tests.

## Components

Each widget is a family: a root that owns the state, and parts that render inside it.

| Root          | Parts                                                                                              | Pattern                                    |
| ------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------ |
| `JokiPopover` | `JokiPopoverTrigger`, `JokiPopoverContent`                                                         | A dialog or region opened beside a control |
| `JokiMenu`    | `JokiMenuTrigger`, `JokiMenuContent`, `JokiMenuItem`                                               | WAI-ARIA menu button                       |
| `JokiSelect`  | `JokiSelectTrigger`, `JokiSelectContent`, `JokiSelectSearch`, `JokiSelectList`, `JokiSelectOption` | WAI-ARIA combobox with a listbox popup     |

A part used outside its root throws `<Part> must be used inside <Root>`.

### Parts render their own elements

Each part renders the element it binds: a trigger is a `<button>`, a content part and the list are a `<div>`, the
search field is an `<input>`, and an item or option is a `<button>`. Put your classes and attributes on the part and
they land on that element, as your component's scoped styles do; the part's content is its default slot.

```vue
<JokiPopover v-model:open="open" :placement="{ align: 'end', offset: 6, padding: 8 }">
  <JokiPopoverTrigger class="details-button">Details</JokiPopoverTrigger>
  <JokiPopoverContent as="section" class="details-panel" aria-label="Details">…</JokiPopoverContent>
</JokiPopover>
```

- `as` names a different element for a trigger, a content part or the list, such as `as="section"` or `as="a"`.
- Your attributes win over the part's, and a listener you add runs beside the part's.
- Do not set a part's `id`, `role`, `tabindex` or any `aria-` attribute the family sets, such as `aria-expanded`,
  `aria-controls`, `aria-haspopup` or `aria-activedescendant`: the family finds its elements by the ids it gives them,
  and those attributes carry the widget's ARIA pattern. An open panel the family cannot find throws, naming its id.
- A trigger exposes `focus()`, for an owner that hands focus back to it through a template ref.

Vapor cannot clone the elements a slot renders, so joki-ui has no `asChild`; a part that rendered your element instead
would have to hand you its bindings to place yourself.

### `JokiPopover`

| Prop / event         | Type                   | Default      | Meaning                                                                                      |
| -------------------- | ---------------------- | ------------ | -------------------------------------------------------------------------------------------- |
| `v-model:open`       | `boolean`              | `false`      | Whether the panel is open                                                                    |
| `placement`          | `PlacementOptions`     | `{}`         | Where the panel sits beside the trigger                                                      |
| `role`               | `"dialog" \| "region"` | `"dialog"`   | `region` for a non-modal part of the page                                                    |
| `focusOnOpen`        | `() => boolean`        | `() => true` | Whether this opening moves focus into the panel; a hover opening can leave it on the page    |
| `triggerTogglesOpen` | `boolean`              | `true`       | Whether a trigger press toggles `open`; `false` leaves the press to the owner's own listener |

An outside press or Escape closes the panel, and focus returns to the trigger.

### `JokiMenu`

| Prop / event   | Type                  | Default | Meaning                                                                                          |
| -------------- | --------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| `v-model:open` | `boolean`             | `false` | Whether the menu is open                                                                         |
| `placement`    | `PlacementOptions`    | `{}`    | Where the menu sits beside its anchor                                                            |
| `anchor`       | `PlacementAnchor`     | trigger | What the menu opens beside instead, such as an element or the point a context menu was opened at |
| `returnFocus`  | `HTMLElement \| null` | `null`  | Where focus returns on close for a menu without a `JokiMenuTrigger`                              |

Arrow keys, Home and End move between enabled items, typing jumps to an item, Enter or a click chooses it, and
Escape or Tab closes the menu. `JokiMenuItem` takes `disabled` and emits `select`; choosing an item closes the menu.
A disabled item stays focusable and carries `aria-disabled`.

A context menu has no trigger: open it with `v-model:open`, pass the pointer position as `anchor` (any object with
`getBoundingClientRect()`), and the element focus should return to as `returnFocus`.

### `JokiSelect`

`JokiSelect` is generic over its items, `Item extends JokiSelectItem` (`{ value, label, disabled? }`).

| Prop / event   | Type               | Default | Meaning                                                       |
| -------------- | ------------------ | ------- | ------------------------------------------------------------- |
| `v-model`      | `Item["value"]`    |         | The chosen value; choosing the chosen option reports it again |
| `options`      | `readonly Item[]`  |         | The options the popup shows, already filtered by any search   |
| `searchable`   | `boolean`          | `false` | Whether the popup has a `JokiSelectSearch` field              |
| `disabled`     | `boolean`          | `false` | Whether the select can open                                   |
| `placement`    | `PlacementOptions` | `{}`    | Where the popup sits beside the trigger                       |
| `@open-change` | `(open: boolean)`  |         | The popup opened or closed, such as to clear a search         |

`JokiSelect` is controlled: it shows the value its parent binds and keeps none of its own, so a select without
`v-model` never shows a choice. `JokiSelectOption` takes the `index` of its item in `options`. The select filters
nothing itself: a searchable select binds `JokiSelectSearch`'s `v-model` to its own query and passes the filtered list
as `options`.

```vue
<JokiSelect v-model="model" :options="visible" searchable @open-change="query = ''">
  <JokiSelectTrigger aria-label="Ship">{{ chosen?.label }}</JokiSelectTrigger>
  <JokiSelectContent class="select-panel">
    <JokiSelectSearch v-model="query" aria-label="Search ships" />
    <JokiSelectList aria-label="Ship">
      <JokiSelectOption v-for="(option, index) in visible" :key="option.value" :index="index">
        {{ option.label }}
      </JokiSelectOption>
    </JokiSelectList>
  </JokiSelectContent>
</JokiSelect>
```

Every root's default slot and each trigger's default slot receive `open`.

## Placement

`PlacementOptions` is `{ side?, align?, offset?, padding?, strategy? }`. The panel opens on `side` (default `bottom`)
when it fits there and on the opposite side when only that one fits, lines up with its anchor by `align` (default
`center`), sits `offset` pixels from it, and stays `padding` pixels inside the viewport. A panel too tall for either
side stays on `side`, shortened to the room there.

`strategy` picks who places the panel:

- `script`, the default: joki-ui measures the anchor and the panel when it opens and again on scroll or resize, not
  when the panel's own content changes size.
- `css`: the browser places it with CSS anchor positioning, with nothing measured and no scroll or resize listener.
  While the panel is open, its anchor's inline `anchor-name` holds a name unique to that panel, and the panel gets
  `position-anchor`, a `position-area` from `side` and `align`, the `offset` as its margin on the anchor's side, the
  `padding` as its margins on the far edges, and `position-try-fallbacks` that flip it as script placement does. A
  point-like anchor such as a context menu's pointer, and a browser without anchor positioning, fall back to `script`.

A panel on its requested side or flipped to the other one, and a `center` panel above or below its anchor, land
where script placement puts them. Otherwise the two differ where script placement slides a panel along its anchor to
keep it inside the viewport, because the browser counts such a slide as not fitting:

- A `start` or `end` panel that overruns the viewport past the anchor's edge centres on the anchor and slides inside
  the padding. That lands where the script clamps it once the overrun is at least half the panel's width; a smaller
  overrun leaves it centred on the anchor, short of the padding.
- A `left` or `right` panel that would have to slide up or down drops below or above the anchor, aligned to its end.
- `data-side` and `--joki-transform-origin` name the requested side even after the browser flips the panel.
- A panel whose anchor scrolls out of the viewport goes with it, where script placement holds it inside the padding.

`tests/anchored-placement.test.ts` places a panel at each of these positions.

Either way, the panel publishes three custom properties for its stylesheet:

- `--joki-anchor-width`: the anchor's width, to make a select popup as wide as its trigger.
- `--joki-available-height`: the room on the side it opened on, for `max-height`; under `css`, the padded viewport
  height (`100dvh`), with a panel too tall for either side shortened by a fallback instead. Script placement measures
  the viewport as the document's client height. The two measurements can differ; no test shows a case where they do.
- `--joki-transform-origin`: the edge facing the anchor, for an opening animation.

## Styling

Style the elements you render. The library sets these attributes for state selectors:

- every trigger and panel: `data-state`, `open` or `closed`, beside the trigger's `aria-expanded`;
- a menu item or select option: `data-highlighted` on the active one, and `data-disabled` with `aria-disabled` when
  disabled;
- a select option: `aria-selected`, and `data-state`, `checked` or `unchecked`.

`promoteToTopLayer` and `leaveTopLayer` move any other element in and out of the top layer, for a surface that must
stack above an open panel.

## Tests

`moon run joki-ui:test` runs the library's tests in Chromium through
[`@joki-ui/vapor-testing`](../vapor-testing/README.md); `moon run joki-ui:typecheck` checks its types.
