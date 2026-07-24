<template>
  <section ref="scrollEl" class="vmd-canvas" @click.self="store.select(null)">
    <div class="vmd-canvas-page" :style="pageStyle">
      <div ref="rowsEl" class="vmd-canvas-rows" :class="{ 'vmd-drop-active': containerEdge !== null }">
        <div v-if="store.doc.rows.length === 0" class="vmd-canvas-empty">
          <p>{{ t('canvas.emptyHint') }}</p>
          <button type="button" class="vmd-btn vmd-btn--primary" @click="store.addRow([100])">{{ t('canvas.addRow') }}</button>
        </div>
        <RowView v-for="row in store.doc.rows" :key="row.id" :row="row" />
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'
import { useI18n } from '../i18n/useI18n'
import { useDragMonitor, useDropTarget } from '../dnd/usePragmatic'
import { dropBlockOnEmptyCanvas, dropRow } from '../dnd/applyDrop'
import RowView from './RowView.vue'

const pinia = useBuilderPinia()
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)
const { t } = useI18n()

const scrollEl = ref<HTMLElement | null>(null)
const rowsEl = ref<HTMLElement | null>(null)

const pageWidth = computed(() => (ui.canvasDevice === 'mobile' ? 375 : store.doc.settings.contentWidth))

const pageStyle = computed(() => {
  const s = store.doc.settings
  const style: Record<string, string> = {
    width: pageWidth.value + 'px',
    backgroundColor: s.backgroundColor,
  }
  if (s.backgroundImage) {
    style.backgroundImage = `url(${s.backgroundImage.url})`
    style.backgroundSize = s.backgroundImage.size
    style.backgroundPosition = s.backgroundImage.position
    style.backgroundRepeat = s.backgroundImage.repeat
  }
  return style
})

// zona de drop del contenedor: recibe filas y las agrega al final (las RowView internas
// manejan la posición precisa; esta atrapa el drop en el espacio vacío o cuando no hay filas)
const { edge: containerEdge } = useDropTarget({
  el: rowsEl,
  getData: () => ({ vmdRowsContainer: true }),
  accept: (d) => d.kind === 'palette-row' || d.kind === 'canvas-row' || (store.doc.rows.length === 0 && (d.kind === 'palette-block' || d.kind === 'canvas-block')),
  onDrop: (drag) => {
    if (drag.kind === 'palette-row' || drag.kind === 'canvas-row') dropRow(store, drag, null, null)
    else if (store.doc.rows.length === 0) dropBlockOnEmptyCanvas(store, drag)
  },
})

useDragMonitor({
  scrollEl,
  onStart: () => {
    ui.isDragging = true
  },
  onEnd: () => {
    ui.isDragging = false
    store.sealHistory()
  },
})
</script>
