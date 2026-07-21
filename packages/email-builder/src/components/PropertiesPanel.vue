<template>
  <div class="vmd-props" @click.stop>
    <div class="vmd-props-header">
      <h3>{{ title }}</h3>
      <div class="vmd-toolbar-group">
        <button type="button" class="vmd-mini-btn" title="Duplicar" data-action="props-duplicate" @click="duplicate">⧉</button>
        <button type="button" class="vmd-mini-btn vmd-mini-btn--danger" title="Eliminar" data-action="props-delete" @click="remove">🗑</button>
        <button type="button" class="vmd-mini-btn" title="Cerrar" data-action="props-close" @click="store.select(null)">✕</button>
      </div>
    </div>

    <!-- Bloque seleccionado -->
    <template v-if="block">
      <template v-if="block.type === 'heading'">
        <TextField label="Texto" :model-value="block.text" @update:model-value="upd({ text: $event })" />
        <SelectField label="Nivel" :model-value="String(block.level)" :options="[{label:'H1',value:'1'},{label:'H2',value:'2'},{label:'H3',value:'3'}]" @update:model-value="upd({ level: Number($event) })" />
        <SelectField label="Fuente" :model-value="block.fontFamily ?? ''" :options="FONT_OPTIONS" @update:model-value="updFont" />
        <ColorField label="Color" :model-value="block.style.color" @update:model-value="upd({ style: { color: $event } })" />
        <NumberField label="Tamaño" :model-value="block.style.fontSize" :min="10" :max="72" @update:model-value="upd({ style: { fontSize: $event } })" />
        <AlignField label="Alineación" :model-value="block.style.align" @update:model-value="upd({ style: { align: $event } })" />
        <PaddingField label="Padding" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'text'">
        <SelectField label="Fuente" :model-value="block.fontFamily ?? ''" :options="FONT_OPTIONS" @update:model-value="updFont" />
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
          <button type="button" class="vmd-mini-btn vmd-mini-btn--danger" @click="removeNetwork(i)">🗑</button>
        </div>
        <button type="button" class="vmd-btn" @click="addNetwork">+ Agregar red</button>
        <NumberField label="Tamaño ícono" :model-value="block.iconSize" :min="16" :max="64" @update:model-value="upd({ iconSize: $event })" />
        <NumberField label="Espaciado" :model-value="block.spacing" :min="0" :max="32" @update:model-value="upd({ spacing: $event })" />
        <AlignField label="Alineación" :model-value="block.align" @update:model-value="upd({ align: $event })" />
      </template>

      <template v-else-if="block.type === 'menu'">
        <div v-for="(it, i) in block.items" :key="i" class="vmd-social-row">
          <TextField label="Etiqueta" :model-value="it.label" @update:model-value="setMenuItem(i, { label: $event })" />
          <TextField label="URL" :model-value="it.href" @update:model-value="setMenuItem(i, { href: $event })" />
          <button type="button" class="vmd-mini-btn vmd-mini-btn--danger" @click="removeMenuItem(i)">🗑</button>
        </div>
        <button type="button" class="vmd-btn" @click="addMenuItem">+ Agregar ítem</button>
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

      <template v-else-if="block.type === 'table'">
        <CheckboxField label="Fila de encabezado" :model-value="block.headerRow" @update:model-value="upd({ headerRow: $event })" />
        <div class="vmd-table-toolbar">
          <button type="button" class="vmd-btn" @click="addTableRow">+ Fila</button>
          <button type="button" class="vmd-btn" @click="removeLastTableRow">− Fila</button>
          <button type="button" class="vmd-btn" @click="addTableColumn">+ Columna</button>
          <button type="button" class="vmd-btn" @click="removeLastTableColumn">− Columna</button>
        </div>
        <div class="vmd-table-grid">
          <div v-for="(tRow, r) in block.rows" :key="r" class="vmd-table-grid-row">
            <textarea
              v-for="(cell, c) in tRow"
              :key="c"
              class="vmd-field-input vmd-table-cell-input"
              rows="2"
              :data-cell="`${r}-${c}`"
              :value="cell"
              @input="setTableCell(r, c, ($event.target as HTMLTextAreaElement).value)"
            />
          </div>
        </div>
        <ColorField label="Color de borde" :model-value="block.style.borderColor" @update:model-value="upd({ style: { borderColor: $event } })" />
        <NumberField label="Grosor de borde" :model-value="block.style.borderWidth" :min="0" :max="8" @update:model-value="upd({ style: { borderWidth: $event } })" />
        <ColorField label="Fondo encabezado" :model-value="block.style.headerBackground" @update:model-value="upd({ style: { headerBackground: $event } })" />
        <ColorField label="Color de texto" :model-value="block.style.color" @update:model-value="upd({ style: { color: $event } })" />
        <NumberField label="Tamaño fuente" :model-value="block.style.fontSize" :min="10" :max="32" @update:model-value="upd({ style: { fontSize: $event } })" />
        <NumberField label="Padding de celda" :model-value="block.style.cellPadding" :min="0" :max="32" @update:model-value="upd({ style: { cellPadding: $event } })" />
        <PaddingField label="Padding" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'gallery'">
        <div v-for="(img, i) in block.images" :key="i" class="vmd-social-row">
          <TextField label="URL" :model-value="img.src" @update:model-value="setGalleryImage(i, { src: $event })" />
          <TextField label="Alt" :model-value="img.alt" @update:model-value="setGalleryImage(i, { alt: $event })" />
          <TextField label="Enlace (opcional)" :model-value="img.href ?? ''" @update:model-value="setGalleryImage(i, { href: $event })" />
          <button type="button" class="vmd-mini-btn vmd-mini-btn--danger" @click="removeGalleryImage(i)">🗑</button>
        </div>
        <button type="button" class="vmd-btn" @click="addGalleryImage">+ Agregar imagen</button>
        <SelectField label="Columnas" :model-value="String(block.columns)" :options="[{label:'2',value:'2'},{label:'3',value:'3'},{label:'4',value:'4'}]" @update:model-value="upd({ columns: Number($event) })" />
        <NumberField label="Espaciado" :model-value="block.gap" :min="0" :max="32" @update:model-value="upd({ gap: $event })" />
        <PaddingField label="Padding" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'timer'">
        <TextField label="Fecha límite (ISO)" :model-value="block.endDate" @update:model-value="upd({ endDate: $event })" />
        <TextField label="URL de imagen" :model-value="block.imageUrl" @update:model-value="upd({ imageUrl: $event })" />
        <TextField label="Texto alternativo" :model-value="block.alt" @update:model-value="upd({ alt: $event })" />
        <NumberField label="Ancho %" :model-value="block.widthPct" :min="10" :max="100" @update:model-value="upd({ widthPct: $event })" />
        <PaddingField label="Padding" :model-value="block.style.padding" @update:model-value="upd({ style: { padding: $event } })" />
      </template>

      <template v-else-if="block.type === 'custom'">
        <template v-for="field in customFields" :key="field.key">
          <ColorField v-if="field.type === 'color'" :label="field.label" :model-value="String(block.data[field.key] ?? '#000000')" @update:model-value="updData(field.key, $event)" />
          <NumberField v-else-if="field.type === 'number'" :label="field.label" :model-value="Number(block.data[field.key] ?? 0)" @update:model-value="updData(field.key, $event)" />
          <label v-else-if="field.type === 'textarea'" class="vmd-field">
            <span class="vmd-field-label">{{ field.label }}</span>
            <textarea class="vmd-field-input vmd-field-code" rows="4" :value="String(block.data[field.key] ?? '')" @input="updData(field.key, ($event.target as HTMLTextAreaElement).value)" />
          </label>
          <TextField v-else :label="field.label" :model-value="String(block.data[field.key] ?? '')" @update:model-value="updData(field.key, $event)" />
        </template>
      </template>

      <div class="vmd-props-section-title">Visibilidad</div>
      <CheckboxField label="Ocultar en escritorio" :model-value="!!block.hideDesktop" @update:model-value="upd({ hideDesktop: $event })" />
      <CheckboxField label="Ocultar en móvil" :model-value="!!block.hideMobile" @update:model-value="upd({ hideMobile: $event })" />
    </template>

    <!-- Fila seleccionada -->
    <template v-else-if="row">
      <ColorField label="Fondo" :model-value="row.style.backgroundColor" @update:model-value="store.updateRowStyle(row.id, { backgroundColor: $event })" />
      <NumberField label="Radio borde" :model-value="row.style.borderRadius" :min="0" :max="32" @update:model-value="store.updateRowStyle(row.id, { borderRadius: $event })" />
      <PaddingField label="Padding" :model-value="row.style.padding" @update:model-value="store.updateRowStyle(row.id, { padding: $event })" />

      <div class="vmd-props-section-title">Imagen de fondo</div>
      <TextField label="URL" :model-value="row.style.backgroundImage?.url ?? ''" @update:model-value="setRowBgImage({ url: $event })" />
      <SelectField label="Repetición" :model-value="row.style.backgroundImage?.repeat ?? 'no-repeat'" :options="BG_REPEAT_OPTIONS" @update:model-value="setRowBgImage({ repeat: $event as RowBackgroundImage['repeat'] })" />
      <SelectField label="Tamaño" :model-value="row.style.backgroundImage?.size ?? 'auto'" :options="BG_SIZE_OPTIONS" @update:model-value="setRowBgImage({ size: $event as RowBackgroundImage['size'] })" />
      <TextField label="Posición" :model-value="row.style.backgroundImage?.position ?? 'center'" @update:model-value="setRowBgImage({ position: $event })" />

      <div class="vmd-props-section-title">Visibilidad</div>
      <CheckboxField label="Ocultar en escritorio" :model-value="!!row.hideDesktop" @update:model-value="store.updateRow(row.id, { hideDesktop: $event })" />
      <CheckboxField label="Ocultar en móvil" :model-value="!!row.hideMobile" @update:model-value="store.updateRow(row.id, { hideMobile: $event })" />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { DEFAULT_FONTS } from '../fonts'
