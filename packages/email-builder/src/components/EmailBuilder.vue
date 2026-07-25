<template>
  <div class="vmd-root" :class="{ 'vmd-dark': ui.theme === 'dark', 'vmd-is-dragging': ui.isDragging }" :style="appearanceStyle">
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
import { computed, onMounted, provide, reactive, watch } from 'vue'
import { DEFAULT_FONTS, type FontDef } from '../fonts'
import type { ImageResult } from '../imageSearch'
import { en } from '../i18n/en'
import { es } from '../i18n/es'
import type { LocaleDict } from '../i18n/keys'
import { provideI18n } from '../i18n/useI18n'
import type { UnlayerFetch } from '../import/unlayerUrl'
import type { MediaLibraryOptions } from '../mediaLibrary'
import { BUILDER_OPTIONS_KEY, type Appearance, type CustomBlockDef, type MergeTagItem, type SpecialLink, type ToolConfig } from '../options'
import type { BlockType } from '../schema'
import { renderHtml } from '../render/html'
import { exportDocumentImage } from '../export/image'
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

const APPEARANCE_VARS: Record<keyof Appearance, string> = {
  accent: '--vmd-accent',
  panel: '--vmd-panel',
  border: '--vmd-border',
  background: '--vmd-bg',
  foreground: '--vmd-fg',
  muted: '--vmd-muted',
}
const appearanceStyle = computed<Record<string, string>>(() => {
  const out: Record<string, string> = {}
  const a = props.appearance
  if (a) {
    for (const key of Object.keys(APPEARANCE_VARS) as (keyof Appearance)[]) {
      const value = a[key]
      if (value) out[APPEARANCE_VARS[key]] = value
    }
  }
  return out
})

const emit = defineEmits<{
  'update:design': [design: EmailDocument]
  change: [design: EmailDocument]
  'export-html': [html: string]
}>()

const pinia = createPinia()
provide(BUILDER_PINIA_KEY, pinia)
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)

// diccionario i18n resuelto a partir de la prop `locale`
const localeDict = computed<LocaleDict>(() => {
  const locale = props.locale
  if (locale === 'en') return { ...es, ...en }
  if (locale === 'es' || locale === undefined) return { ...es }
  return { ...es, ...locale }
})
provideI18n(() => localeDict.value)

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
    get tools() {
      return props.tools
    },
    get fonts() {
      return props.fonts ?? DEFAULT_FONTS
    },
    get specialLinks() {
      return props.specialLinks
    },
    get customBlocks() {
      return props.customBlocks
    },
    get mediaLibrary() {
      return props.mediaLibrary
    },
  }),
)

// inyecta los <link> de Google Fonts en el documento host para WYSIWYG en el canvas
onMounted(() => {
  const fonts = props.fonts ?? DEFAULT_FONTS
  for (const font of fonts) {
    if (!font.url) continue
    const id = 'vmd-font-' + btoa(font.url).replace(/[^a-z0-9]/gi, '').slice(0, 24)
    if (document.getElementById(id)) continue
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    link.href = font.url
    document.head.appendChild(link)
  }
})

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
  const html = renderHtml(store.doc, props.fonts ?? DEFAULT_FONTS, props.customBlocks)
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
function exportImage(): Promise<string> {
  const html = renderHtml(store.doc, props.fonts ?? DEFAULT_FONTS, props.customBlocks)
  return exportDocumentImage(html, store.doc.settings.contentWidth)
}

defineExpose({ exportHtml, exportJson, getDesign, loadDesign, exportImage })
</script>
