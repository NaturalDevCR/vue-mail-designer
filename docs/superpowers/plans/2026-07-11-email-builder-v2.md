# Email Builder v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reescribir vue-mail-designer como librería Vue 3 embebible con builder drag & drop estilo Unlayer, preview desktop/mobile del HTML real, 10 bloques, merge tags y templates.

**Architecture:** Monorepo pnpm con `packages/email-builder` (librería) y `apps/demo`. El documento es JSON validado con Zod; un generador puro `renderHtml(doc): string` produce HTML de email (tablas + estilos inline + MSO comments) que alimenta tanto el export como el preview en iframe. Estado con Pinia (instancia propia inyectada por `EmailBuilder.vue`), DnD con vuedraggable, rich text con Tiptap.

**Tech Stack:** Vue 3.5, TypeScript estricto, Vite 7 (library mode + vite-plugin-dts), Pinia 3, Zod 3.25+, Tiptap 2.26+, vuedraggable 4 (SortableJS), Vitest 3, @vue/test-utils.

**Spec:** `docs/superpowers/specs/2026-07-11-email-builder-v2-design.md`

## Global Constraints

- Paquete librería: `@vue-mail-designer/builder`, ESM only, `peerDependencies`: `vue ^3.5.0` y `pinia ^2.2.0 || ^3.0.0`.
- TypeScript estricto (`"strict": true`), typecheck con `vue-tsc --noEmit`.
- HTML de email: solo tablas con `role="presentation"`, estilos inline, sin flex/grid/position; columnas con hybrid approach (ghost tables MSO + `display:inline-block` + media query).
- Ancho de contenido por defecto 600px; breakpoint mobile 480px.
- Un solo editor rich text (Tiptap) y una sola librería DnD (vuedraggable). Prohibido agregar Quill, Swapy o vue-email.
- La librería NO persiste en localStorage; eso es de la demo.
- El tema oscuro afecta solo la UI del builder, nunca el canvas del email.
- Todos los strings visibles de la UI en español.
- Cada tarea termina con typecheck + tests verdes y un commit.
- Comandos se corren desde la raíz salvo indicación. Si `pnpm --filter` falla por "Ignored build scripts", correr una vez `pnpm approve-builds` aprobando esbuild y vue-demi (ya cubierto por `pnpm.onlyBuiltDependencies` en Task 1).

---

### Task 1: Scaffold del monorepo limpio

Borra el código viejo (ya preservado en git commit `1f3c653`) y crea la estructura nueva con tooling moderno funcionando de punta a punta.

**Files:**
- Delete: `packages/`, `apps/`, `.trae/` (código viejo)
- Create: `package.json` (reemplaza), `pnpm-workspace.yaml` (reemplaza), `packages/email-builder/package.json`, `packages/email-builder/vite.config.ts`, `packages/email-builder/tsconfig.json`, `packages/email-builder/src/index.ts`, `apps/demo/package.json`, `apps/demo/vite.config.ts`, `apps/demo/tsconfig.json`, `apps/demo/index.html`, `apps/demo/src/main.ts`, `apps/demo/src/App.vue`

**Interfaces:**
- Produces: workspace donde `pnpm test`, `pnpm typecheck` y `pnpm dev` corren verdes; la librería exporta desde `src/index.ts`; la demo importa `@vue-mail-designer/builder` (aliased a `src/` en dev).

- [ ] **Step 1: Borrar código viejo**

```bash
git rm -rq packages apps .trae
rm -rf node_modules packages apps
```

- [ ] **Step 2: Root `package.json`** (sobrescribir)

```json
{
  "name": "vue-mail-designer",
  "version": "2.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "pnpm --filter demo dev",
    "build": "pnpm --filter @vue-mail-designer/builder build && pnpm --filter demo build",
    "test": "pnpm --filter @vue-mail-designer/builder test",
    "typecheck": "pnpm -r typecheck",
    "check": "pnpm typecheck && pnpm test"
  },
  "pnpm": {
    "onlyBuiltDependencies": ["esbuild", "vue-demi"]
  },
  "engines": { "node": ">=20" }
}
```

`pnpm-workspace.yaml` (sobrescribir):

```yaml
packages:
  - 'packages/*'
  - 'apps/*'
```

- [ ] **Step 3: `packages/email-builder/package.json`**

```json
{
  "name": "@vue-mail-designer/builder",
  "version": "0.1.0",
  "description": "Email builder visual drag & drop para Vue 3",
  "type": "module",
  "files": ["dist"],
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js" },
    "./style.css": "./dist/vue-mail-designer.css"
  },
  "scripts": {
    "build": "vite build",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "vue-tsc --noEmit"
  },
  "dependencies": {
    "@tiptap/extension-link": "^2.26.0",
    "@tiptap/extension-text-align": "^2.26.0",
    "@tiptap/extension-underline": "^2.26.0",
    "@tiptap/pm": "^2.26.0",
    "@tiptap/starter-kit": "^2.26.0",
    "@tiptap/vue-3": "^2.26.0",
    "vuedraggable": "^4.1.0",
    "zod": "^3.25.0"
  },
  "peerDependencies": {
    "pinia": "^2.2.0 || ^3.0.0",
    "vue": "^3.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.0",
    "@vue/test-utils": "^2.4.6",
    "jsdom": "^26.0.0",
    "pinia": "^3.0.0",
    "typescript": "~5.9.0",
    "vite": "^7.0.0",
    "vite-plugin-dts": "^4.5.0",
    "vitest": "^3.2.0",
    "vue": "^3.5.0",
    "vue-tsc": "^3.0.0"
  }
}
```

- [ ] **Step 4: `packages/email-builder/vite.config.ts`**

```ts
/// <reference types="vitest/config" />
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [vue(), dts({ rollupTypes: true, tsconfigPath: './tsconfig.json' })],
  build: {
    lib: {
      entry: fileURLToPath(new URL('./src/index.ts', import.meta.url)),
      formats: ['es'],
      fileName: 'index',
      cssFileName: 'vue-mail-designer',
    },
    rollupOptions: { external: ['vue', 'pinia'] },
  },
  test: {
    environment: 'jsdom',
    globals: false,
  },
})
```

`packages/email-builder/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noEmit": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "verbatimModuleSyntax": true,
    "jsx": "preserve",
    "types": ["vite/client"]
  },
  "include": ["src/**/*.ts", "src/**/*.vue", "tests/**/*.ts"]
}
```

`packages/email-builder/src/index.ts` (placeholder mínimo que las tareas siguientes van ampliando):

```ts
export const VERSION = '0.1.0'
```

- [ ] **Step 5: App demo**

`apps/demo/package.json`:

```json
{
  "name": "demo",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "typecheck": "vue-tsc --noEmit"
  },
  "dependencies": {
    "@vue-mail-designer/builder": "workspace:*",
    "pinia": "^3.0.0",
    "vue": "^3.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^6.0.0",
    "typescript": "~5.9.0",
    "vite": "^7.0.0",
    "vue-tsc": "^3.0.0"
  }
}
```

`apps/demo/vite.config.ts` (alias a `src` de la librería para HMR en dev):

```ts
import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@vue-mail-designer/builder': fileURLToPath(
        new URL('../../packages/email-builder/src/index.ts', import.meta.url),
      ),
    },
  },
})
```

`apps/demo/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true,
    "jsx": "preserve",
    "types": ["vite/client"],
    "paths": {
      "@vue-mail-designer/builder": ["../../packages/email-builder/src/index.ts"]
    }
  },
  "include": ["src/**/*.ts", "src/**/*.vue"]
}
```

`apps/demo/index.html`:

```html
<!doctype html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vue Mail Designer — Demo</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

`apps/demo/src/main.ts`:

```ts
import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')
```

`apps/demo/src/App.vue`:

```vue
<template>
  <main style="padding: 16px">
    <h1>Vue Mail Designer {{ VERSION }}</h1>
  </main>
</template>

<script setup lang="ts">
import { VERSION } from '@vue-mail-designer/builder'
</script>
```

- [ ] **Step 6: Instalar y verificar**

```bash
pnpm install
pnpm typecheck
```

Expected: install sin errores; typecheck pasa en ambos paquetes (exit 0).

```bash
pnpm --filter @vue-mail-designer/builder test
```

Expected: "No test files found" con exit 0 — si Vitest sale con código ≠0 por falta de tests, agregar `passWithNoTests: true` dentro de `test` en `vite.config.ts` (se puede quitar en Task 2).

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold monorepo v2 (Vite 7, Vue 3.5, TS estricto)"
```

---

### Task 2: Schema Zod, tipos y factories

**Files:**
- Create: `packages/email-builder/src/schema/ids.ts`, `packages/email-builder/src/schema/document.ts`, `packages/email-builder/src/schema/factories.ts`
- Modify: `packages/email-builder/src/index.ts`
- Test: `packages/email-builder/tests/schema.test.ts`

**Interfaces:**
- Produces:
  - Tipos: `EmailDocument`, `EmailSettings`, `Row`, `Column`, `Block`, `BlockType`, y por bloque `HeadingBlock`, `TextBlock`, `ImageBlock`, `ButtonBlock`, `DividerBlock`, `SpacerBlock`, `SocialBlock`, `MenuBlock`, `HtmlBlock`, `VideoBlock`, `SocialNetworkKind`, `Align`.
  - `zEmailDocument: ZodType<EmailDocument>` para validación.
  - `createId(prefix: string): string`
  - `createDocument(): EmailDocument` (vacío, settings default)
  - `createRow(widths: number[]): Row` (widths en % que suman 100)
  - `createBlock(type: BlockType): Block` (defaults completos por tipo)
  - `BLOCK_TYPES: BlockType[]` (los 10, en orden de paleta)

- [ ] **Step 1: Test que falla**

`packages/email-builder/tests/schema.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import {
  BLOCK_TYPES,
  createBlock,
  createDocument,
  createId,
  createRow,
  zEmailDocument,
} from '../src/schema'

describe('schema', () => {
  it('createId genera ids únicos con prefijo', () => {
    const a = createId('row')
    const b = createId('row')
    expect(a).toMatch(/^row_/)
    expect(a).not.toBe(b)
  })

  it('createDocument produce un documento válido según zod', () => {
    const doc = createDocument()
    expect(doc.rows).toEqual([])
    expect(doc.settings.contentWidth).toBe(600)
    expect(() => zEmailDocument.parse(doc)).not.toThrow()
  })

  it('createRow reparte columnas según widths', () => {
    const row = createRow([33, 34, 33])
    expect(row.columns).toHaveLength(3)
    expect(row.columns.map((c) => c.widthPct)).toEqual([33, 34, 33])
  })

  it('cada tipo de bloque tiene factory válida', () => {
    for (const type of BLOCK_TYPES) {
      const doc = createDocument()
      const row = createRow([100])
      row.columns[0].blocks.push(createBlock(type))
      doc.rows.push(row)
      const result = zEmailDocument.safeParse(doc)
      expect(result.success, `bloque ${type} inválido`).toBe(true)
    }
  })

  it('rechaza documentos malformados', () => {
    expect(zEmailDocument.safeParse({ rows: 'nope' }).success).toBe(false)
    expect(
      zEmailDocument.safeParse({
        version: 1,
        settings: {},
        rows: [{ id: 'x', style: {}, columns: [{ id: 'c', widthPct: 100, style: {}, blocks: [{ type: 'inexistente', id: 'b' }] }] }],
      }).success,
    ).toBe(false)
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
pnpm --filter @vue-mail-designer/builder test
```

Expected: FAIL — no existe `../src/schema`.

- [ ] **Step 3: Implementar**

`packages/email-builder/src/schema/ids.ts`:

```ts
let counter = 0

export function createId(prefix: string): string {
  counter += 1
  return `${prefix}_${counter.toString(36)}${Math.random().toString(36).slice(2, 8)}`
}
```

`packages/email-builder/src/schema/document.ts`:

```ts
import { z } from 'zod'

export const zAlign = z.enum(['left', 'center', 'right'])
export type Align = z.infer<typeof zAlign>

const zPadding = z.object({
  top: z.number(),
  right: z.number(),
  bottom: z.number(),
  left: z.number(),
})
export type Padding = z.infer<typeof zPadding>

export const zHeadingBlock = z.object({
  id: z.string(),
  type: z.literal('heading'),
  text: z.string(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  style: z.object({
    color: z.string(),
    fontSize: z.number(),
    align: zAlign,
    padding: zPadding,
  }),
})

export const zTextBlock = z.object({
  id: z.string(),
  type: z.literal('text'),
  html: z.string(),
  style: z.object({
    color: z.string(),
    fontSize: z.number(),
    lineHeight: z.number(),
    padding: zPadding,
  }),
})

export const zImageBlock = z.object({
  id: z.string(),
  type: z.literal('image'),
  src: z.string(),
  alt: z.string(),
  href: z.string().optional(),
  widthPct: z.number().min(10).max(100),
  align: zAlign,
  style: z.object({ padding: zPadding }),
})

export const zButtonBlock = z.object({
  id: z.string(),
  type: z.literal('button'),
  label: z.string(),
  href: z.string(),
  align: zAlign,
  style: z.object({
    backgroundColor: z.string(),
    color: z.string(),
    fontSize: z.number(),
    borderRadius: z.number(),
    innerPaddingX: z.number(),
    innerPaddingY: z.number(),
    padding: zPadding,
  }),
})

export const zDividerBlock = z.object({
  id: z.string(),
  type: z.literal('divider'),
  style: z.object({
    color: z.string(),
    thickness: z.number(),
    widthPct: z.number().min(10).max(100),
    padding: zPadding,
  }),
})

export const zSpacerBlock = z.object({
  id: z.string(),
  type: z.literal('spacer'),
  height: z.number().min(4).max(200),
})

export const zSocialNetworkKind = z.enum([
  'facebook',
  'instagram',
  'x',
  'linkedin',
  'youtube',
  'tiktok',
  'whatsapp',
  'web',
])
export type SocialNetworkKind = z.infer<typeof zSocialNetworkKind>

export const zSocialBlock = z.object({
  id: z.string(),
  type: z.literal('social'),
  networks: z.array(z.object({ kind: zSocialNetworkKind, url: z.string() })),
  iconSize: z.number(),
  spacing: z.number(),
  align: zAlign,
  style: z.object({ padding: zPadding }),
})

export const zMenuBlock = z.object({
  id: z.string(),
  type: z.literal('menu'),
  items: z.array(z.object({ label: z.string(), href: z.string() })),
  separator: z.string(),
  align: zAlign,
  style: z.object({
    color: z.string(),
    fontSize: z.number(),
    padding: zPadding,
  }),
})

export const zHtmlBlock = z.object({
  id: z.string(),
  type: z.literal('html'),
  code: z.string(),
})

export const zVideoBlock = z.object({
  id: z.string(),
  type: z.literal('video'),
  thumbnailUrl: z.string(),
  videoUrl: z.string(),
  alt: z.string(),
  widthPct: z.number().min(10).max(100),
  style: z.object({ padding: zPadding }),
})

export const zBlock = z.discriminatedUnion('type', [
  zHeadingBlock,
  zTextBlock,
  zImageBlock,
  zButtonBlock,
  zDividerBlock,
  zSpacerBlock,
  zSocialBlock,
  zMenuBlock,
  zHtmlBlock,
  zVideoBlock,
])

export const zColumn = z.object({
  id: z.string(),
  widthPct: z.number().min(5).max(100),
  style: z.object({
    backgroundColor: z.string(),
    padding: zPadding,
  }),
  blocks: z.array(zBlock),
})

export const zRow = z.object({
  id: z.string(),
  style: z.object({
    backgroundColor: z.string(),
    padding: zPadding,
    borderRadius: z.number(),
  }),
  columns: z.array(zColumn),
})

export const zEmailSettings = z.object({
  contentWidth: z.number().min(320).max(900),
  backgroundColor: z.string(),
  fontFamily: z.string(),
  preheader: z.string(),
})

export const zEmailDocument = z.object({
  version: z.literal(1),
  settings: zEmailSettings,
  rows: z.array(zRow),
})

export type HeadingBlock = z.infer<typeof zHeadingBlock>
export type TextBlock = z.infer<typeof zTextBlock>
export type ImageBlock = z.infer<typeof zImageBlock>
export type ButtonBlock = z.infer<typeof zButtonBlock>
export type DividerBlock = z.infer<typeof zDividerBlock>
export type SpacerBlock = z.infer<typeof zSpacerBlock>
export type SocialBlock = z.infer<typeof zSocialBlock>
export type MenuBlock = z.infer<typeof zMenuBlock>
export type HtmlBlock = z.infer<typeof zHtmlBlock>
export type VideoBlock = z.infer<typeof zVideoBlock>
export type Block = z.infer<typeof zBlock>
export type BlockType = Block['type']
export type Column = z.infer<typeof zColumn>
export type Row = z.infer<typeof zRow>
export type EmailSettings = z.infer<typeof zEmailSettings>
export type EmailDocument = z.infer<typeof zEmailDocument>
```

`packages/email-builder/src/schema/factories.ts`:

