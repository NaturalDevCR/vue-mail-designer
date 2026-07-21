<template>
  <div ref="barEl" class="vmd-canvasbar">
    <div class="vmd-toolbar-group">
      <button type="button" class="vmd-btn" data-action="undo" :disabled="!store.canUndo" :title="`${t('canvasbar.undo')} (⌘Z)`" @click="store.undo()">↶</button>
      <button type="button" class="vmd-btn" data-action="redo" :disabled="!store.canRedo" :title="`${t('canvasbar.redo')} (⌘⇧Z)`" @click="store.redo()">↷</button>
    </div>
    <div class="vmd-canvasbar-center">
      <button type="button" class="vmd-btn" :class="{ 'vmd-active': ui.canvasDevice === 'desktop' }" data-device="desktop" :title="t('canvasbar.desktop')" @click="ui.canvasDevice = 'desktop'">🖥</button>
      <button type="button" class="vmd-btn" :class="{ 'vmd-active': ui.canvasDevice === 'mobile' }" data-device="mobile" :title="t('canvasbar.mobile')" @click="ui.canvasDevice = 'mobile'">📱</button>
    </div>
    <div class="vmd-toolbar-group">
      <button type="button" class="vmd-btn" data-action="preview" :title="t('canvasbar.preview')" @click="ui.previewOpen = true">👁</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import { useI18n } from '../i18n/useI18n'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'

const pinia = useBuilderPinia()
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)
const { t } = useI18n()
const barEl = ref<HTMLElement | null>(null)
let root: HTMLElement | null = null

function onKeydown(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null
  // no interceptar edición de texto (inputs del host o del builder, y el editor Tiptap)
  if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return
  // solo actuar si el foco está dentro de este builder o en el body
  // nota: con múltiples instancias del builder en la misma página y foco en body,
  // todas las instancias manejarán el atajo (edge case aceptable)
  if (t && t !== document.body && root && !root.contains(t)) return

  const meta = e.metaKey || e.ctrlKey
  if (meta && e.key.toLowerCase() === 'z') {
    e.preventDefault()
    if (e.shiftKey) store.redo()
    else store.undo()
  }
}
onMounted(() => {
  root = barEl.value?.closest('.vmd-root') ?? null
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>
