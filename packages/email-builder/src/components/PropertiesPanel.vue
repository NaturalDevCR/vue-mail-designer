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
    </template>

    <!-- Fila seleccionada -->
    <template v-else-if="row">
      <ColorField label="Fondo" :model-value="row.style.backgroundColor" @update:model-value="store.updateRowStyle(row.id, { backgroundColor: $event })" />
      <NumberField label="Radio borde" :model-value="row.style.borderRadius" :min="0" :max="32" @update:model-value="store.updateRowStyle(row.id, { borderRadius: $event })" />
      <PaddingField label="Padding" :model-value="row.style.padding" @update:model-value="store.updateRowStyle(row.id, { padding: $event })" />
    </template>
  </div>
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
  row: 'Fila',
}

const title = computed(() => {
  if (block.value) return TYPE_LABELS[block.value.type] ?? block.value.type
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