```ts
import { createId } from './ids'
import type { Block, BlockType, Column, EmailDocument, Padding, Row } from './document'

export const BLOCK_TYPES: BlockType[] = [
  'heading',
  'text',
  'image',
  'button',
  'divider',
  'spacer',
  'social',
  'menu',
  'html',
  'video',
]

function pad(top: number, right: number, bottom: number, left: number): Padding {
  return { top, right, bottom, left }
}

export function createDocument(): EmailDocument {
  return {
    version: 1,
    settings: {
      contentWidth: 600,
      backgroundColor: '#f4f4f5',
      fontFamily: "Arial, 'Helvetica Neue', Helvetica, sans-serif",
      preheader: '',
    },
    rows: [],
  }
}

export function createColumn(widthPct: number): Column {
  return {
    id: createId('col'),
    widthPct,
    style: { backgroundColor: 'transparent', padding: pad(0, 0, 0, 0) },
    blocks: [],
  }
}

export function createRow(widths: number[]): Row {
  return {
    id: createId('row'),
    style: { backgroundColor: '#ffffff', padding: pad(8, 0, 8, 0), borderRadius: 0 },
    columns: widths.map((w) => createColumn(w)),
  }
}

export function createBlock(type: BlockType): Block {
  const id = createId('blk')
  switch (type) {
    case 'heading':
      return {
        id, type, text: 'Escribe un título', level: 1,
        style: { color: '#111827', fontSize: 28, align: 'left', padding: pad(12, 24, 12, 24) },
      }
    case 'text':
      return {
        id, type, html: '<p>Escribe aquí tu texto.</p>',
        style: { color: '#374151', fontSize: 14, lineHeight: 1.6, padding: pad(8, 24, 8, 24) },
      }
    case 'image':
      return {
        id, type, src: '', alt: '', widthPct: 100, align: 'center',
        style: { padding: pad(8, 24, 8, 24) },
      }
    case 'button':
      return {
        id, type, label: 'Haz clic aquí', href: 'https://example.com', align: 'center',
        style: {
          backgroundColor: '#3b82f6', color: '#ffffff', fontSize: 14,
          borderRadius: 6, innerPaddingX: 24, innerPaddingY: 12, padding: pad(12, 24, 12, 24),
        },
      }
    case 'divider':
      return {
        id, type,
        style: { color: '#e5e7eb', thickness: 1, widthPct: 100, padding: pad(12, 24, 12, 24) },
      }
    case 'spacer':
      return { id, type, height: 24 }
    case 'social':
      return {
        id, type,
        networks: [
          { kind: 'facebook', url: 'https://facebook.com/' },
          { kind: 'instagram', url: 'https://instagram.com/' },
          { kind: 'x', url: 'https://x.com/' },
        ],
        iconSize: 32, spacing: 8, align: 'center',
        style: { padding: pad(12, 24, 12, 24) },
      }
    case 'menu':
      return {
        id, type,
        items: [
          { label: 'Inicio', href: 'https://example.com' },
          { label: 'Productos', href: 'https://example.com' },
          { label: 'Contacto', href: 'https://example.com' },
        ],
        separator: '·', align: 'center',
        style: { color: '#374151', fontSize: 14, padding: pad(12, 24, 12, 24) },
      }
    case 'html':
      return { id, type, code: '<div style="text-align:center">HTML personalizado</div>' }
    case 'video':
      return {
        id, type, thumbnailUrl: '', videoUrl: '', alt: 'Ver video', widthPct: 100,
        style: { padding: pad(8, 24, 8, 24) },
      }
  }
}
```

`packages/email-builder/src/schema/index.ts` (crear):

```ts
export * from './document'
export * from './factories'
export * from './ids'
```

Reemplazar `packages/email-builder/src/index.ts`:

```ts
export * from './schema'
```

(El `VERSION` del scaffold se elimina; actualizar `apps/demo/src/App.vue` para no importarlo: dejar `<h1>Vue Mail Designer</h1>` sin script o con script vacío.)

- [ ] **Step 4: Verificar que pasa**

```bash
pnpm --filter @vue-mail-designer/builder test && pnpm typecheck
```

Expected: PASS (5 tests) y typecheck limpio.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: schema zod del documento + factories con defaults"
```

---

### Task 3: Store del documento — mutaciones y selección

**Files:**
- Create: `packages/email-builder/src/store/document.ts`, `packages/email-builder/src/store/keys.ts`
- Modify: `packages/email-builder/src/index.ts`
- Test: `packages/email-builder/tests/store.test.ts`

**Interfaces:**
- Consumes: `createDocument`, `createRow`, `createBlock`, `zEmailDocument`, tipos de Task 2.
- Produces: `useDocumentStore` (Pinia setup store, id `'vmd-document'`) con:
  - state: `doc: EmailDocument`, `selection: Selection | null` donde `type Selection = { kind: 'row' | 'block'; id: string }`
  - getters: `selectedBlock: Block | null`, `selectedRow: Row | null`
  - helpers: `findRow(id): Row | undefined`, `findBlock(id): { row: Row; column: Column; index: number; block: Block } | undefined`
  - actions: `addRow(widths: number[], index?: number): Row`, `removeRow(id)`, `duplicateRow(id)`, `replaceRows(rows: Row[])`, `addBlockToColumn(columnId: string, type: BlockType, index?: number): Block`, `removeBlock(id)`, `duplicateBlock(id)`, `replaceColumnBlocks(columnId: string, blocks: Block[])`, `updateBlock(id, patch: object)`, `updateRowStyle(id, patch)`, `updateColumn(columnId, patch)`, `updateSettings(patch)`, `select(sel: Selection | null)`, `loadDesign(doc: EmailDocument)`
  - Todas las mutaciones llaman `commit()` (definido acá, la pila undo se completa en Task 4; en esta task `commit()` ya guarda snapshots).
- `BUILDER_PINIA_KEY: InjectionKey<Pinia>` en `store/keys.ts`, y `useBuilderPinia(): Pinia` que hace `inject` y lanza error claro si falta.

- [ ] **Step 1: Test que falla**

`packages/email-builder/tests/store.test.ts`:

```ts
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useDocumentStore } from '../src/store/document'

describe('useDocumentStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('agrega filas con columnas según layout', () => {
    const store = useDocumentStore()
    store.addRow([50, 50])
    expect(store.doc.rows).toHaveLength(1)
    expect(store.doc.rows[0].columns.map((c) => c.widthPct)).toEqual([50, 50])
  })

  it('inserta fila en un índice específico', () => {
    const store = useDocumentStore()
    const a = store.addRow([100])
    store.addRow([100])
    const inserted = store.addRow([50, 50], 1)
    expect(store.doc.rows[0].id).toBe(a.id)
    expect(store.doc.rows[1].id).toBe(inserted.id)
  })

  it('agrega, duplica y elimina bloques', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const colId = row.columns[0].id
    const block = store.addBlockToColumn(colId, 'button')
    expect(store.findBlock(block.id)?.block.type).toBe('button')

    store.duplicateBlock(block.id)
    expect(store.findRow(row.id)!.columns[0].blocks).toHaveLength(2)
    const ids = store.findRow(row.id)!.columns[0].blocks.map((b) => b.id)
    expect(new Set(ids).size).toBe(2)

    store.removeBlock(block.id)
    expect(store.findBlock(block.id)).toBeUndefined()
  })

  it('duplicateRow clona con ids nuevos en profundidad', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    store.addBlockToColumn(row.columns[0].id, 'text')
    store.duplicateRow(row.id)
    expect(store.doc.rows).toHaveLength(2)
    expect(store.doc.rows[1].id).not.toBe(row.id)
    expect(store.doc.rows[1].columns[0].id).not.toBe(row.columns[0].id)
    expect(store.doc.rows[1].columns[0].blocks[0].id).not.toBe(row.columns[0].blocks[0].id)
  })

  it('updateBlock aplica un patch parcial', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'heading')
    store.updateBlock(block.id, { text: 'Hola' })
    const found = store.findBlock(block.id)!.block
    expect(found.type === 'heading' && found.text).toBe('Hola')
  })

  it('selección apunta a bloque y se limpia al borrarlo', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'text')
    store.select({ kind: 'block', id: block.id })
    expect(store.selectedBlock?.id).toBe(block.id)
    store.removeBlock(block.id)
    expect(store.selection).toBeNull()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
pnpm --filter @vue-mail-designer/builder test tests/store.test.ts
```

Expected: FAIL — no existe `../src/store/document`.

- [ ] **Step 3: Implementar**

`packages/email-builder/src/store/keys.ts`:

```ts
import type { InjectionKey } from 'vue'
import { inject } from 'vue'
import type { Pinia } from 'pinia'

export const BUILDER_PINIA_KEY: InjectionKey<Pinia> = Symbol('vmd-pinia')

export function useBuilderPinia(): Pinia {
  const pinia = inject(BUILDER_PINIA_KEY)
  if (!pinia) throw new Error('[vue-mail-designer] Falta el contexto: usa los componentes dentro de <EmailBuilder>.')
  return pinia
}
```

`packages/email-builder/src/store/document.ts`:

```ts
import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import type { Block, BlockType, Column, EmailDocument, EmailSettings, Row } from '../schema'
import { createBlock, createId, createDocument, createRow } from '../schema'

export type Selection = { kind: 'row' | 'block'; id: string }

const HISTORY_LIMIT = 50
const COALESCE_MS = 600

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T
}

export const useDocumentStore = defineStore('vmd-document', () => {
  const doc = ref<EmailDocument>(createDocument())
  const selection = ref<Selection | null>(null)
  const past = ref<string[]>([])
  const future = ref<string[]>([])

  let lastCommitKey: string | null = null
  let lastCommitAt = 0

  /** Guarda snapshot ANTES de mutar. `coalesceKey` agrupa ráfagas (p.ej. tipeo). */
  function commit(coalesceKey?: string) {
    const now = Date.now()
    if (coalesceKey && coalesceKey === lastCommitKey && now - lastCommitAt < COALESCE_MS) {
      lastCommitAt = now
      return
    }
    past.value.push(JSON.stringify(doc.value))
    if (past.value.length > HISTORY_LIMIT) past.value.shift()
    future.value = []
    lastCommitKey = coalesceKey ?? null
    lastCommitAt = now
  }

  function findRow(id: string): Row | undefined {
    return doc.value.rows.find((r) => r.id === id)
  }

  function findColumn(columnId: string): { row: Row; column: Column } | undefined {
    for (const row of doc.value.rows) {
      const column = row.columns.find((c) => c.id === columnId)
      if (column) return { row, column }
    }
    return undefined
  }

  function findBlock(id: string): { row: Row; column: Column; index: number; block: Block } | undefined {
    for (const row of doc.value.rows) {
      for (const column of row.columns) {
        const index = column.blocks.findIndex((b) => b.id === id)
        if (index !== -1) return { row, column, index, block: column.blocks[index] }
      }
    }
    return undefined
  }

  const selectedBlock = computed<Block | null>(() =>
    selection.value?.kind === 'block' ? (findBlock(selection.value.id)?.block ?? null) : null,
  )
  const selectedRow = computed<Row | null>(() =>
    selection.value?.kind === 'row' ? (findRow(selection.value.id) ?? null) : null,
  )

  function addRow(widths: number[], index?: number): Row {
    commit()
    const row = createRow(widths)
    doc.value.rows.splice(index ?? doc.value.rows.length, 0, row)
    return row
  }

  function removeRow(id: string) {
    commit()
    doc.value.rows = doc.value.rows.filter((r) => r.id !== id)
    clearDanglingSelection()
  }

  function duplicateRow(id: string) {
    const idx = doc.value.rows.findIndex((r) => r.id === id)
    if (idx === -1) return
    commit()
    const copy = clone(doc.value.rows[idx])
    copy.id = createId('row')
    for (const col of copy.columns) {
      col.id = createId('col')
      for (const b of col.blocks) b.id = createId('blk')
    }
    doc.value.rows.splice(idx + 1, 0, copy)
  }

  function replaceRows(rows: Row[]) {
    commit('dnd-rows')
    doc.value.rows = rows
  }

  function addBlockToColumn(columnId: string, type: BlockType, index?: number): Block {
    const found = findColumn(columnId)
    if (!found) throw new Error(`Columna no encontrada: ${columnId}`)
    commit()
    const block = createBlock(type)
    found.column.blocks.splice(index ?? found.column.blocks.length, 0, block)
    return block
  }

  function removeBlock(id: string) {
    const found = findBlock(id)
    if (!found) return
    commit()
    found.column.blocks.splice(found.index, 1)
    clearDanglingSelection()
  }

  function duplicateBlock(id: string) {
    const found = findBlock(id)
    if (!found) return
    commit()
    const copy = clone(found.block)
    copy.id = createId('blk')
    found.column.blocks.splice(found.index + 1, 0, copy)
  }

  function replaceColumnBlocks(columnId: string, blocks: Block[]) {
    const found = findColumn(columnId)
    if (!found) return
    commit('dnd-blocks')
    found.column.blocks = blocks
  }

  function updateBlock(id: string, patch: Record<string, unknown>) {
    const found = findBlock(id)
    if (!found) return
    commit(`block:${id}`)
    deepMerge(found.block as unknown as Record<string, unknown>, patch)
  }

  function updateRowStyle(id: string, patch: Record<string, unknown>) {
    const row = findRow(id)
    if (!row) return
    commit(`row:${id}`)
    deepMerge(row.style as unknown as Record<string, unknown>, patch)
  }

  function updateColumn(columnId: string, patch: Record<string, unknown>) {
    const found = findColumn(columnId)
    if (!found) return
    commit(`col:${columnId}`)
    deepMerge(found.column as unknown as Record<string, unknown>, patch)
  }

  function updateSettings(patch: Partial<EmailSettings>) {
    commit('settings')
    Object.assign(doc.value.settings, patch)
  }

  function select(sel: Selection | null) {
    selection.value = sel
  }

  function clearDanglingSelection() {
    if (!selection.value) return
    const { kind, id } = selection.value
    const exists = kind === 'row' ? Boolean(findRow(id)) : Boolean(findBlock(id))
    if (!exists) selection.value = null
  }

  function loadDesign(next: EmailDocument) {
    commit()
    doc.value = clone(next)
    selection.value = null
  }

  return {
    doc, selection, past, future,
    selectedBlock, selectedRow,
    commit, findRow, findColumn, findBlock,
    addRow, removeRow, duplicateRow, replaceRows,
    addBlockToColumn, removeBlock, duplicateBlock, replaceColumnBlocks,
    updateBlock, updateRowStyle, updateColumn, updateSettings,
    select, loadDesign,
  }
})

function deepMerge(target: Record<string, unknown>, patch: Record<string, unknown>) {
  for (const [key, value] of Object.entries(patch)) {
    const current = target[key]
    if (
      value && typeof value === 'object' && !Array.isArray(value) &&
      current && typeof current === 'object' && !Array.isArray(current)
    ) {
      deepMerge(current as Record<string, unknown>, value as Record<string, unknown>)
    } else {
      target[key] = value as unknown
    }
  }
}
```

Agregar a `packages/email-builder/src/index.ts`:

```ts
export * from './schema'
export { useDocumentStore, type Selection } from './store/document'
export { BUILDER_PINIA_KEY, useBuilderPinia } from './store/keys'
```

- [ ] **Step 4: Verificar que pasa**

```bash
pnpm --filter @vue-mail-designer/builder test && pnpm typecheck
```

Expected: PASS todos los tests, typecheck limpio.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: store del documento con mutaciones, selección y snapshots"
```

---

### Task 4: Undo/redo e import/export JSON

**Files:**
- Modify: `packages/email-builder/src/store/document.ts`
- Test: `packages/email-builder/tests/history.test.ts`

**Interfaces:**
- Consumes: `useDocumentStore` de Task 3 (`commit`, `past`, `future`).
- Produces (nuevas en el mismo store, incluidas en el `return`):
  - `undo(): void`, `redo(): void`, `canUndo: ComputedRef<boolean>`, `canRedo: ComputedRef<boolean>`
  - `exportJson(): string` (JSON pretty de `doc`)
  - `importJson(text: string): { ok: true } | { ok: false; error: string }` — parsea, valida con `zEmailDocument.safeParse`, si ok llama `loadDesign`.

- [ ] **Step 1: Test que falla**

`packages/email-builder/tests/history.test.ts`:

```ts
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useDocumentStore } from '../src/store/document'

describe('undo/redo e import/export', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('undo revierte y redo reaplica', () => {
    const store = useDocumentStore()
    store.addRow([100])
    expect(store.doc.rows).toHaveLength(1)
    expect(store.canUndo).toBe(true)

    store.undo()
    expect(store.doc.rows).toHaveLength(0)
    expect(store.canRedo).toBe(true)

    store.redo()
    expect(store.doc.rows).toHaveLength(1)
  })

  it('una mutación nueva limpia el stack de redo', () => {
    const store = useDocumentStore()
    store.addRow([100])
    store.undo()
    store.addRow([50, 50])
    expect(store.canRedo).toBe(false)
  })

  it('exportJson → importJson es round-trip', () => {
    const store = useDocumentStore()
    const row = store.addRow([100])
    store.addBlockToColumn(row.columns[0].id, 'heading')
    const json = store.exportJson()

    const store2 = useDocumentStore()
    store2.loadDesign(JSON.parse(json))
    const result = store2.importJson(json)
    expect(result.ok).toBe(true)
    expect(store2.doc.rows[0].columns[0].blocks[0].type).toBe('heading')
  })

  it('importJson rechaza JSON inválido y no toca el documento', () => {
    const store = useDocumentStore()
    store.addRow([100])
    const bad = store.importJson('{"version":1,"rows":"x"}')
    expect(bad.ok).toBe(false)
    if (!bad.ok) expect(bad.error.length).toBeGreaterThan(0)
    expect(store.doc.rows).toHaveLength(1)

    const notJson = store.importJson('esto no es json')
    expect(notJson.ok).toBe(false)
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
pnpm --filter @vue-mail-designer/builder test tests/history.test.ts
```

Expected: FAIL — `undo`, `canUndo`, `exportJson`, `importJson` no existen.

- [ ] **Step 3: Implementar** (dentro del setup store de `document.ts`, antes del `return`)

```ts
  const canUndo = computed(() => past.value.length > 0)
  const canRedo = computed(() => future.value.length > 0)

  function undo() {
    const prev = past.value.pop()
    if (prev === undefined) return
    future.value.push(JSON.stringify(doc.value))
    doc.value = JSON.parse(prev) as EmailDocument
    lastCommitKey = null
    clearDanglingSelection()
  }

  function redo() {
    const next = future.value.pop()
    if (next === undefined) return
    past.value.push(JSON.stringify(doc.value))
    doc.value = JSON.parse(next) as EmailDocument
    lastCommitKey = null
    clearDanglingSelection()
  }

  function exportJson(): string {
    return JSON.stringify(doc.value, null, 2)
  }

  function importJson(text: string): { ok: true } | { ok: false; error: string } {
    let parsed: unknown
    try {
      parsed = JSON.parse(text)
    } catch {
      return { ok: false, error: 'El archivo no es JSON válido.' }
    }
    const result = zEmailDocument.safeParse(parsed)
    if (!result.success) {
      const issues = result.error.issues
        .slice(0, 3)
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ')
      return { ok: false, error: `El diseño no es válido — ${issues}` }
    }
    loadDesign(result.data)
    return { ok: true }
  }
```

Importar `zEmailDocument` desde `../schema` y agregar `undo, redo, canUndo, canRedo, exportJson, importJson` al `return` del store.

- [ ] **Step 4: Verificar que pasa**

```bash
pnpm --filter @vue-mail-designer/builder test && pnpm typecheck
```

