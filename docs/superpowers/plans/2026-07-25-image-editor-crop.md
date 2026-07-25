# Editor de imagen — Crop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Agregar un botón "Recortar" al inspector del bloque imagen que abre un modal de edición (shell compartido para futuras herramientas Filter/Resize/Draw/Text) con recorte real vía `vue-advanced-cropper`: aspect ratio, rotar/flip, enderezar y radio de esquinas; al guardar, sube la imagen recortada vía `options.uploadImage` y actualiza el bloque.

**Architecture:** Nuevo campo opcional `borderRadius` en el schema del bloque imagen (renderizado como CSS, no horneado en los píxeles). Nuevo shell `ImageEditorModal.vue` con riel de 5 pestañas (solo Crop habilitada) que monta `image-editor/CropPanel.vue`, envolviendo el componente `<Cropper>` de `vue-advanced-cropper`. El resultado del recorte se convierte a `Blob` → `File` → se sube vía `options.uploadImage`, reemplazando `block.src`.

**Tech Stack:** Vue 3 `<script setup>`, Pinia, `vue-advanced-cropper` (nueva dependencia), Vitest + `@vue/test-utils`.

## Global Constraints

- **Este plan agrega una dependencia nueva** (`vue-advanced-cropper`) — decisión explícita del usuario en el spec (`docs/superpowers/specs/2026-07-25-image-editor-crop-design.md`), a diferencia de fases anteriores del proyecto que evitaron sumar dependencias.
- Todo aditivo y retrocompatible: `borderRadius` es un campo opcional del schema; diseños existentes sin ese campo renderizan igual que antes.
- El botón "Recortar" solo aparece si `options.uploadImage` está definido **y** `block.src` no está vacío.
- El radio de esquinas se guarda como `block.borderRadius` y se renderiza con CSS `border-radius` (canvas y HTML exportado) — **no** se hornea en los píxeles del recorte.
- Copy hardcodeada en español, sin claves i18n nuevas (mismo patrón que `ImagesTab.vue`/`MediaLibraryTab.vue`).
- Cada tarea deja `pnpm vitest run`, `pnpm typecheck` (`vue-tsc --noEmit`) y el build en verde antes de commitear.
- Fuera de alcance (spec): Filter, Resize, Draw, Text (próximas fases); Shapes, Stickers, Frame (excluidos); recortar desde la Galería de medios; radio de esquinas horneado en los píxeles.
- Lo que depende de arrastrar/redimensionar el rectángulo de recorte real, o de una imagen real cargándose en el navegador (comportamiento de `vue-advanced-cropper` en sí), **no es testeable en jsdom** — se verifica manualmente en un browser real antes de dar la tarea por terminada (mismo criterio que `exportImage`, Fase E).

---

### Task 1: Campo `borderRadius` en el bloque imagen (schema + render)

**Files:**
- Modify: `packages/email-builder/src/schema/document.ts`
- Modify: `packages/email-builder/src/render/html.ts`
- Modify: `packages/email-builder/src/components/BlockView.vue`
- Test: `packages/email-builder/tests/render-blocks.test.ts`
- Test: `packages/email-builder/tests/block-view.test.ts`

**Interfaces:**
- Produces: `ImageBlock.borderRadius?: number` (vía `z.infer<typeof zImageBlock>`), consumido por la Tarea 2 al guardar el recorte.

- [ ] **Step 1: Agregar el campo al schema**

Editar `packages/email-builder/src/schema/document.ts`. `zImageBlock` actualmente es:

```ts
export const zImageBlock = z.object({
  id: z.string(),
  type: z.literal('image'),
  src: z.string(),
  alt: z.string(),
  href: z.string().optional(),
  target: z.enum(['_blank', '_self']).default('_blank'),
  widthPct: z.number().min(10).max(100),
  widthAuto: z.boolean().default(false),
  align: zAlign,
  style: z.object({ padding: zPadding }),
  hideDesktop: z.boolean().optional(),
  hideMobile: z.boolean().optional(),
})
```

Reemplazar por (agrega `borderRadius` antes de `hideDesktop`):

```ts
export const zImageBlock = z.object({
  id: z.string(),
  type: z.literal('image'),
  src: z.string(),
  alt: z.string(),
  href: z.string().optional(),
  target: z.enum(['_blank', '_self']).default('_blank'),
  widthPct: z.number().min(10).max(100),
  widthAuto: z.boolean().default(false),
  align: zAlign,
  style: z.object({ padding: zPadding }),
  borderRadius: z.number().min(0).optional(),
  hideDesktop: z.boolean().optional(),
  hideMobile: z.boolean().optional(),
})
```

- [ ] **Step 2: Escribir el test de export HTML (debe fallar primero)**

Editar `packages/email-builder/tests/render-blocks.test.ts`, agregar este `it` después de "image sin src renderiza celda vacía sin `<img>`" (dentro del mismo `describe`):

