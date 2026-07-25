# Galería de medios (Fase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar una pestaña "Galería" opcional al rail del builder que permite listar (paginado), insertar, subir, borrar y renombrar imágenes de un media library provisto por el integrador (ej. Firebase Storage), sin implementar ningún backend concreto.

**Architecture:** Nuevo tipo `MediaLibraryOptions` (4 funciones: `list`/`upload`/`delete`/`rename`) inyectado vía el mismo mecanismo de `BuilderOptions` que ya usan `uploadImage`/`imageSearch`. Nuevo componente `MediaLibraryTab.vue` con estado 100% local (sin store nuevo), montado condicionalmente en `SidePanel.vue` solo si `options.mediaLibrary` está definido. Reutiliza el patrón de inserción de `ImagesTab.vue` (`store.updateBlock`/`addRow`/`addBlockToColumn`).

**Tech Stack:** Vue 3 `<script setup>`, Pinia (solo el store de documento existente), Vitest + `@vue/test-utils`, sin dependencias nuevas.

## Global Constraints

- Todo aditivo y retrocompatible: sin `mediaLibrary`, el comportamiento actual del builder no cambia (la pestaña ni se renderiza).
- Cero dependencias nuevas en `package.json`.
- Estado de la pestaña vive en `ref`s locales del componente (mismo criterio que `ImagesTab.vue`); no se crea store Pinia nuevo.
- Copy hardcodeada en español dentro de `MediaLibraryTab.vue`, igual que `ImagesTab.vue` y `PropertiesPanel.vue` (no usan el sistema i18n para su contenido interno). La única clave i18n nueva es `rail.media`, porque es la que usa el rail (`SidePanel.vue`) — mismo patrón que `rail.images`.
- Cada tarea deja `pnpm vitest run`, `pnpm typecheck` (`vue-tsc --noEmit`) y el build en verde antes de commitear.
- Fuera de alcance (spec [2026-07-24-media-library-tab-design.md](../specs/2026-07-24-media-library-tab-design.md)): crop, optimización/compresión, selección múltiple, drag&drop de archivos, imágenes inline en el rich text editor.

---

### Task 1: Contrato de API + pestaña base (listar, insertar, error/retry, vacío)

**Files:**
- Create: `packages/email-builder/src/mediaLibrary.ts`
- Modify: `packages/email-builder/src/options.ts`
- Modify: `packages/email-builder/src/components/EmailBuilder.vue`
- Modify: `packages/email-builder/src/index.ts`
- Modify: `packages/email-builder/src/store/ui.ts`
- Modify: `packages/email-builder/src/components/icons.ts`
- Modify: `packages/email-builder/src/i18n/en.ts`
- Modify: `packages/email-builder/src/i18n/es.ts`
- Modify: `packages/email-builder/src/components/SidePanel.vue`
- Modify: `packages/email-builder/src/styles.css`
- Create: `packages/email-builder/src/components/tabs/MediaLibraryTab.vue`
- Test: `packages/email-builder/tests/media-library-tab.test.ts`

**Interfaces:**
- Produces: `MediaItem = { id: string; url: string; thumbnailUrl: string; name?: string; size?: number; createdAt?: string | number }`, `MediaListPage = { items: MediaItem[]; nextCursor?: string }`, `MediaLibraryOptions = { list: (cursor?: string) => Promise<MediaListPage>; upload: (file: File) => Promise<MediaItem>; delete: (id: string) => Promise<void>; rename: (id: string, name: string) => Promise<MediaItem> }`. `BuilderOptions.mediaLibrary?: MediaLibraryOptions`. `EmailBuilder` prop `mediaLibrary?: MediaLibraryOptions`. Estas firmas las consumen las Tareas 2-5.
- Produces (DOM, para tests de tareas siguientes): `.vmd-media-tab`, `.vmd-media-grid`, `.vmd-media-item`, `.vmd-media-item-thumb`, `.vmd-media-item-name`, botón con `data-tab="media"` en el rail.

- [ ] **Step 1: Crear el archivo de tipos `mediaLibrary.ts`**

```ts
// packages/email-builder/src/mediaLibrary.ts
export type MediaItem = {
  id: string
  url: string
  thumbnailUrl: string
  name?: string
  size?: number
  createdAt?: string | number
}

export type MediaListPage = { items: MediaItem[]; nextCursor?: string }

export type MediaLibraryOptions = {
  list: (cursor?: string) => Promise<MediaListPage>
  upload: (file: File) => Promise<MediaItem>
  delete: (id: string) => Promise<void>
  rename: (id: string, name: string) => Promise<MediaItem>
}
```

- [ ] **Step 2: Agregar el campo `mediaLibrary` a `BuilderOptions`**

Editar `packages/email-builder/src/options.ts`: agregar el import y el campo (el resto del archivo queda igual).

```ts
// agregar junto a los demás imports de tipos, cerca de la línea 3-6
import type { MediaLibraryOptions } from './mediaLibrary'
```

```ts
// dentro de BuilderOptions (línea 56-66), agregar la última propiedad:
export type BuilderOptions = {
  mergeTags: MergeTagItem[]
  uploadImage?: (file: File) => Promise<string>
  templates?: EmailTemplate[]
  imageSearch?: (query: string) => Promise<ImageResult[]>
  unlayerFetch?: UnlayerFetch
  tools?: Partial<Record<BlockType, ToolConfig>>
  fonts?: FontDef[]
  specialLinks?: SpecialLink[]
  customBlocks?: CustomBlockDef[]
  mediaLibrary?: MediaLibraryOptions
}
```

- [ ] **Step 3: Exponer la prop `mediaLibrary` en `EmailBuilder.vue`**

Editar `packages/email-builder/src/components/EmailBuilder.vue`. Agregar el import de tipo junto a los demás (cerca de la línea 20):

```ts
import type { MediaLibraryOptions } from '../mediaLibrary'
```

Agregar la prop al final del bloque `defineProps` (línea 41-53):

