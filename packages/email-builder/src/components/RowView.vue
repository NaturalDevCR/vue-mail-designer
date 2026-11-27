<template>
  <div
    ref="el"
    class="vmd-row"
    :class="{ 'vmd-selected': isSelected, 'vmd-drop-before': rowEdge === 'before', 'vmd-drop-after': rowEdge === 'after' }"
    :style="rowStyles.outer"
    @click.stop="selectRow"
  >
    <!-- insertar fila arriba / abajo -->
    <button type="button" class="vmd-row-add vmd-row-add--top" :title="t('props.addAbove')" @click.stop="addAbove">
      <span class="vmd-ico" v-html="ICONS.plus" />
    </button>
    <button type="button" class="vmd-row-add vmd-row-add--bottom" :title="t('props.addBelow')" @click.stop="addBelow">
      <span class="vmd-ico" v-html="ICONS.plus" />
    </button>

    <!-- El handle de arrastre y la etiqueta se anclan al borde exterior de la fila. -->
    <button ref="handle" type="button" class="vmd-row-handle vmd-mini-btn vmd-drag-handle" :title="t('props.move')"><span class="vmd-ico" v-html="ICONS.move" /></button>
    <span class="vmd-row-tag">{{ t('props.row') }}</span>

    <div class="vmd-row-inner" :style="rowStyles.content">
      <!-- mini-toolbar pegada al borde superior del contenido, igual que la de cada bloque -->
      <div class="vmd-row-actions">
        <button type="button" class="vmd-mini-btn" :title="t('props.rowSettings')" @click.stop="selectRow"><span class="vmd-ico" v-html="ICONS.settings" /></button>
        <button type="button" class="vmd-mini-btn" :title="t('props.duplicate')" @click.stop="store.duplicateRow(row.id)"><span class="vmd-ico" v-html="ICONS.duplicate" /></button>
        <button type="button" class="vmd-mini-btn vmd-mini-btn--danger" :title="t('props.delete')" @click.stop="store.removeRow(row.id)"><span class="vmd-ico" v-html="ICONS.trash" /></button>
      </div>
      <button v-if="isHidden" type="button" class="vmd-row-hidden" @click.stop="selectRow">
        {{ t('props.row') }} · {{ t('canvas.hiddenHere') }}
      </button>
      <div v-show="!isHidden" class="vmd-row-columns">
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
import { paddingCss } from '../render/html'
import ColumnView from './ColumnView.vue'
import { ICONS } from './icons'

const props = defineProps<{ row: Row; contentWidth: number }>()
const store = useDocumentStore(useBuilderPinia())
const ui = useUiStore(useBuilderPinia())
const { t } = useI18n()
const el = ref<HTMLElement | null>(null)
const handle = ref<HTMLElement | null>(null)
const isSelected = computed(() => store.selection?.kind === 'row' && store.selection.id === props.row.id)
const isHidden = computed(() => (ui.canvasDevice === 'mobile' ? props.row.hideMobile : props.row.hideDesktop))

const rowStyles = computed(() => {
  const outer: CSSProperties = {}
  const content: CSSProperties = {
    maxWidth: props.contentWidth + 'px',
    marginLeft: store.doc.settings.contentAlignment === 'left' ? '0px' : undefined,
  }
  if (isHidden.value) return { outer, content }

  const { backgroundColor, contentBackgroundColor, backgroundImage, padding, borderRadius } = props.row.style
  if (backgroundColor && backgroundColor !== 'transparent') outer.backgroundColor = backgroundColor
  content.backgroundColor = contentBackgroundColor
  content.padding = paddingCss(padding)
  content.borderRadius = borderRadius + 'px'
  if (backgroundImage?.url) {
    const layer = backgroundImage.fullWidth ? outer : content
    layer.backgroundImage = `url(${JSON.stringify(backgroundImage.url)})`
    layer.backgroundSize = backgroundImage.size
    layer.backgroundPosition = backgroundImage.position
    layer.backgroundRepeat = backgroundImage.repeat
  }
  return { outer, content }
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
