<template>
  <div
    ref="el"
    class="vmd-row"
    :class="{ 'vmd-selected': isSelected, 'vmd-drop-before': rowEdge === 'before', 'vmd-drop-after': rowEdge === 'after' }"
    :style="rowStyle"
    @click.stop="selectRow"
  >
    <!-- insertar fila arriba / abajo -->
    <button type="button" class="vmd-row-add vmd-row-add--top" :title="t('props.addAbove')" @click.stop="addAbove">
      <span class="vmd-ico" v-html="ICONS.plus" />
    </button>
    <button type="button" class="vmd-row-add vmd-row-add--bottom" :title="t('props.addBelow')" @click.stop="addBelow">
      <span class="vmd-ico" v-html="ICONS.plus" />
    </button>

    <!-- barra de acciones (aparece al hover / selección) — siempre dentro del canvas para que
         nunca dependa de espacio libre alrededor (el handle externo se recortaba en pantallas
         angostas y quedaba inalcanzable) -->
    <div class="vmd-row-actions">
      <button ref="handle" type="button" class="vmd-mini-btn vmd-drag-handle" :title="t('props.move')"><span class="vmd-ico" v-html="ICONS.move" /></button>
      <button type="button" class="vmd-mini-btn" :title="t('props.rowSettings')" @click.stop="selectRow"><span class="vmd-ico" v-html="ICONS.settings" /></button>
      <button type="button" class="vmd-mini-btn" :title="t('props.duplicate')" @click.stop="store.duplicateRow(row.id)"><span class="vmd-ico" v-html="ICONS.duplicate" /></button>
      <button type="button" class="vmd-mini-btn vmd-mini-btn--danger" :title="t('props.delete')" @click.stop="store.removeRow(row.id)"><span class="vmd-ico" v-html="ICONS.trash" /></button>
    </div>

    <!-- etiqueta identificadora (decorativa: no debe interceptar clics sobre el bloque de abajo) -->
    <span class="vmd-row-tag">{{ t('props.row') }}</span>

    <div class="vmd-row-columns">
      <ColumnView v-for="column in row.columns" :key="column.id" :column="column" />
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

const props = defineProps<{ row: Row }>()
const store = useDocumentStore(useBuilderPinia())
const ui = useUiStore(useBuilderPinia())
const { t } = useI18n()
const el = ref<HTMLElement | null>(null)
const handle = ref<HTMLElement | null>(null)
const isSelected = computed(() => store.selection?.kind === 'row' && store.selection.id === props.row.id)

const rowStyle = computed<CSSProperties>(() => {
  const s = props.row.style
  const style: CSSProperties = { background: s.backgroundColor, borderRadius: s.borderRadius + 'px' }
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