```ts
  it('image: aplica border-radius al <img> cuando está definido', () => {
    const img = createBlock('image') as ImageBlock
    img.src = 'https://cdn.example.com/a.png'
    img.borderRadius = 12
    const html = render(img)
    expect(html).toContain('border-radius:12px')
  })
```

- [ ] **Step 3: Correr el test para verificar que falla**

Run: `cd packages/email-builder && pnpm vitest run tests/render-blocks.test.ts`
Expected: FAIL — el HTML no contiene `border-radius:12px`.

- [ ] **Step 4: Aplicar el border-radius en el export HTML**

Editar `packages/email-builder/src/render/html.ts`. El case `'image'` actualmente es:

```ts
    case 'image': {
      const s = block.style
      if (!block.src) {
        return cellTable(`<tr><td style="padding:${paddingCss(s.padding)};"></td></tr>`)
      }
      const imgStyle = block.widthAuto
        ? 'display:block;width:auto;max-width:100%;height:auto;border:0;'
        : 'display:block;width:100%;max-width:100%;height:auto;border:0;'
      const img = `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" ${block.widthAuto ? '' : 'width="100%" '}style="${imgStyle}">`
```

Reemplazar esas líneas por:

```ts
    case 'image': {
      const s = block.style
      if (!block.src) {
        return cellTable(`<tr><td style="padding:${paddingCss(s.padding)};"></td></tr>`)
      }
      const radius = block.borderRadius ? `border-radius:${block.borderRadius}px;` : ''
      const imgStyle =
        (block.widthAuto
          ? 'display:block;width:auto;max-width:100%;height:auto;border:0;'
          : 'display:block;width:100%;max-width:100%;height:auto;border:0;') + radius
      const img = `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" ${block.widthAuto ? '' : 'width="100%" '}style="${imgStyle}">`
```

(el resto del case, líneas siguientes con `content`/`tableWidth`/`return cellTable(...)`, queda igual).

- [ ] **Step 5: Correr el test para verificar que pasa**

Run: `cd packages/email-builder && pnpm vitest run tests/render-blocks.test.ts`
Expected: PASS.

- [ ] **Step 6: Escribir el test del canvas (debe fallar primero)**

Editar `packages/email-builder/tests/block-view.test.ts`, agregar este `it` después de "image sin src muestra placeholder" (dentro del mismo `describe`):

```ts
  it('image aplica border-radius cuando el bloque lo tiene seteado', () => {
    const block = createBlock('image')
    if (block.type !== 'image') throw new Error()
    block.src = 'https://cdn.example.com/a.png'
    block.borderRadius = 8
    const { wrapper } = mountBlock(block)
    expect(wrapper.find('.vmd-b-image-placeholder').exists()).toBe(false)
    expect(wrapper.find('img').attributes('style')).toContain('border-radius: 8px')
  })
```

- [ ] **Step 7: Correr el test para verificar que falla**

Run: `cd packages/email-builder && pnpm vitest run tests/block-view.test.ts`
Expected: FAIL — el `<img>` no tiene `border-radius` en su style.

- [ ] **Step 8: Aplicar el border-radius en el canvas**

Editar `packages/email-builder/src/components/BlockView.vue`. El `<img>` del case `image` actualmente es:

```vue
      <img
        v-if="block.src"
        :src="block.src"
        :alt="block.alt"
        :style="block.widthAuto ? { width: 'auto', maxWidth: '100%', display: 'inline-block' } : { width: block.widthPct + '%', display: 'inline-block' }"
      />
```

Reemplazar por:

```vue
      <img
        v-if="block.src"
        :src="block.src"
        :alt="block.alt"
        :style="{
          ...(block.widthAuto ? { width: 'auto', maxWidth: '100%' } : { width: block.widthPct + '%' }),
          display: 'inline-block',
          ...(block.borderRadius ? { borderRadius: block.borderRadius + 'px' } : {}),
        }"
      />