```ts
const props = defineProps<{
  design?: EmailDocument
  mergeTags?: MergeTagItem[]
  templates?: EmailTemplate[]
  specialLinks?: SpecialLink[]
  uploadImage?: (file: File) => Promise<string>
  imageSearch?: (query: string) => Promise<ImageResult[]>
  unlayerFetch?: UnlayerFetch
  theme?: 'light' | 'dark'
  locale?: 'es' | 'en' | LocaleDict
  appearance?: Appearance
  tools?: Partial<Record<BlockType, ToolConfig>>
  fonts?: FontDef[]
  customBlocks?: CustomBlockDef[]
  mediaLibrary?: MediaLibraryOptions
}>()
```

Agregar el getter al objeto reactivo que se provee (línea 127-129, justo antes del `}),` que cierra el `reactive({...})`):

```ts
    get customBlocks() {
      return props.customBlocks
    },
    get mediaLibrary() {
      return props.mediaLibrary
    },
  }),
)
```

- [ ] **Step 4: Exportar los tipos nuevos desde el entrypoint del paquete**

Editar `packages/email-builder/src/index.ts`, agregar una línea (el resto del archivo queda igual):

```ts
export type { MediaItem, MediaListPage, MediaLibraryOptions } from './mediaLibrary'
```

- [ ] **Step 5: Extender el tipo de `sidebarTab` en el store de UI**

Editar `packages/email-builder/src/store/ui.ts`, cambiar la línea del `sidebarTab`:

```ts
  const sidebarTab = ref<'content' | 'blocks' | 'body' | 'images' | 'media'>('content')
```

- [ ] **Step 6: Agregar el ícono `tabMedia`**

Editar `packages/email-builder/src/components/icons.ts`, agregar una entrada en la sección `--- tabs del riel ---` (después de `tabImages`, línea 28):

```ts
  tabImages: svg('<rect x="3" y="6" width="14" height="11" rx="2"/><path d="m5 15 3-3 2 2 3-3 2 2"/><path d="M19 8h2v11H8v-2"/>'),
  tabMedia: svg('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7z"/>'),
```

- [ ] **Step 7: Agregar la clave i18n `rail.media`**

Editar `packages/email-builder/src/i18n/en.ts`, agregar después de `'rail.images': 'Images',` (línea 23):

```ts
  'rail.images': 'Images',
  'rail.media': 'Gallery',
```

Editar `packages/email-builder/src/i18n/es.ts`, agregar después de `'rail.images': 'Imágenes',` (línea 23):

```ts
  'rail.images': 'Imágenes',
  'rail.media': 'Galería',
```

- [ ] **Step 8: Escribir el componente `MediaLibraryTab.vue` (listar, insertar, error/retry, vacío)**

```vue
<!-- packages/email-builder/src/components/tabs/MediaLibraryTab.vue -->
<template>
  <div class="vmd-media-tab">
    <p v-if="status === 'loading'" class="vmd-tab-placeholder">Cargando…</p>
    <template v-else-if="status === 'error'">
      <p class="vmd-image-error">No se pudo cargar la galería.</p>
      <button type="button" class="vmd-mini-btn vmd-mini-btn--text" @click="load()">Reintentar</button>
    </template>
    <p v-else-if="status === 'empty'" class="vmd-tab-placeholder">Todavía no subiste imágenes.</p>

    <div v-else-if="status === 'results'" class="vmd-media-grid">
      <div v-for="item in items" :key="item.id" class="vmd-media-item">
        <button type="button" class="vmd-media-item-thumb" @click="insert(item)">
          <img :src="item.thumbnailUrl" :alt="item.name ?? ''" />
        </button>
        <div class="vmd-media-item-name" :title="item.name ?? ''">{{ item.name ?? '' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { MediaItem } from '../../mediaLibrary'
import { useBuilderOptions } from '../../options'
import { useDocumentStore } from '../../store/document'
import { useBuilderPinia } from '../../store/keys'

const store = useDocumentStore(useBuilderPinia())
const options = useBuilderOptions()

const items = ref<MediaItem[]>([])
const status = ref<'loading' | 'error' | 'empty' | 'results'>('loading')

async function load() {
  if (!options.mediaLibrary) return
  status.value = 'loading'
  try {
    const page = await options.mediaLibrary.list()
    items.value = page.items
    status.value = page.items.length ? 'results' : 'empty'
  } catch {
    status.value = 'error'
  }
}

onMounted(load)

function insert(item: MediaItem) {
  const selected = store.selectedBlock
  if (selected && selected.type === 'image') {
    store.updateBlock(selected.id, { src: item.url, ...(selected.alt ? {} : { alt: item.name ?? '' }) })
    return
  }
  const row = store.addRow([100])
  const block = store.addBlockToColumn(row.columns[0].id, 'image')
  store.updateBlock(block.id, { src: item.url, alt: item.name ?? '' })
}
</script>
```

- [ ] **Step 9: Montar la pestaña condicionalmente en `SidePanel.vue`**

Reemplazar el contenido completo de `packages/email-builder/src/components/SidePanel.vue`:

