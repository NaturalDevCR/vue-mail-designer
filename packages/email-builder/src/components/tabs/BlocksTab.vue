<template>
  <draggable
    :list="rowItems"
    :group="{ name: 'rows', pull: 'clone', put: false }"
    :sort="false"
    v-bind="DND_OPTIONS"
    :clone="cloneRow"
    item-key="key"
    @start="ui.isDragging = true"
    @end="onDragEnd"
  >
    <template #item="{ element }">
      <div class="vmd-layout-thumb" :title="t(element.labelKey)">
        <div v-for="(w, i) in element.widths" :key="i" class="vmd-layout-cell" :style="{ flex: w }" />
      </div>
    </template>
  </draggable>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { createRow } from '../../schema'
import { useDocumentStore } from '../../store/document'
import { useBuilderPinia } from '../../store/keys'
import { useUiStore } from '../../store/ui'
import { useI18n } from '../../i18n/useI18n'
import { DND_OPTIONS } from '../dnd'
import { ROW_LAYOUTS } from '../palette-items'

const store = useDocumentStore(useBuilderPinia())
const ui = useUiStore(useBuilderPinia())
const { t } = useI18n()
const rowItems = [...ROW_LAYOUTS]

function cloneRow(item: (typeof ROW_LAYOUTS)[number]) {
  return createRow(item.widths)
}

function onDragEnd() {
  ui.isDragging = false
  store.sealHistory()
}
</script>
