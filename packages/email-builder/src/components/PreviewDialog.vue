<template>
  <div class="vmd-modal" @click.self="ui.previewOpen = false">
    <div class="vmd-modal-box vmd-preview-box">
      <div class="vmd-preview-bar">
        <div class="vmd-toolbar-group">
          <button type="button" class="vmd-btn" :class="{ 'vmd-btn--primary': ui.previewDevice === 'desktop' }" data-device="desktop" @click="ui.previewDevice = 'desktop'">🖥 Escritorio</button>
          <button type="button" class="vmd-btn" :class="{ 'vmd-btn--primary': ui.previewDevice === 'mobile' }" data-device="mobile" @click="ui.previewDevice = 'mobile'">📱 Móvil</button>
        </div>
        <div class="vmd-toolbar-group">
          <button type="button" class="vmd-btn" @click="copyHtml">{{ copied ? '✓ Copiado' : 'Copiar HTML' }}</button>
          <button type="button" class="vmd-btn" @click="ui.previewOpen = false">Cerrar ✕</button>
        </div>
      </div>
      <div class="vmd-preview-stage">
        <iframe
          class="vmd-preview-frame"
          :srcdoc="html"
          :style="{ width: ui.previewDevice === 'mobile' ? '375px' : '600px' }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { renderHtml } from '../render/html'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'

const pinia = useBuilderPinia()
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)
const html = computed(() => renderHtml(store.doc))
const copied = ref(false)

async function copyHtml() {
  try {
    await navigator.clipboard.writeText(html.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    window.alert('No se pudo copiar al portapapeles.')
  }
}
</script>
