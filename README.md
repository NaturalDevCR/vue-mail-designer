# vue-mail-designer

Monorepo de un email builder visual drag & drop para Vue 3 (estilo Unlayer), publicado como librería embebible y acompañado de una demo.

- `packages/email-builder` — la librería (`@vue-mail-designer/builder`): componente `EmailBuilder`, store Pinia, generador de HTML compatible con clientes de correo, schema Zod y plantillas built-in. Ver su [README](./packages/email-builder/README.md) para instalación y uso.
- `apps/demo` — app de demostración que consume la librería (vía alias a `src` en desarrollo) para probar el editor de punta a punta.

## Stack

Vue 3.5, Vite 7, Pinia 3, Tiptap, vuedraggable, Zod, Vitest.

## Requisitos

- Node >= 20
- pnpm

## Instalación

```bash
pnpm install
```

## Comandos

| Comando | Descripción |
|---------|-------------|
| `pnpm dev` | Levanta la demo en modo desarrollo. |
| `pnpm build` | Compila la librería en modo lib (`dist/index.js`, `dist/index.d.ts`, `dist/vue-mail-designer.css`) y luego la demo. |
| `pnpm test` | Corre los tests de la librería (Vitest). |
| `pnpm typecheck` | Verifica tipos en todos los paquetes del workspace. |
| `pnpm check` | `typecheck` + `test`. |

## Estructura

```
packages/email-builder/   # librería publicable
apps/demo/                 # demo de consumo
```

## Licencia

Privado / uso interno.
