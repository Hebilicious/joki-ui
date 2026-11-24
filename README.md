# joki-ui

Accessible, unstyled menus, selects and popovers for Vue Vapor, on the browser's top layer.

The library is in [`packages/joki-ui`](packages/joki-ui/README.md). [`packages/vapor-testing`](packages/vapor-testing/README.md)
renders Vapor components in Chromium for its tests and is not published. The work is tracked in Quadratique, project
`JOKI`.

## Development

proto installs Node, pnpm and Moon at the versions in `.prototools` (`proto install`). Moon runs every operation.

```sh
moon run verify                 # every check: type check and browser tests of each package
moon run joki-ui:test           # one package's tests, in Chromium
moon run joki-ui:typecheck      # one package's types
```

Moon installs the Node dependencies and Chromium before the tasks that need them.
