# Installation

## Requirements

- Vue `^3.5.0`
- Pinia `^2.2.0` or `^3.0.0`
- Node `>=20` (only to develop/build your app)

## Package

::: code-group

```bash [pnpm]
pnpm add @naturaldevcr/vue-mail-designer vue pinia
```

```bash [npm]
npm install @naturaldevcr/vue-mail-designer vue pinia
```

```bash [yarn]
yarn add @naturaldevcr/vue-mail-designer vue pinia
```

:::

`vue` and `pinia` are peer dependencies — the library doesn't bundle them, to avoid duplicating them if your app already uses them.

## Styles

The component ships its own CSS, with `--vmd-*` variables for theming. Import it once in your app:

```ts
import '@naturaldevcr/vue-mail-designer/style.css'
```

## Next step

[Quickstart](/guide/quickstart) — mount the editor and export your first HTML.
