<template>
  <div class="vmd-root" :class="{ 'vmd-dark': ui.theme === 'dark', 'vmd-is-dragging': ui.isDragging }">
    <BuilderHeader />
    <PreviewDialog v-if="ui.previewOpen" />
    <div class="vmd-main">
      <section class="vmd-canvas-area">
        <CanvasBar />
        <BuilderCanvas />
      </section>
      <SidePanel />
    </div>
    <TemplateGallery v-if="ui.galleryOpen" />
  </div>
</template>

<script setup lang="ts">
import { createPinia } from 'pinia'
import { provide, reactive, watch } from 'vue'
import type { ImageResult } from '../imageSearch'
import type { UnlayerFetch } from '../import/unlayerUrl'
import { BUILDER_OPTIONS_KEY, type MergeTagDef } from '../options'
import { renderHtml } from '../render/html'
import type { EmailDocument } from '../schema'
import { useDocumentStore } from '../store/document'
import { BUILDER_PINIA_KEY } from '../store/keys'
import { useUiStore } from '../store/ui'
import type { EmailTemplate } from '../templates'
import BuilderCanvas from './BuilderCanvas.vue'
import BuilderHeader from './BuilderHeader.vue'
import CanvasBar from './CanvasBar.vue'
import PreviewDialog from './PreviewDialog.vue'
import SidePanel from './SidePanel.vue'
import TemplateGallery from './TemplateGallery.vue'
import '../styles.css'

const props = defineProps<{
  design?: EmailDocument
  mergeTags?: MergeTagDef[]
  templates?: EmailTemplate[]
  uploadImage?: (file: File) => Promise<string>
  imageSearch?: (query: string) => Promise<ImageResult[]>
  unlayerFetch?: UnlayerFetch
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
    get imageSearch() {
      return props.imageSearch
    },
    get unlayerFetch() {
      return props.unlayerFetch
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

if (props.design) {
  store.loadDesign(props.design)
  // la carga inicial es la línea base: no debe quedar en el historial de undo
  store.resetHistory()
}

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