```

- [ ] **Step 9: Correr el test para verificar que pasa**

Run: `cd packages/email-builder && pnpm vitest run tests/block-view.test.ts`
Expected: PASS.

- [ ] **Step 10: Correr la suite completa y typecheck**

Run: `cd packages/email-builder && pnpm vitest run`
Expected: todos los tests PASS (sin regresiones).

Run: `cd packages/email-builder && pnpm typecheck`
Expected: sin errores.

- [ ] **Step 11: Commit**

```bash
git add packages/email-builder/src/schema/document.ts packages/email-builder/src/render/html.ts packages/email-builder/src/components/BlockView.vue packages/email-builder/tests/render-blocks.test.ts packages/email-builder/tests/block-view.test.ts
git commit -m "feat: agregar borderRadius al bloque imagen (canvas + export HTML)"
```

---

### Task 2: Modal de edición de imagen + Crop end-to-end

**Files:**
- Modify: `packages/email-builder/package.json` (nueva dependencia)
- Modify: `packages/email-builder/src/store/ui.ts`
- Modify: `packages/email-builder/src/components/icons.ts`
- Modify: `packages/email-builder/src/components/EmailBuilder.vue`
- Modify: `packages/email-builder/src/components/PropertiesPanel.vue`
- Modify: `packages/email-builder/src/styles.css`
- Create: `packages/email-builder/src/components/ImageEditorModal.vue`
- Create: `packages/email-builder/src/components/image-editor/CropPanel.vue`
- Test: `packages/email-builder/tests/image-editor.test.ts`

**Interfaces:**
- Consumes: `ImageBlock.borderRadius?: number` (Tarea 1); `options.uploadImage?: (file: File) => Promise<string>` (ya existente); `store.findBlock(id)`, `store.updateBlock(id, patch)` (ya existentes).
- Produces: `ui.imageEditorBlockId: Ref<string | null>` — controla si el modal está abierto y para qué bloque. `CropPanel` expone `save(): Promise<void>` vía `defineExpose`, consumido por `ImageEditorModal`.

- [ ] **Step 1: Agregar la dependencia**

Run: `cd packages/email-builder && pnpm add vue-advanced-cropper`
Expected: se agrega `"vue-advanced-cropper": "^2.8.9"` (o la última versión estable resuelta) a `dependencies` en `packages/email-builder/package.json`, y el lockfile del repo se actualiza.

- [ ] **Step 2: Agregar el campo `imageEditorBlockId` al store de UI**

Editar `packages/email-builder/src/store/ui.ts`. Reemplazar el archivo completo:

```ts
import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('vmd-ui', () => {
  const theme = ref<'light' | 'dark'>('light')
  const previewOpen = ref(false)
  const previewWidth = ref(1000)
  const galleryOpen = ref(false)
  const versionsOpen = ref(false)
  const unlayerImportOpen = ref(false)
  const canvasDevice = ref<'desktop' | 'mobile'>('desktop')
  const sidebarTab = ref<'content' | 'blocks' | 'body' | 'images' | 'media'>('content')
  const isDragging = ref(false)
  const panelMode = ref<'tab' | 'props'>('tab')
  const imageEditorBlockId = ref<string | null>(null)

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  return {
    theme,
    previewOpen,
    previewWidth,
    galleryOpen,
    unlayerImportOpen,
    canvasDevice,
    sidebarTab,
    isDragging,
    panelMode,
    versionsOpen,
    imageEditorBlockId,
    toggleTheme,
  }
})
```

- [ ] **Step 3: Agregar los íconos del editor de imagen**

Editar `packages/email-builder/src/components/icons.ts`, agregar una sección nueva al final del objeto `ICONS` (antes del `}` de cierre, después de la entrada `variable:` de la sección "--- editor de texto ---"):

```ts
  variable: svg('<path d="M8 4C5 8 5 16 8 20M16 4c3 4 3 12 0 16M9.5 9l5 6M14.5 9l-5 6"/>'),

  // --- editor de imagen ---
  edFilter: svg('<path d="M4 7h10M18 7h2M4 17h2M8 17h12"/><circle cx="16" cy="7" r="2"/><circle cx="6" cy="17" r="2"/>'),
  edCrop: svg('<path d="M6 2v14a2 2 0 0 0 2 2h14M2 6h14a2 2 0 0 1 2 2v14"/>'),
  edResize: svg('<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>'),
  edDraw: svg('<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>'),
  edText: svg('<path d="M4 6h16M12 6v14"/>'),
  rotateLeft: svg('<path d="M4 12a8 8 0 1 1 2.3 5.6M4 12v5h5"/>'),
  rotateRight: svg('<path d="M20 12a8 8 0 1 0-2.3 5.6M20 12v5h-5"/>'),
  flipHorizontal: svg('<path d="M12 3v18M7 7l-3 5 3 5M17 7l3 5-3 5"/>'),
  flipVertical: svg('<path d="M3 12h18M7 7l5-3 5 3M7 17l5 3 5-3"/>'),
}
```

(Ojo: la línea `variable: svg(...)` ya existe en el archivo — no la dupliques, solo agregá las líneas nuevas después de ella y movés el `}` de cierre al final del bloque nuevo.)

- [ ] **Step 4: Crear `CropPanel.vue`**

```vue
<!-- packages/email-builder/src/components/image-editor/CropPanel.vue -->
<template>
  <div class="vmd-crop-panel">
    <div class="vmd-crop-viewport">
      <Cropper
        ref="cropperRef"
        class="vmd-cropper"
        :src="block.src"
        :stencil-props="{ aspectRatio: selectedRatio }"
        @change="onCropperChange"
      />
    </div>

    <div class="vmd-props-section-title">Aspect ratio</div>
    <div class="vmd-crop-ratio-grid">
      <button
        v-for="opt in RATIO_OPTIONS"
        :key="opt.key"
        type="button"
        class="vmd-crop-ratio-btn"
        :class="{ 'vmd-active': selectedRatioKey === opt.key }"
        @click="selectedRatioKey = opt.key"
      >
        {{ opt.label }}
      </button>
    </div>

    <div class="vmd-props-section-title">Rotar y voltear</div>
    <div class="vmd-crop-actions-grid">
      <button type="button" class="vmd-mini-btn vmd-mini-btn--text" @click="rotateLeft">
        <span class="vmd-ico" v-html="ICONS.rotateLeft" />Rotar izquierda
      </button>
      <button type="button" class="vmd-mini-btn vmd-mini-btn--text" @click="rotateRight">
        <span class="vmd-ico" v-html="ICONS.rotateRight" />Rotar derecha
      </button>
      <button
        type="button"
        class="vmd-mini-btn vmd-mini-btn--text"
        :class="{ 'vmd-active': flippedH }"
        @click="toggleFlipH"
      >
        <span class="vmd-ico" v-html="ICONS.flipHorizontal" />Flip horizontal
      </button>
      <button
        type="button"
        class="vmd-mini-btn vmd-mini-btn--text"
        :class="{ 'vmd-active': flippedV }"
        @click="toggleFlipV"
      >
        <span class="vmd-ico" v-html="ICONS.flipVertical" />Flip vertical
      </button>
    </div>
    <label class="vmd-field">
      <span class="vmd-field-label">Enderezar</span>
      <input type="range" class="vmd-range" min="-45" max="45" step="1" :value="straightenDeg" @input="onStraightenInput" />
    </label>

    <div class="vmd-props-section-title">Esquinas</div>
    <label class="vmd-field">
      <span class="vmd-field-label">Radio</span>
      <input type="range" class="vmd-range" min="0" max="60" step="1" v-model.number="radius" />
    </label>

    <button type="button" class="vmd-mini-btn vmd-mini-btn--text" @click="reset">Restablecer</button>
    <p v-if="errorMsg" class="vmd-image-error">{{ errorMsg }}</p>
  </div>
