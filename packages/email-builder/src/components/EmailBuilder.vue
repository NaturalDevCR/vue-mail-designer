<template>
  <div class="vmd-root" :class="{ 'vmd-dark': ui.theme === 'dark', 'vmd-is-dragging': ui.isDragging }" :style="appearanceStyle">
    <BuilderHeader v-if="props.showHeader !== false" :autosave-status="headerAutosaveStatus" @ai-templates-error="forwardAiTemplateError" />
    <ModalPortal v-if="ui.previewOpen" :label="t('canvasbar.preview')" @cancel="ui.previewOpen = false">
      <PreviewDialog />
    </ModalPortal>
    <div class="vmd-main">
      <section class="vmd-canvas-area">
        <CanvasBar />
        <BuilderCanvas />
      </section>
      <SidePanel @ai-templates-error="forwardAiTemplateError" />
    </div>
    <ModalPortal v-if="ui.galleryOpen" :label="t('dialog.templateTitle')" @cancel="ui.galleryOpen = false">
      <TemplateGallery />
    </ModalPortal>
    <ImageEditorModal v-if="ui.imageEditorBlockId" />
  </div>
</template>

<script setup lang="ts">
import { createPinia } from 'pinia'
import { computed, onMounted, onUnmounted, provide, reactive, ref, watch } from 'vue'
import { createAutosaveController } from '../autosave/controller'
import type {
  AutosaveErrorPayload,
  AutosaveOptions,
  AutosaveRestoredPayload,
  AutosaveSavedPayload,
  AutosaveStatus,
  AutosaveStatusPayload,
} from '../autosave/types'
import { DEFAULT_FONTS, usedFontUrls, type FontDef } from '../fonts'
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
import type { VersionHistoryOptions } from '../versionHistory'
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
  versionHistory?: VersionHistoryOptions
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
  'ai-templates-error': [payload: import('../options').AiTemplateErrorPayload]
  'autosave-status': [payload: AutosaveStatusPayload]
  'autosave-saved': [payload: AutosaveSavedPayload]
  'autosave-restored': [payload: AutosaveRestoredPayload]
  'autosave-error': [payload: AutosaveErrorPayload]
}>()

const pinia = createPinia()
provide(BUILDER_PINIA_KEY, pinia)
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)
const autosaveStatus = ref<AutosaveStatus>('disabled')
const currentDesignSaved = ref(false)
const headerAutosaveStatus = computed(() =>
  autosaveStatus.value === 'saved' && !currentDesignSaved.value ? 'pending' : autosaveStatus.value,
)
provide(MODAL_CONTEXT_KEY, {
  theme: computed(() => ui.theme),
  appearanceStyle,
})

function cloneDocument(document: EmailDocument): EmailDocument {
  return JSON.parse(JSON.stringify(document)) as EmailDocument
}

let autosaveBaseline: string | undefined
let resetHistoryOnRestore = false
function loadWithoutAutosave(design: EmailDocument) {
  store.loadDesign(design)
  autosaveBaseline = JSON.stringify(store.doc)
}

const autosaveController = createAutosaveController({
  applyRestoredDesign(design) {
    loadWithoutAutosave(design)
    if (resetHistoryOnRestore) store.resetHistory()
  },
  onStatus(payload) {
    if (payload.status !== 'restoring') resetHistoryOnRestore = false
    autosaveStatus.value = payload.status
    emit('autosave-status', payload)
  },
  onSaved(payload) {
    currentDesignSaved.value = JSON.stringify(store.doc) === JSON.stringify(payload.design)
    emit('autosave-saved', payload)
  },
  onRestored(payload) {
    currentDesignSaved.value = true
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
const t = (key: string) => localeDict.value[key] ?? key

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

onMounted(() => {
  watch(
    [() => props.versionHistory?.key, () => props.versionHistory?.storage],
    ([key, storage]) => {
      if (store.configureVersionHistory(key === undefined ? undefined : { key, storage })) {
        ui.versionsOpen = false
      }
    },
    { immediate: true },
  )

  watch(
    () => usedFontUrls(store.doc, props.fonts ?? DEFAULT_FONTS),
    (urls) => {
      const stylesheets = new Set(Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'), (link) => link.href))
      for (const url of urls) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = url
        if (stylesheets.has(link.href)) continue
        document.head.appendChild(link)
        stylesheets.add(link.href)
      }
    },
    { immediate: true },
  )

  void autosaveController.configure(props.autosave, props.design)
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

// A design supplied with a different autosave destination becomes its initial baseline.
watch(
  [() => props.design, () => props.autosave],
  ([design, autosave], [previousDesign]) => {
    const newDesign = design !== previousDesign ? design : undefined
    const shouldLoadDesign = newDesign && JSON.stringify(newDesign) !== JSON.stringify(store.doc)
    let loadedBaseline = false

    void autosaveController.configure(autosave, design, (destinationChanged) => {
      currentDesignSaved.value = false
      if (!destinationChanged) return
      resetHistoryOnRestore = true
      if (shouldLoadDesign) {
        loadWithoutAutosave(newDesign)
        loadedBaseline = true
      }
      store.resetHistory()
    })

    if (shouldLoadDesign && !loadedBaseline) store.loadDesign(newDesign)
  },
  { deep: true },
)

// Store -> emits.
watch(
  () => store.doc,
  (doc) => {
    const serialized = JSON.stringify(doc)
    const snapshot = JSON.parse(serialized) as EmailDocument
    const shouldSave = serialized !== autosaveBaseline
    autosaveBaseline = undefined
    emit('update:design', snapshot)
    emit('change', snapshot)
    if (shouldSave) {
      currentDesignSaved.value = false
      autosaveController.handleDesignChange(snapshot)
    }
  },
  { deep: true },
)

function exportHtml(): string {
  const html = renderHtml(store.doc, props.fonts ?? DEFAULT_FONTS, props.customBlocks, props.timerImageUrlBuilder, props.socialIconUrlBuilder)
  emit('export-html', html)
  return html
}

function forwardAiTemplateError(payload: import('../options').AiTemplateErrorPayload): void {
  emit('ai-templates-error', payload)
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
