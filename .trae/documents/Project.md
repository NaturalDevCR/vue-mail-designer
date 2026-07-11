# Prompt Extendido — Email Builder DnD con Vue 3 + Vuemail

**Rol del agente:** Arquitecto + Implementador full‑stack frontend. **No improvises**: sigue los pasos y criterios exactamente. Si algo no es 100% claro en la doc de Vuemail, implementa el wrapper y abstrae los puntos inciertos tras una interfaz estable (dejando TODOs bien localizados).

## Objetivo
Crear un **Email Builder visual** con **drag & drop** estilo Unlayer, que:
- Genere un **JSON jerárquico** en tiempo real (modelo de documento) que represente el email (rows → columns → blocks).
- **Exporte** a **HTML válido y robusto para clientes de correo** (Outlook desktop, Gmail, Apple Mail, Yahoo) usando **Vuemail**.
- Permita **anidar** (columns dentro de rows y blocks dentro de columns).
- Permita **reordenar** elementos en el lienzo arrastrando.
- Ofrezca **edición de propiedades** (texto, imágenes, botones, estilos).
- Tenga **tema claro/oscuro**, diseño sobrio y profesional.
- Sea **reutilizable** como **componente/librería** en cualquier proyecto Vue 3.
- Diseño del builder moderno, con paneles de control y herramientas de edición.
- WYSIWYG (What You See Is What You Get) para edición visual de texto (el mejor que encuentres con más funciones)
- Soporte para **todos los bloques** de Vuemail (text, image, button, etc.).
- Soporte para **estilos** (fuentes, colores, márgenes, padding, etc.).
- Soporte para **anidamiento** (columns dentro de rows y blocks dentro de columns).
- Soporte para **reordenamiento** (arrastrar y soltar).
- Soporte para **edición de propiedades** (texto, imágenes, botones, estilos).
- Soporte para **importación de JSON** para editar emails existentes.
- Soporte para **exportación de JSON** para guardar emails.
- Soporte para **exportación de HTML** para compartir emails.
- Soporte para **importación de HTML** para editar emails existentes.
- Soporte para eventos para que el usuario pueda subir su imagen donde quiera y luego pegar la URL de la imagen automáticamente luego de la subida al property de la URL de la imagen de forma asincrona.
- Diseño de elementos draggeables moderno y profesional para que el usuario pueda arrastrar y soltar los elementos en el lienzo.
- El Dark theme no cambia el lienzo o canvas, solo la interfaz al rededor.