</template>

<script setup lang="ts">
import { Cropper } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'
import { computed, ref } from 'vue'
import type { ImageBlock } from '../../schema'
import { useBuilderOptions } from '../../options'
import { useDocumentStore } from '../../store/document'
import { useBuilderPinia } from '../../store/keys'
import { useUiStore } from '../../store/ui'
import { ICONS } from '../icons'

const props = defineProps<{ block: ImageBlock }>()

const store = useDocumentStore(useBuilderPinia())
const ui = useUiStore(useBuilderPinia())
const options = useBuilderOptions()

type CropperExposed = {
  getResult: () => { canvas: HTMLCanvasElement }
  rotate: (angle: number) => void
  flip: (horizontal: boolean, vertical: boolean) => void
  reset: () => void
}
const cropperRef = ref<CropperExposed | null>(null)

const naturalRatio = ref<number | undefined>(undefined)
function onCropperChange(result: { imageSize?: { width: number; height: number } }) {
  if (result.imageSize && !naturalRatio.value) {
    naturalRatio.value = result.imageSize.width / result.imageSize.height
  }
}

type RatioOption = { key: string; label: string; ratio: number | undefined }
const RATIO_OPTIONS = computed<RatioOption[]>(() => [
  { key: 'free', label: 'Free', ratio: undefined },
  { key: 'original', label: 'Original', ratio: naturalRatio.value },
  { key: 'square', label: 'Square', ratio: 1 },
  { key: '4:3', label: '4:3', ratio: 4 / 3 },
  { key: '3:2', label: '3:2', ratio: 3 / 2 },
  { key: '16:9', label: '16:9', ratio: 16 / 9 },
  { key: '3:4', label: '3:4', ratio: 3 / 4 },
  { key: '2:3', label: '2:3', ratio: 2 / 3 },
  { key: '9:16', label: '9:16', ratio: 9 / 16 },
])
const selectedRatioKey = ref('free')
const selectedRatio = computed(() => RATIO_OPTIONS.value.find((r) => r.key === selectedRatioKey.value)?.ratio)

const straightenDeg = ref(0)
const flippedH = ref(false)
const flippedV = ref(false)
const radius = ref(props.block.borderRadius ?? 0)
const errorMsg = ref<string | null>(null)

