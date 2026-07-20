<template>
  <header class="vmd-header">
    <div class="vmd-header-brand">Vue Mail Designer</div>
    <button type="button" class="vmd-header-btn" data-action="templates" @click="ui.galleryOpen = true">
      Plantillas
    </button>
    <span class="vmd-header-spacer" />
    <span class="vmd-header-status">● Guardado</span>
    <button type="button" class="vmd-header-btn" :title="ui.theme === 'dark' ? 'Tema claro' : 'Tema oscuro'" @click="ui.toggleTheme()">
      {{ ui.theme === 'dark' ? '☀' : '☾' }}
    </button>
    <div ref="exportRoot" class="vmd-export">
      <button type="button" class="vmd-btn-export" data-action="export" @click="menuOpen = !menuOpen">
        EXPORTAR ▾
      </button>
      <div v-if="menuOpen" class="vmd-export-menu">
        <button type="button" data-action="export-html" @click="exportHtmlFile">Exportar HTML</button>
        <button type="button" data-action="export-json" @click="exportJsonFile">Exportar JSON</button>
        <button type="button" data-action="import-json" @click="fileInput?.click()">Importar JSON…</button>
      </div>
    </div>
    <input ref="fileInput" type="file" accept="application/json,.json" style="display: none" @change="onFile" />
  </header>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { renderHtml } from '../render/html'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'

const pinia = useBuilderPinia()
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)
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
  downloadFile('email.html', renderHtml(store.doc), 'text/html')
  menuOpen.value = false
}
function exportJsonFile() {
  downloadFile('email-design.json', store.exportJson(), 'application/json')
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
