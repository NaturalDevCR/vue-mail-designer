# Instalación

## Requisitos

- Vue `^3.5.0`
- Pinia `^2.2.0` o `^3.0.0`
- Node `>=20` (solo para desarrollar/compilar tu app)

## Paquete

::: code-group

```bash [pnpm]
pnpm add @vue-mail-designer/builder vue pinia
```

```bash [npm]
npm install @vue-mail-designer/builder vue pinia
```

```bash [yarn]
yarn add @vue-mail-designer/builder vue pinia
```

:::

`vue` y `pinia` son *peer dependencies* — la librería no las empaqueta, para no duplicarlas si tu app ya las usa.

## Estilos

El componente trae su propio CSS, con variables `--vmd-*` para theming. Importalo una vez en tu app:

```ts
import '@vue-mail-designer/builder/style.css'
```

## Siguiente paso

[Inicio rápido](/guide/quickstart) — montar el editor y exportar tu primer HTML.
