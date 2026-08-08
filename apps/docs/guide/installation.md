# Instalación

## Requisitos

- Vue `^3.5.0`
- Pinia `^2.2.0` o `^3.0.0`
- Node `>=20` (solo para desarrollar/compilar tu app)

## Paquete

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

`vue` y `pinia` son *peer dependencies* — la librería no las empaqueta, para no duplicarlas si tu app ya las usa.

## Estilos

El componente trae su propio CSS, con variables `--vmd-*` para theming. Importalo una vez en tu app:

```ts
import '@naturaldevcr/vue-mail-designer/style.css'
```

## Siguiente paso

[Inicio rápido](/guide/quickstart) — montar el editor y exportar tu primer HTML.