Expected: PASS, typecheck limpio.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: undo/redo con coalescing e import/export JSON validado"
```

---

### Task 5: Renderer HTML — frame, filas/columnas, heading y text

El corazón del sistema: `renderHtml(doc): string`, función pura y síncrona.

**Files:**
- Create: `packages/email-builder/src/render/html.ts`
- Modify: `packages/email-builder/src/index.ts`
- Test: `packages/email-builder/tests/render.test.ts`

**Interfaces:**
- Consumes: tipos y factories de Task 2.
- Produces:
  - `renderHtml(doc: EmailDocument): string` — documento HTML completo.
  - `escapeHtml(s: string): string`
  - Internos que Tasks 6-7 extienden: `renderBlock(block: Block, ctx: RenderCtx): string` con `type RenderCtx = { fontFamily: string }`, helpers `paddingCss(p: Padding): string`.
  - Convención merge tags: el HTML de Tiptap contiene `<span data-mt="first_name">…</span>`; el renderer lo convierte a `{{first_name}}` (regex `MERGE_TAG_RE` exportada para tests).

- [ ] **Step 1: Test que falla**

`packages/email-builder/tests/render.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { renderHtml } from '../src/render/html'
import { createBlock, createDocument, createRow } from '../src/schema'
import type { HeadingBlock, TextBlock } from '../src/schema'

function docWith(widths: number[], blocks: Parameters<typeof createBlock>[0][][]) {
  const doc = createDocument()
  const row = createRow(widths)
  blocks.forEach((types, i) => {
    for (const t of types) row.columns[i].blocks.push(createBlock(t))
  })
  doc.rows.push(row)
  return { doc, row }
}

describe('renderHtml — frame y layout', () => {
  it('genera documento completo con tablas de presentación', () => {
    const { doc } = docWith([100], [['heading']])
    const html = renderHtml(doc)
    expect(html).toContain('<!doctype html>')
    expect(html).toContain('role="presentation"')
    expect(html).toContain(`width="600"`)
    expect(html).toContain('@media (max-width: 480px)')
    expect(html).not.toContain('display:flex')
  })

  it('varias columnas generan ghost tables MSO con widths en px', () => {
    const { doc } = docWith([50, 50], [['heading'], ['text']])
    const html = renderHtml(doc)
    expect(html).toContain('<!--[if mso]>')
    // 50% de 600 = 300px
    expect(html).toContain('width="300"')
    expect((html.match(/class="vmd-col"/g) ?? []).length).toBe(2)
  })

  it('heading escapa el texto y respeta align/color', () => {
    const { doc, row } = docWith([100], [['heading']])
    const h = row.columns[0].blocks[0] as HeadingBlock
    h.text = 'Hola <script>'
    h.style.align = 'center'
    h.style.color = '#ff0000'
    const html = renderHtml(doc)
    expect(html).toContain('Hola &lt;script&gt;')
    expect(html).toContain('text-align:center')
    expect(html).toContain('#ff0000')
  })

  it('text conserva HTML de tiptap y convierte merge tags', () => {
    const { doc, row } = docWith([100], [['text']])
    const t = row.columns[0].blocks[0] as TextBlock
    t.html = '<p>Hola <span data-mt="first_name">Nombre</span>, bienvenido</p>'
    const html = renderHtml(doc)
    expect(html).toContain('{{first_name}}')
    expect(html).not.toContain('data-mt')
  })

  it('snapshot estable de un documento de referencia', () => {
    const { doc } = docWith([33, 34, 33], [['heading'], ['text'], ['text']])
    // ids deterministas para el snapshot
    let n = 0
    const fix = (o: { id: string }) => { o.id = `fix_${n++}` }
    doc.rows.forEach((r) => { fix(r); r.columns.forEach((c) => { fix(c); c.blocks.forEach(fix) }) })
    expect(renderHtml(doc)).toMatchSnapshot()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
pnpm --filter @vue-mail-designer/builder test tests/render.test.ts
```

Expected: FAIL — no existe `../src/render/html`.

- [ ] **Step 3: Implementar**

`packages/email-builder/src/render/html.ts`:

```ts
import type { Block, EmailDocument, Padding, Row } from '../schema'

export type RenderCtx = { fontFamily: string }

export const MERGE_TAG_RE = /<span[^>]*\bdata-mt="([^"]+)"[^>]*>.*?<\/span>/gs

export function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function paddingCss(p: Padding): string {
  return `${p.top}px ${p.right}px ${p.bottom}px ${p.left}px`
}

function convertMergeTags(html: string): string {
  return html.replace(MERGE_TAG_RE, (_m, value: string) => `{{${value}}}`)
}

/** Tabla 100% de una celda — wrapper estándar para el contenido de un bloque. */
function cellTable(innerTd: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${innerTd}</table>`
}

export function renderBlock(block: Block, ctx: RenderCtx): string {
  switch (block.type) {
    case 'heading': {
      const s = block.style
      return cellTable(
        `<tr><td style="padding:${paddingCss(s.padding)};font-family:${ctx.fontFamily};font-size:${s.fontSize}px;line-height:1.3;font-weight:bold;color:${s.color};text-align:${s.align};">${escapeHtml(block.text)}</td></tr>`,
      )
    }
    case 'text': {
      const s = block.style
      return cellTable(
        `<tr><td style="padding:${paddingCss(s.padding)};font-family:${ctx.fontFamily};font-size:${s.fontSize}px;line-height:${s.lineHeight};color:${s.color};">${convertMergeTags(block.html)}</td></tr>`,
      )
    }
    default:
      // Tasks 6 y 7 completan el resto de los tipos.
      return ''
  }
}

function renderColumnBlocks(blocks: Block[], ctx: RenderCtx): string {
  return blocks.map((b) => renderBlock(b, ctx)).join('')
}

function renderRow(row: Row, contentWidth: number, ctx: RenderCtx): string {
  const rs = row.style
  const bg = rs.backgroundColor === 'transparent' ? '' : `background-color:${rs.backgroundColor};`
  const radius = rs.borderRadius > 0 ? `border-radius:${rs.borderRadius}px;` : ''
  const innerWidth = contentWidth // el padding de fila vive dentro de la celda

  const cols = row.columns
    .map((col) => {
      const pxWidth = Math.round((innerWidth * col.widthPct) / 100)
      const colBg = col.style.backgroundColor === 'transparent' ? '' : `background-color:${col.style.backgroundColor};`
      return (
        `<!--[if mso]><td width="${pxWidth}" valign="top"><![endif]-->` +
        `<div class="vmd-col" style="display:inline-block;width:${col.widthPct}%;min-width:280px;max-width:${pxWidth}px;vertical-align:top;font-size:14px;">` +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:${paddingCss(col.style.padding)};${colBg}">` +
        renderColumnBlocks(col.blocks, ctx) +
        `</td></tr></table></div>` +
        `<!--[if mso]></td><![endif]-->`
      )
    })
    .join('')

  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
    `<td style="${bg}${radius}padding:${paddingCss(rs.padding)};font-size:0;">` +
    `<!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><![endif]-->` +
    cols +
    `<!--[if mso]></tr></table><![endif]-->` +
    `</td></tr></table>`
  )
}

