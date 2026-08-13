<template>
  <div class="vmd-root" :class="{ 'vmd-dark': ui.theme === 'dark', 'vmd-is-dragging': ui.isDragging }" :style="appearanceStyle">
    <BuilderHeader v-if="props.showHeader !== false" />
    <ModalPortal v-if="ui.previewOpen">
      <PreviewDialog />
    </ModalPortal>
    <div class="vmd-main">
      <section class="vmd-canvas-area">
        <CanvasBar />
        <BuilderCanvas />
      </section>
      <SidePanel />
    </div>
    <ModalPortal v-if="ui.galleryOpen">
      <TemplateGallery />
    </ModalPortal>
    <ModalPortal v-if="ui.imageEditorBlockId">
      <ImageEditorModal />
    </ModalPortal>
  </div>
</template>

<script setup lang="ts">
import { createPinia } from 'pinia'
import { computed, nextTick, onMounted, onUnmounted, provide, reactive, watch } from 'vue'
import { createAutosaveController } from '../autosave/controller'
import type {
  AutosaveErrorPayload,
  AutosaveOptions,
  AutosaveRestoredPayload,
  AutosaveSavedPayload,
  AutosaveStatus,
  AutosaveStatusPayload,
} from '../autosave/types'
import { DEFAULT_FONTS, type FontDef } from '../fonts'
import type { ImageResult } from '../imageSearch'
import { en } from '../i18n/en'
import { es } from '../i18n/es'
import type { LocaleDict } from '../i18n/keys'
import { provideI18n, type ResolvedLocale } from '../i18n/useI18n'
import type { UnlayerFetch } from '../import/unlayerUrl'
import type { MediaLibraryOptions } from '../mediaLibrary'
import { BUILDER_OPTIONS_KEY, isThemeAppearance, type AiOptions, type AiTemplateOptions, type Appearance, type CustomBlockDef, type MergeTagItem, type SocialIconUrlBuilder, type SpecialLink, type ThemeAppearance, type TimerImageUrlBuilder, type ToolConfig } from '../options'
import type { BlockType } from '../schema'
import { renderHtml } from '../render/html'
import { exportDocumentImage } from '../export/image'
import type { EmailDocument } from '../schema'
import { useDocumentStore } from '../store/document'
import { BUILDER_PINIA_KEY } from '../store/keys'
import { useUiStore } from '../store/ui'
import { MODAL_CONTEXT_KEY } from '../modalContext'
import type { EmailTemplate } from '../templates'
import BuilderCanvas from './BuilderCanvas.vue'
import BuilderHeader from './BuilderHeader.vue'
import CanvasBar from './CanvasBar.vue'
import ImageEditorModal from './ImageEditorModal.vue'
import ModalPortal from './ModalPortal.vue'
import PreviewDialog from './PreviewDialog.vue'
import SidePanel from './SidePanel.vue'
import TemplateGallery from './TemplateGallery.vue'
import '../styles.css'

const props = withDefaults(defineProps<{
  design?: EmailDocument
  mergeTags?: MergeTagItem[]
  templates?: EmailTemplate[]
  specialLinks?: SpecialLink[]
  uploadImage?: (file: File) => Promise<string>
  imageSearch?: (query: string) => Promise<ImageResult[]>
  timerImageUrlBuilder?: TimerImageUrlBuilder
  socialIconUrlBuilder?: SocialIconUrlBuilder
  unlayerFetch?: UnlayerFetch
  theme?: 'light' | 'dark'
  locale?: 'es' | 'en' | LocaleDict
  showHeader?: boolean
  appearance?: Appearance | ThemeAppearance
  tools?: Partial<Record<BlockType, ToolConfig>>
  fonts?: FontDef[]
  customBlocks?: CustomBlockDef[]
  mediaLibrary?: MediaLibraryOptions
  ai?: AiOptions
  aiTemplates?: AiTemplateOptions
  autosave?: AutosaveOptions
}>(), {
  showHeader: true,
})

const APPEARANCE_VARS: Record<keyof Appearance, string> = {
  accent: '--vmd-accent',
  panel: '--vmd-panel',
  border: '--vmd-border',
  background: '--vmd-bg',
  foreground: '--vmd-fg',
  muted: '--vmd-muted',
}
const appearanceStyle = computed<Record<string, string>>(() => {
  const configured = props.appearance
  if (!configured) return {}

  const colors = isThemeAppearance(configured) ? configured[ui.theme] : configured
  if (!colors) return {}

  const out: Record<string, string> = {}
  for (const key of Object.keys(APPEARANCE_VARS) as (keyof Appearance)[]) {
    const value = colors[key]
    if (value) out[APPEARANCE_VARS[key]] = value
  }
  return out
})