function rotateLeft() {
  cropperRef.value?.rotate(-90)
}
function rotateRight() {
  cropperRef.value?.rotate(90)
}
function onStraightenInput(e: Event) {
  const next = Number((e.target as HTMLInputElement).value)
  const delta = next - straightenDeg.value
  straightenDeg.value = next
  cropperRef.value?.rotate(delta)
}
function toggleFlipH() {
  flippedH.value = !flippedH.value
  cropperRef.value?.flip(true, false)
}
function toggleFlipV() {
  flippedV.value = !flippedV.value
  cropperRef.value?.flip(false, true)
}
function reset() {
  selectedRatioKey.value = 'free'
  straightenDeg.value = 0
  flippedH.value = false
  flippedV.value = false
  radius.value = props.block.borderRadius ?? 0
  cropperRef.value?.reset()
}

async function save() {
  if (!cropperRef.value || !options.uploadImage) return
  errorMsg.value = null
  let blob: Blob | null
  try {
    const { canvas } = cropperRef.value.getResult()
    blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  } catch {
    errorMsg.value = 'No se pudo procesar esta imagen (¿es de otro origen sin CORS habilitado?).'
    return
  }
  if (!blob) {
    errorMsg.value = 'No se pudo procesar esta imagen (¿es de otro origen sin CORS habilitado?).'
    return
  }
  const file = new File([blob], 'cropped.png', { type: 'image/png' })
  try {
    const url = await options.uploadImage(file)
    store.updateBlock(props.block.id, { src: url, borderRadius: radius.value || undefined })
    ui.imageEditorBlockId = null
  } catch {
    errorMsg.value = 'No se pudo subir la imagen recortada.'
  }
}