```vue
<template>
  <aside class="vmd-sidepanel">
    <div class="vmd-sidepanel-content">
      <Transition name="vmd-tab" mode="out-in">
        <div :key="viewKey" class="vmd-tab-view">
          <PropertiesPanel v-if="store.selection && ui.panelMode === 'props'" />
          <template v-else>
            <ContentTab v-if="ui.sidebarTab === 'content'" />
            <BlocksTab v-else-if="ui.sidebarTab === 'blocks'" />
            <BodyTab v-else-if="ui.sidebarTab === 'body'" />
            <ImagesTab v-else-if="ui.sidebarTab === 'images'" />
            <MediaLibraryTab v-else-if="ui.sidebarTab === 'media'" />
          </template>
        </div>
      </Transition>
    </div>
    <nav class="vmd-rail">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        type="button"
        :data-tab="tab.key"
        :class="{ 'vmd-active': ui.panelMode === 'tab' && ui.sidebarTab === tab.key }"
        @click="ui.sidebarTab = tab.key; ui.panelMode = 'tab'"
      >
        <span v-html="ICONS[tab.icon]"></span>
        <span>{{ t(tab.labelKey) }}</span>
      </button>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import { useI18n } from '../i18n/useI18n'
import { useBuilderOptions } from '../options'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'
import { ICONS } from './icons'
import PropertiesPanel from './PropertiesPanel.vue'
import BlocksTab from './tabs/BlocksTab.vue'
import BodyTab from './tabs/BodyTab.vue'
import ContentTab from './tabs/ContentTab.vue'
import ImagesTab from './tabs/ImagesTab.vue'
import MediaLibraryTab from './tabs/MediaLibraryTab.vue'

const pinia = useBuilderPinia()
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)
const options = useBuilderOptions()
const { t } = useI18n()

// clave de vista: cambia al alternar tab o al entrar/salir del modo propiedades.
// No cambia al seleccionar distintos elementos (evita animar cada edición).
const viewKey = computed(() =>
  store.selection && ui.panelMode === 'props' ? 'props' : ui.sidebarTab,
)

type TabKey = 'content' | 'blocks' | 'body' | 'images' | 'media'

const TABS = computed<{ key: TabKey; labelKey: string; icon: string }[]>(() => {
  const tabs: { key: TabKey; labelKey: string; icon: string }[] = [
    { key: 'content', labelKey: 'rail.content', icon: 'tabContent' },
    { key: 'blocks', labelKey: 'rail.blocks', icon: 'tabBlocks' },
    { key: 'body', labelKey: 'rail.body', icon: 'tabBody' },
    { key: 'images', labelKey: 'rail.images', icon: 'tabImages' },
  ]
  if (options.mediaLibrary) tabs.push({ key: 'media', labelKey: 'rail.media', icon: 'tabMedia' })
  return tabs
})

watch(
  () => store.selection,
  (selection) => {
    if (!selection) ui.panelMode = 'tab'
  },
)
</script>
```

- [ ] **Step 10: Agregar los estilos base de la grilla**

Editar `packages/email-builder/src/styles.css`, agregar al final del archivo:

```css
.vmd-media-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 12px; }
.vmd-media-item { position: relative; border: 1px solid var(--vmd-border); border-radius: 8px; padding: 6px; }
.vmd-media-item-thumb { display: block; width: 100%; padding: 0; border: none; border-radius: 6px; overflow: hidden; cursor: pointer; background: none; }
.vmd-media-item-thumb img { display: block; width: 100%; height: 80px; object-fit: cover; }
.vmd-media-item-name { margin-top: 6px; font-size: 11px; color: var(--vmd-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
```

- [ ] **Step 11: Escribir los tests**

```ts
// packages/email-builder/tests/media-library-tab.test.ts
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import type { MediaItem } from '../src/mediaLibrary'
import { createBlock, createDocument, createRow } from '../src/schema'

const items: MediaItem[] = [
  { id: 'a', url: 'https://img.example/a.jpg', thumbnailUrl: 'https://img.example/a-thumb.jpg', name: 'Foto A' },
  { id: 'b', url: 'https://img.example/b.jpg', thumbnailUrl: 'https://img.example/b-thumb.jpg', name: 'Foto B' },
]

function makeMediaLibrary(
  overrides: Partial<{
    list: ReturnType<typeof vi.fn>
    upload: ReturnType<typeof vi.fn>
    delete: ReturnType<typeof vi.fn>
    rename: ReturnType<typeof vi.fn>
  }> = {},
) {
  return {
    list: overrides.list ?? vi.fn().mockResolvedValue({ items }),
    upload: overrides.upload ?? vi.fn(),
    delete: overrides.delete ?? vi.fn(),
    rename: overrides.rename ?? vi.fn(),
  }
}

async function openMediaTab(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('[data-tab="media"]').trigger('click')
  await flushPromises()
}

describe('MediaLibraryTab', () => {
  it('no aparece la pestaña sin la prop mediaLibrary', () => {
    const wrapper = mount(EmailBuilder)
    expect(wrapper.find('[data-tab="media"]').exists()).toBe(false)
  })

  it('lista los ítems al abrir la pestaña', async () => {
    const mediaLibrary = makeMediaLibrary()
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary } })
    await openMediaTab(wrapper)
    expect(mediaLibrary.list).toHaveBeenCalledWith()
    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(2)
  })

  it('click sin selección inserta un bloque imagen nuevo con el src y el name', async () => {
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary() } })
    await openMediaTab(wrapper)
    await wrapper.find('.vmd-media-item-thumb').trigger('click')

    const emitted = wrapper.emitted('update:design')
    const design = emitted![emitted!.length - 1][0] as {
      rows: { columns: { blocks: { type: string; src?: string; alt?: string }[] }[] }[]
    }
    const blocks = design.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks))
    const image = blocks.find((b) => b.type === 'image')
    expect(image?.src).toBe('https://img.example/a.jpg')
    expect(image?.alt).toBe('Foto A')
  })

  it('no pisa el alt existente al cambiar la imagen de un bloque seleccionado', async () => {
    const design = createDocument()
    const row = createRow([100])
    const img = createBlock('image')
    if (img.type !== 'image') throw new Error()
    img.src = 'x'
    img.alt = 'Mi alt'
    row.columns[0].blocks.push(img)
    design.rows.push(row)

    const wrapper = mount(EmailBuilder, { props: { design, mediaLibrary: makeMediaLibrary() } })
    await wrapper.find('.vmd-block').trigger('click')
    await openMediaTab(wrapper)
    await wrapper.find('.vmd-media-item-thumb').trigger('click')

    const emitted = wrapper.emitted('update:design')
    const doc = emitted![emitted!.length - 1][0] as {
      rows: { columns: { blocks: { type: string; src?: string; alt?: string }[] }[] }[]
    }
    const blocks = doc.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks))
    const image = blocks.find((b) => b.type === 'image')
    expect(image?.src).toBe('https://img.example/a.jpg')
    expect(image?.alt).toBe('Mi alt')
  })

  it('muestra error y permite reintentar si list falla', async () => {
    const list = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce({ items })
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ list }) } })
    await openMediaTab(wrapper)
    expect(wrapper.find('.vmd-media-tab .vmd-image-error').exists()).toBe(true)

    await wrapper.find('.vmd-media-tab .vmd-mini-btn--text').trigger('click')
    await flushPromises()
    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(2)
  })

  it('muestra estado vacío si list devuelve 0 ítems', async () => {
    const wrapper = mount(EmailBuilder, {
      props: { mediaLibrary: makeMediaLibrary({ list: vi.fn().mockResolvedValue({ items: [] }) }) },
    })
    await openMediaTab(wrapper)
    expect(wrapper.find('.vmd-tab-placeholder').text()).toContain('Todavía no subiste imágenes')
  })
})
```

