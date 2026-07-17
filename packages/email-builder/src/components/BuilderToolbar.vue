<template>
  <header class="vmd-toolbar">
    <div class="vmd-toolbar-group">
      <button class="vmd-btn" data-action="undo" :disabled="!store.canUndo" title="Deshacer (⌘Z)" @click="store.undo()">↶</button>
      <button class="vmd-btn" data-action="redo" :disabled="!store.canRedo" title="Rehacer (⌘⇧Z)" @click="store.redo()">↷</button>
    </div>
    <div class="vmd-toolbar-spacer" />
    <div class="vmd-toolbar-group">
      <button class="vmd-btn" data-action="templates" @click="ui.galleryOpen = true">Plantillas</button>
      <button class="vmd-btn" data-action="preview" @click="ui.previewOpen = true">Vista previa</button>
      <button class="vmd-btn" @click="importFile">Importar JSON</button>
      <button class="vmd-btn" @click="exportJson">Exportar JSON</button>
      <button class="vmd-btn vmd-btn--primary" @click="exportHtml">Exportar HTML</button>
      <button class="vmd-btn" :title="ui.theme === 'dark' ? 'Tema claro' : 'Tema oscuro'" @click="ui.toggleTheme()">
        {{ ui.theme === 'dark' ? '☀' : '☾' }}
      </button>
    </div>
    <input ref="fileInput" type="file" accept="application/json,.json" style="display: none" @change="onFile" />
    <PreviewDialog v-if="ui.previewOpen" />
  </header>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { renderHtml } from '../render/html'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'
import PreviewDialog from './PreviewDialog.vue'

const pinia = useBuilderPinia()
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)
const fileInput = ref<HTMLInputElement | null>(null)

function downloadFile(name: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function exportJson() {
  downloadFile('email-design.json', store.exportJson(), 'application/json')
}
function exportHtml() {
  downloadFile('email.html', renderHtml(store.doc), 'text/html')
}
function importFile() {
  fileInput.value?.click()
}
async function onFile(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const text = await file.text()
  const result = store.importJson(text)
  if (!result.ok) window.alert(result.error)
  ;(e.target as HTMLInputElement).value = ''
}

function onKeydown(e: KeyboardEvent) {
  const meta = e.metaKey || e.ctrlKey
  if (meta && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    if (e.shiftKey) store.redo()
    else store.undo()
  }
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>
