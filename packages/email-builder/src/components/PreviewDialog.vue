<template>
  <div class="vmd-modal" @click.self="ui.previewOpen = false">
    <div class="vmd-modal-box vmd-preview-box">
      <div class="vmd-preview-bar">
        <div class="vmd-toolbar-group">
          <button
            v-for="preset in presets"
            :key="preset.name"
            type="button"
            class="vmd-btn vmd-btn--pill"
            :class="{ 'vmd-btn--primary': ui.previewWidth === preset.width }"
            :data-preset="preset.name"
            :title="preset.title"
            @click="ui.previewWidth = preset.width"
          ><span class="vmd-ico" v-html="ICONS[preset.icon]" /> {{ preset.title }}</button>
          <input
            type="number"
            class="vmd-preview-width vmd-field-input"
            min="320"
            max="1400"
            v-model.number="ui.previewWidth"
          />
        </div>
        <div class="vmd-toolbar-group">
          <button type="button" class="vmd-btn" @click="copyHtml">{{ copied ? '✓ Copiado' : 'Copiar HTML' }}</button>
          <button type="button" class="vmd-btn vmd-btn--icon" title="Cerrar" @click="ui.previewOpen = false"><span class="vmd-ico" v-html="ICONS.close" /></button>
        </div>
      </div>
      <div class="vmd-preview-stage">
        <iframe
          class="vmd-preview-frame"
          :srcdoc="html"
          :style="{ width: ui.previewWidth + 'px' }"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { renderHtml } from '../render/html'
import { ICONS } from './icons'
import { useBuilderOptions } from '../options'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'

const pinia = useBuilderPinia()
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)
const options = useBuilderOptions()
const html = computed(() => renderHtml(store.doc, options.fonts, options.customBlocks))
const copied = ref(false)
const presets = [
  { name: 'desktop', title: 'Escritorio', icon: 'desktop', width: 1000 },
  { name: 'tablet', title: 'Tablet', icon: 'tablet', width: 768 },
  { name: 'mobile', title: 'Móvil', icon: 'mobile', width: 375 },
]

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