- [ ] **Step 12: Correr la suite y typecheck**

Run: `cd packages/email-builder && pnpm vitest run tests/media-library-tab.test.ts`
Expected: 6 tests, todos PASS.

Run: `cd packages/email-builder && pnpm typecheck`
Expected: sin errores.

- [ ] **Step 13: Commit**

```bash
git add packages/email-builder/src/mediaLibrary.ts packages/email-builder/src/options.ts packages/email-builder/src/components/EmailBuilder.vue packages/email-builder/src/index.ts packages/email-builder/src/store/ui.ts packages/email-builder/src/components/icons.ts packages/email-builder/src/i18n/en.ts packages/email-builder/src/i18n/es.ts packages/email-builder/src/components/SidePanel.vue packages/email-builder/src/styles.css packages/email-builder/src/components/tabs/MediaLibraryTab.vue packages/email-builder/tests/media-library-tab.test.ts
git commit -m "feat: pestaña de galería de medios (listar e insertar)"
```

---

### Task 2: Subir imagen desde la galería

**Files:**
- Modify: `packages/email-builder/src/components/tabs/MediaLibraryTab.vue`
- Modify: `packages/email-builder/src/styles.css`
- Test: `packages/email-builder/tests/media-library-tab.test.ts`

**Interfaces:**
- Consumes: `options.mediaLibrary.upload: (file: File) => Promise<MediaItem>` (Task 1).
- Produces: input `input[type="file"]` dentro de `.vmd-media-tab`; el `MediaItem` devuelto por `upload` se antepone a `items` sin volver a llamar `list()`.

- [ ] **Step 1: Escribir los tests de subida (deben fallar primero)**

Agregar estos dos `it` dentro del `describe('MediaLibraryTab', ...)` de `packages/email-builder/tests/media-library-tab.test.ts`, después del test "muestra estado vacío...":

```ts
  it('sube un archivo y antepone el ítem al grid sin volver a listar', async () => {
    const newItem: MediaItem = {
      id: 'c',
      url: 'https://img.example/c.jpg',
      thumbnailUrl: 'https://img.example/c-thumb.jpg',
      name: 'Foto C',
    }
    const upload = vi.fn().mockResolvedValue(newItem)
    const list = vi.fn().mockResolvedValue({ items })
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ list, upload }) } })
    await openMediaTab(wrapper)

    const input = wrapper.find('.vmd-media-tab input[type="file"]')
    const file = new File(['x'], 'c.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')
    await flushPromises()

    expect(upload).toHaveBeenCalledWith(file)
    expect(list).toHaveBeenCalledTimes(1)
    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(3)
    expect(wrapper.findAll('.vmd-media-item-thumb')[0].find('img').attributes('src')).toBe(
      'https://img.example/c-thumb.jpg',
    )
  })

  it('muestra error inline si falla la subida', async () => {
    const upload = vi.fn().mockRejectedValue(new Error('boom'))
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ upload }) } })
    await openMediaTab(wrapper)

    const input = wrapper.find('.vmd-media-tab input[type="file"]')
    const file = new File(['x'], 'c.jpg', { type: 'image/jpeg' })
    Object.defineProperty(input.element, 'files', { value: [file], configurable: true })
    await input.trigger('change')
    await flushPromises()

    expect(wrapper.find('.vmd-media-tab .vmd-image-error').text()).toContain('No se pudo subir la imagen')
    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(2)
  })
```

- [ ] **Step 2: Correr los tests nuevos para verificar que fallan**

Run: `cd packages/email-builder && pnpm vitest run tests/media-library-tab.test.ts`
Expected: FAIL — no existe `input[type="file"]` dentro de `.vmd-media-tab`.

- [ ] **Step 3: Agregar el botón de subida al componente**

Reemplazar el `<template>` de `packages/email-builder/src/components/tabs/MediaLibraryTab.vue`:

```vue
<template>
  <div class="vmd-media-tab">
    <div class="vmd-media-upload-row">
      <button type="button" class="vmd-btn" :disabled="uploading" @click="fileInput?.click()">
        <span class="vmd-ico" v-html="ICONS.upload" />{{ uploading ? 'Subiendo…' : 'Subir imagen' }}
      </button>
      <input ref="fileInput" type="file" accept="image/*" class="vmd-visually-hidden" @change="onUpload" />
    </div>
    <p v-if="uploadError" class="vmd-image-error">{{ uploadError }}</p>

    <p v-if="status === 'loading'" class="vmd-tab-placeholder">Cargando…</p>
    <template v-else-if="status === 'error'">
      <p class="vmd-image-error">No se pudo cargar la galería.</p>
      <button type="button" class="vmd-mini-btn vmd-mini-btn--text" @click="load()">Reintentar</button>
    </template>
    <p v-else-if="status === 'empty'" class="vmd-tab-placeholder">Todavía no subiste imágenes.</p>

    <div v-else-if="status === 'results'" class="vmd-media-grid">
      <div v-for="item in items" :key="item.id" class="vmd-media-item">
        <button type="button" class="vmd-media-item-thumb" @click="insert(item)">
          <img :src="item.thumbnailUrl" :alt="item.name ?? ''" />
        </button>
        <div class="vmd-media-item-name" :title="item.name ?? ''">{{ item.name ?? '' }}</div>
      </div>
    </div>
  </div>
</template>
```

Reemplazar el `<script setup>` completo:

```vue
<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { MediaItem } from '../../mediaLibrary'
import { useBuilderOptions } from '../../options'
import { useDocumentStore } from '../../store/document'
import { useBuilderPinia } from '../../store/keys'
import { ICONS } from '../icons'

const store = useDocumentStore(useBuilderPinia())
const options = useBuilderOptions()

const items = ref<MediaItem[]>([])
const status = ref<'loading' | 'error' | 'empty' | 'results'>('loading')

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadError = ref<string | null>(null)

async function load() {
  if (!options.mediaLibrary) return
  status.value = 'loading'
  try {
    const page = await options.mediaLibrary.list()
    items.value = page.items
    status.value = page.items.length ? 'results' : 'empty'
  } catch {
    status.value = 'error'
  }
}

onMounted(load)

function insert(item: MediaItem) {
  const selected = store.selectedBlock
  if (selected && selected.type === 'image') {
    store.updateBlock(selected.id, { src: item.url, ...(selected.alt ? {} : { alt: item.name ?? '' }) })
    return
  }
  const row = store.addRow([100])
  const block = store.addBlockToColumn(row.columns[0].id, 'image')
  store.updateBlock(block.id, { src: item.url, alt: item.name ?? '' })
}

async function onUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !options.mediaLibrary) return
  uploading.value = true
  uploadError.value = null
  try {
    const item = await options.mediaLibrary.upload(file)
    items.value = [item, ...items.value]
    status.value = 'results'
  } catch {
    uploadError.value = 'No se pudo subir la imagen.'
  } finally {
    uploading.value = false
    input.value = ''
  }
}
</script>
```

- [ ] **Step 4: Agregar el estilo de la fila de subida**

Editar `packages/email-builder/src/styles.css`, agregar al final:

```css
.vmd-media-upload-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
```

- [ ] **Step 5: Correr la suite y typecheck**

Run: `cd packages/email-builder && pnpm vitest run tests/media-library-tab.test.ts`
Expected: 8 tests, todos PASS.

Run: `cd packages/email-builder && pnpm typecheck`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add packages/email-builder/src/components/tabs/MediaLibraryTab.vue packages/email-builder/src/styles.css packages/email-builder/tests/media-library-tab.test.ts
git commit -m "feat: subir imagen desde la pestaña de galería"
```

---

### Task 3: Paginación con "Cargar más"

**Files:**
- Modify: `packages/email-builder/src/components/tabs/MediaLibraryTab.vue`
- Modify: `packages/email-builder/src/styles.css`
- Test: `packages/email-builder/tests/media-library-tab.test.ts`

**Interfaces:**
- Consumes: `options.mediaLibrary.list(cursor?: string): Promise<MediaListPage>` (Task 1), campo `nextCursor` de la respuesta.
- Produces: botón `.vmd-media-loadmore`, visible solo cuando la última respuesta trae `nextCursor`.

- [ ] **Step 1: Escribir los tests de paginación (deben fallar primero)**

Agregar estos dos `it` después del test de "muestra error inline si falla la subida":

```ts
  it('muestra "Cargar más" solo cuando hay nextCursor y concatena la página siguiente', async () => {
    const page2: MediaItem[] = [
      { id: 'c', url: 'https://img.example/c.jpg', thumbnailUrl: 'https://img.example/c-thumb.jpg', name: 'Foto C' },
    ]
    const list = vi
      .fn()
      .mockResolvedValueOnce({ items, nextCursor: 'cursor-1' })
      .mockResolvedValueOnce({ items: page2 })
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ list }) } })
    await openMediaTab(wrapper)

    expect(wrapper.find('.vmd-media-loadmore').exists()).toBe(true)

    await wrapper.find('.vmd-media-loadmore').trigger('click')
    await flushPromises()

    expect(list).toHaveBeenNthCalledWith(2, 'cursor-1')
    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(3)
    expect(wrapper.find('.vmd-media-loadmore').exists()).toBe(false)
  })

  it('si falla "Cargar más" conserva los ítems ya cargados y permite reintentar', async () => {
    const list = vi
      .fn()
      .mockResolvedValueOnce({ items, nextCursor: 'cursor-1' })
      .mockRejectedValueOnce(new Error('boom'))
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ list }) } })
    await openMediaTab(wrapper)

    await wrapper.find('.vmd-media-loadmore').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(2)
    expect(wrapper.find('.vmd-media-tab .vmd-image-error').text()).toContain('No se pudo cargar más imágenes')
    expect(wrapper.find('.vmd-media-loadmore').exists()).toBe(true)
  })
```

- [ ] **Step 2: Correr los tests nuevos para verificar que fallan**

Run: `cd packages/email-builder && pnpm vitest run tests/media-library-tab.test.ts`
Expected: FAIL — no existe `.vmd-media-loadmore`.

- [ ] **Step 3: Agregar paginación al componente**

Agregar al final del `<template>` de `MediaLibraryTab.vue`, justo antes de `</div>` de cierre de `.vmd-media-tab`:

```vue
    <button
      v-if="nextCursor"
      type="button"
      class="vmd-mini-btn vmd-mini-btn--text vmd-media-loadmore"
      :disabled="loadingMore"
      @click="loadMore"
    >
      {{ loadingMore ? 'Cargando…' : 'Cargar más' }}
    </button>
    <p v-if="loadMoreError" class="vmd-image-error">{{ loadMoreError }}</p>
```

En el `<script setup>`, agregar el estado nuevo junto a los demás `ref`s:

```ts
const nextCursor = ref<string | undefined>(undefined)
const loadingMore = ref(false)
const loadMoreError = ref<string | null>(null)
```

Modificar `load()` para guardar el cursor:

```ts
async function load() {
  if (!options.mediaLibrary) return
  status.value = 'loading'
  try {
    const page = await options.mediaLibrary.list()
    items.value = page.items
    nextCursor.value = page.nextCursor
    status.value = page.items.length ? 'results' : 'empty'
  } catch {
    status.value = 'error'
  }
}
```

Agregar la función `loadMore`:

```ts
async function loadMore() {
  if (!options.mediaLibrary || !nextCursor.value) return
  loadingMore.value = true
  loadMoreError.value = null
  try {
    const page = await options.mediaLibrary.list(nextCursor.value)
    items.value = [...items.value, ...page.items]
    nextCursor.value = page.nextCursor
  } catch {
    loadMoreError.value = 'No se pudo cargar más imágenes.'
  } finally {
    loadingMore.value = false
  }
}
```

- [ ] **Step 4: Agregar el estilo del botón "Cargar más"**

Editar `packages/email-builder/src/styles.css`, agregar al final:

```css
.vmd-media-loadmore { display: block; margin: 12px auto 0; }
```

- [ ] **Step 5: Correr la suite y typecheck**

Run: `cd packages/email-builder && pnpm vitest run tests/media-library-tab.test.ts`
Expected: 10 tests, todos PASS.

Run: `cd packages/email-builder && pnpm typecheck`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add packages/email-builder/src/components/tabs/MediaLibraryTab.vue packages/email-builder/src/styles.css packages/email-builder/tests/media-library-tab.test.ts
git commit -m "feat: paginación con cargar más en la galería de medios"
```