## Stack y convenciones (obligatorio)
- **Vue 3** + **\<script setup\>**, **TypeScript** estricto.
- **Pinia** con `pinia-plugin-persistedstate` para persistencia selectiva.
- **Vuemail** (https://deepwiki.com/vue-email/vue-email y https://deepwiki.com/vue-email/docs) para los elementos y la exportación a HTML.
- **Drag & Drop** con **vuedraggable@next** (SortableJS) para listas y reordenamiento.
- **Vite** como bundler (modo app + library mode para empaquetado).
- **ESLint** + **Prettier** + reglas estrictas TS.
- Pruebas con **Vitest** + **@vue/test-utils**.
- **ESNext**/ES2022 como target donde aplique.

## Entregables
1. **Monorepo mínimo** (o repo simple) con:
   - `packages/email-builder` (librería reutilizable)
   - `apps/demo` (app de demo que consume la librería)
2. **Librería** empaquetada (Vite library mode) con tipos `.d.ts`.
3. **Demo** funcional: paleta de bloques, lienzo DnD, inspector de propiedades, exportar HTML/JSON, importar JSON.
4. **Documentación** corta (README + guía rápida de uso e integración).

## Estructura de carpetas (propón y crea los archivos)
```
.
├─ packages/
│  └─ email-builder/
│     ├─ src/
│     │  ├─ index.ts
│     │  ├─ components/
│     │  │  ├─ EmailBuilder.vue
│     │  │  ├─ Canvas.vue
│     │  │  ├─ Palette.vue
│     │  │  ├─ Inspector.vue
│     │  │  ├─ Toolbar.vue
│     │  │  ├─ nodes/
│     │  │  │  ├─ RowNode.vue
│     │  │  │  ├─ ColumnNode.vue
│     │  │  │  ├─ TextBlock.vue
│     │  │  │  ├─ ButtonBlock.vue
│     │  │  │  ├─ ImageBlock.vue
│     │  │  │  └─ DividerBlock.vue
│     │  ├─ stores/
│     │  │  ├─ useDocumentStore.ts
│     │  │  └─ useUiStore.ts
│     │  ├─ dnd/
│     │  │  └─ sortable.ts
│     │  ├─ schema/
│     │  │  ├─ document.ts
│     │  │  └─ validators.ts
│     │  ├─ exporters/
│     │  │  ├─ toVuemail.ts
│     │  │  └─ toHtml.ts
│     │  ├─ theming/
│     │  │  └─ theme.css
│     │  ├─ styles/
│     │  │  └─ builder.css
│     │  └─ utils/
│     │     ├─ ids.ts
│     │     └─ deep.ts
│     ├─ vite.config.ts
│     ├─ tsconfig.json
│     ├─ package.json
│     ├─ .eslintrc.cjs
│     └─ README.md
└─ apps/
   └─ demo/
      ├─ src/
      │  ├─ main.ts
      │  ├─ App.vue
      │  └─ pages/Playground.vue
      ├─ index.html
      ├─ vite.config.ts
      ├─ tsconfig.json
      └─ package.json
```

## JSON del documento (especificación)
- **Tipos**:
  - `EmailDocument { id, meta, rows: Row[] }`
  - `Row { id, columns: Column[], style? }`
  - `Column { id, width?: number, blocks: Block[], style? }`
  - `Block` (discriminante `type`):
    - `text` { html | plaintext, style }
    - `image` { src, alt, href?, width?, height?, style }
    - `button` { label, href, target?, style }
    - `divider` { style }
- **Reglas**:
  - Solo `Row` en raíz; `Column` dentro de `Row`; `Block` dentro de `Column`.
  - Validar width de columns suma ≤ 12 (grid de 12) o porcentual ≤ 100%.
  - IDs únicos (usa util `createId()`).
- **Persistencia**: `document` y `ui.preferences` via `pinia-plugin-persistedstate`.

## Funcionalidad requerida (implementa TODO)
1. **Paleta**: lista de bloques (Row, Column, Text, Image, Button, Divider) con drag hacia el lienzo.
2. **Lienzo**:
   - Drop zones claras (resaltar al arrastrar).
   - Reordenar rows, columns dentro de row, blocks dentro de column (vuedraggable).
   - Controles inline (+ añadir, 🗑 eliminar, ⤴ duplicar).
3. **Inspector**:
   - Propiedades del elemento seleccionado (según tipo).
   - Edición de texto rich (contenteditable simple o textarea con parse a HTML seguro).
   - Selectores de padding, align, font-size, color, background, border, etc.
4. **Toolbar**:
   - Deshacer/Rehacer (historial simple en store).
   - Importar JSON (validar schema).
   - Exportar JSON (descarga .json).
   - Exportar HTML (usa Vuemail vía `exporters/toVuemail.ts` + `toHtml.ts`).
   - Toggle tema claro/oscuro.
5. **Theming**:
   - CSS variables para colores tipográficos, bordes y fondos.
   - Clase raíz `theme--dark`/`theme--light`.
6. **Accesibilidad**:
   - Focus states visibles, roles ARIA en botones del builder, `alt` obligatorio en imágenes.
7. **Rendimiento**:
   - Render atómico por nodo (keyed), evitar reactividad excesiva (shallowReactive donde convenga).
8. **Compatibilidad email**:
   - Estilos inline en exportación; evitar CSS avanzados no soportados; layout basado en tablas si así lo requiere Vuemail.

## Integración con Vuemail
- Implementa un **adaptador** `exporters/toVuemail.ts` que transforme el JSON al formato que Vuemail espera.
- `exporters/toHtml.ts` consumirá Vuemail para emitir el HTML final.
- Maneja **fallbacks** si alguna propiedad no es soportada, y deja TODOs claros.

## Stores (Pinia)
- `useDocumentStore`:
  - state: `document`, `selection`, `history`
  - actions: `addRow`, `addColumn(rowId)`, `addBlock(columnId,type)`, `move{Row|Column|Block}`, `duplicate*`, `remove*`, `select(nodeRef)`, `undo`, `redo`, `importDocument(json)`, `exportJson()`, `exportHtml()`
- `useUiStore`:
  - state: `theme`, `rightPanelTab`, `showGrid`, `persistKeys`
  - actions: `toggleTheme()`

## DnD
- Usa **vuedraggable@next** con listas por nivel:
  - `rows` (Canvas)
  - `columns` (RowNode)
  - `blocks` (ColumnNode)
- Configura `group` para permitir mover entre contenedores válidos.
- Custom ghost y chosen classes. Snap visual en zonas válidas.

## Scripts y configuración
- `packages/email-builder/package.json`:
  - `"build": "vite build"`, `"dev": "vite"`, `"typecheck": "tsc -p tsconfig.json --noEmit"`, `"lint": "eslint 'src/**/*.{ts,vue}'"`, `"test": "vitest run"`
- **Vite (library mode)** exporta `EmailBuilder.vue` y `index.ts`.
- **apps/demo** depende de `email-builder` por `workspace:*`.

## Tests mínimos (Vitest)
- Crear doc vacío → añadir row/column/block y verificar árbol.
- DnD simulado: mover block entre columnas.
- Exportar HTML: no errores y contiene elementos esperados.
- Persistencia: recarga estado desde localStorage (mock).

## Criterios de aceptación (no negocibles)
- El **demo** permite **construir** un email con filas/columnas/bloques, **reordenar** todo, **editar** propiedades, **exportar HTML y JSON**, **importar JSON**, **cambiar tema**.
- El HTML exportado **no** incluye CSS moderno roto en Outlook; estilos relevantes **inline**.
- La librería **compila** y **expone tipos**. Instalación en otro proyecto funciona sin hacks.
- ESLint/Typecheck **limpios**. Tests mínimos **verdes**.

## Plan de trabajo del agente (ejecuta en este orden)
1. **Inicializa repo** (pnpm preferible) y workspaces `packages/email-builder` y `apps/demo`.
2. Configura **Vite**, **TS**, **ESLint**, **Prettier**, **Pinia** y `pinia-plugin-persistedstate`.
3. Implementa **schema**, **stores**, **utils** (IDs, deep clone).
4. Implementa **components** base (Palette, Canvas, Inspector, Toolbar).
5. Integra **vuedraggable** en los tres niveles (rows/columns/blocks).
6. Implementa **theming** con variables CSS y toggle.
7. Implementa **exporters** (`toVuemail` → `toHtml`) y botón **Export HTML**.
8. Implementa **import/export JSON** y **historial undo/redo** simple (stack).
9. **Demo app** en `apps/demo` consumiendo la librería.
10. Agrega **tests** y ajusta hasta pasar.
11. Escribe **README** de la librería y guía de integración.

## Esqueletos de archivos (créalos con contenido real, sin placeholders)

**packages/email-builder/src/index.ts**
```ts
export { default as EmailBuilder } from './components/EmailBuilder.vue';
export * from './schema/document';
```

**packages/email-builder/src/schema/document.ts**
```ts
export type BlockType = 'text' | 'image' | 'button' | 'divider';

export interface TextBlock { id: string; type: 'text'; html?: string; plaintext?: string; style?: Record<string,string|number>; }
export interface ImageBlock { id: string; type: 'image'; src: string; alt: string; href?: string; width?: number; height?: number; style?: Record<string,string|number>; }
export interface ButtonBlock { id: string; type: 'button'; label: string; href?: string; target?: '_blank'|'_self'; style?: Record<string,string|number>; }
export interface DividerBlock { id: string; type: 'divider'; style?: Record<string,string|number>; }

export type Block = TextBlock | ImageBlock | ButtonBlock | DividerBlock;

export interface Column { id: string; width?: number; style?: Record<string,string|number>; blocks: Block[]; }
export interface Row { id: string; style?: Record<string,string|number>; columns: Column[]; }
export interface EmailDocument { id: string; meta?: { name?: string; createdAt?: string; updatedAt?: string }; rows: Row[]; }
```

**packages/email-builder/src/stores/useDocumentStore.ts**
```ts
import { defineStore } from 'pinia';
import { reactive } from 'vue';
import type { EmailDocument, Row, Column, Block, BlockType } from '../schema/document';
import { createId, deepClone } from '../utils/ids';

export const useDocumentStore = defineStore('document', () => {
  const document = reactive<EmailDocument>({ id: createId('doc'), rows: [] });
  const selection = reactive<{ nodeType?: 'row'|'column'|'block'; id?: string }>({});
  const history = reactive<{ past: EmailDocument[]; future: EmailDocument[] }>({ past: [], future: [] });

  function commit() { history.past.push(deepClone(document)); history.future = []; }
  function undo() { const prev = history.past.pop(); if (!prev) return; history.future.push(deepClone(document)); Object.assign(document, prev); }
  function redo() { const next = history.future.pop(); if (!next) return; history.past.push(deepClone(document)); Object.assign(document, next); }

  // Implementar: addRow, addColumn, addBlock, move*, duplicate*, remove*, select, importDocument, exportJson, exportHtml
  // Cada mutación debe llamar a commit() al final.
  return { document, selection, history, undo, redo /* + acciones */ };
}, { persist: { paths: ['document'] } });
```

**packages/email-builder/src/exporters/toVuemail.ts**
```ts
import type { EmailDocument, Row, Column, Block } from '../schema/document';

// Devuelve estructura compatible con Vuemail (ajusta según docs).
export function toVuemail(doc: EmailDocument) {
  // mapear rows/columns/blocks → estructura Vuemail (sección/columnas/componentes)
  // Incluir estilos inline básicos soportados por email clients.
  return {/* ...estructura resultante... */};
}
```

**packages/email-builder/src/exporters/toHtml.ts**
```ts
import { toVuemail } from './toVuemail';
// @ts-expect-error: import real de vuemail según guía
import { renderToHtml } from 'vuemail';

export async function exportHtml(doc: any): Promise<string> {
  const v = toVuemail(doc);
  const html = await renderToHtml(v);
  return html;
}
```

**packages/email-builder/src/dnd/sortable.ts**
```ts
import type { SortableOptions } from 'sortablejs';
// Opciones por defecto para ghostClass, animation, handle, etc.
export const sortableDefaults: SortableOptions = { animation: 120, fallbackOnBody: true, swapThreshold: 0.65 };
```

**packages/email-builder/src/theming/theme.css**
```css
:root { --bg: #f8f9fb; --fg: #1f2937; --muted: #6b7280; --accent: #3b82f6; --panel: #ffffff; --border:#e5e7eb; }
.theme--dark { --bg:#0b0f14; --fg:#e5e7eb; --muted:#9ca3af; --accent:#60a5fa; --panel:#111827; --border:#1f2937; }
```

**apps/demo/src/App.vue**
```vue
<template>
  <div :class="['app', themeClass]">
    <EmailBuilder />
  </div>
</template>
<script setup lang="ts">
import { EmailBuilder } from 'email-builder';
import { useUiStore } from 'email-builder/stores/useUiStore';
const ui = useUiStore();
const themeClass = computed(() => ui.theme === 'dark' ? 'theme--dark' : 'theme--light');
</script>
```

> Implementa el resto con **código real**, sin placeholders. Donde la integración de Vuemail requiera imports/nombres específicos, sigue su guía; de no existir typings, crea `types/vuemail.d.ts`.

## Validaciones y compatibilidad email (exigentes)
- **Inline styles** en exportación (ciñe propiedades a las soportadas por Outlook/Gmail).
- Evita `position`, `flex`, `grid`. Para layout, si Vuemail lo requiere, genera **tablas** con `align`, `valign`, `width` y `cellpadding` adecuados.
- `img` con `width` fijo y `display:block`.
- Botones con `<table>` anidado (técnica bulletproof).
- Provee **preheader** opcional.

## Comandos que debes dejar listos
- `pnpm i && pnpm -w run dev` → levanta demo
- `pnpm -w run build` → build librería y demo
- `pnpm -w run test` → vitest
- `pnpm -w run lint` → eslint

## Entregables finales automáticos
- Código compilando sin errores TS.
- Lint sin errores.
- Tests verdes.
- Demo navegable con flujo completo.
- README con:
  - Instalación como dependencia
  - API del componente `<EmailBuilder>`
  - Ejemplos de import/export JSON y export HTML
  - Limitaciones y roadmap.

---

**Importante:** No pospongas nada. Implementa todas las funciones declaradas. Si la API de Vuemail exige cambios, encapsúlalos en `exporters/` para no romper el resto del builder. Si detectas un edge case de clientes de correo, deja un test y un comentario técnico con referencia.
