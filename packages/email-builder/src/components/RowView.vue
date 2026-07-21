<template>
  <div
    class="vmd-row"
    :class="{ 'vmd-selected': isSelected }"
    :style="rowStyle"
    @click.stop="selectRow"
  >
    <div class="vmd-row-actions">
      <button type="button" class="vmd-mini-btn vmd-drag-handle" :title="t('props.move')">✥</button>
      <button type="button" class="vmd-mini-btn" :title="t('props.rowSettings')" @click.stop="selectRow">⚙</button>
      <button type="button" class="vmd-mini-btn" :title="t('props.duplicate')" @click.stop="store.duplicateRow(row.id)">⧉</button>
      <button type="button" class="vmd-mini-btn vmd-mini-btn--danger" :title="t('props.delete')" @click.stop="store.removeRow(row.id)">🗑</button>
    </div>
    <span class="vmd-row-badge">{{ t('props.row') }}</span>
    <div class="vmd-row-columns">
      <div
        v-for="column in row.columns"
        :key="column.id"
        class="vmd-column"
        :style="{ width: column.widthPct + '%' }"
      >
        <draggable
          :model-value="column.blocks"
          group="blocks"
          item-key="id"
          class="vmd-column-blocks"
          v-bind="DND_OPTIONS"
          @update:model-value="store.replaceColumnBlocks(column.id, $event)"
          @start="ui.isDragging = true"
          @end="onDragEnd"
        >
          <template #item="{ element }">
            <BlockView :block="element" />
          </template>
        </draggable>
        <div v-if="column.blocks.length === 0" class="vmd-column-empty">{{ t('canvas.dropHere') }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { CSSProperties } from 'vue'
import draggable from 'vuedraggable'
import type { Row } from '../schema'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'
import { useI18n } from '../i18n/useI18n'
import BlockView from './BlockView.vue'
import { DND_OPTIONS } from './dnd'

const props = defineProps<{ row: Row }>()
const store = useDocumentStore(useBuilderPinia())
const ui = useUiStore(useBuilderPinia())
const { t } = useI18n()
const isSelected = computed(() => store.selection?.kind === 'row' && store.selection.id === props.row.id)

const rowStyle = computed<CSSProperties>(() => {
  const s = props.row.style
  const style: CSSProperties = {
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

function onDragEnd() {
  ui.isDragging = false
  store.sealHistory()
}
</script>