defineExpose({ save })
</script>
```

- [ ] **Step 5: Crear `ImageEditorModal.vue`**

```vue
<!-- packages/email-builder/src/components/ImageEditorModal.vue -->
<template>
  <div class="vmd-modal" @click.self="cancel">
    <div class="vmd-modal-box vmd-image-editor">
      <div class="vmd-preview-bar">
        <h3 class="vmd-inspector-title" style="margin: 0">Editar imagen</h3>
        <div class="vmd-toolbar-group">
          <button type="button" class="vmd-btn" @click="cancel">Cancelar</button>
          <button type="button" class="vmd-btn vmd-btn--primary" :disabled="saving" @click="triggerSave">
            {{ saving ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </div>
      <div class="vmd-image-editor-body">
        <div class="vmd-image-editor-content">
          <CropPanel v-if="activeTab === 'crop' && block" ref="cropPanelRef" :block="block" />
        </div>
        <nav class="vmd-image-editor-rail">
          <button
            v-for="tool in TOOLS"
            :key="tool.key"
            type="button"
            :disabled="tool.key !== 'crop'"
            :class="{ 'vmd-active': activeTab === tool.key }"
            @click="activeTab = tool.key"
          >
            <span class="vmd-ico" v-html="ICONS[tool.icon]"></span>
            <span>{{ tool.label }}</span>
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'
import { ICONS } from './icons'
import CropPanel from './image-editor/CropPanel.vue'

const store = useDocumentStore(useBuilderPinia())
const ui = useUiStore(useBuilderPinia())

const block = computed(() => {
  const found = store.findBlock(ui.imageEditorBlockId ?? '')
  return found && found.block.type === 'image' ? found.block : null
})

type ToolKey = 'filter' | 'crop' | 'resize' | 'draw' | 'text'
const TOOLS: { key: ToolKey; label: string; icon: string }[] = [
  { key: 'filter', label: 'Filter', icon: 'edFilter' },
  { key: 'crop', label: 'Crop', icon: 'edCrop' },
  { key: 'resize', label: 'Resize', icon: 'edResize' },
  { key: 'draw', label: 'Draw', icon: 'edDraw' },
  { key: 'text', label: 'Text', icon: 'edText' },
]
const activeTab = ref<ToolKey>('crop')

const cropPanelRef = ref<{ save: () => Promise<void> } | null>(null)
const saving = ref(false)

async function triggerSave() {
  if (!cropPanelRef.value) return
  saving.value = true
  try {
    await cropPanelRef.value.save()
  } finally {
    saving.value = false
  }
}

function cancel() {
  ui.imageEditorBlockId = null
}
</script>
```

- [ ] **Step 6: Montar el modal en `EmailBuilder.vue`**

Editar `packages/email-builder/src/components/EmailBuilder.vue`. Agregar el import junto a los demás componentes (después de `import CanvasBar from './CanvasBar.vue'`):

```ts
import ImageEditorModal from './ImageEditorModal.vue'
```

En el `<template>`, agregar la línea después de `<TemplateGallery v-if="ui.galleryOpen" />`:

```vue
    <TemplateGallery v-if="ui.galleryOpen" />
    <ImageEditorModal v-if="ui.imageEditorBlockId" />
```

- [ ] **Step 7: Agregar el botón "Recortar" en `PropertiesPanel.vue`**

Editar `packages/email-builder/src/components/PropertiesPanel.vue`. Agregar el import junto a los demás (después de `import { useBuilderPinia } from '../store/keys'`):

```ts
import { useUiStore } from '../store/ui'
```

Agregar la instancia junto a las demás (después de `const options = useBuilderOptions()`):

```ts
const ui = useUiStore(useBuilderPinia())
```

En el `<template>`, dentro del bloque `v-else-if="block.type === 'image'"`, agregar el botón justo después del `</div>` que cierra el bloque `v-if="options.uploadImage"` de subida (antes del `<TextField label="URL" ...>`):

```vue
        <div v-if="options.uploadImage" class="vmd-field">
          <span class="vmd-field-label">Subir imagen</span>
          <div class="vmd-upload-row">
            <button type="button" class="vmd-btn" :disabled="uploading" @click="fileInput?.click()">
              <span class="vmd-ico" v-html="ICONS.upload" />{{ uploading ? 'Subiendo…' : 'Elegir archivo' }}
            </button>
            <span class="vmd-upload-filename">{{ uploadFileName ?? 'Ningún archivo seleccionado' }}</span>
          </div>
          <input ref="fileInput" type="file" accept="image/*" class="vmd-visually-hidden" @change="onUpload" />
        </div>
        <button
          v-if="options.uploadImage && block.src"
          type="button"
          class="vmd-mini-btn vmd-mini-btn--text"
          data-action="crop-image"
          @click="ui.imageEditorBlockId = block.id"
        >
          Recortar
        </button>
        <TextField label="URL" :model-value="block.src" @update:model-value="upd({ src: $event })" />
```

- [ ] **Step 8: Agregar los estilos**

Editar `packages/email-builder/src/styles.css`, agregar al final:

```css
.vmd-image-editor { width: 92vw; max-width: 1100px; height: 86vh; display: flex; flex-direction: column; }
.vmd-image-editor-body { display: flex; flex: 1; min-height: 0; }
.vmd-image-editor-content { flex: 1; min-width: 0; padding: 16px; overflow-y: auto; }
.vmd-image-editor-rail { width: 96px; flex: none; display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 12px 6px; border-left: 1px solid var(--vmd-border); overflow-y: auto; }
.vmd-image-editor-rail button {
  width: 100%; display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 10px 4px; border: none; background: none; border-radius: 8px; color: var(--vmd-fg);
  font-size: 11px; cursor: pointer;
}
.vmd-image-editor-rail button:disabled { color: var(--vmd-muted); cursor: not-allowed; opacity: 0.5; }
.vmd-image-editor-rail button:not(:disabled):hover,
.vmd-image-editor-rail button.vmd-active { background: var(--vmd-bg); }
.vmd-image-editor-rail .vmd-ico svg { width: 20px; height: 20px; }

.vmd-crop-panel { display: flex; flex-direction: column; gap: 4px; height: 100%; }
.vmd-crop-viewport { flex: 1; min-height: 240px; background: var(--vmd-bg); border-radius: 8px; overflow: hidden; margin-bottom: 12px; }
.vmd-cropper { height: 100%; width: 100%; }
.vmd-crop-ratio-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; margin-bottom: 12px; }
.vmd-crop-ratio-btn { padding: 8px 4px; border: 1px solid var(--vmd-border); border-radius: 8px; background: var(--vmd-panel); color: var(--vmd-fg); font-size: 12px; cursor: pointer; }
.vmd-crop-ratio-btn.vmd-active { border-color: var(--vmd-accent); color: var(--vmd-accent); }
.vmd-crop-actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 8px; }
.vmd-range { width: 100%; accent-color: var(--vmd-accent); }
```

- [ ] **Step 9: Escribir los tests (deben fallar primero)**

```ts
// packages/email-builder/tests/image-editor.test.ts
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import { createBlock, createDocument, createRow } from '../src/schema'
import type { ImageBlock } from '../src/schema'

function fakeCanvas(shouldFailToBlob = false) {
  return {
    toBlob(callback: (b: Blob | null) => void) {
      callback(shouldFailToBlob ? null : new Blob(['x'], { type: 'image/png' }))
    },
  } as unknown as HTMLCanvasElement
}

function makeCropperStub(options: { throwOnGetResult?: boolean; failToBlob?: boolean } = {}) {
  return defineComponent({
    name: 'Cropper',
    props: ['src', 'stencilProps'],
    emits: ['change'],
    setup(_props, { expose }) {
      expose({
        getResult: () => {
          if (options.throwOnGetResult) throw new Error('tainted canvas')
          return { canvas: fakeCanvas(options.failToBlob) }
        },
        rotate: () => {},
        flip: () => {},
        reset: () => {},
      })
      return () => h('div', { class: 'cropper-stub' })
    },
  })
}

function designWithImage() {
  const design = createDocument()
  const row = createRow([100])
  const img = createBlock('image') as ImageBlock
  img.src = 'https://cdn.example.com/a.png'
  row.columns[0].blocks.push(img)
  design.rows.push(row)
  return { design, img }
}