const emit = defineEmits<{
  'update:design': [design: EmailDocument]
  change: [design: EmailDocument]
  'export-html': [html: string]
  'autosave-status': [payload: AutosaveStatusPayload]
  'autosave-saved': [payload: AutosaveSavedPayload]
  'autosave-restored': [payload: AutosaveRestoredPayload]
  'autosave-error': [payload: AutosaveErrorPayload]
}>()

const pinia = createPinia()
provide(BUILDER_PINIA_KEY, pinia)
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)
provide(MODAL_CONTEXT_KEY, {
  theme: computed(() => ui.theme),
  appearanceStyle,
})

function cloneDocument(document: EmailDocument): EmailDocument {
  return JSON.parse(JSON.stringify(document)) as EmailDocument
}

function getExplicitInitialDesign() {
  return props.design ? cloneDocument(props.design) : undefined
}

let autosaveSuppressionDepth = 0
const autosaveController = createAutosaveController({
  applyRestoredDesign(design) {
    autosaveSuppressionDepth += 1
    store.loadDesign(design)
    void nextTick(() => {
      autosaveSuppressionDepth = Math.max(0, autosaveSuppressionDepth - 1)
    })
  },
  onStatus(payload) {
    emit('autosave-status', payload)
  },
  onSaved(payload) {
    emit('autosave-saved', payload)
  },
  onRestored(payload) {
    emit('autosave-restored', payload)
  },
  onError(payload) {
    emit('autosave-error', payload)
  },
})

// Resolve the i18n dictionary from the public locale prop.
const localeDict = computed<LocaleDict>(() => {
  if (props.locale === 'es') return { ...en, ...es }
  if (props.locale === 'en' || props.locale === undefined) return { ...en }
  return { ...en, ...props.locale }
})
const resolvedLocale = computed<ResolvedLocale>(() => (props.locale === 'es' ? 'es' : 'en'))
provideI18n(() => localeDict.value, () => resolvedLocale.value)

// Provide reactive child options while preserving prop reactivity through getters.
provide(
  BUILDER_OPTIONS_KEY,
  reactive({
    get mergeTags() {
      return props.mergeTags ?? []
    },
    get ai() {
      return props.ai
    },
    get aiTemplates() {
      return props.aiTemplates
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
    get timerImageUrlBuilder() {
      return props.timerImageUrlBuilder
    },
    get socialIconUrlBuilder() {
      return props.socialIconUrlBuilder
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

// Inject Google Fonts links into the host document for canvas WYSIWYG rendering.
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

  void autosaveController.configure(props.autosave, getExplicitInitialDesign())
})

onUnmounted(() => {
  autosaveController.dispose()
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
  // The initial load is the baseline and should not enter undo history.
  store.resetHistory()
}

// Prop -> store.
watch(
  () => props.design,
  (next) => {
    if (next && JSON.stringify(next) !== JSON.stringify(store.doc)) {
      store.loadDesign(next)
    }
  },
)

// Store -> emits.
watch(
  () => store.doc,
  (doc) => {
    const snapshot = cloneDocument(doc)
    emit('update:design', snapshot)
    emit('change', snapshot)
    if (autosaveSuppressionDepth === 0) {
      autosaveController.handleDesignChange(snapshot)
    }
  },
  { deep: true },
)

watch(
  () => props.autosave,
  (nextAutosave) => {
    void autosaveController.configure(nextAutosave, getExplicitInitialDesign())
  },
  { deep: true },
)

function exportHtml(): string {
  const html = renderHtml(store.doc, props.fonts ?? DEFAULT_FONTS, props.customBlocks, props.timerImageUrlBuilder, props.socialIconUrlBuilder)
  emit('export-html', html)
  return html
}
function exportJson(): string {
  return store.exportJson()
}
function getDesign(): EmailDocument {
  return cloneDocument(store.doc)
}
function loadDesign(doc: EmailDocument): void {
  store.loadDesign(doc)
}
function getAutosaveStatus(): AutosaveStatus {
  return autosaveController.getStatus()
}
function exportImage(): Promise<string> {
  const html = renderHtml(store.doc, props.fonts ?? DEFAULT_FONTS, props.customBlocks, props.timerImageUrlBuilder, props.socialIconUrlBuilder)
  return exportDocumentImage(html, store.doc.settings.contentWidth)
}

defineExpose({ exportHtml, exportJson, getDesign, loadDesign, getAutosaveStatus, exportImage })
</script>