import { useBuilderOptions } from '../options'
import type { Row, SocialNetworkKind } from '../schema'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import AlignField from './fields/AlignField.vue'
import CheckboxField from './fields/CheckboxField.vue'
import ColorField from './fields/ColorField.vue'
import NumberField from './fields/NumberField.vue'
import PaddingField from './fields/PaddingField.vue'
import SelectField from './fields/SelectField.vue'
import TextField from './fields/TextField.vue'

type RowBackgroundImage = NonNullable<Row['style']['backgroundImage']>

const store = useDocumentStore(useBuilderPinia())
const options = useBuilderOptions()
const block = computed(() => store.selectedBlock)
const row = computed(() => store.selectedRow)
const uploading = ref(false)

const TYPE_LABELS: Record<string, string> = {
  heading: 'Título',
  text: 'Texto',
  image: 'Imagen',
  button: 'Botón',
  divider: 'Divisor',
  spacer: 'Espacio',
  social: 'Redes',
  menu: 'Menú',
  html: 'HTML',
  video: 'Video',
  table: 'Tabla',
  gallery: 'Galería',
  timer: 'Timer',
  row: 'Fila',
}

const FONT_OPTIONS = computed(() => {
  const fonts = options.fonts ?? DEFAULT_FONTS
  const opts = [{ label: 'Heredar', value: '' }, ...fonts.map((f) => ({ label: f.label, value: f.value }))]
  // conserva visible una fuente ya guardada que no esté en la lista (p. ej. 'Arial' de docs viejos)
  const current = block.value?.type === 'heading' || block.value?.type === 'text' ? block.value.fontFamily : undefined
  if (current && !opts.some((o) => o.value === current)) opts.push({ label: 'Actual', value: current })
  return opts
})