export function renderHtml(doc: EmailDocument): string {
  const { settings } = doc
  const ctx: RenderCtx = { fontFamily: settings.fontFamily }
  const preheader = settings.preheader
    ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(settings.preheader)}</div>`
    : ''

  const rows = doc.rows.map((r) => renderRow(r, settings.contentWidth, ctx)).join('')

  return `<!doctype html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body { margin: 0; padding: 0; }
  img { border: 0; }
  @media (max-width: 480px) {
    .vmd-col { width: 100% !important; max-width: 100% !important; display: block !important; }
    .vmd-container { width: 100% !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${settings.backgroundColor};">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${settings.backgroundColor};">
<tr><td align="center" style="padding:16px 8px;">
<table role="presentation" width="${settings.contentWidth}" cellpadding="0" cellspacing="0" border="0" class="vmd-container" style="width:${settings.contentWidth}px;max-width:100%;">
<tr><td>
${rows}
</td></tr></table>
</td></tr></table>
</body>
</html>`
}
```

Agregar a `packages/email-builder/src/index.ts`:

```ts
export { renderHtml, escapeHtml } from './render/html'
```

- [ ] **Step 4: Verificar que pasa**

```bash
pnpm --filter @vue-mail-designer/builder test && pnpm typecheck
```

Expected: PASS (se crea el snapshot en la primera corrida), typecheck limpio.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: renderer HTML con hybrid columns, heading y text con merge tags"
```

---

### Task 6: Renderer — image, button, divider, spacer

**Files:**
- Modify: `packages/email-builder/src/render/html.ts` (agregar cases al switch de `renderBlock`)
- Test: `packages/email-builder/tests/render-blocks.test.ts`

**Interfaces:**
- Consumes: `renderBlock`, `cellTable`, `paddingCss`, `escapeHtml` de Task 5.
- Produces: cases `image`, `button`, `divider`, `spacer` en `renderBlock`. Botón con técnica bulletproof (tabla anidada). Imagen `display:block` con width en px.

- [ ] **Step 1: Test que falla**

`packages/email-builder/tests/render-blocks.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { renderHtml } from '../src/render/html'
import { createBlock, createDocument, createRow } from '../src/schema'
import type { Block, ButtonBlock, DividerBlock, ImageBlock, SpacerBlock } from '../src/schema'

function render(block: Block): string {
  const doc = createDocument()
  const row = createRow([100])
  row.columns[0].blocks.push(block)
  doc.rows.push(row)
  return renderHtml(doc)
}

describe('renderBlock — bloques básicos', () => {
  it('image: display:block, alt escapado y link opcional', () => {
    const img = createBlock('image') as ImageBlock
    img.src = 'https://cdn.example.com/a.png'
    img.alt = 'Logo & marca'
    img.href = 'https://example.com'
    const html = render(img)
    expect(html).toContain('display:block')
    expect(html).toContain('alt="Logo &amp; marca"')
    expect(html).toContain('<a href="https://example.com"')
  })

  it('image sin src renderiza celda vacía sin <img>', () => {
    const img = createBlock('image') as ImageBlock
    const html = render(img)
    expect(html).not.toContain('<img')
  })

  it('button: tabla anidada bulletproof con estilos inline', () => {
    const btn = createBlock('button') as ButtonBlock
    btn.label = 'Comprar <ya>'
    btn.href = 'https://example.com/buy'
    btn.style.backgroundColor = '#16a34a'
    const html = render(btn)
    expect(html).toContain('Comprar &lt;ya&gt;')
    expect(html).toContain('background-color:#16a34a')
    expect(html).toContain('href="https://example.com/buy"')
    // bulletproof: el <a> vive dentro de una celda con bg, no es un <a> suelto con display:block
    expect(html).toMatch(/<td[^>]*background-color:#16a34a[^>]*>\s*<a/)
  })

  it('divider: hr como borde de celda con ancho porcentual', () => {
    const div = createBlock('divider') as DividerBlock
    div.style.widthPct = 50
    div.style.thickness = 3
    div.style.color = '#000000'
    const html = render(div)
    expect(html).toContain('border-top:3px solid #000000')
    expect(html).toContain('width="50%"')
  })

  it('spacer: celda con altura fija', () => {
    const sp = createBlock('spacer') as SpacerBlock
    sp.height = 40
    const html = render(sp)
    expect(html).toContain('height:40px')
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
pnpm --filter @vue-mail-designer/builder test tests/render-blocks.test.ts
```

Expected: FAIL — los cases devuelven `''` (default).

- [ ] **Step 3: Implementar** — agregar al switch de `renderBlock` (reemplazando el `default` por estos cases; el `default` queda para social/menu/html/video hasta Task 7):

```ts
    case 'image': {
      const s = block.style
      if (!block.src) {
        return cellTable(`<tr><td style="padding:${paddingCss(s.padding)};"></td></tr>`)
      }
      const img = `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" width="100%" style="display:block;width:100%;max-width:100%;height:auto;border:0;">`
      const content = block.href ? `<a href="${escapeHtml(block.href)}" target="_blank">${img}</a>` : img
      return cellTable(
        `<tr><td align="${block.align}" style="padding:${paddingCss(s.padding)};">` +
        `<table role="presentation" width="${block.widthPct}%" cellpadding="0" cellspacing="0" border="0"><tr><td>${content}</td></tr></table>` +
        `</td></tr>`,
      )
    }
    case 'button': {
      const s = block.style
      return cellTable(
        `<tr><td align="${block.align}" style="padding:${paddingCss(s.padding)};">` +
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>` +
        `<td style="border-radius:${s.borderRadius}px;background-color:${s.backgroundColor};">` +
        `<a href="${escapeHtml(block.href)}" target="_blank" style="display:inline-block;padding:${s.innerPaddingY}px ${s.innerPaddingX}px;font-family:${ctx.fontFamily};font-size:${s.fontSize}px;font-weight:bold;color:${s.color};text-decoration:none;border-radius:${s.borderRadius}px;">${escapeHtml(block.label)}</a>` +
        `</td></tr></table></td></tr>`,
      )
    }
    case 'divider': {
      const s = block.style
      return cellTable(
        `<tr><td align="center" style="padding:${paddingCss(s.padding)};">` +
        `<table role="presentation" width="${s.widthPct}%" cellpadding="0" cellspacing="0" border="0"><tr>` +
        `<td style="border-top:${s.thickness}px solid ${s.color};font-size:0;line-height:0;">&nbsp;</td>` +
        `</tr></table></td></tr>`,
      )
    }
    case 'spacer':
      return cellTable(
        `<tr><td style="height:${block.height}px;font-size:0;line-height:0;">&nbsp;</td></tr>`,
      )
```

- [ ] **Step 4: Verificar que pasa**

```bash
pnpm --filter @vue-mail-designer/builder test && pnpm typecheck
```

Expected: PASS (el snapshot de Task 5 no cambia porque solo usa heading/text).

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: renderer de image, button bulletproof, divider y spacer"
```

---

### Task 7: Renderer — social, menu, html, video y snapshot integral

**Files:**
- Modify: `packages/email-builder/src/render/html.ts`
- Test: `packages/email-builder/tests/render-blocks2.test.ts`

**Interfaces:**
- Consumes: infraestructura de Tasks 5-6.
- Produces: cases `social`, `menu`, `html`, `video` (el switch queda exhaustivo — eliminar el `default` y dejar que TS verifique exhaustividad). `SOCIAL_BRANDS: Record<SocialNetworkKind, { label: string; color: string }>` exportado (lo reusa la UI en Task 10).

- [ ] **Step 1: Test que falla**

`packages/email-builder/tests/render-blocks2.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { renderHtml } from '../src/render/html'
import { createBlock, createDocument, createRow } from '../src/schema'
import type { Block, HtmlBlock, MenuBlock, SocialBlock, VideoBlock } from '../src/schema'

function render(block: Block): string {
  const doc = createDocument()
  const row = createRow([100])
  row.columns[0].blocks.push(block)
  doc.rows.push(row)
  return renderHtml(doc)
}

describe('renderBlock — bloques avanzados', () => {
  it('social: un link por red con círculo de marca', () => {
    const social = createBlock('social') as SocialBlock
    social.networks = [
      { kind: 'facebook', url: 'https://facebook.com/acme' },
      { kind: 'youtube', url: 'https://youtube.com/@acme' },
    ]
    const html = render(social)
    expect(html).toContain('href="https://facebook.com/acme"')
    expect(html).toContain('href="https://youtube.com/@acme"')
    expect(html).toContain('border-radius:50%')
  })

  it('menu: items con separador escapado', () => {
    const menu = createBlock('menu') as MenuBlock
    menu.items = [
      { label: 'Inicio', href: 'https://a.com' },
      { label: 'Tienda', href: 'https://b.com' },
    ]
    menu.separator = '|'
    const html = render(menu)
    expect(html).toContain('>Inicio</a>')
    expect(html).toContain('>Tienda</a>')
    expect(html.split('|').length).toBeGreaterThanOrEqual(2)
  })

  it('html: el código pasa crudo, sin escapar', () => {
    const raw = createBlock('html') as HtmlBlock
    raw.code = '<table><tr><td>custom</td></tr></table>'
    const html = render(raw)
    expect(html).toContain('<table><tr><td>custom</td></tr></table>')
  })

  it('video: thumbnail linkeado al video', () => {
    const video = createBlock('video') as VideoBlock
    video.thumbnailUrl = 'https://cdn.example.com/thumb.jpg'
    video.videoUrl = 'https://youtu.be/xyz'
    video.alt = 'Ver demo'
    const html = render(video)
    expect(html).toContain('href="https://youtu.be/xyz"')
    expect(html).toContain('src="https://cdn.example.com/thumb.jpg"')
    expect(html).toContain('alt="Ver demo"')
  })

  it('preheader aparece oculto al inicio del body', () => {
    const doc = createDocument()
    doc.settings.preheader = 'Oferta exclusiva dentro'
    const html = renderHtml(doc)
    expect(html).toContain('Oferta exclusiva dentro')
    expect(html).toMatch(/display:none[^>]*>Oferta exclusiva dentro/)
  })

  it('snapshot integral con los 10 bloques', () => {
    const doc = createDocument()
    const row = createRow([100])
    for (const t of ['heading', 'text', 'image', 'button', 'divider', 'spacer', 'social', 'menu', 'html', 'video'] as const) {
      row.columns[0].blocks.push(createBlock(t))
    }
    doc.rows.push(row)
    let n = 0
    const fix = (o: { id: string }) => { o.id = `fix_${n++}` }
    doc.rows.forEach((r) => { fix(r); r.columns.forEach((c) => { fix(c); c.blocks.forEach(fix) }) })
    expect(renderHtml(doc)).toMatchSnapshot()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
pnpm --filter @vue-mail-designer/builder test tests/render-blocks2.test.ts
```

Expected: FAIL en social/menu/html/video.

- [ ] **Step 3: Implementar** — en `html.ts`, agregar el mapa de marcas y los cases:

```ts
import type { SocialNetworkKind } from '../schema'

export const SOCIAL_BRANDS: Record<SocialNetworkKind, { label: string; color: string }> = {
  facebook: { label: 'f', color: '#1877f2' },
  instagram: { label: 'ig', color: '#e4405f' },
  x: { label: 'x', color: '#000000' },
  linkedin: { label: 'in', color: '#0a66c2' },
  youtube: { label: '▶', color: '#ff0000' },
  tiktok: { label: 'tt', color: '#010101' },
  whatsapp: { label: 'wa', color: '#25d366' },
  web: { label: '@', color: '#6b7280' },
}
```

Cases del switch:

```ts
    case 'social': {
      const s = block.style
      const icons = block.networks
        .map(({ kind, url }) => {
          const brand = SOCIAL_BRANDS[kind]
          return (
            `<td style="padding:0 ${block.spacing / 2}px;">` +
            `<a href="${escapeHtml(url)}" target="_blank" style="display:inline-block;width:${block.iconSize}px;height:${block.iconSize}px;line-height:${block.iconSize}px;border-radius:50%;background-color:${brand.color};color:#ffffff;text-align:center;text-decoration:none;font-family:${ctx.fontFamily};font-size:${Math.round(block.iconSize * 0.45)}px;font-weight:bold;">${brand.label}</a>` +
            `</td>`
          )
        })
        .join('')
      return cellTable(
        `<tr><td align="${block.align}" style="padding:${paddingCss(s.padding)};">` +
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${icons}</tr></table>` +
        `</td></tr>`,
      )
    }
    case 'menu': {
      const s = block.style
      const sep = `<span style="padding:0 8px;color:${s.color};">${escapeHtml(block.separator)}</span>`
      const items = block.items
        .map((it) => `<a href="${escapeHtml(it.href)}" target="_blank" style="color:${s.color};font-family:${ctx.fontFamily};font-size:${s.fontSize}px;text-decoration:none;">${escapeHtml(it.label)}</a>`)
        .join(sep)
      return cellTable(
        `<tr><td align="${block.align}" style="padding:${paddingCss(s.padding)};font-family:${ctx.fontFamily};font-size:${s.fontSize}px;">${items}</td></tr>`,
      )
    }
    case 'html':
      return cellTable(`<tr><td>${block.code}</td></tr>`)
    case 'video': {
      const s = block.style
      if (!block.thumbnailUrl || !block.videoUrl) {
        return cellTable(`<tr><td style="padding:${paddingCss(s.padding)};"></td></tr>`)
      }
      return cellTable(
        `<tr><td align="center" style="padding:${paddingCss(s.padding)};">` +
        `<table role="presentation" width="${block.widthPct}%" cellpadding="0" cellspacing="0" border="0"><tr><td>` +
        `<a href="${escapeHtml(block.videoUrl)}" target="_blank">` +
        `<img src="${escapeHtml(block.thumbnailUrl)}" alt="${escapeHtml(block.alt)}" width="100%" style="display:block;width:100%;max-width:100%;height:auto;border:0;">` +
        `</a></td></tr></table></td></tr>`,
      )
    }
```

Eliminar el `default` del switch — con los 10 cases TS ya garantiza exhaustividad.

Exportar `SOCIAL_BRANDS` también desde `src/index.ts`:

```ts
export { renderHtml, escapeHtml, SOCIAL_BRANDS } from './render/html'
```

- [ ] **Step 4: Verificar que pasa**

```bash
pnpm --filter @vue-mail-designer/builder test && pnpm typecheck
```

Expected: PASS todos, nuevo snapshot creado.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: renderer completo — social, menu, html crudo y video"
```

---

### Task 8: UI store, estilos base y shell de EmailBuilder

**Files:**
- Create: `packages/email-builder/src/store/ui.ts`, `packages/email-builder/src/styles.css`, `packages/email-builder/src/components/EmailBuilder.vue`, stubs `packages/email-builder/src/components/BuilderToolbar.vue`, `packages/email-builder/src/components/BlockPalette.vue`, `packages/email-builder/src/components/BuilderCanvas.vue`, `packages/email-builder/src/components/InspectorPanel.vue`
- Modify: `packages/email-builder/src/index.ts`, `apps/demo/src/App.vue`
- Test: `packages/email-builder/tests/email-builder.test.ts`

**Interfaces:**
- Consumes: `BUILDER_PINIA_KEY` (Task 3).
- Produces:
  - `useUiStore` (id `'vmd-ui'`): state `theme: 'light' | 'dark'`, `previewOpen: boolean`, `previewDevice: 'desktop' | 'mobile'`, `galleryOpen: boolean`; action `toggleTheme()`.
  - `EmailBuilder.vue`: crea `createPinia()` propio, lo provee con `BUILDER_PINIA_KEY`, renderiza toolbar arriba y tres paneles (paleta | canvas | inspector). Los cuatro hijos son stubs con la clase raíz correcta que las Tasks 9-13 reemplazan **manteniendo el nombre de archivo**.
  - CSS: clases `vmd-root`, `vmd-dark`, `vmd-body`, `vmd-toolbar`, `vmd-palette`, `vmd-canvas`, `vmd-inspector` + variables `--vmd-bg`, `--vmd-panel`, `--vmd-border`, `--vmd-fg`, `--vmd-muted`, `--vmd-accent`.

- [ ] **Step 1: Test que falla**

`packages/email-builder/tests/email-builder.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'

describe('EmailBuilder shell', () => {
  it('monta con pinia propio y renderiza los 4 paneles', () => {
    const wrapper = mount(EmailBuilder)
    expect(wrapper.find('.vmd-root').exists()).toBe(true)
    expect(wrapper.find('.vmd-toolbar').exists()).toBe(true)
    expect(wrapper.find('.vmd-palette').exists()).toBe(true)
    expect(wrapper.find('.vmd-canvas').exists()).toBe(true)
    expect(wrapper.find('.vmd-inspector').exists()).toBe(true)
  })

  it('no requiere pinia global (dos instancias aisladas)', () => {
    const a = mount(EmailBuilder)
    const b = mount(EmailBuilder)
    expect(a.find('.vmd-root').exists()).toBe(true)
    expect(b.find('.vmd-root').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
pnpm --filter @vue-mail-designer/builder test tests/email-builder.test.ts
```

Expected: FAIL — no existe el componente.

- [ ] **Step 3: Implementar**

`packages/email-builder/src/store/ui.ts`:

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('vmd-ui', () => {
  const theme = ref<'light' | 'dark'>('light')
  const previewOpen = ref(false)
  const previewDevice = ref<'desktop' | 'mobile'>('desktop')
  const galleryOpen = ref(false)

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  return { theme, previewOpen, previewDevice, galleryOpen, toggleTheme }
})
```

`packages/email-builder/src/styles.css`:

```css
.vmd-root {
  --vmd-bg: #f4f4f5;
  --vmd-panel: #ffffff;
  --vmd-border: #e4e4e7;
  --vmd-fg: #18181b;
  --vmd-muted: #71717a;
  --vmd-accent: #3b82f6;
  --vmd-danger: #dc2626;
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 480px;
  background: var(--vmd-bg);
  color: var(--vmd-fg);
  font-family: system-ui, -apple-system, sans-serif;
  font-size: 14px;
}
.vmd-root.vmd-dark {
  --vmd-bg: #0b0f14;
  --vmd-panel: #111827;
  --vmd-border: #1f2937;
  --vmd-fg: #e5e7eb;
  --vmd-muted: #9ca3af;
  --vmd-accent: #60a5fa;
}
.vmd-body { display: flex; flex: 1; min-height: 0; }
.vmd-toolbar {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 12px; background: var(--vmd-panel);
  border-bottom: 1px solid var(--vmd-border);
}
.vmd-palette {
  width: 220px; flex-shrink: 0; overflow-y: auto;
  padding: 12px; background: var(--vmd-panel);
  border-right: 1px solid var(--vmd-border);
}
.vmd-canvas { flex: 1; overflow-y: auto; padding: 24px; }
.vmd-inspector {
  width: 300px; flex-shrink: 0; overflow-y: auto;
  padding: 12px; background: var(--vmd-panel);
  border-left: 1px solid var(--vmd-border);
}
.vmd-btn {
  padding: 6px 10px; border: 1px solid var(--vmd-border); border-radius: 6px;
  background: var(--vmd-panel); color: var(--vmd-fg); cursor: pointer; font-size: 13px;
}
.vmd-btn:hover { border-color: var(--vmd-accent); }
.vmd-btn:disabled { opacity: 0.4; cursor: default; }
.vmd-btn--primary { background: var(--vmd-accent); border-color: var(--vmd-accent); color: #fff; }
```

(Las Tasks 9-13 agregan a este archivo las clases que necesiten sus componentes.)

`packages/email-builder/src/components/EmailBuilder.vue`:

```vue
<template>
  <div class="vmd-root" :class="{ 'vmd-dark': ui.theme === 'dark' }">
    <BuilderToolbar />
    <div class="vmd-body">
      <BlockPalette />
      <BuilderCanvas />
      <InspectorPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { createPinia } from 'pinia'
import { provide } from 'vue'
import { BUILDER_PINIA_KEY } from '../store/keys'
import { useUiStore } from '../store/ui'
import BlockPalette from './BlockPalette.vue'
import BuilderCanvas from './BuilderCanvas.vue'
import BuilderToolbar from './BuilderToolbar.vue'
import InspectorPanel from './InspectorPanel.vue'
import '../styles.css'

const pinia = createPinia()
provide(BUILDER_PINIA_KEY, pinia)
const ui = useUiStore(pinia)
</script>
```

Stubs (cada uno en su archivo, mismo patrón):

```vue
<!-- BuilderToolbar.vue -->
<template><header class="vmd-toolbar">Toolbar</header></template>
```

```vue
<!-- BlockPalette.vue -->
<template><aside class="vmd-palette">Paleta</aside></template>
```

```vue
<!-- BuilderCanvas.vue -->
<template><section class="vmd-canvas">Canvas</section></template>
```

```vue
<!-- InspectorPanel.vue -->
<template><aside class="vmd-inspector">Inspector</aside></template>
```

Agregar a `src/index.ts`:

```ts
export { default as EmailBuilder } from './components/EmailBuilder.vue'
export { useUiStore } from './store/ui'
```

`apps/demo/src/App.vue` (reemplazar):

```vue
<template>
  <EmailBuilder style="height: 100vh" />
</template>

<script setup lang="ts">
import { EmailBuilder } from '@vue-mail-designer/builder'
</script>

<style>
html, body, #app { height: 100%; margin: 0; }
</style>
```

- [ ] **Step 4: Verificar**

```bash
pnpm --filter @vue-mail-designer/builder test && pnpm typecheck
```

Expected: PASS. Además arrancar `pnpm dev` y verificar en el browser que se ven toolbar + 3 paneles.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: shell de EmailBuilder con pinia aislado, tema y layout de paneles"
```

---

### Task 9: Paleta drag & drop y Canvas con filas/columnas/bloques

**Files:**
- Modify (reemplazar stubs): `packages/email-builder/src/components/BlockPalette.vue`, `packages/email-builder/src/components/BuilderCanvas.vue`
- Create: `packages/email-builder/src/components/RowView.vue`, `packages/email-builder/src/components/BlockView.vue` (stub visual, Task 10 lo completa), `packages/email-builder/src/components/palette-items.ts`
- Modify: `packages/email-builder/src/styles.css`
- Test: `packages/email-builder/tests/canvas.test.ts`

**Interfaces:**
- Consumes: `useDocumentStore`, `useBuilderPinia`, `createBlock`, `createRow`, `BLOCK_TYPES`.
- Produces:
  - `palette-items.ts`: `PALETTE_BLOCKS: { type: BlockType; label: string; icon: string }[]` (los 10) y `ROW_LAYOUTS: { key: string; label: string; widths: number[] }[]` (`100`, `50-50`, `33-33-33`, `66-33`, `33-66`, `25-25-25-25`).
  - DnD: grupo `"blocks"` compartido paleta→columnas y columna↔columna (clone desde paleta); grupo `"rows"` paleta→canvas y reorden de filas.
  - `RowView.vue` props `{ row: Row }`; `BlockView.vue` props `{ block: Block }`; click selecciona (`store.select`), stopPropagation para no seleccionar la fila al clickear un bloque.

- [ ] **Step 1: Test que falla**

`packages/email-builder/tests/canvas.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import { PALETTE_BLOCKS, ROW_LAYOUTS } from '../src/components/palette-items'

describe('paleta y canvas', () => {
  it('la paleta lista los 10 bloques y los layouts de fila', () => {
    expect(PALETTE_BLOCKS).toHaveLength(10)
    expect(ROW_LAYOUTS.map((l) => l.key)).toContain('50-50')
    const wrapper = mount(EmailBuilder)
    expect(wrapper.findAll('.vmd-palette-item').length).toBe(PALETTE_BLOCKS.length + ROW_LAYOUTS.length)
  })

  it('canvas vacío muestra hint; agregar fila renderiza RowView con columnas', async () => {
    const wrapper = mount(EmailBuilder)
    expect(wrapper.find('.vmd-canvas-empty').exists()).toBe(true)
    // botón de "agregar fila" del empty state agrega una fila 100%
    await wrapper.find('.vmd-canvas-empty button').trigger('click')
    expect(wrapper.find('.vmd-row').exists()).toBe(true)
    expect(wrapper.findAll('.vmd-column')).toHaveLength(1)
  })

  it('click en fila la selecciona visualmente', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('.vmd-canvas-empty button').trigger('click')
    await wrapper.find('.vmd-row').trigger('click')
    expect(wrapper.find('.vmd-row.vmd-selected').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
pnpm --filter @vue-mail-designer/builder test tests/canvas.test.ts
```

Expected: FAIL — no existe `palette-items`.

- [ ] **Step 3: Implementar**

`packages/email-builder/src/components/palette-items.ts`:

```ts
import type { BlockType } from '../schema'

export const PALETTE_BLOCKS: { type: BlockType; label: string; icon: string }[] = [
  { type: 'heading', label: 'Título', icon: 'H' },
  { type: 'text', label: 'Texto', icon: '¶' },
  { type: 'image', label: 'Imagen', icon: '🖼' },
  { type: 'button', label: 'Botón', icon: '⬢' },
  { type: 'divider', label: 'Divisor', icon: '—' },
  { type: 'spacer', label: 'Espacio', icon: '↕' },
  { type: 'social', label: 'Redes', icon: '@' },
  { type: 'menu', label: 'Menú', icon: '≡' },
  { type: 'html', label: 'HTML', icon: '<>' },
  { type: 'video', label: 'Video', icon: '▶' },
]

export const ROW_LAYOUTS: { key: string; label: string; widths: number[] }[] = [
  { key: '100', label: '1 columna', widths: [100] },
  { key: '50-50', label: '2 columnas', widths: [50, 50] },
  { key: '33-33-33', label: '3 columnas', widths: [33, 34, 33] },
  { key: '66-33', label: '2:1', widths: [66, 34] },
  { key: '33-66', label: '1:2', widths: [34, 66] },
  { key: '25-25-25-25', label: '4 columnas', widths: [25, 25, 25, 25] },
]
```

`packages/email-builder/src/components/BlockPalette.vue` (reemplazar stub):

```vue
<template>
  <aside class="vmd-palette">
    <h3 class="vmd-palette-title">Bloques</h3>
    <draggable
      :list="blockItems"
      :group="{ name: 'blocks', pull: 'clone', put: false }"
      :sort="false"
      :clone="cloneBlock"
      item-key="type"
      class="vmd-palette-grid"
    >
      <template #item="{ element }">
        <div class="vmd-palette-item">
          <span class="vmd-palette-icon">{{ element.icon }}</span>
          <span>{{ element.label }}</span>
        </div>
      </template>
    </draggable>

    <h3 class="vmd-palette-title">Filas</h3>
    <draggable
      :list="rowItems"
      :group="{ name: 'rows', pull: 'clone', put: false }"
      :sort="false"
      :clone="cloneRow"
      item-key="key"
      class="vmd-palette-grid"
    >
      <template #item="{ element }">
        <div class="vmd-palette-item">
          <span class="vmd-palette-icon">▤</span>
          <span>{{ element.label }}</span>
        </div>
      </template>
    </draggable>
  </aside>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { createBlock, createRow } from '../schema'
import { PALETTE_BLOCKS, ROW_LAYOUTS } from './palette-items'

const blockItems = [...PALETTE_BLOCKS]
const rowItems = [...ROW_LAYOUTS]

function cloneBlock(item: (typeof PALETTE_BLOCKS)[number]) {
  return createBlock(item.type)
}
function cloneRow(item: (typeof ROW_LAYOUTS)[number]) {
  return createRow(item.widths)
}
</script>
```

`packages/email-builder/src/components/BuilderCanvas.vue` (reemplazar stub):

```vue
<template>
  <section class="vmd-canvas" @click.self="store.select(null)">
    <div
      class="vmd-canvas-page"
      :style="{ width: store.doc.settings.contentWidth + 'px', background: store.doc.settings.backgroundColor }"
    >
      <div v-if="store.doc.rows.length === 0" class="vmd-canvas-empty">
        <p>Arrastra una fila desde la paleta o</p>
        <button class="vmd-btn vmd-btn--primary" @click="store.addRow([100])">Agregar fila</button>
      </div>
      <draggable
        :model-value="store.doc.rows"
        group="rows"
        item-key="id"
        class="vmd-canvas-rows"
        ghost-class="vmd-ghost"
        :animation="150"
        @update:model-value="store.replaceRows($event)"
      >
        <template #item="{ element }">
          <RowView :row="element" />
        </template>
      </draggable>
    </div>
  </section>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import RowView from './RowView.vue'

const store = useDocumentStore(useBuilderPinia())
</script>
```

`packages/email-builder/src/components/RowView.vue`:

```vue
<template>
  <div
    class="vmd-row"
    :class="{ 'vmd-selected': isSelected }"
    :style="{ background: row.style.backgroundColor, borderRadius: row.style.borderRadius + 'px' }"
    @click.stop="store.select({ kind: 'row', id: row.id })"
  >
    <div class="vmd-row-actions" v-if="isSelected">
      <button class="vmd-mini-btn" title="Duplicar fila" @click.stop="store.duplicateRow(row.id)">⧉</button>
      <button class="vmd-mini-btn vmd-mini-btn--danger" title="Eliminar fila" @click.stop="store.removeRow(row.id)">🗑</button>
    </div>
    <div class="vmd-row-columns">
      <div
        v-for="column in row.columns"
        :key="column.id"
        class="vmd-column"
        :style="{ width: column.widthPct + '%' }"
      >
        <draggable
          :model-value="column.blocks"
          group="blocks"
          item-key="id"
          class="vmd-column-blocks"
          ghost-class="vmd-ghost"
          :animation="150"
          @update:model-value="store.replaceColumnBlocks(column.id, $event)"
        >
          <template #item="{ element }">
            <BlockView :block="element" />
          </template>
        </draggable>
        <div v-if="column.blocks.length === 0" class="vmd-column-empty">Suelta un bloque aquí</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import draggable from 'vuedraggable'
import type { Row } from '../schema'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import BlockView from './BlockView.vue'

const props = defineProps<{ row: Row }>()
const store = useDocumentStore(useBuilderPinia())
const isSelected = computed(() => store.selection?.kind === 'row' && store.selection.id === props.row.id)
</script>
```

`packages/email-builder/src/components/BlockView.vue` (stub visual — Task 10 lo completa):

```vue
<template>
  <div
    class="vmd-block"
    :class="{ 'vmd-selected': isSelected }"
    @click.stop="store.select({ kind: 'block', id: block.id })"
  >
    {{ block.type }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Block } from '../schema'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'

const props = defineProps<{ block: Block }>()
const store = useDocumentStore(useBuilderPinia())
const isSelected = computed(() => store.selection?.kind === 'block' && store.selection.id === props.block.id)
</script>
```

Agregar a `styles.css`:

```css
.vmd-palette-title { margin: 12px 0 8px; font-size: 12px; text-transform: uppercase; color: var(--vmd-muted); }
.vmd-palette-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.vmd-palette-item {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 10px 4px; border: 1px solid var(--vmd-border); border-radius: 8px;
  background: var(--vmd-bg); cursor: grab; font-size: 12px; text-align: center;
}
.vmd-palette-item:hover { border-color: var(--vmd-accent); }
.vmd-palette-icon { font-size: 16px; }
.vmd-canvas-page { margin: 0 auto; max-width: 100%; min-height: 200px; box-shadow: 0 1px 4px rgba(0,0,0,.12); }
.vmd-canvas-empty { padding: 48px 16px; text-align: center; color: var(--vmd-muted); }
.vmd-canvas-rows { min-height: 40px; }
.vmd-row { position: relative; border: 1px dashed transparent; }
.vmd-row:hover { border-color: var(--vmd-border); }
.vmd-row.vmd-selected { border: 1px solid var(--vmd-accent); }
.vmd-row-actions { position: absolute; top: -12px; right: 8px; z-index: 5; display: flex; gap: 4px; }
.vmd-mini-btn {
  width: 24px; height: 24px; border: 1px solid var(--vmd-border); border-radius: 4px;
  background: var(--vmd-panel); color: var(--vmd-fg); cursor: pointer; font-size: 12px;
}
.vmd-mini-btn--danger:hover { border-color: var(--vmd-danger); color: var(--vmd-danger); }
.vmd-row-columns { display: flex; }
.vmd-column { min-height: 40px; }
.vmd-column-blocks { min-height: 24px; }
.vmd-column-empty { padding: 12px; margin: 4px; text-align: center; font-size: 12px; color: var(--vmd-muted); border: 1px dashed var(--vmd-border); border-radius: 6px; }
.vmd-block { position: relative; border: 1px dashed transparent; cursor: pointer; }
.vmd-block:hover { border-color: var(--vmd-border); }
.vmd-block.vmd-selected { border: 1px solid var(--vmd-accent); }
.vmd-ghost { opacity: 0.5; outline: 2px dashed var(--vmd-accent); }
```

**Nota (canvas ≠ tema):** `.vmd-canvas-page` usa los colores del documento, nunca las variables del tema — el dark mode no toca el email.

- [ ] **Step 4: Verificar**

```bash
pnpm --filter @vue-mail-designer/builder test && pnpm typecheck
```

Expected: PASS. Verificación manual en `pnpm dev`: arrastrar "2 columnas" al canvas, arrastrar "Botón" a una columna, reordenar filas, mover un bloque entre columnas. Los cuatro gestos deben funcionar.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: paleta DnD y canvas con filas, columnas y bloques arrastrables"
```

---

### Task 10: BlockView — vista real de los 10 bloques + controles inline

**Files:**
- Modify (reemplazar): `packages/email-builder/src/components/BlockView.vue`
- Modify: `packages/email-builder/src/styles.css`
- Test: `packages/email-builder/tests/block-view.test.ts`

**Interfaces:**
- Consumes: `Block` y tipos por bloque, `SOCIAL_BRANDS` (Task 7), store.
- Produces: `BlockView.vue` renderiza cada tipo con fidelidad visual aproximada al HTML final; botones inline duplicar/eliminar cuando está seleccionado. La edición de texto inline llega en Task 11; acá el texto se muestra con `v-html` (heading como texto plano).

- [ ] **Step 1: Test que falla**

`packages/email-builder/tests/block-view.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, provide } from 'vue'
import BlockView from '../src/components/BlockView.vue'
import { createBlock } from '../src/schema'
import type { Block } from '../src/schema'
import { useDocumentStore } from '../src/store/document'
import { BUILDER_PINIA_KEY } from '../src/store/keys'

function mountBlock(block: Block) {
  const pinia = createPinia()
  const Host = defineComponent({
    setup() {
      provide(BUILDER_PINIA_KEY, pinia)
      return () => h(BlockView, { block })
    },
  })
  return { wrapper: mount(Host), store: useDocumentStore(pinia) }
}

describe('BlockView', () => {
  it('button muestra el label con sus colores', () => {
    const block = createBlock('button')
    if (block.type !== 'button') throw new Error()
    block.label = 'Comprar'
    const { wrapper } = mountBlock(block)
    expect(wrapper.text()).toContain('Comprar')
    expect(wrapper.find('.vmd-b-button').attributes('style')).toContain('background')
  })

  it('image sin src muestra placeholder', () => {
    const { wrapper } = mountBlock(createBlock('image'))
    expect(wrapper.find('.vmd-b-image-placeholder').exists()).toBe(true)
  })

  it('social renderiza un círculo por red', () => {
    const block = createBlock('social')
    const { wrapper } = mountBlock(block)
    expect(wrapper.findAll('.vmd-b-social-icon')).toHaveLength(3)
  })

  it('seleccionado muestra acciones y eliminar borra del store', async () => {
    const block = createBlock('spacer')
    const { wrapper, store } = mountBlock(block)
    const row = store.addRow([100])
    store.findRow(row.id)!.columns[0].blocks.push(block)
    store.select({ kind: 'block', id: block.id })
    await wrapper.vm.$nextTick()
    await wrapper.find('.vmd-block-actions .vmd-mini-btn--danger').trigger('click')
    expect(store.findBlock(block.id)).toBeUndefined()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
pnpm --filter @vue-mail-designer/builder test tests/block-view.test.ts
```

Expected: FAIL — el stub no tiene las clases `vmd-b-*` ni acciones.

- [ ] **Step 3: Implementar** — reemplazar `BlockView.vue`:

```vue
<template>
  <div
    class="vmd-block"
    :class="{ 'vmd-selected': isSelected }"
    @click.stop="store.select({ kind: 'block', id: block.id })"
  >
    <div v-if="isSelected" class="vmd-block-actions">
      <button class="vmd-mini-btn" title="Duplicar" @click.stop="store.duplicateBlock(block.id)">⧉</button>
      <button class="vmd-mini-btn vmd-mini-btn--danger" title="Eliminar" @click.stop="store.removeBlock(block.id)">🗑</button>
    </div>

    <!-- heading -->
    <div
      v-if="block.type === 'heading'"
      :style="{
        color: block.style.color,
        fontSize: block.style.fontSize + 'px',
        textAlign: block.style.align,
        fontWeight: 'bold',
        padding: padCss(block.style.padding),
        fontFamily: fontFamily,
      }"
    >{{ block.text }}</div>

    <!-- text -->
    <div
      v-else-if="block.type === 'text'"
      class="vmd-b-text"
      :style="{
        color: block.style.color,
        fontSize: block.style.fontSize + 'px',
        lineHeight: String(block.style.lineHeight),
        padding: padCss(block.style.padding),
        fontFamily: fontFamily,
      }"
      v-html="block.html"
    />

    <!-- image -->
    <div v-else-if="block.type === 'image'" :style="{ padding: padCss(block.style.padding), textAlign: block.align }">
      <img v-if="block.src" :src="block.src" :alt="block.alt" :style="{ width: block.widthPct + '%', display: 'inline-block' }" />
      <div v-else class="vmd-b-image-placeholder">🖼 Selecciona una imagen en el inspector</div>
    </div>

    <!-- button -->
    <div v-else-if="block.type === 'button'" :style="{ padding: padCss(block.style.padding), textAlign: block.align }">
      <span
        class="vmd-b-button"
        :style="{
          background: block.style.backgroundColor,
          color: block.style.color,
          fontSize: block.style.fontSize + 'px',
          borderRadius: block.style.borderRadius + 'px',
          padding: block.style.innerPaddingY + 'px ' + block.style.innerPaddingX + 'px',
          fontFamily: fontFamily,
        }"
      >{{ block.label }}</span>
    </div>

    <!-- divider -->
    <div v-else-if="block.type === 'divider'" :style="{ padding: padCss(block.style.padding), textAlign: 'center' }">
      <div :style="{ width: block.style.widthPct + '%', display: 'inline-block', borderTop: block.style.thickness + 'px solid ' + block.style.color }" />
    </div>

    <!-- spacer -->
    <div v-else-if="block.type === 'spacer'" class="vmd-b-spacer" :style="{ height: block.height + 'px' }" />

    <!-- social -->
    <div v-else-if="block.type === 'social'" :style="{ padding: padCss(block.style.padding), textAlign: block.align }">
      <span
        v-for="(n, i) in block.networks"
        :key="i"
        class="vmd-b-social-icon"
        :style="{
          width: block.iconSize + 'px', height: block.iconSize + 'px',
          lineHeight: block.iconSize + 'px',
          margin: '0 ' + block.spacing / 2 + 'px',
          background: SOCIAL_BRANDS[n.kind].color,
          fontSize: Math.round(block.iconSize * 0.45) + 'px',
        }"
      >{{ SOCIAL_BRANDS[n.kind].label }}</span>
    </div>

    <!-- menu -->
    <div
      v-else-if="block.type === 'menu'"
      :style="{ padding: padCss(block.style.padding), textAlign: block.align, color: block.style.color, fontSize: block.style.fontSize + 'px', fontFamily: fontFamily }"
    >
      <template v-for="(it, i) in block.items" :key="i">
        <span v-if="i > 0" style="padding: 0 8px">{{ block.separator }}</span>
        <span>{{ it.label }}</span>
      </template>
    </div>

    <!-- html -->
    <div v-else-if="block.type === 'html'" class="vmd-b-html" v-html="block.code" />

    <!-- video -->
    <div v-else-if="block.type === 'video'" :style="{ padding: padCss(block.style.padding), textAlign: 'center' }">
      <div v-if="block.thumbnailUrl" class="vmd-b-video" :style="{ width: block.widthPct + '%' }">
        <img :src="block.thumbnailUrl" :alt="block.alt" style="width: 100%; display: block" />
        <span class="vmd-b-video-play">▶</span>
      </div>
      <div v-else class="vmd-b-image-placeholder">▶ Configura el video en el inspector</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SOCIAL_BRANDS } from '../render/html'
import type { Block, Padding } from '../schema'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'

const props = defineProps<{ block: Block }>()
const store = useDocumentStore(useBuilderPinia())
const isSelected = computed(() => store.selection?.kind === 'block' && store.selection.id === props.block.id)
const fontFamily = computed(() => store.doc.settings.fontFamily)

function padCss(p: Padding): string {
  return `${p.top}px ${p.right}px ${p.bottom}px ${p.left}px`
}
</script>
```

Agregar a `styles.css`:

```css
.vmd-block-actions { position: absolute; top: -12px; right: 4px; z-index: 6; display: flex; gap: 4px; }
.vmd-b-text p { margin: 0 0 0.5em; }
.vmd-b-text p:last-child { margin-bottom: 0; }
.vmd-b-image-placeholder {
  padding: 24px; border: 1px dashed var(--vmd-border); border-radius: 6px;
  color: var(--vmd-muted); font-size: 13px; text-align: center; background: rgba(0,0,0,.02);
}
.vmd-b-button { display: inline-block; font-weight: bold; }
.vmd-b-spacer { background: repeating-linear-gradient(45deg, transparent, transparent 6px, rgba(0,0,0,.04) 6px, rgba(0,0,0,.04) 12px); }
.vmd-b-social-icon { display: inline-block; border-radius: 50%; color: #fff; text-align: center; font-weight: bold; }
.vmd-b-video { position: relative; display: inline-block; }
.vmd-b-video-play {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 40px; color: #fff; text-shadow: 0 1px 6px rgba(0,0,0,.6);
}
.vmd-mt { background: color-mix(in srgb, var(--vmd-accent) 15%, transparent); border-radius: 3px; padding: 0 3px; }
```

- [ ] **Step 4: Verificar**

```bash
pnpm --filter @vue-mail-designer/builder test && pnpm typecheck
```

Expected: PASS. Manual en demo: cada bloque arrastrado se ve con su forma real.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: vista real de los 10 bloques con controles duplicar/eliminar"
```

---

### Task 11: Editor Tiptap con merge tags y edición inline de texto

**Files:**
- Create: `packages/email-builder/src/editor/mergeTag.ts`, `packages/email-builder/src/components/RichTextEditor.vue`, `packages/email-builder/src/options.ts`
- Modify: `packages/email-builder/src/components/BlockView.vue` (el case `text` usa el editor cuando está seleccionado), `packages/email-builder/src/components/EmailBuilder.vue` (provee opciones), `packages/email-builder/src/styles.css`, `packages/email-builder/src/index.ts`
- Test: `packages/email-builder/tests/merge-tag.test.ts`

**Interfaces:**
- Consumes: convención `<span data-mt="valor">Etiqueta</span>` del renderer (Task 5).
- Produces:
  - `options.ts`: `type MergeTagDef = { name: string; value: string }` (value SIN llaves, p.ej. `first_name`), `type BuilderOptions = { mergeTags: MergeTagDef[]; uploadImage?: (file: File) => Promise<string> }`, `BUILDER_OPTIONS_KEY: InjectionKey<BuilderOptions>`, `useBuilderOptions(): BuilderOptions` (inject con default `{ mergeTags: [] }`). Task 14 agrega el campo `templates` a este tipo.
  - `MergeTag` (Tiptap Node): inline, atom; `renderHTML` → `<span data-mt="..." class="vmd-mt">Etiqueta</span>`; `parseHTML` desde `span[data-mt]`; comando de inserción vía `insertContent`.
  - `RichTextEditor.vue`: props `{ modelValue: string }`, emit `update:modelValue`; toolbar con negrita, cursiva, subrayado, alineación (izq/centro/der), link (prompt) y select de merge tags (visible solo si hay tags configurados).
  - En `EmailBuilder.vue`: `provide(BUILDER_OPTIONS_KEY, …)` con valores de props nuevas `mergeTags` y `uploadImage` (props formalizadas del todo en Task 15; acá se declaran `mergeTags?: MergeTagDef[]` y `uploadImage?: (file: File) => Promise<string>`).

- [ ] **Step 1: Test que falla**

`packages/email-builder/tests/merge-tag.test.ts`:

```ts
import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'
import { MergeTag, insertMergeTag } from '../src/editor/mergeTag'
import { MERGE_TAG_RE } from '../src/render/html'

describe('MergeTag', () => {
  it('inserta un span data-mt que el renderer convierte a {{value}}', () => {
    const editor = new Editor({ extensions: [StarterKit, MergeTag], content: '<p>Hola </p>' })
    insertMergeTag(editor, { name: 'Nombre', value: 'first_name' })
    const html = editor.getHTML()
    expect(html).toContain('data-mt="first_name"')
    expect(html.replace(MERGE_TAG_RE, (_m, v) => `{{${v}}}`)).toContain('{{first_name}}')
    editor.destroy()
  })

  it('parsea de vuelta HTML con spans data-mt como nodos atómicos', () => {
    const editor = new Editor({
      extensions: [StarterKit, MergeTag],
      content: '<p>Hola <span data-mt="first_name">Nombre</span></p>',
    })
    expect(editor.getHTML()).toContain('data-mt="first_name"')
    editor.destroy()
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
pnpm --filter @vue-mail-designer/builder test tests/merge-tag.test.ts
```

Expected: FAIL — no existe `../src/editor/mergeTag`.

- [ ] **Step 3: Implementar**

`packages/email-builder/src/editor/mergeTag.ts`:

```ts
import { Node, mergeAttributes } from '@tiptap/core'
import type { Editor } from '@tiptap/core'
import type { MergeTagDef } from '../options'

export const MergeTag = Node.create({
  name: 'mergeTag',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      value: { default: '' },
      label: { default: '' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-mt]',
        getAttrs: (el) => ({
          value: (el as HTMLElement).getAttribute('data-mt') ?? '',
          label: (el as HTMLElement).textContent ?? '',
        }),
      },
    ]
  },

  renderHTML({ node }) {
    return [
      'span',
      mergeAttributes({ 'data-mt': node.attrs.value as string, class: 'vmd-mt' }),
      (node.attrs.label as string) || (node.attrs.value as string),
    ]
  },
})

export function insertMergeTag(editor: Editor, tag: MergeTagDef) {
  editor
    .chain()
    .focus()
    .insertContent({ type: 'mergeTag', attrs: { value: tag.value, label: tag.name } })
    .run()
}
```

`packages/email-builder/src/options.ts`:

```ts
import type { InjectionKey } from 'vue'
import { inject } from 'vue'

export type MergeTagDef = { name: string; value: string }

export type BuilderOptions = {
  mergeTags: MergeTagDef[]
  uploadImage?: (file: File) => Promise<string>
}

export const BUILDER_OPTIONS_KEY: InjectionKey<BuilderOptions> = Symbol('vmd-options')

export function useBuilderOptions(): BuilderOptions {
  return inject(BUILDER_OPTIONS_KEY, { mergeTags: [] })
}
```

`packages/email-builder/src/components/RichTextEditor.vue`:

```vue
<template>
  <div class="vmd-rte" @click.stop>
    <div class="vmd-rte-toolbar">
      <button class="vmd-mini-btn" :class="{ 'vmd-active': editor?.isActive('bold') }" @click="editor?.chain().focus().toggleBold().run()"><b>B</b></button>
      <button class="vmd-mini-btn" :class="{ 'vmd-active': editor?.isActive('italic') }" @click="editor?.chain().focus().toggleItalic().run()"><i>I</i></button>
      <button class="vmd-mini-btn" :class="{ 'vmd-active': editor?.isActive('underline') }" @click="editor?.chain().focus().toggleUnderline().run()"><u>U</u></button>
      <button class="vmd-mini-btn" @click="editor?.chain().focus().setTextAlign('left').run()">⇤</button>
      <button class="vmd-mini-btn" @click="editor?.chain().focus().setTextAlign('center').run()">↔</button>
      <button class="vmd-mini-btn" @click="editor?.chain().focus().setTextAlign('right').run()">⇥</button>
      <button class="vmd-mini-btn" @click="setLink">🔗</button>
      <select v-if="options.mergeTags.length" class="vmd-rte-tags" @change="onTagPick">
        <option value="">Variable…</option>
        <option v-for="t in options.mergeTags" :key="t.value" :value="t.value">{{ t.name }}</option>
      </select>
    </div>
    <EditorContent :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { watch } from 'vue'
import { MergeTag, insertMergeTag } from '../editor/mergeTag'
import { useBuilderOptions } from '../options'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const options = useBuilderOptions()

const editor = useEditor({
  extensions: [
    StarterKit.configure({ heading: false }),
    Underline,
    Link.configure({ openOnClick: false }),
    TextAlign.configure({ types: ['paragraph'] }),
    MergeTag,
  ],
  content: props.modelValue,
  onUpdate({ editor }) {
    emit('update:modelValue', editor.getHTML())
  },
})

watch(
  () => props.modelValue,
  (value) => {
    if (editor.value && editor.value.getHTML() !== value) {
      editor.value.commands.setContent(value, false)
    }
  },
)

function setLink() {
  if (!editor.value) return
  const prev = editor.value.getAttributes('link').href as string | undefined
  const url = window.prompt('URL del enlace', prev ?? 'https://')
  if (url === null) return
  if (url === '') editor.value.chain().focus().unsetLink().run()
  else editor.value.chain().focus().setLink({ href: url }).run()
}

function onTagPick(e: Event) {
  const select = e.target as HTMLSelectElement
  const tag = options.mergeTags.find((t) => t.value === select.value)
  if (tag && editor.value) insertMergeTag(editor.value, tag)
  select.value = ''
}
</script>
```

En `BlockView.vue`, reemplazar el case `text` para editar inline al estar seleccionado:

```vue
    <!-- text -->
    <div
      v-else-if="block.type === 'text'"
      :style="{
        color: block.style.color,
        fontSize: block.style.fontSize + 'px',
        lineHeight: String(block.style.lineHeight),
        padding: padCss(block.style.padding),
        fontFamily: fontFamily,
      }"
    >
      <RichTextEditor
        v-if="isSelected"
        :model-value="block.html"
        @update:model-value="store.updateBlock(block.id, { html: $event })"
      />
      <div v-else class="vmd-b-text" v-html="block.html" />
    </div>
```

(agregar `import RichTextEditor from './RichTextEditor.vue'` al script).

En `EmailBuilder.vue`, declarar props provisorias y proveer opciones:

```ts
import { computed } from 'vue'
import { BUILDER_OPTIONS_KEY, type MergeTagDef } from '../options'

const props = defineProps<{
  mergeTags?: MergeTagDef[]
  uploadImage?: (file: File) => Promise<string>
}>()

provide(
  BUILDER_OPTIONS_KEY,
  // reactive para que cambios de prop lleguen a los hijos
  computed(() => ({ mergeTags: props.mergeTags ?? [], uploadImage: props.uploadImage })).value,
)
```

> Nota: si `computed(...).value` pierde reactividad de props en la práctica, usar `reactive({ get mergeTags() { return props.mergeTags ?? [] }, get uploadImage() { return props.uploadImage } })`. Verificarlo en la demo cambiando `mergeTags` en caliente.

Agregar a `styles.css`:

```css
.vmd-rte-toolbar { display: flex; gap: 2px; padding: 4px; background: var(--vmd-panel); border: 1px solid var(--vmd-border); border-radius: 6px 6px 0 0; }
.vmd-rte .ProseMirror { outline: none; min-height: 40px; padding: 4px; border: 1px solid var(--vmd-border); border-top: 0; border-radius: 0 0 6px 6px; }
.vmd-active { border-color: var(--vmd-accent); color: var(--vmd-accent); }
.vmd-rte-tags { font-size: 12px; border: 1px solid var(--vmd-border); border-radius: 4px; background: var(--vmd-panel); color: var(--vmd-fg); }
```

Exportar desde `src/index.ts`:

```ts
export { type BuilderOptions, type MergeTagDef, BUILDER_OPTIONS_KEY, useBuilderOptions } from './options'
```

- [ ] **Step 4: Verificar**

```bash
pnpm --filter @vue-mail-designer/builder test && pnpm typecheck
```

Expected: PASS. Manual en demo: seleccionar un bloque de texto → aparece el editor; negrita/alineación funcionan; insertar una variable y verla como chip.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: editor Tiptap inline con merge tags atómicos"
```

---

### Task 12: Inspector de propiedades

**Files:**
- Create: `packages/email-builder/src/components/fields/TextField.vue`, `NumberField.vue`, `ColorField.vue`, `SelectField.vue`, `AlignField.vue`, `PaddingField.vue` (mismo directorio)
- Modify (reemplazar stub): `packages/email-builder/src/components/InspectorPanel.vue`
- Modify: `packages/email-builder/src/styles.css`
- Test: `packages/email-builder/tests/inspector.test.ts`

**Interfaces:**
- Consumes: store (`selectedBlock`, `selectedRow`, `updateBlock`, `updateRowStyle`, `updateSettings`), `useBuilderOptions` (para `uploadImage`).
- Produces:
  - Fields con contrato uniforme: props `{ label: string; modelValue: T }`, emit `update:modelValue`. `SelectField` agrega `options: { label: string; value: string }[]`; `NumberField` agrega `min?/max?`; `PaddingField` trabaja sobre `Padding` completo (4 inputs); `AlignField` sobre `Align` (3 botones).
  - `InspectorPanel.vue`: sin selección → settings del documento (ancho, color fondo, fuente, preheader); fila seleccionada → estilo de fila; bloque seleccionado → panel por tipo. Imagen: si `uploadImage` está configurado muestra `<input type="file">`, sube, y setea `src` al resolver (con estado "Subiendo…"); siempre permite pegar URL manual.

- [ ] **Step 1: Test que falla**

`packages/email-builder/tests/inspector.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import { createPinia } from 'pinia'
import { describe, expect, it } from 'vitest'
import { defineComponent, h, provide } from 'vue'
import InspectorPanel from '../src/components/InspectorPanel.vue'
import { useDocumentStore } from '../src/store/document'
import { BUILDER_PINIA_KEY } from '../src/store/keys'

function mountInspector() {
  const pinia = createPinia()
  const Host = defineComponent({
    setup() {
      provide(BUILDER_PINIA_KEY, pinia)
      return () => h(InspectorPanel)
    },
  })
  return { wrapper: mount(Host), store: useDocumentStore(pinia) }
}

describe('InspectorPanel', () => {
  it('sin selección muestra settings del documento', () => {
    const { wrapper } = mountInspector()
    expect(wrapper.text()).toContain('Documento')
    expect(wrapper.text()).toContain('Preheader')
  })

  it('con bloque button seleccionado muestra sus campos y edita el label', async () => {
    const { wrapper, store } = mountInspector()
    const row = store.addRow([100])
    const block = store.addBlockToColumn(row.columns[0].id, 'button')
    store.select({ kind: 'block', id: block.id })
    await wrapper.vm.$nextTick()

    const input = wrapper.find('input[data-field="label"]')
    expect(input.exists()).toBe(true)
    await input.setValue('Nuevo texto')
    const found = store.findBlock(block.id)!.block
    expect(found.type === 'button' && found.label).toBe('Nuevo texto')
  })

  it('con fila seleccionada muestra estilo de fila', async () => {
    const { wrapper, store } = mountInspector()
    const row = store.addRow([100])
    store.select({ kind: 'row', id: row.id })
    await wrapper.vm.$nextTick()
    expect(wrapper.text()).toContain('Fila')
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
pnpm --filter @vue-mail-designer/builder test tests/inspector.test.ts
```

Expected: FAIL — el stub no tiene contenido.

- [ ] **Step 3: Implementar los fields**

`fields/TextField.vue`:

```vue
<template>
  <label class="vmd-field">
    <span class="vmd-field-label">{{ label }}</span>
    <input
      class="vmd-field-input"
      type="text"
      :value="modelValue"
      :data-field="dataField"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </label>
</template>

<script setup lang="ts">
defineProps<{ label: string; modelValue: string; dataField?: string }>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
```

`fields/NumberField.vue`:

```vue
<template>
  <label class="vmd-field">
    <span class="vmd-field-label">{{ label }}</span>
    <input
      class="vmd-field-input"
      type="number"
      :value="modelValue"
      :min="min"
      :max="max"
      @input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
    />
  </label>
</template>

<script setup lang="ts">
defineProps<{ label: string; modelValue: number; min?: number; max?: number }>()
defineEmits<{ 'update:modelValue': [value: number] }>()
</script>
```

`fields/ColorField.vue`:

```vue
<template>
  <label class="vmd-field">
    <span class="vmd-field-label">{{ label }}</span>
    <span class="vmd-field-color">
      <input type="color" :value="colorValue" @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
      <input
        class="vmd-field-input"
        type="text"
        :value="modelValue"
        @change="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ label: string; modelValue: string }>()
defineEmits<{ 'update:modelValue': [value: string] }>()
// input[type=color] solo acepta #rrggbb
const colorValue = computed(() => (/^#[0-9a-fA-F]{6}$/.test(props.modelValue) ? props.modelValue : '#000000'))
</script>
```

`fields/SelectField.vue`:

```vue
<template>
  <label class="vmd-field">
    <span class="vmd-field-label">{{ label }}</span>
    <select class="vmd-field-input" :value="modelValue" @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)">
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
  </label>
</template>

<script setup lang="ts">
defineProps<{ label: string; modelValue: string; options: { label: string; value: string }[] }>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
```

`fields/AlignField.vue`:

```vue
<template>
  <div class="vmd-field">
    <span class="vmd-field-label">{{ label }}</span>
    <div class="vmd-align-group">
      <button
        v-for="a in ALIGNS"
        :key="a.value"
        class="vmd-mini-btn"
        :class="{ 'vmd-active': modelValue === a.value }"
        @click="$emit('update:modelValue', a.value)"
      >{{ a.icon }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Align } from '../../schema'
defineProps<{ label: string; modelValue: Align }>()
defineEmits<{ 'update:modelValue': [value: Align] }>()
const ALIGNS: { value: Align; icon: string }[] = [
  { value: 'left', icon: '⇤' },
  { value: 'center', icon: '↔' },
  { value: 'right', icon: '⇥' },
]
</script>
```

`fields/PaddingField.vue`:

```vue
<template>
  <div class="vmd-field">
    <span class="vmd-field-label">{{ label }}</span>
    <div class="vmd-padding-grid">
      <input v-for="side in SIDES" :key="side.key" class="vmd-field-input" type="number" min="0"
        :value="modelValue[side.key]" :title="side.label"
        @input="onSide(side.key, $event)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Padding } from '../../schema'
const props = defineProps<{ label: string; modelValue: Padding }>()
const emit = defineEmits<{ 'update:modelValue': [value: Padding] }>()
const SIDES = [
  { key: 'top', label: 'Arriba' },
  { key: 'right', label: 'Derecha' },
  { key: 'bottom', label: 'Abajo' },
  { key: 'left', label: 'Izquierda' },
] as const

function onSide(key: keyof Padding, e: Event) {
  emit('update:modelValue', { ...props.modelValue, [key]: Number((e.target as HTMLInputElement).value) })
}
</script>
```

- [ ] **Step 4: Implementar `InspectorPanel.vue`** (reemplazar stub):

```vue
<template>
  <aside class="vmd-inspector" @click.stop>
    <!-- Bloque seleccionado -->
    <template v-if="block">
      <h3 class="vmd-inspector-title">Bloque: {{ block.type }}</h3>

      <template v-if="block.type === 'heading'">
        <TextField label="Texto" :model-value="block.text" @update:model-value="upd({ text: $event })" />
        <SelectField label="Nivel" :model-value="String(block.level)" :options="[{label:'H1',value:'1'},{label:'H2',value:'2'},{label:'H3',value:'3'}]" @update:model-value="upd({ level: Number($event) })" />
        <ColorField label="Color" :model-value="block.style.color" @update:model-value="upd({ style: { color: $event } })" />
        <NumberField label="Tamaño" :model-value="block.style.fontSize" :min="10" :max="72" @update:model-value="upd({ style: { fontSize: $event } })" />
        <AlignField label="Alineación" :model-value="block.style.align" @update:model-value="upd({ style: { align: $event } })" />
        <PaddingField label="Padding" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'text'">
        <ColorField label="Color" :model-value="block.style.color" @update:model-value="upd({ style: { color: $event } })" />
        <NumberField label="Tamaño" :model-value="block.style.fontSize" :min="10" :max="40" @update:model-value="upd({ style: { fontSize: $event } })" />
        <NumberField label="Interlineado" :model-value="block.style.lineHeight" :min="1" :max="3" @update:model-value="upd({ style: { lineHeight: $event } })" />
        <PaddingField label="Padding" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'image'">
        <div v-if="options.uploadImage" class="vmd-field">
          <span class="vmd-field-label">Subir imagen</span>
          <input type="file" accept="image/*" @change="onUpload" />
          <span v-if="uploading" class="vmd-field-hint">Subiendo…</span>
        </div>
        <TextField label="URL" :model-value="block.src" @update:model-value="upd({ src: $event })" />
        <TextField label="Texto alternativo" :model-value="block.alt" @update:model-value="upd({ alt: $event })" />
        <TextField label="Enlace (opcional)" :model-value="block.href ?? ''" @update:model-value="upd({ href: $event })" />
        <NumberField label="Ancho %" :model-value="block.widthPct" :min="10" :max="100" @update:model-value="upd({ widthPct: $event })" />
        <AlignField label="Alineación" :model-value="block.align" @update:model-value="upd({ align: $event })" />
        <PaddingField label="Padding" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'button'">
        <TextField label="Texto" data-field="label" :model-value="block.label" @update:model-value="upd({ label: $event })" />
        <TextField label="Enlace" :model-value="block.href" @update:model-value="upd({ href: $event })" />
        <AlignField label="Alineación" :model-value="block.align" @update:model-value="upd({ align: $event })" />
        <ColorField label="Fondo" :model-value="block.style.backgroundColor" @update:model-value="upd({ style: { backgroundColor: $event } })" />
        <ColorField label="Texto" :model-value="block.style.color" @update:model-value="upd({ style: { color: $event } })" />
        <NumberField label="Tamaño fuente" :model-value="block.style.fontSize" :min="10" :max="32" @update:model-value="upd({ style: { fontSize: $event } })" />
        <NumberField label="Radio borde" :model-value="block.style.borderRadius" :min="0" :max="40" @update:model-value="upd({ style: { borderRadius: $event } })" />
        <PaddingField label="Padding" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'divider'">
        <ColorField label="Color" :model-value="block.style.color" @update:model-value="upd({ style: { color: $event } })" />
        <NumberField label="Grosor" :model-value="block.style.thickness" :min="1" :max="10" @update:model-value="upd({ style: { thickness: $event } })" />
        <NumberField label="Ancho %" :model-value="block.style.widthPct" :min="10" :max="100" @update:model-value="upd({ style: { widthPct: $event } })" />
        <PaddingField label="Padding" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'spacer'">
        <NumberField label="Altura" :model-value="block.height" :min="4" :max="200" @update:model-value="upd({ height: $event })" />
      </template>

      <template v-else-if="block.type === 'social'">
        <div v-for="(n, i) in block.networks" :key="i" class="vmd-social-row">
          <SelectField :label="'Red ' + (i + 1)" :model-value="n.kind" :options="NETWORK_OPTIONS" @update:model-value="setNetwork(i, { kind: $event as SocialNetworkKind })" />
          <TextField label="URL" :model-value="n.url" @update:model-value="setNetwork(i, { url: $event })" />
          <button class="vmd-mini-btn vmd-mini-btn--danger" @click="removeNetwork(i)">🗑</button>
        </div>
        <button class="vmd-btn" @click="addNetwork">+ Agregar red</button>
        <NumberField label="Tamaño ícono" :model-value="block.iconSize" :min="16" :max="64" @update:model-value="upd({ iconSize: $event })" />
        <NumberField label="Espaciado" :model-value="block.spacing" :min="0" :max="32" @update:model-value="upd({ spacing: $event })" />
        <AlignField label="Alineación" :model-value="block.align" @update:model-value="upd({ align: $event })" />
      </template>

      <template v-else-if="block.type === 'menu'">
        <div v-for="(it, i) in block.items" :key="i" class="vmd-social-row">
          <TextField label="Etiqueta" :model-value="it.label" @update:model-value="setMenuItem(i, { label: $event })" />
          <TextField label="URL" :model-value="it.href" @update:model-value="setMenuItem(i, { href: $event })" />
          <button class="vmd-mini-btn vmd-mini-btn--danger" @click="removeMenuItem(i)">🗑</button>
        </div>
        <button class="vmd-btn" @click="addMenuItem">+ Agregar ítem</button>
        <TextField label="Separador" :model-value="block.separator" @update:model-value="upd({ separator: $event })" />
        <ColorField label="Color" :model-value="block.style.color" @update:model-value="upd({ style: { color: $event } })" />
        <AlignField label="Alineación" :model-value="block.align" @update:model-value="upd({ align: $event })" />
      </template>

      <template v-else-if="block.type === 'html'">
        <label class="vmd-field">
          <span class="vmd-field-label">Código HTML</span>
          <textarea class="vmd-field-input vmd-field-code" rows="8" :value="block.code" @input="upd({ code: ($event.target as HTMLTextAreaElement).value })" />
        </label>
      </template>

      <template v-else-if="block.type === 'video'">
        <TextField label="URL del video" :model-value="block.videoUrl" @update:model-value="upd({ videoUrl: $event })" />
        <TextField label="URL de miniatura" :model-value="block.thumbnailUrl" @update:model-value="upd({ thumbnailUrl: $event })" />
        <TextField label="Texto alternativo" :model-value="block.alt" @update:model-value="upd({ alt: $event })" />
        <NumberField label="Ancho %" :model-value="block.widthPct" :min="10" :max="100" @update:model-value="upd({ widthPct: $event })" />
      </template>
    </template>

    <!-- Fila seleccionada -->
    <template v-else-if="row">
      <h3 class="vmd-inspector-title">Fila</h3>
      <ColorField label="Fondo" :model-value="row.style.backgroundColor" @update:model-value="store.updateRowStyle(row.id, { backgroundColor: $event })" />
      <NumberField label="Radio borde" :model-value="row.style.borderRadius" :min="0" :max="32" @update:model-value="store.updateRowStyle(row.id, { borderRadius: $event })" />
      <PaddingField label="Padding" :model-value="row.style.padding" @update:model-value="store.updateRowStyle(row.id, { padding: $event })" />
    </template>

    <!-- Sin selección: settings del documento -->
    <template v-else>
      <h3 class="vmd-inspector-title">Documento</h3>
      <NumberField label="Ancho contenido" :model-value="store.doc.settings.contentWidth" :min="320" :max="900" @update:model-value="store.updateSettings({ contentWidth: $event })" />
      <ColorField label="Color de fondo" :model-value="store.doc.settings.backgroundColor" @update:model-value="store.updateSettings({ backgroundColor: $event })" />
      <TextField label="Fuente" :model-value="store.doc.settings.fontFamily" @update:model-value="store.updateSettings({ fontFamily: $event })" />
      <TextField label="Preheader" :model-value="store.doc.settings.preheader" @update:model-value="store.updateSettings({ preheader: $event })" />
    </template>
  </aside>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useBuilderOptions } from '../options'
import type { SocialNetworkKind } from '../schema'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import AlignField from './fields/AlignField.vue'
import ColorField from './fields/ColorField.vue'
import NumberField from './fields/NumberField.vue'
import PaddingField from './fields/PaddingField.vue'
import SelectField from './fields/SelectField.vue'
import TextField from './fields/TextField.vue'

const store = useDocumentStore(useBuilderPinia())
const options = useBuilderOptions()
const block = computed(() => store.selectedBlock)
const row = computed(() => store.selectedRow)
const uploading = ref(false)

const NETWORK_OPTIONS = [
  'facebook', 'instagram', 'x', 'linkedin', 'youtube', 'tiktok', 'whatsapp', 'web',
].map((v) => ({ label: v, value: v }))

function upd(patch: Record<string, unknown>) {
  if (block.value) store.updateBlock(block.value.id, patch)
}

async function onUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file || !options.uploadImage || !block.value) return
  const id = block.value.id
  uploading.value = true
  try {
    const url = await options.uploadImage(file)
    store.updateBlock(id, { src: url })
  } finally {
    uploading.value = false
  }
}

function setNetwork(i: number, patch: Partial<{ kind: SocialNetworkKind; url: string }>) {
  if (block.value?.type !== 'social') return
  const networks = block.value.networks.map((n, j) => (j === i ? { ...n, ...patch } : n))
  upd({ networks })
}
function addNetwork() {
  if (block.value?.type !== 'social') return
  upd({ networks: [...block.value.networks, { kind: 'web', url: 'https://' }] })
}
function removeNetwork(i: number) {
  if (block.value?.type !== 'social') return
  upd({ networks: block.value.networks.filter((_, j) => j !== i) })
}

function setMenuItem(i: number, patch: Partial<{ label: string; href: string }>) {
  if (block.value?.type !== 'menu') return
  upd({ items: block.value.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) })
}
function addMenuItem() {
  if (block.value?.type !== 'menu') return
  upd({ items: [...block.value.items, { label: 'Nuevo', href: 'https://' }] })
}
function removeMenuItem(i: number) {
  if (block.value?.type !== 'menu') return
  upd({ items: block.value.items.filter((_, j) => j !== i) })
}
</script>
```

> Nota sobre arrays: `deepMerge` (Task 3) reemplaza arrays completos, por eso `setNetwork`/`setMenuItem` pasan el array nuevo entero.

Agregar a `styles.css`:

```css
.vmd-inspector-title { margin: 4px 0 12px; font-size: 13px; text-transform: uppercase; color: var(--vmd-muted); }
.vmd-field { display: block; margin-bottom: 10px; }
.vmd-field-label { display: block; margin-bottom: 4px; font-size: 12px; color: var(--vmd-muted); }
.vmd-field-input { width: 100%; box-sizing: border-box; padding: 6px 8px; border: 1px solid var(--vmd-border); border-radius: 6px; background: var(--vmd-bg); color: var(--vmd-fg); font-size: 13px; }
.vmd-field-color { display: flex; gap: 6px; align-items: center; }
.vmd-field-color input[type='color'] { width: 32px; height: 32px; padding: 0; border: 1px solid var(--vmd-border); border-radius: 6px; background: none; }
.vmd-field-code { font-family: ui-monospace, monospace; font-size: 12px; }
.vmd-field-hint { font-size: 12px; color: var(--vmd-muted); }
.vmd-align-group { display: flex; gap: 4px; }
.vmd-padding-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
.vmd-social-row { padding: 8px; margin-bottom: 8px; border: 1px solid var(--vmd-border); border-radius: 6px; }
```

- [ ] **Step 5: Verificar**

```bash
pnpm --filter @vue-mail-designer/builder test && pnpm typecheck
```

Expected: PASS. Manual: seleccionar cada tipo de bloque y editar cada campo; verificar que el canvas refleja los cambios al instante.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: inspector de propiedades por tipo de bloque, fila y documento"
```

---

### Task 13: Toolbar y preview desktop/mobile

**Files:**
- Modify (reemplazar stub): `packages/email-builder/src/components/BuilderToolbar.vue`
- Create: `packages/email-builder/src/components/PreviewDialog.vue`
- Modify: `packages/email-builder/src/styles.css`
- Test: `packages/email-builder/tests/preview.test.ts`

**Interfaces:**
- Consumes: store (`undo`, `redo`, `canUndo`, `canRedo`, `exportJson`, `importJson`, `doc`), `useUiStore` (`previewOpen`, `previewDevice`, `galleryOpen`, `theme`, `toggleTheme`), `renderHtml`.
- Produces:
  - `BuilderToolbar.vue`: botones deshacer/rehacer (disabled según `canUndo/canRedo`), Preview (abre dialog), Plantillas (abre `galleryOpen`), Importar JSON (input file oculto → `importJson`, alert si error), Exportar JSON (descarga `.json`), Exportar HTML (descarga `.html` con `renderHtml`), toggle tema. Atajos ⌘Z / ⌘⇧Z vía listener global montado/desmontado en el toolbar.
  - `PreviewDialog.vue`: overlay modal; iframe con `srcdoc = renderHtml(store.doc)`; toggle desktop (600) / mobile (375) cambiando el ancho del iframe; botón copiar HTML (`navigator.clipboard`) y cerrar. Se muestra solo si `ui.previewOpen`.
  - Helper local `downloadFile(name: string, content: string, mime: string)` en el toolbar.

- [ ] **Step 1: Test que falla**

`packages/email-builder/tests/preview.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'

describe('toolbar y preview', () => {
  it('deshacer está deshabilitado sin historial y se habilita al mutar', async () => {
    const wrapper = mount(EmailBuilder)
    const undoBtn = wrapper.find('[data-action="undo"]')
    expect(undoBtn.attributes('disabled')).toBeDefined()
    await wrapper.find('.vmd-canvas-empty button').trigger('click')
    expect(wrapper.find('[data-action="undo"]').attributes('disabled')).toBeUndefined()
  })

  it('abrir preview monta el iframe con srcdoc', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('[data-action="preview"]').trigger('click')
    const iframe = wrapper.find('iframe.vmd-preview-frame')
    expect(iframe.exists()).toBe(true)
    expect(iframe.attributes('srcdoc')).toContain('<!doctype html>')
  })

  it('toggle mobile cambia el ancho del iframe', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('[data-action="preview"]').trigger('click')
    await wrapper.find('[data-device="mobile"]').trigger('click')
    const iframe = wrapper.find('iframe.vmd-preview-frame')
    expect(iframe.attributes('style')).toContain('375px')
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
pnpm --filter @vue-mail-designer/builder test tests/preview.test.ts
```

Expected: FAIL — el toolbar stub no tiene los botones.

- [ ] **Step 3: Implementar** `BuilderToolbar.vue`:

```vue
<template>
  <header class="vmd-toolbar">
    <div class="vmd-toolbar-group">
      <button class="vmd-btn" data-action="undo" :disabled="!store.canUndo" title="Deshacer (⌘Z)" @click="store.undo()">↶</button>
      <button class="vmd-btn" data-action="redo" :disabled="!store.canRedo" title="Rehacer (⌘⇧Z)" @click="store.redo()">↷</button>
    </div>
    <div class="vmd-toolbar-spacer" />
    <div class="vmd-toolbar-group">
      <button class="vmd-btn" data-action="templates" @click="ui.galleryOpen = true">Plantillas</button>
      <button class="vmd-btn" data-action="preview" @click="ui.previewOpen = true">Vista previa</button>
      <button class="vmd-btn" @click="importFile">Importar JSON</button>
      <button class="vmd-btn" @click="exportJson">Exportar JSON</button>
      <button class="vmd-btn vmd-btn--primary" @click="exportHtml">Exportar HTML</button>
      <button class="vmd-btn" :title="ui.theme === 'dark' ? 'Tema claro' : 'Tema oscuro'" @click="ui.toggleTheme()">
        {{ ui.theme === 'dark' ? '☀' : '☾' }}
      </button>
    </div>
    <input ref="fileInput" type="file" accept="application/json,.json" style="display: none" @change="onFile" />
    <PreviewDialog v-if="ui.previewOpen" />
  </header>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { renderHtml } from '../render/html'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'
import PreviewDialog from './PreviewDialog.vue'

const pinia = useBuilderPinia()
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)
const fileInput = ref<HTMLInputElement | null>(null)

function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function exportJson() {
  downloadFile('email-design.json', store.exportJson(), 'application/json')
}
function exportHtml() {
  downloadFile('email.html', renderHtml(store.doc), 'text/html')
}
function importFile() {
  fileInput.value?.click()
}
async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const text = await file.text()
  const result = store.importJson(text)
  if (!result.ok) window.alert(result.error)
  ;(e.target as HTMLInputElement).value = ''
}

function onKeydown(e: KeyboardEvent) {
  const meta = e.metaKey || e.ctrlKey
  if (meta && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    if (e.shiftKey) store.redo()
    else store.undo()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>
```

`PreviewDialog.vue`:

```vue
<template>
  <div class="vmd-modal" @click.self="ui.previewOpen = false">
    <div class="vmd-modal-box vmd-preview-box">
      <div class="vmd-preview-bar">
        <div class="vmd-toolbar-group">
          <button class="vmd-btn" :class="{ 'vmd-btn--primary': ui.previewDevice === 'desktop' }" data-device="desktop" @click="ui.previewDevice = 'desktop'">🖥 Escritorio</button>
          <button class="vmd-btn" :class="{ 'vmd-btn--primary': ui.previewDevice === 'mobile' }" data-device="mobile" @click="ui.previewDevice = 'mobile'">📱 Móvil</button>
        </div>
        <div class="vmd-toolbar-group">
          <button class="vmd-btn" @click="copyHtml">{{ copied ? '✓ Copiado' : 'Copiar HTML' }}</button>
          <button class="vmd-btn" @click="ui.previewOpen = false">Cerrar ✕</button>
        </div>
      </div>
      <div class="vmd-preview-stage">
        <iframe
          class="vmd-preview-frame"
          :srcdoc="html"
          :style="{ width: ui.previewDevice === 'mobile' ? '375px' : '600px' }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { renderHtml } from '../render/html'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'

const pinia = useBuilderPinia()
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)
const html = computed(() => renderHtml(store.doc))
const copied = ref(false)

async function copyHtml() {
  try {
    await navigator.clipboard.writeText(html.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    window.alert('No se pudo copiar al portapapeles.')
  }
}
</script>
```

Agregar a `styles.css`:

```css
.vmd-toolbar-group { display: flex; gap: 6px; }
.vmd-toolbar-spacer { flex: 1; }
.vmd-modal { position: fixed; inset: 0; z-index: 1000; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.5); }
.vmd-modal-box { background: var(--vmd-panel); border-radius: 10px; box-shadow: 0 10px 40px rgba(0,0,0,.3); overflow: hidden; }
.vmd-preview-box { width: 90vw; max-width: 900px; height: 88vh; display: flex; flex-direction: column; }
.vmd-preview-bar { display: flex; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid var(--vmd-border); }
.vmd-preview-stage { flex: 1; overflow: auto; display: flex; justify-content: center; padding: 20px; background: #e4e4e7; }
.vmd-preview-frame { height: 100%; border: 0; background: #fff; box-shadow: 0 1px 6px rgba(0,0,0,.15); transition: width .2s; }
```

- [ ] **Step 4: Verificar**

```bash
pnpm --filter @vue-mail-designer/builder test && pnpm typecheck
```

Expected: PASS. Manual: construir un email, abrir preview, alternar desktop/móvil, copiar HTML, exportar HTML y abrir el archivo en el browser para confirmar que renderiza.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: toolbar con undo/redo, import/export y preview desktop/móvil"
```

---

### Task 14: Plantillas y galería

**Files:**
- Create: `packages/email-builder/src/templates/index.ts`, `packages/email-builder/src/templates/newsletter.ts`, `promo.ts`, `transactional.ts`, `welcome.ts`, `packages/email-builder/src/components/TemplateGallery.vue`
- Modify: `packages/email-builder/src/options.ts` (agregar `templates`), `packages/email-builder/src/components/EmailBuilder.vue` (prop `templates`, montar galería), `packages/email-builder/src/styles.css`, `packages/email-builder/src/index.ts`
- Test: `packages/email-builder/tests/templates.test.ts`

**Interfaces:**
- Consumes: `createDocument`, `createRow`, `createBlock`, `zEmailDocument`, `loadDesign`.
- Produces:
  - `type EmailTemplate = { id: string; name: string; thumbnail?: string; build: () => EmailDocument }`.
  - `BUILTIN_TEMPLATES: EmailTemplate[]` (vacío + newsletter + promo + transactional + welcome). Cada `build()` produce un `EmailDocument` que pasa `zEmailDocument.safeParse`.
  - `BuilderOptions.templates?: EmailTemplate[]` (extras del integrador; se concatenan a los built-in).
  - `TemplateGallery.vue`: grid de tarjetas; click → `store.loadDesign(tpl.build())` y cierra `galleryOpen`. Visible solo si `ui.galleryOpen`.

- [ ] **Step 1: Test que falla**

`packages/email-builder/tests/templates.test.ts`:

```ts
import { describe, expect, it } from 'vitest'
import { BUILTIN_TEMPLATES } from '../src/templates'
import { zEmailDocument } from '../src/schema'

describe('plantillas', () => {
  it('incluye al menos vacío + 4 diseños', () => {
    expect(BUILTIN_TEMPLATES.length).toBeGreaterThanOrEqual(5)
    expect(BUILTIN_TEMPLATES.some((t) => t.id === 'blank')).toBe(true)
  })

  it('cada plantilla construye un documento válido', () => {
    for (const tpl of BUILTIN_TEMPLATES) {
      const doc = tpl.build()
      const result = zEmailDocument.safeParse(doc)
      expect(result.success, `plantilla ${tpl.id} inválida`).toBe(true)
    }
  })

  it('las plantillas con contenido generan ids únicos en cada build', () => {
    const nl = BUILTIN_TEMPLATES.find((t) => t.id === 'newsletter')!
    const a = nl.build()
    const b = nl.build()
    const idsA = a.rows.flatMap((r) => [r.id, ...r.columns.map((c) => c.id)])
    const idsB = b.rows.flatMap((r) => [r.id, ...r.columns.map((c) => c.id)])
    expect(idsA[0]).not.toBe(idsB[0])
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
pnpm --filter @vue-mail-designer/builder test tests/templates.test.ts
```

Expected: FAIL — no existe `../src/templates`.

- [ ] **Step 3: Implementar**

`packages/email-builder/src/templates/newsletter.ts` (patrón para las 4; las otras varían contenido):

```ts
import { createBlock, createDocument, createRow } from '../schema'
import type { EmailDocument } from '../schema'

export function buildNewsletter(): EmailDocument {
  const doc = createDocument()

  const header = createRow([100])
  const logo = createBlock('heading')
  if (logo.type === 'heading') {
    logo.text = 'Mi Empresa'
    logo.style.align = 'center'
  }
  header.columns[0].blocks.push(logo)

  const hero = createRow([100])
  hero.style.backgroundColor = '#ffffff'
  const title = createBlock('heading')
  if (title.type === 'heading') {
    title.text = 'Novedades de este mes'
    title.level = 2
  }
  const body = createBlock('text')
  if (body.type === 'text') {
    body.html = '<p>Hola, estas son las noticias más importantes de este mes. Gracias por acompañarnos.</p>'
  }
  const cta = createBlock('button')
  if (cta.type === 'button') cta.label = 'Leer más'
  hero.columns[0].blocks.push(title, body, cta)

  const footer = createRow([100])
  footer.style.backgroundColor = '#f4f4f5'
  const social = createBlock('social')
  const legal = createBlock('text')
  if (legal.type === 'text') {
    legal.html = '<p style="text-align:center;font-size:12px;color:#9ca3af">© 2026 Mi Empresa · <span data-mt="unsubscribe_url">Cancelar suscripción</span></p>'
    legal.style.fontSize = 12
  }
  footer.columns[0].blocks.push(social, legal)

  doc.rows.push(header, hero, footer)
  return doc
}
```

`promo.ts`, `transactional.ts`, `welcome.ts`: seguir el mismo patrón con contenido distinto (promo: heading grande + imagen + botón con descuento; transactional: heading "Confirmación de pedido" + text con datos + divider + text total; welcome: heading "¡Bienvenido!" + text + button "Empezar"). Cada uno exporta `buildPromo`, `buildTransactional`, `buildWelcome` con la misma firma `(): EmailDocument`.

`packages/email-builder/src/templates/index.ts`:

```ts
import { createDocument } from '../schema'
import type { EmailDocument } from '../schema'
import { buildNewsletter } from './newsletter'
import { buildPromo } from './promo'
import { buildTransactional } from './transactional'
import { buildWelcome } from './welcome'

export type EmailTemplate = {
  id: string
  name: string
  thumbnail?: string
  build: () => EmailDocument
}

export const BUILTIN_TEMPLATES: EmailTemplate[] = [
  { id: 'blank', name: 'En blanco', build: () => createDocument() },
  { id: 'newsletter', name: 'Newsletter', build: buildNewsletter },
  { id: 'promo', name: 'Promoción', build: buildPromo },
  { id: 'transactional', name: 'Transaccional', build: buildTransactional },
  { id: 'welcome', name: 'Bienvenida', build: buildWelcome },
]
```

Agregar a `options.ts`:

```ts
import type { EmailTemplate } from './templates'
// ...dentro de BuilderOptions:
//   templates?: EmailTemplate[]
```

`BuilderOptions` queda:

```ts
export type BuilderOptions = {
  mergeTags: MergeTagDef[]
  uploadImage?: (file: File) => Promise<string>
  templates?: EmailTemplate[]
}
```

`TemplateGallery.vue`:

```vue
<template>
  <div class="vmd-modal" @click.self="ui.galleryOpen = false">
    <div class="vmd-modal-box vmd-gallery-box">
      <div class="vmd-preview-bar">
        <h3 class="vmd-inspector-title" style="margin: 0">Elegir plantilla</h3>
        <button class="vmd-btn" @click="ui.galleryOpen = false">Cerrar ✕</button>
      </div>
      <div class="vmd-gallery-grid">
        <button v-for="tpl in templates" :key="tpl.id" class="vmd-gallery-card" @click="pick(tpl)">
          <img v-if="tpl.thumbnail" :src="tpl.thumbnail" :alt="tpl.name" />
          <div v-else class="vmd-gallery-thumb">{{ tpl.name.charAt(0) }}</div>
          <span>{{ tpl.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderOptions } from '../options'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'
import { BUILTIN_TEMPLATES, type EmailTemplate } from '../templates'

const pinia = useBuilderPinia()
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)
const options = useBuilderOptions()
const templates = computed(() => [...BUILTIN_TEMPLATES, ...(options.templates ?? [])])

function pick(tpl: EmailTemplate) {
  store.loadDesign(tpl.build())
  store.select(null)
  ui.galleryOpen = false
}
</script>
```

Montar la galería en `EmailBuilder.vue` (dentro del `.vmd-root`, después de `.vmd-body`):

```vue
    <TemplateGallery v-if="ui.galleryOpen" />
```

con `import TemplateGallery from './TemplateGallery.vue'` y agregar la prop `templates?: EmailTemplate[]` al `defineProps`, incluyéndola en el objeto provisto por `BUILDER_OPTIONS_KEY`.

Agregar a `styles.css`:

```css
.vmd-gallery-box { width: 90vw; max-width: 800px; max-height: 88vh; display: flex; flex-direction: column; }
.vmd-gallery-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; padding: 16px; overflow: auto; }
.vmd-gallery-card { display: flex; flex-direction: column; gap: 8px; padding: 10px; border: 1px solid var(--vmd-border); border-radius: 8px; background: var(--vmd-bg); color: var(--vmd-fg); cursor: pointer; }
.vmd-gallery-card:hover { border-color: var(--vmd-accent); }
.vmd-gallery-card img, .vmd-gallery-thumb { width: 100%; height: 100px; border-radius: 6px; object-fit: cover; }
.vmd-gallery-thumb { display: flex; align-items: center; justify-content: center; font-size: 32px; background: var(--vmd-panel); color: var(--vmd-muted); }
```

Exportar desde `src/index.ts`:

```ts
export { BUILTIN_TEMPLATES, type EmailTemplate } from './templates'
```

- [ ] **Step 4: Verificar**

```bash
pnpm --filter @vue-mail-designer/builder test && pnpm typecheck
```

Expected: PASS. Manual: abrir Plantillas, elegir Newsletter, verificar que el canvas se llena.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: plantillas built-in y galería de selección"
```

---

### Task 15: API pública — v-model, eventos y expose

**Files:**
- Modify: `packages/email-builder/src/components/EmailBuilder.vue`
- Modify: `apps/demo/src/App.vue` (demo completa con persistencia localStorage, merge tags, uploadImage)
- Test: `packages/email-builder/tests/public-api.test.ts`

**Interfaces:**
- Consumes: todo lo anterior.
- Produces (contrato público final de `<EmailBuilder>`):
  - Props: `design?: EmailDocument` (v-model), `mergeTags?: MergeTagDef[]`, `templates?: EmailTemplate[]`, `uploadImage?: (file: File) => Promise<string>`, `theme?: 'light' | 'dark'`.
  - Emits: `update:design [EmailDocument]` (en cada cambio del doc), `change [EmailDocument]`, `export-html [string]`.
  - Expose: `exportHtml(): string`, `exportJson(): string`, `loadDesign(doc: EmailDocument): void`, `getDesign(): EmailDocument`.
  - Sincronización: al montar, si viene `design` lo carga; watch de `store.doc` (deep) emite `update:design` y `change`; watch de la prop `design` la aplica si difiere del doc actual (evitar loop comparando JSON). `theme` prop inicializa `ui.theme`.

- [ ] **Step 1: Test que falla**

`packages/email-builder/tests/public-api.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import { createDocument, createRow } from '../src/schema'

describe('API pública de EmailBuilder', () => {
  it('carga la prop design al montar', () => {
    const design = createDocument()
    design.rows.push(createRow([100]))
    const wrapper = mount(EmailBuilder, { props: { design } })
    expect(wrapper.find('.vmd-row').exists()).toBe(true)
  })

  it('emite update:design y change al mutar', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('.vmd-canvas-empty button').trigger('click')
    await wrapper.vm.$nextTick()
    expect(wrapper.emitted('update:design')).toBeTruthy()
    expect(wrapper.emitted('change')).toBeTruthy()
  })

  it('expone exportHtml/exportJson/loadDesign/getDesign', () => {
    const wrapper = mount(EmailBuilder)
    const vm = wrapper.vm as unknown as {
      exportHtml: () => string
      exportJson: () => string
      getDesign: () => unknown
      loadDesign: (d: unknown) => void
    }
    expect(typeof vm.exportHtml).toBe('function')
    expect(vm.exportHtml()).toContain('<!doctype html>')
    expect(vm.exportJson()).toContain('"version"')
    const d = createDocument()
    d.rows.push(createRow([50, 50]))
    vm.loadDesign(d)
    expect(wrapper.find('.vmd-row').exists()).toBe(true)
  })

  it('aplica el theme de la prop', () => {
    const wrapper = mount(EmailBuilder, { props: { theme: 'dark' } })
    expect(wrapper.find('.vmd-root.vmd-dark').exists()).toBe(true)
  })
})
```

- [ ] **Step 2: Correr y verificar que falla**

```bash
pnpm --filter @vue-mail-designer/builder test tests/public-api.test.ts
```

Expected: FAIL — expose/emits aún no existen.

- [ ] **Step 3: Implementar** — `EmailBuilder.vue` completo (reemplaza el `<script setup>` acumulado):

```vue
<template>
  <div class="vmd-root" :class="{ 'vmd-dark': ui.theme === 'dark' }">
    <BuilderToolbar />
    <div class="vmd-body">
      <BlockPalette />
      <BuilderCanvas />
      <InspectorPanel />
    </div>
    <TemplateGallery v-if="ui.galleryOpen" />
  </div>
</template>

<script setup lang="ts">
import { createPinia } from 'pinia'
import { onMounted, provide, reactive, watch } from 'vue'
import { BUILDER_OPTIONS_KEY, type MergeTagDef } from '../options'
import { renderHtml } from '../render/html'
import type { EmailDocument } from '../schema'
import { useDocumentStore } from '../store/document'
import { BUILDER_PINIA_KEY } from '../store/keys'
import { useUiStore } from '../store/ui'
import type { EmailTemplate } from '../templates'
import BlockPalette from './BlockPalette.vue'
import BuilderCanvas from './BuilderCanvas.vue'
import BuilderToolbar from './BuilderToolbar.vue'
import InspectorPanel from './InspectorPanel.vue'
import TemplateGallery from './TemplateGallery.vue'
import '../styles.css'

const props = defineProps<{
  design?: EmailDocument
  mergeTags?: MergeTagDef[]
  templates?: EmailTemplate[]
  uploadImage?: (file: File) => Promise<string>
  theme?: 'light' | 'dark'
}>()

const emit = defineEmits<{
  'update:design': [design: EmailDocument]
  change: [design: EmailDocument]
  'export-html': [html: string]
}>()

const pinia = createPinia()
provide(BUILDER_PINIA_KEY, pinia)
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)

// opciones reactivas para los hijos (getters mantienen la reactividad de props)
provide(
  BUILDER_OPTIONS_KEY,
  reactive({
    get mergeTags() {
      return props.mergeTags ?? []
    },
    get uploadImage() {
      return props.uploadImage
    },
    get templates() {
      return props.templates
    },
  }),
)

if (props.theme) ui.theme = props.theme
watch(
  () => props.theme,
  (t) => {
    if (t) ui.theme = t
  },
)

onMounted(() => {
  if (props.design) store.loadDesign(props.design)
})

// prop → store
watch(
  () => props.design,
  (next) => {
    if (next && JSON.stringify(next) !== JSON.stringify(store.doc)) {
      store.loadDesign(next)
    }
  },
)

// store → emits
watch(
  () => store.doc,
  (doc) => {
    const snapshot = JSON.parse(JSON.stringify(doc)) as EmailDocument
    emit('update:design', snapshot)
    emit('change', snapshot)
  },
  { deep: true },
)

function exportHtml(): string {
  const html = renderHtml(store.doc)
  emit('export-html', html)
  return html
}
function exportJson(): string {
  return store.exportJson()
}
function getDesign(): EmailDocument {
  return JSON.parse(JSON.stringify(store.doc)) as EmailDocument
}
function loadDesign(doc: EmailDocument): void {
  store.loadDesign(doc)
}

defineExpose({ exportHtml, exportJson, getDesign, loadDesign })
</script>
```

`apps/demo/src/App.vue` (demo completa):

```vue
<template>
  <EmailBuilder
    v-model:design="design"
    :merge-tags="mergeTags"
    :upload-image="uploadImage"
    style="height: 100vh"
    @export-html="onExportHtml"
  />
</template>

<script setup lang="ts">
import { EmailBuilder, type EmailDocument, type MergeTagDef } from '@vue-mail-designer/builder'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'vmd-demo-design'
const saved = localStorage.getItem(STORAGE_KEY)
const design = ref<EmailDocument | undefined>(saved ? (JSON.parse(saved) as EmailDocument) : undefined)

watch(design, (d) => {
  if (d) localStorage.setItem(STORAGE_KEY, JSON.stringify(d))
})

const mergeTags: MergeTagDef[] = [
  { name: 'Nombre', value: 'first_name' },
  { name: 'Apellido', value: 'last_name' },
  { name: 'Email', value: 'email' },
  { name: 'Cancelar suscripción', value: 'unsubscribe_url' },
]

// demo: convierte el archivo a data URL (un backend real subiría a un CDN)
async function uploadImage(file: File): Promise<string> {
  return await new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

function onExportHtml(html: string) {
  console.log('HTML exportado:', html.length, 'caracteres')
}
</script>

<style>
html, body, #app { height: 100%; margin: 0; }
</style>
```

- [ ] **Step 4: Verificar**

```bash
pnpm --filter @vue-mail-designer/builder test && pnpm typecheck
```

Expected: PASS todos los tests. Manual en demo: construir, recargar la página y confirmar que el diseño persiste; subir una imagen y ver la URL en el bloque.

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: API pública con v-model:design, eventos y métodos expuestos"
```

---

### Task 16: Build de librería, verificación de tipos y README

**Files:**
- Create: `packages/email-builder/README.md`, `packages/email-builder/src/vite-env.d.ts` (si falta el shim de `.vue`)
- Modify: `README.md` (raíz)
- Test: build real + smoke import

**Interfaces:**
- Consumes: todo. Cierra el proyecto verificando que la librería empaqueta con tipos.

- [ ] **Step 1: Shim de tipos `.vue`** (si `vue-tsc` no lo resuelve ya) — `packages/email-builder/src/vite-env.d.ts`:

```ts
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
```

- [ ] **Step 2: Build de la librería**

```bash
pnpm --filter @vue-mail-designer/builder build
```

Expected: genera `dist/index.js`, `dist/index.d.ts` y `dist/vue-mail-designer.css` sin errores. Si `vite-plugin-dts` con `rollupTypes: true` falla por algún tipo re-exportado, quitar `rollupTypes: true` (deja múltiples `.d.ts`, igual válido) y volver a correr.

- [ ] **Step 3: Smoke test del build** — verificar que el entry exporta lo esperado:

```bash
node -e "import('./packages/email-builder/dist/index.js').then(m => { const req = ['EmailBuilder','renderHtml','createDocument','useDocumentStore','BUILTIN_TEMPLATES']; const missing = req.filter(k => !(k in m)); if (missing.length) { console.error('FALTAN:', missing); process.exit(1); } console.log('exports OK'); })"
```

Expected: `exports OK`.

- [ ] **Step 4: Build de la demo**

```bash
pnpm --filter demo build
```

Expected: build de la demo sin errores (valida que la librería se consume correctamente vía alias).

- [ ] **Step 5: README de la librería** — `packages/email-builder/README.md`:

````markdown
# @vue-mail-designer/builder

Email builder visual drag & drop para Vue 3, estilo Unlayer. Genera HTML compatible con clientes de correo y JSON de diseño reeditable.

## Instalación

```bash
pnpm add @vue-mail-designer/builder vue pinia
```

## Uso básico

```vue
<template>
  <EmailBuilder
    v-model:design="design"
    :merge-tags="mergeTags"
    :upload-image="uploadImage"
    @export-html="onHtml"
  />
</template>

<script setup lang="ts">
import { EmailBuilder, type EmailDocument, type MergeTagDef } from '@vue-mail-designer/builder'
import '@vue-mail-designer/builder/style.css'
import { ref } from 'vue'

const design = ref<EmailDocument>()
const mergeTags: MergeTagDef[] = [{ name: 'Nombre', value: 'first_name' }]

async function uploadImage(file: File): Promise<string> {
  // subí el archivo a tu CDN y devolvé la URL
  return 'https://cdn.tu-dominio.com/...'
}

function onHtml(html: string) {
  // guardá o enviá el HTML
}
</script>
```

## Props

| Prop | Tipo | Descripción |
|------|------|-------------|
| `design` | `EmailDocument` | Diseño (v-model). |
| `mergeTags` | `MergeTagDef[]` | Variables insertables en texto (`{ name, value }`). |
| `templates` | `EmailTemplate[]` | Plantillas extra además de las incluidas. |
| `uploadImage` | `(file: File) => Promise<string>` | Handler de subida; devuelve la URL final. |
| `theme` | `'light' \| 'dark'` | Tema de la UI del builder. |

## Eventos

- `update:design` — en cada cambio del diseño.
- `change` — igual que arriba, sin v-model.
- `export-html` — al llamar `exportHtml()`; entrega el HTML.

## Métodos (via ref)

- `exportHtml(): string`
- `exportJson(): string`
- `getDesign(): EmailDocument`
- `loadDesign(doc: EmailDocument): void`

## Compatibilidad de email

El HTML usa tablas con estilos inline, ghost tables para Outlook y una media query para apilar columnas en móvil. Evita flex/grid/position.

## Limitaciones (v1)

- No importa HTML existente (solo JSON).
- Estilos iguales en desktop y móvil (salvo el apilado de columnas).
- Los merge tags se emiten como `{{value}}`; el motor de tu plataforma los reemplaza.
````

Actualizar el `README.md` de la raíz con: qué es el proyecto, comandos (`pnpm dev`, `pnpm build`, `pnpm test`, `pnpm typecheck`), y link al README de la librería.

- [ ] **Step 6: Verificación final completa**

```bash
pnpm typecheck && pnpm test
```

Expected: typecheck limpio en ambos paquetes y todos los tests verdes.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "chore: build de librería en modo lib con .d.ts + README y docs"
```

---

## Self-Review (completado por el autor del plan)

**Cobertura del spec:**
- Reescritura desde cero → Task 1. ✅
- Salidas JSON + HTML → Tasks 4 (JSON), 5-7 (HTML), 13 (export). ✅
- Generador propio de HTML (no vue-email) → Tasks 5-7. ✅
- Librería embebible + demo → Tasks 8, 15, 16. ✅
- Stack (Vue 3.5, Vite 7, Pinia 3, Tiptap, vuedraggable, Zod, Vitest) → Task 1 + uso a lo largo. ✅
- Modelo de documento con los 10 bloques → Task 2. ✅
- Store con mutaciones/selección/undo-redo → Tasks 3-4. ✅
- DnD paleta→canvas y reordenar 3 niveles → Task 9. ✅
- Preview desktop/mobile con HTML real en iframe → Task 13. ✅
- Merge tags configurables → Task 11. ✅
- Templates built-in + integrador → Task 14. ✅
- Tema claro/oscuro solo UI → Tasks 8, 9 (nota canvas), 15. ✅
- Import/export JSON validado con Zod → Task 4, 13. ✅
- upload-image asíncrono → Tasks 11 (tipo), 12 (UI), 15 (demo). ✅
- API pública (v-model, eventos, expose) → Task 15. ✅
- Testing: snapshots HTML + unit store + smoke component → Tasks 5-7, 3-4, 8, 15. ✅
- Fuera de alcance (import HTML, per-device, etc.) → no hay tareas, correcto. ✅

**Placeholders:** las plantillas promo/transactional/welcome (Task 14 Step 3) describen contenido sin código completo — es intencional: siguen exactamente el patrón mostrado de `buildNewsletter` cambiando strings; el test valida cada una con Zod. Aceptable como variación de un patrón ya dado por completo.

**Consistencia de tipos:** `EmailDocument`, `Block`, `Padding`, `Align`, `MergeTagDef`, `EmailTemplate`, `BuilderOptions`, `Selection` usados consistentemente. Nombres de acciones del store (`loadDesign`, `replaceRows`, `replaceColumnBlocks`, `updateBlock`, `exportJson`, `importJson`) idénticos entre definición (Tasks 3-4) y consumo (Tasks 9, 13, 15). Convención merge tag (`data-mt` → `{{value}}`) consistente entre renderer (Task 5), extensión Tiptap (Task 11) y plantillas (Task 14).

**Riesgo señalado:** la reactividad de `provide` de opciones (Task 11 nota) se resuelve definitivamente en Task 15 con `reactive` + getters.