---

### Task 4: Borrar con confirmación

**Files:**
- Modify: `packages/email-builder/src/components/tabs/MediaLibraryTab.vue`
- Modify: `packages/email-builder/src/styles.css`
- Test: `packages/email-builder/tests/media-library-tab.test.ts`

**Interfaces:**
- Consumes: `options.mediaLibrary.delete: (id: string) => Promise<void>` (Task 1).
- Produces: botón `.vmd-media-item-menu-btn` por ítem; menú `.vmd-media-menu` con botón de texto "Borrar"; popover `.vmd-media-confirm` con botones de texto "Cancelar"/"Confirmar".

- [ ] **Step 1: Escribir los tests de borrado (deben fallar primero)**

Cambiar la línea de import de `@vue/test-utils` para incluir el tipo `DOMWrapper`:

```ts
import { type DOMWrapper, flushPromises, mount } from '@vue/test-utils'
```

Agregar este helper antes del `describe`, y los tres `it` dentro del `describe`, después del test "si falla 'Cargar más'...":

```ts
function findButtonWithText(root: DOMWrapper<Element>, text: string) {
  const btn = root.findAll('button').find((b) => b.text().trim() === text)
  if (!btn) throw new Error(`No se encontró el botón "${text}"`)
  return btn
}
```

```ts
  it('borra un ítem tras confirmar', async () => {
    const del = vi.fn().mockResolvedValue(undefined)
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ delete: del }) } })
    await openMediaTab(wrapper)

    const firstItem = wrapper.findAll('.vmd-media-item')[0]
    await firstItem.find('.vmd-media-item-menu-btn').trigger('click')
    await findButtonWithText(firstItem, 'Borrar').trigger('click')
    expect(del).not.toHaveBeenCalled()

    await findButtonWithText(firstItem, 'Confirmar').trigger('click')
    await flushPromises()

    expect(del).toHaveBeenCalledWith('a')
    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(1)
  })

  it('cancelar el popover de borrado no llama a delete', async () => {
    const del = vi.fn()
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ delete: del }) } })
    await openMediaTab(wrapper)

    const firstItem = wrapper.findAll('.vmd-media-item')[0]
    await firstItem.find('.vmd-media-item-menu-btn').trigger('click')
    await findButtonWithText(firstItem, 'Borrar').trigger('click')
    await findButtonWithText(firstItem, 'Cancelar').trigger('click')

    expect(del).not.toHaveBeenCalled()
    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(2)
  })

  it('si delete falla, el ítem permanece y se ve el error', async () => {
    const del = vi.fn().mockRejectedValue(new Error('boom'))
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ delete: del }) } })
    await openMediaTab(wrapper)

    const firstItem = wrapper.findAll('.vmd-media-item')[0]
    await firstItem.find('.vmd-media-item-menu-btn').trigger('click')
    await findButtonWithText(firstItem, 'Borrar').trigger('click')
    await findButtonWithText(firstItem, 'Confirmar').trigger('click')
    await flushPromises()

    expect(wrapper.findAll('.vmd-media-item')).toHaveLength(2)
    expect(firstItem.find('.vmd-image-error').text()).toContain('No se pudo borrar la imagen')
  })
```

> Nota: `firstItem` (resultado de `wrapper.findAll('.vmd-media-item')[0]`) ya es un `DOMWrapper<Element>`, por eso `findButtonWithText` lo tipa directamente sin casts.

- [ ] **Step 2: Correr los tests nuevos para verificar que fallan**

Run: `cd packages/email-builder && pnpm vitest run tests/media-library-tab.test.ts`
Expected: FAIL — no existe `.vmd-media-item-menu-btn`.

- [ ] **Step 3: Agregar el menú y el popover de confirmación al componente**

Reemplazar el bloque `<div v-for="item in items" ...>` del `<template>` de `MediaLibraryTab.vue`:

```vue
      <div v-for="item in items" :key="item.id" class="vmd-media-item">
        <button type="button" class="vmd-media-item-thumb" @click="insert(item)">
          <img :src="item.thumbnailUrl" :alt="item.name ?? ''" />
        </button>
        <div class="vmd-media-item-name" :title="item.name ?? ''">{{ item.name ?? '' }}</div>

        <button type="button" class="vmd-media-item-menu-btn" @click.stop="toggleMenu(item.id)">⋮</button>
        <div v-if="openMenuId === item.id" class="vmd-media-menu" @click.stop>
          <button type="button" class="vmd-media-menu-danger" @click="startDelete(item.id)">Borrar</button>
        </div>

        <div v-if="confirmingDeleteId === item.id" class="vmd-media-confirm" @click.stop>
          <p>¿Borrar esta imagen?</p>
          <p v-if="deleteError" class="vmd-image-error">{{ deleteError }}</p>
          <div class="vmd-media-confirm-actions">
            <button type="button" class="vmd-mini-btn vmd-mini-btn--text" @click="cancelDelete">Cancelar</button>
            <button
              type="button"
              class="vmd-mini-btn vmd-mini-btn--text vmd-mini-btn--danger"
              :disabled="deleting"
              @click="confirmDelete(item.id)"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
```

En el `<script setup>`, agregar el estado nuevo:

```ts
const openMenuId = ref<string | null>(null)
const confirmingDeleteId = ref<string | null>(null)
const deleting = ref(false)
const deleteError = ref<string | null>(null)
```

Agregar las funciones:

```ts
function toggleMenu(id: string) {
  openMenuId.value = openMenuId.value === id ? null : id
  confirmingDeleteId.value = null
}

function startDelete(id: string) {
  openMenuId.value = null
  confirmingDeleteId.value = id
  deleteError.value = null
}

function cancelDelete() {
  confirmingDeleteId.value = null
}

async function confirmDelete(id: string) {
  if (!options.mediaLibrary) return
  deleting.value = true
  deleteError.value = null
  try {
    await options.mediaLibrary.delete(id)
    items.value = items.value.filter((i) => i.id !== id)
    confirmingDeleteId.value = null
    if (items.value.length === 0) status.value = 'empty'
  } catch {
    deleteError.value = 'No se pudo borrar la imagen.'
  } finally {
    deleting.value = false
  }
}
```

- [ ] **Step 4: Agregar los estilos del menú y el popover**

Editar `packages/email-builder/src/styles.css`, agregar al final:

```css
.vmd-media-item-menu-btn {
  position: absolute; top: 4px; right: 4px; width: 22px; height: 22px; border-radius: 6px;
  border: 1px solid var(--vmd-border); background: var(--vmd-panel); color: var(--vmd-fg);
  opacity: 0; cursor: pointer; line-height: 1; font-size: 14px; padding: 0;
}
.vmd-media-item:hover .vmd-media-item-menu-btn,
.vmd-media-item-menu-btn:focus {
  opacity: 1;
}
.vmd-media-menu {
  position: absolute; top: 28px; right: 4px; z-index: 5; display: flex; flex-direction: column;
  min-width: 110px; border: 1px solid var(--vmd-border); border-radius: 8px; background: var(--vmd-panel);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); overflow: hidden;
}
.vmd-media-menu button { padding: 8px 10px; text-align: left; border: none; background: none; color: var(--vmd-fg); font-size: 12px; cursor: pointer; }
.vmd-media-menu button:hover { background: var(--vmd-bg); }
.vmd-media-menu-danger { color: var(--vmd-danger); }
.vmd-media-confirm {
  position: absolute; inset: 0; z-index: 6; display: flex; flex-direction: column; justify-content: center; gap: 6px;
  padding: 8px; border-radius: 8px; background: var(--vmd-panel); border: 1px solid var(--vmd-border);
}
.vmd-media-confirm p { margin: 0; font-size: 11px; color: var(--vmd-fg); }
.vmd-media-confirm-actions { display: flex; gap: 6px; justify-content: flex-end; }
```

- [ ] **Step 5: Correr la suite y typecheck**

Run: `cd packages/email-builder && pnpm vitest run tests/media-library-tab.test.ts`
Expected: 13 tests, todos PASS.

Run: `cd packages/email-builder && pnpm typecheck`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add packages/email-builder/src/components/tabs/MediaLibraryTab.vue packages/email-builder/src/styles.css packages/email-builder/tests/media-library-tab.test.ts
git commit -m "feat: borrar imagen con confirmación en la galería de medios"
```

---

### Task 5: Renombrar inline

**Files:**
- Modify: `packages/email-builder/src/components/tabs/MediaLibraryTab.vue`
- Modify: `packages/email-builder/src/styles.css`
- Test: `packages/email-builder/tests/media-library-tab.test.ts`

**Interfaces:**
- Consumes: `options.mediaLibrary.rename: (id: string, name: string) => Promise<MediaItem>` (Task 1).
- Produces: input `.vmd-media-item-name-input` inline que reemplaza `.vmd-media-item-name` en modo edición.

- [ ] **Step 1: Escribir los tests de renombrado (deben fallar primero)**

Agregar estos dos `it` después del test "si delete falla...":

```ts
  it('renombra un ítem con Enter y actualiza el nombre mostrado', async () => {
    const updated: MediaItem = { ...items[0], name: 'Nuevo nombre' }
    const rename = vi.fn().mockResolvedValue(updated)
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ rename }) } })
    await openMediaTab(wrapper)

    const firstItem = wrapper.findAll('.vmd-media-item')[0]
    await firstItem.find('.vmd-media-item-menu-btn').trigger('click')
    await findButtonWithText(firstItem, 'Renombrar').trigger('click')

    const input = firstItem.find('.vmd-media-item-name-input')
    await input.setValue('Nuevo nombre')
    await input.trigger('keydown', { key: 'Enter' })
    await flushPromises()

    expect(rename).toHaveBeenCalledWith('a', 'Nuevo nombre')
    expect(firstItem.find('.vmd-media-item-name').text()).toBe('Nuevo nombre')
  })

  it('Escape cancela el renombrado sin llamar a rename', async () => {
    const rename = vi.fn()
    const wrapper = mount(EmailBuilder, { props: { mediaLibrary: makeMediaLibrary({ rename }) } })
    await openMediaTab(wrapper)

    const firstItem = wrapper.findAll('.vmd-media-item')[0]
    await firstItem.find('.vmd-media-item-menu-btn').trigger('click')
    await findButtonWithText(firstItem, 'Renombrar').trigger('click')

    const input = firstItem.find('.vmd-media-item-name-input')
    await input.setValue('Otro nombre')
    await input.trigger('keydown', { key: 'Escape' })
    await flushPromises()

    expect(rename).not.toHaveBeenCalled()
    expect(firstItem.find('.vmd-media-item-name').text()).toBe('Foto A')
  })