const BG_REPEAT_OPTIONS = [
  { label: 'Sin repetir', value: 'no-repeat' },
  { label: 'Repetir', value: 'repeat' },
  { label: 'Repetir horizontal', value: 'repeat-x' },
  { label: 'Repetir vertical', value: 'repeat-y' },
]

const BG_SIZE_OPTIONS = [
  { label: 'Auto', value: 'auto' },
  { label: 'Cubrir', value: 'cover' },
  { label: 'Contener', value: 'contain' },
]

const title = computed(() => {
  const b = block.value
  if (b) {
    if (b.type === 'custom') {
      return options.customBlocks?.find((d) => d.type === b.customType)?.label ?? b.customType
    }
    return TYPE_LABELS[b.type] ?? b.type
  }
  if (row.value) return TYPE_LABELS.row
  return ''
})

function duplicate() {
  const sel = store.selection
  if (!sel) return
  if (sel.kind === 'block') store.duplicateBlock(sel.id)
  else store.duplicateRow(sel.id)
}

function remove() {
  const sel = store.selection
  if (!sel) return
  if (sel.kind === 'block') store.removeBlock(sel.id)
  else store.removeRow(sel.id)
}

const NETWORK_OPTIONS = [
  'facebook', 'instagram', 'x', 'linkedin', 'youtube', 'tiktok', 'whatsapp', 'web',
].map((v) => ({ label: v, value: v }))

