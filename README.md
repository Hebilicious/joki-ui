# joki-ui

Accessible, unstyled menus, selects and popovers for Vue Vapor, on the browser's top layer.

The library is in [`packages/joki-ui`](packages/joki-ui/README.md). [`packages/vapor-testing`](packages/vapor-testing/README.md)
renders Vapor components in Chromium for its tests and is not published. The work is tracked in Quadratique, project
`JOKI`.

## Development

Node and pnpm are pinned in `.prototools`; `proto install` installs them.

```sh
pnpm install
pnpm browsers:install   # Chromium for the browser tests, once
pnpm typecheck          # every package
pnpm test               # every package, in Chromium
```