```

- [ ] **Step 2: Correr los tests nuevos para verificar que fallan**

Run: `cd packages/email-builder && pnpm vitest run tests/media-library-tab.test.ts`
Expected: FAIL — no existe el botón "Renombrar" ni `.vmd-media-item-name-input`.

- [ ] **Step 3: Agregar el renombrado inline al componente**

Reemplazar el bloque `<div v-for="item in items" ...>` del `<template>` de `MediaLibraryTab.vue`:

```vue
      <div v-for="item in items" :key="item.id" class="vmd-media-item">
        <button type="button" class="vmd-media-item-thumb" @click="insert(item)">
          <img :src="item.thumbnailUrl" :alt="item.name ?? ''" />
        </button>

        <input
          v-if="renamingId === item.id"
          ref="renameInputEl"
          type="text"
          class="vmd-media-item-name-input"
          :value="renameValue"
          @input="renameValue = ($event.target as HTMLInputElement).value"
          @keydown.enter="confirmRename(item)"
          @keydown.escape="cancelRename"
          @blur="confirmRename(item)"
        />
        <div v-else class="vmd-media-item-name" :title="item.name ?? ''">{{ item.name ?? '' }}</div>

        <button type="button" class="vmd-media-item-menu-btn" @click.stop="toggleMenu(item.id)">⋮</button>
        <div v-if="openMenuId === item.id" class="vmd-media-menu" @click.stop>
          <button type="button" @click="startRename(item)">Renombrar</button>
          <button type="button" class="vmd-media-menu-danger" @click="startDelete(item.id)">Borrar</button>
        </div>

        <div v-if="confirmingDeleteId === item.id" class="vmd-media-confirm" @click.stop>
          <p>¿Borrar esta imagen?</p>
          <p v-if="deleteError" class="vmd-image-error">{{ deleteError }}</p>
          <div class="vmd-media-confirm-actions">
            <button type="button" class="vmd-mini-btn vmd-mini-btn--text" @click="cancelDelete">Cancelar</button>
            <button
              type="button"
              class="vmd-mini-btn vmd-mini-btn--text vmd-mini-btn--danger"
              :disabled="deleting"
              @click="confirmDelete(item.id)"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
```

En el `<script setup>`, cambiar el import de `ref` para incluir `nextTick`:

```ts
import { nextTick, onMounted, ref } from 'vue'
```

Agregar el estado nuevo:

```ts
const renamingId = ref<string | null>(null)
const renameValue = ref('')
const renameInputEl = ref<HTMLInputElement | null>(null)
```

Modificar `toggleMenu` para no dejar un renombrado a medias al abrir otro menú (queda igual, no requiere cambios). Agregar las funciones de renombrado:

```ts
function startRename(item: MediaItem) {
  openMenuId.value = null
  renamingId.value = item.id
  renameValue.value = item.name ?? ''
  nextTick(() => renameInputEl.value?.focus())
}

function cancelRename() {
  renamingId.value = null
}

async function confirmRename(item: MediaItem) {
  if (renamingId.value !== item.id) return
  const value = renameValue.value.trim()
  if (!value || !options.mediaLibrary) {
    renamingId.value = null
    return
  }
  try {
    const updated = await options.mediaLibrary.rename(item.id, value)
    const idx = items.value.findIndex((i) => i.id === item.id)
    if (idx !== -1) items.value[idx] = updated
  } finally {
    renamingId.value = null
  }
}
```

- [ ] **Step 4: Agregar el estilo del input de renombrado**

Editar `packages/email-builder/src/styles.css`, agregar al final:

```css
.vmd-media-item-name-input {
  width: 100%; box-sizing: border-box; margin-top: 6px; font-size: 11px; padding: 2px 4px;
  border: 1px solid var(--vmd-accent); border-radius: 4px; background: var(--vmd-bg); color: var(--vmd-fg);
}
```

- [ ] **Step 5: Correr la suite y typecheck**

Run: `cd packages/email-builder && pnpm vitest run tests/media-library-tab.test.ts`
Expected: 15 tests, todos PASS.

Run: `cd packages/email-builder && pnpm typecheck`
Expected: sin errores.

- [ ] **Step 6: Commit**

```bash
git add packages/email-builder/src/components/tabs/MediaLibraryTab.vue packages/email-builder/src/styles.css packages/email-builder/tests/media-library-tab.test.ts
git commit -m "feat: renombrar imagen inline en la galería de medios"
```

---

### Task 6: Documentación y verificación final

**Files:**
- Modify: `packages/email-builder/README.md`

**Interfaces:**
- Consumes: nada nuevo — documenta la API completa de las Tareas 1-5.

- [ ] **Step 1: Documentar la prop `mediaLibrary` en el README**

Editar `packages/email-builder/README.md`, agregar una fila a la tabla de props (después de la fila de `imageSearch`, línea 47):

```md
| `imageSearch` | `(query: string) => Promise<ImageResult[]>` | Handler de búsqueda para la pestaña Imágenes; por defecto usa `openverseSearch`. |
| `mediaLibrary` | `MediaLibraryOptions` | Habilita la pestaña "Galería": `{ list: (cursor?) => Promise<{ items: MediaItem[], nextCursor? }>, upload: (file) => Promise<MediaItem>, delete: (id) => Promise<void>, rename: (id, name) => Promise<MediaItem> }`. Sin esta prop, la pestaña no aparece. Todas las funciones las implementa el integrador contra su propio storage (ej. Firebase Storage); la librería no asume ningún backend. |
```

Agregar un ejemplo de uso después del bloque de `uploadImage` en la sección "Uso básico" (después de la línea 34, `}`):

```md
async function uploadImage(file: File): Promise<string> {
  // subí el archivo a tu CDN y devolvé la URL
  return 'https://cdn.tu-dominio.com/...'
}

const mediaLibrary = {
  async list(cursor?: string) {
    // listá tu bucket (ej. Firebase Storage) paginado por cursor
    return { items: [], nextCursor: undefined }
  },
  async upload(file: File) {
    // subí el archivo y devolvé el MediaItem completo (id, url, thumbnailUrl, name)
    return { id: 'x', url: '...', thumbnailUrl: '...', name: file.name }
  },
  async delete(id: string) {
    // borrá el archivo de tu bucket
  },
  async rename(id: string, name: string) {
    // renombrá el archivo y devolvé el MediaItem actualizado
    return { id, url: '...', thumbnailUrl: '...', name }
  },
}
```

- [ ] **Step 2: Correr la suite completa, typecheck y build**

Run: `cd packages/email-builder && pnpm vitest run`
Expected: todos los tests PASS (los 15 nuevos de `media-library-tab.test.ts` + los existentes sin regresiones).

Run: `cd packages/email-builder && pnpm typecheck`
Expected: sin errores.

Run: `cd packages/email-builder && pnpm build`
Expected: build exitoso, sin errores.

- [ ] **Step 3: Commit**

```bash
git add packages/email-builder/README.md
git commit -m "docs: documentar la prop mediaLibrary"
```

## Fuera de alcance de este plan

Crop y optimización de imagen (specs y planes separados, ver el diseño). Persistencia real del backend de storage — queda del lado del integrador. Selección múltiple, drag&drop de archivos, imágenes inline en el rich text editor.
