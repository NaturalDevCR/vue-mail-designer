<template>
  <div
    ref="el"
    class="vmd-row"
    :class="{ 'vmd-selected': isSelected, 'vmd-drop-before': rowEdge === 'before', 'vmd-drop-after': rowEdge === 'after' }"
    @click.stop="selectRow"
  >
    <!-- insertar fila arriba / abajo -->
    <button type="button" class="vmd-row-add vmd-row-add--top" :title="t('props.addAbove')" @click.stop="addAbove">
      <span class="vmd-ico" v-html="ICONS.plus" />
    </button>
    <button type="button" class="vmd-row-add vmd-row-add--bottom" :title="t('props.addBelow')" @click.stop="addBelow">
      <span class="vmd-ico" v-html="ICONS.plus" />
    </button>

    <!-- handle de arrastre y etiqueta — en el margen ancho del canvas, nunca sobre el
         contenido (que vive centrado y más angosto en .vmd-row-inner) -->
    <button ref="handle" type="button" class="vmd-row-handle vmd-mini-btn vmd-drag-handle" :title="t('props.move')"><span class="vmd-ico" v-html="ICONS.move" /></button>
    <span class="vmd-row-tag">{{ t('props.row') }}</span>

    <!-- "body" de la fila: ancho de contenido, centrado — aquí vive el contenido real -->
    <div class="vmd-row-inner" :style="rowInnerStyle">
      <!-- mini-toolbar pegada al borde superior del contenido, igual que la de cada bloque -->
      <div class="vmd-row-actions">
        <button type="button" class="vmd-mini-btn" :title="t('props.rowSettings')" @click.stop="selectRow"><span class="vmd-ico" v-html="ICONS.settings" /></button>
        <button type="button" class="vmd-mini-btn" :title="t('props.duplicate')" @click.stop="store.duplicateRow(row.id)"><span class="vmd-ico" v-html="ICONS.duplicate" /></button>
        <button type="button" class="vmd-mini-btn vmd-mini-btn--danger" :title="t('props.delete')" @click.stop="store.removeRow(row.id)"><span class="vmd-ico" v-html="ICONS.trash" /></button>
      </div>
      <div class="vmd-row-columns">
        <ColumnView v-for="column in row.columns" :key="column.id" :column="column" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CSSProperties } from 'vue'
import type { Row } from '../schema'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'
import { useI18n } from '../i18n/useI18n'
import { useDraggableItem, useDropTarget } from '../dnd/usePragmatic'
import { dropRow } from '../dnd/applyDrop'
import ColumnView from './ColumnView.vue'
import { ICONS } from './icons'

const props = defineProps<{ row: Row; contentWidth: number }>()
const store = useDocumentStore(useBuilderPinia())
const ui = useUiStore(useBuilderPinia())
const { t } = useI18n()
const el = ref<HTMLElement | null>(null)
const handle = ref<HTMLElement | null>(null)
const isSelected = computed(() => store.selection?.kind === 'row' && store.selection.id === props.row.id)

const rowInnerStyle = computed<CSSProperties>(() => {
  const s = props.row.style
  const style: CSSProperties = {
    maxWidth: props.contentWidth + 'px',
    background: s.backgroundColor,
    borderRadius: s.borderRadius + 'px',
  }
  if (s.backgroundImage && s.backgroundImage.url) {
    style.backgroundImage = `url(${s.backgroundImage.url})`
    style.backgroundSize = s.backgroundImage.size
    style.backgroundPosition = s.backgroundImage.position
    style.backgroundRepeat = s.backgroundImage.repeat
  }
  return style
})

function selectRow() {
  store.select({ kind: 'row', id: props.row.id })
  ui.panelMode = 'props'
}

function rowIndex(): number {
  return store.doc.rows.findIndex((r) => r.id === props.row.id)
}
// inserta una fila de 1 columna y abre de una vez el inspector (con el selector de
// estructura de columnas arriba de todo) para que el usuario elija el layout ahí mismo.
function addAbove() {
  const i = rowIndex()
  if (i === -1) return
  store.select({ kind: 'row', id: store.addRow([100], i).id })
  ui.panelMode = 'props'
}
function addBelow() {
  const i = rowIndex()
  if (i === -1) return
  store.select({ kind: 'row', id: store.addRow([100], i + 1).id })
  ui.panelMode = 'props'
}

// arrastrar la fila (solo desde el handle de mover)
useDraggableItem({
  el,
  handle,
  getData: () => ({ kind: 'canvas-row', rowId: props.row.id }),
  previewLabel: () => t('props.row'),
})

// recibir filas (nueva desde paleta o reordenar) con indicador de borde
const { edge: rowEdge } = useDropTarget({
  el,
  getData: () => ({ vmdRowId: props.row.id }),
  accept: (d) => d.kind === 'palette-row' || d.kind === 'canvas-row',
  onDrop: (drag, e) => dropRow(store, drag, props.row.id, e),
})
</script>
