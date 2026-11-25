# Vapor testing

Renders Vue 3.6 Vapor components in the real browser page Vitest Browser Mode runs, and queries them with
`@testing-library/dom`. Each mount is a `createVaporApp`, the way Vue's own Vapor runtime tests mount components.

It depends on Vue and its Vapor runtime, Vite, Vitest with its Playwright provider, Testing Library, and Vize with
its Vite plugin, and on nothing from the application, so another project can take it as it is.

## Setup

```ts
// vitest.config.ts
import vize from "@vizejs/vite-plugin";
import { vaporTesting } from "@joki-ui/vapor-testing/vite";

export default defineConfig({
  plugins: [...vize({ vapor: true }), vaporTesting({ stubbable: ["InteractiveMap"] })],
  test: {
    setupFiles: ["@joki-ui/vapor-testing/setup"],
    browser: { enabled: true, provider: playwright(), instances: [{ browser: "chromium" }] },
  },
});
```

`vaporTesting` aliases `node:assert/strict`, `node:timers/promises` and `node:util` to page shims. It also compiles
each component named in `stubbable` into a stand-in, which renders the real component unless a mount stubs it. The
`NODE_BUILTIN_SHIMS` is that alias map, for a configuration that sets its aliases itself. The
setup file gives the page Node's `setImmediate` queue, answers Vue's devtools wait, and unmounts every component after
each test.

## Rendering

```ts
const view = render(Greeting, { props: { name: "Ada" }, global: { provide: { tone: "warm" }, stubs: { Map: true } } });
await fireEvent.click(screen.getByRole("button"));
view.emitted("greet"); // [["Ada"]]
await view.rerender({ name: "Grace" });
```

`fireEvent` waits for Vue's next flush after each event. `compose.ts` builds test surfaces without a single-file
component: `withProps`, `withModel`, `withSetup`, `harness`, `inScope`, `inFrame`, `inOrder`, `afterMount` and `markup`.

## Tests

`moon run vapor-testing:test` runs the library's own tests in Chromium; `moon run vapor-testing:typecheck` checks its
types.
