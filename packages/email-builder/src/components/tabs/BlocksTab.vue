<template>
  <draggable
    :list="rowItems"
    :group="{ name: 'rows', pull: 'clone', put: false }"
    :sort="false"
    :force-fallback="true"
    :clone="cloneRow"
    item-key="key"
  >
    <template #item="{ element }">
      <div class="vmd-layout-thumb" :title="element.label">
        <div v-for="(w, i) in element.widths" :key="i" class="vmd-layout-cell" :style="{ flex: w }" />
      </div>
    </template>
  </draggable>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { createRow } from '../../schema'
import { ROW_LAYOUTS } from '../palette-items'

const rowItems = [...ROW_LAYOUTS]

function cloneRow(item: (typeof ROW_LAYOUTS)[number]) {
  return createRow(item.widths)
}
</script>
