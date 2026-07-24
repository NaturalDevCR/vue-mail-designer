<template>
  <header class="vmd-header">
    <div class="vmd-header-brand">Vue Mail Designer</div>
    <button type="button" class="vmd-header-btn" data-action="templates" @click="ui.galleryOpen = true">
      {{ t('header.templates') }}
    </button>
    <span class="vmd-header-spacer" />
    <span class="vmd-header-status"><span class="vmd-status-dot" />{{ t('header.saved') }}</span>
    <button type="button" class="vmd-header-btn vmd-header-btn--icon" :title="ui.theme === 'dark' ? t('header.themeLight') : t('header.themeDark')" @click="ui.toggleTheme()">
      <span class="vmd-ico" v-html="ui.theme === 'dark' ? ICONS.sun : ICONS.moon" />
    </button>
    <div ref="exportRoot" class="vmd-export">
      <button type="button" class="vmd-btn-export" data-action="export" @click="menuOpen = !menuOpen">
        {{ t('header.export') }} <span class="vmd-ico" v-html="ICONS.chevronDown" />
      </button>
      <div v-if="menuOpen" class="vmd-export-menu">
        <button type="button" data-action="export-html" @click="exportHtmlFile">{{ t('header.exportHtml') }}</button>
        <button type="button" data-action="export-json" @click="exportJsonFile">{{ t('header.exportJson') }}</button>
        <button type="button" data-action="import-json" @click="fileInput?.click()">{{ t('header.importJson') }}</button>
        <button type="button" data-action="import-unlayer" @click="openUnlayerImport">{{ t('header.importUnlayer') }}</button>
        <button type="button" data-action="export-image" @click="exportImageFile">{{ t('header.exportImage') }}</button>
        <button type="button" data-action="versions" @click="openVersions">{{ t('header.versions') }}</button>
      </div>
    </div>
    <input ref="fileInput" type="file" accept="application/json,.json" style="display: none" @change="onFile" />
    <UnlayerImportDialog v-if="ui.unlayerImportOpen" />
    <VersionsDialog v-if="ui.versionsOpen" />
  </header>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from '../i18n/useI18n'
import { ICONS } from './icons'
import { renderHtml } from '../render/html'
import { useBuilderOptions } from '../options'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'
import UnlayerImportDialog from './UnlayerImportDialog.vue'
import VersionsDialog from './VersionsDialog.vue'
import { exportDocumentImage } from '../export/image'

const pinia = useBuilderPinia()
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)
const options = useBuilderOptions()
const { t } = useI18n()
const menuOpen = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const exportRoot = ref<HTMLElement | null>(null)

function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function exportHtmlFile() {
  downloadFile('email.html', renderHtml(store.doc, options.fonts, options.customBlocks), 'text/html')
  menuOpen.value = false
}
function exportJsonFile() {
  downloadFile('email-design.json', store.exportJson(), 'application/json')
  menuOpen.value = false
}
async function exportImageFile() {
  menuOpen.value = false
  try {
    const html = renderHtml(store.doc, options.fonts, options.customBlocks)
    const dataUrl = await exportDocumentImage(html, store.doc.settings.contentWidth)
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = 'email.png'
    a.click()
  } catch {
    window.alert(t('export.imageError'))
  }
}
function openVersions() {
  ui.versionsOpen = true
  menuOpen.value = false
}
function openUnlayerImport() {
  ui.unlayerImportOpen = true
  menuOpen.value = false
}
async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const result = store.importJson(await file.text())
  if (!result.ok) window.alert(result.error)
  ;(e.target as HTMLInputElement).value = ''
  menuOpen.value = false
}

function onDocClick(e: MouseEvent) {
  if (menuOpen.value && exportRoot.value && !exportRoot.value.contains(e.target as Node)) {
    menuOpen.value = false
  }
}
onMounted(() => document.addEventListener('click', onDocClick))
onUnmounted(() => document.removeEventListener('click', onDocClick))
</script>