async function openEditor(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('.vmd-block').trigger('click')
  await wrapper.find('[data-action="crop-image"]').trigger('click')
  await flushPromises()
}

describe('ImageEditorModal — Crop', () => {
  it('el botón Recortar no aparece sin uploadImage', async () => {
    const { design } = designWithImage()
    const wrapper = mount(EmailBuilder, { props: { design } })
    await wrapper.find('.vmd-block').trigger('click')
    expect(wrapper.find('[data-action="crop-image"]').exists()).toBe(false)
  })

  it('el botón Recortar no aparece si el bloque no tiene src', async () => {
    const design = createDocument()
    const row = createRow([100])
    row.columns[0].blocks.push(createBlock('image'))
    design.rows.push(row)
    const wrapper = mount(EmailBuilder, { props: { design, uploadImage: vi.fn() } })
    await wrapper.find('.vmd-block').trigger('click')
    expect(wrapper.find('[data-action="crop-image"]').exists()).toBe(false)
  })

  it('abre el modal con Crop habilitado y el resto de las pestañas deshabilitadas', async () => {
    const { design } = designWithImage()
    const wrapper = mount(EmailBuilder, {
      props: { design, uploadImage: vi.fn() },
      global: { stubs: { Cropper: makeCropperStub() } },
    })
    await openEditor(wrapper)

    expect(wrapper.find('.vmd-image-editor').exists()).toBe(true)
    const railButtons = wrapper.findAll('.vmd-image-editor-rail button')
    expect(railButtons).toHaveLength(5)
    const disabled = railButtons.filter((b) => b.attributes('disabled') !== undefined)
    expect(disabled).toHaveLength(4)
  })

  it('Cancelar cierra el modal sin tocar el bloque', async () => {
    const { design } = designWithImage()
    const wrapper = mount(EmailBuilder, {
      props: { design, uploadImage: vi.fn() },
      global: { stubs: { Cropper: makeCropperStub() } },
    })
    await openEditor(wrapper)

    const cancelBtn = wrapper.findAll('.vmd-image-editor .vmd-btn').find((b) => b.text() === 'Cancelar')
    await cancelBtn!.trigger('click')

    expect(wrapper.find('.vmd-image-editor').exists()).toBe(false)
    expect(wrapper.emitted('update:design')).toBeUndefined()
  })

  it('Guardar sube el resultado recortado y actualiza el src del bloque', async () => {
    const { design } = designWithImage()
    const uploadImage = vi.fn().mockResolvedValue('https://cdn.example.com/cropped.png')
    const wrapper = mount(EmailBuilder, {
      props: { design, uploadImage },
      global: { stubs: { Cropper: makeCropperStub() } },
    })
    await openEditor(wrapper)

    const saveBtn = wrapper.findAll('.vmd-image-editor .vmd-btn').find((b) => b.text().includes('Guardar'))
    await saveBtn!.trigger('click')
    await flushPromises()

    expect(uploadImage).toHaveBeenCalledTimes(1)
    const file = uploadImage.mock.calls[0][0] as File
    expect(file.name).toBe('cropped.png')
    expect(file.type).toBe('image/png')

    const emitted = wrapper.emitted('update:design')
    const doc = emitted![emitted!.length - 1][0] as {
      rows: { columns: { blocks: { type: string; src?: string }[] }[] }[]
    }
    const blocks = doc.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks))
    const image = blocks.find((b) => b.type === 'image')
    expect(image?.src).toBe('https://cdn.example.com/cropped.png')
    expect(wrapper.find('.vmd-image-editor').exists()).toBe(false)
  })

  it('el radio de esquinas ajustado se guarda en el bloque al guardar', async () => {
    const { design } = designWithImage()
    const uploadImage = vi.fn().mockResolvedValue('https://cdn.example.com/cropped.png')
    const wrapper = mount(EmailBuilder, {
      props: { design, uploadImage },
      global: { stubs: { Cropper: makeCropperStub() } },
    })
    await openEditor(wrapper)

    // input[1] es el slider de "Radio" (input[0] es "Enderezar")
    const radiusInput = wrapper.findAll('.vmd-crop-panel input[type="range"]')[1]
    await radiusInput.setValue('20')

    const saveBtn = wrapper.findAll('.vmd-image-editor .vmd-btn').find((b) => b.text().includes('Guardar'))
    await saveBtn!.trigger('click')
    await flushPromises()

    const emitted = wrapper.emitted('update:design')
    const doc = emitted![emitted!.length - 1][0] as {
      rows: { columns: { blocks: { type: string; borderRadius?: number }[] }[] }[]
    }
    const blocks = doc.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks))
    const image = blocks.find((b) => b.type === 'image')
    expect(image?.borderRadius).toBe(20)
  })

  it('si falla uploadImage, el modal permanece abierto y muestra el error', async () => {
    const { design } = designWithImage()
    const uploadImage = vi.fn().mockRejectedValue(new Error('boom'))
    const wrapper = mount(EmailBuilder, {
      props: { design, uploadImage },
      global: { stubs: { Cropper: makeCropperStub() } },
    })
    await openEditor(wrapper)

    const saveBtn = wrapper.findAll('.vmd-image-editor .vmd-btn').find((b) => b.text().includes('Guardar'))
    await saveBtn!.trigger('click')
    await flushPromises()

    expect(wrapper.find('.vmd-image-editor').exists()).toBe(true)
    expect(wrapper.find('.vmd-image-editor .vmd-image-error').text()).toContain('No se pudo subir')
  })

  it('si el recorte falla (ej. CORS), se muestra el error sin cerrar el modal', async () => {
    const { design } = designWithImage()
    const uploadImage = vi.fn()
    const wrapper = mount(EmailBuilder, {
      props: { design, uploadImage },
      global: { stubs: { Cropper: makeCropperStub({ throwOnGetResult: true }) } },
    })
    await openEditor(wrapper)

    const saveBtn = wrapper.findAll('.vmd-image-editor .vmd-btn').find((b) => b.text().includes('Guardar'))
    await saveBtn!.trigger('click')
    await flushPromises()

    expect(uploadImage).not.toHaveBeenCalled()
    expect(wrapper.find('.vmd-image-editor').exists()).toBe(true)
    expect(wrapper.find('.vmd-image-editor .vmd-image-error').text()).toContain('No se pudo procesar')
  })
})
```

> Nota: estos tests reemplazan el `<Cropper>` real de `vue-advanced-cropper` por un stub (vía `global.stubs`) porque el componente real depende de cargar una imagen de verdad y de `ResizeObserver`/canvas real, que jsdom no provee — mismo criterio que `exportImage` (no testeado en jsdom). El stub verifica el flujo de datos (`getResult`/`toBlob`/`uploadImage`/`updateBlock`) sin depender de la interacción visual real de recorte.

- [ ] **Step 10: Correr los tests para verificar que fallan**

Run: `cd packages/email-builder && pnpm vitest run tests/image-editor.test.ts`
Expected: FAIL — no existen `ImageEditorModal.vue` ni el botón `[data-action="crop-image"]` todavía.

(Si al llegar a este punto ya hiciste los Steps 4-8, esto en realidad debería pasar directo a PASS — en ese caso, saltealo y confirmá el resultado en el Step 11.)

- [ ] **Step 11: Correr los tests para verificar que pasan**

Run: `cd packages/email-builder && pnpm vitest run tests/image-editor.test.ts`
Expected: 8 tests, todos PASS.

- [ ] **Step 12: Correr la suite completa, typecheck y build**

Run: `cd packages/email-builder && pnpm vitest run`
Expected: todos los tests PASS (sin regresiones).

Run: `cd packages/email-builder && pnpm typecheck`
Expected: sin errores. Si `vue-advanced-cropper` no trae tipos utilizables y aparecen errores de tipo en `CropPanel.vue`, resolvelos ahí mismo (por ejemplo, tipando explícitamente el resultado de `getResult()`/`onCropperChange` según lo que reporte `vue-tsc`) antes de continuar.

Run: `cd packages/email-builder && pnpm build`
Expected: build exitoso, sin errores.

- [ ] **Step 13: Verificación manual en browser**

Con la demo corriendo (`pnpm --filter demo dev`, que ya tiene `uploadImage` configurado), insertar/seleccionar un bloque imagen con `src`, click en "Recortar", y confirmar visualmente: el `<Cropper>` real carga la imagen y el rectángulo de recorte es arrastrable/redimensionable; los botones de aspect ratio cambian la forma del rectángulo; rotar/flip/enderezar mueven la imagen visualmente; "Guardar" produce una imagen recortada nueva en el canvas; "Cancelar" no deja rastros. Este paso no es automatizable (ver Global Constraints) pero es obligatorio antes de dar la tarea por terminada.

- [ ] **Step 14: Commit**

```bash
git add packages/email-builder/package.json packages/email-builder/pnpm-lock.yaml packages/email-builder/src/store/ui.ts packages/email-builder/src/components/icons.ts packages/email-builder/src/components/EmailBuilder.vue packages/email-builder/src/components/PropertiesPanel.vue packages/email-builder/src/styles.css packages/email-builder/src/components/ImageEditorModal.vue packages/email-builder/src/components/image-editor/CropPanel.vue packages/email-builder/tests/image-editor.test.ts
git commit -m "feat: editor de imagen — recorte (crop) con vue-advanced-cropper"
```

## Fuera de alcance de este plan

Filter, Resize, Draw, Text (specs y planes separados). Shapes, Stickers, Frame (excluidos del roadmap). Recortar desde la Galería de medios. Radio de esquinas horneado en los píxeles del recorte.