function upd(patch: Record<string, unknown>) {
  if (block.value) store.updateBlock(block.value.id, patch)
}

const customFields = computed(() => {
  const b = block.value
  if (b?.type !== 'custom') return []
  return options.customBlocks?.find((d) => d.type === b.customType)?.fields ?? []
})

function updData(key: string, value: unknown) {
  const b = block.value
  if (b?.type !== 'custom') return
  upd({ data: { ...b.data, [key]: value } })
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

function updFont(value: string) {
  upd({ fontFamily: value === '' ? undefined : value })
}

function setTableCell(r: number, c: number, value: string) {
  if (block.value?.type !== 'table') return
  const rows = block.value.rows.map((tRow, ri) => (ri === r ? tRow.map((cell, ci) => (ci === c ? value : cell)) : tRow))
  upd({ rows })
}
function addTableRow() {
  if (block.value?.type !== 'table') return
  const cols = block.value.rows[0]?.length ?? 1
  upd({ rows: [...block.value.rows, Array(cols).fill('')] })
}
function removeLastTableRow() {
  if (block.value?.type !== 'table') return
  if (block.value.rows.length <= 1) return
  upd({ rows: block.value.rows.slice(0, -1) })
}
function addTableColumn() {
  if (block.value?.type !== 'table') return
  upd({ rows: block.value.rows.map((tRow) => [...tRow, '']) })
}
function removeLastTableColumn() {
  if (block.value?.type !== 'table') return
  if ((block.value.rows[0]?.length ?? 0) <= 1) return
  upd({ rows: block.value.rows.map((tRow) => tRow.slice(0, -1)) })
}

function setGalleryImage(i: number, patch: Partial<{ src: string; alt: string; href: string }>) {
  if (block.value?.type !== 'gallery') return
  upd({ images: block.value.images.map((img, j) => (j === i ? { ...img, ...patch } : img)) })
}
function addGalleryImage() {
  if (block.value?.type !== 'gallery') return
  upd({ images: [...block.value.images, { src: '', alt: '' }] })
}
function removeGalleryImage(i: number) {
  if (block.value?.type !== 'gallery') return
  upd({ images: block.value.images.filter((_, j) => j !== i) })
}

function setRowBgImage(patch: Partial<RowBackgroundImage>) {
  if (!row.value) return
  const current: RowBackgroundImage = row.value.style.backgroundImage ?? {
    url: '', repeat: 'no-repeat', size: 'auto', position: 'center',
  }
  store.updateRowStyle(row.value.id, { backgroundImage: { ...current, ...patch } })
}
</script>
