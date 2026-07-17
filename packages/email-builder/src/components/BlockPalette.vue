<template>
  <aside class="vmd-palette">
    <h3 class="vmd-palette-title">Bloques</h3>
    <draggable
      :list="blockItems"
      :group="{ name: 'blocks', pull: 'clone', put: false }"
      :sort="false"
      :clone="cloneBlock"
      item-key="type"
      class="vmd-palette-grid"
    >
      <template #item="{ element }">
        <div class="vmd-palette-item">
          <span class="vmd-palette-icon">{{ element.icon }}</span>
          <span>{{ element.label }}</span>
        </div>
      </template>
    </draggable>

    <h3 class="vmd-palette-title">Filas</h3>
    <draggable
      :list="rowItems"
      :group="{ name: 'rows', pull: 'clone', put: false }"
      :sort="false"
      :clone="cloneRow"
      item-key="key"
      class="vmd-palette-grid"
    >
      <template #item="{ element }">
        <div class="vmd-palette-item">
          <span class="vmd-palette-icon">▤</span>
          <span>{{ element.label }}</span>
        </div>
      </template>
    </draggable>
  </aside>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { createBlock, createRow } from '../schema'
import { PALETTE_BLOCKS, ROW_LAYOUTS } from './palette-items'

const blockItems = [...PALETTE_BLOCKS]
const rowItems = [...ROW_LAYOUTS]

function cloneBlock(item: (typeof PALETTE_BLOCKS)[number]) {
  return createBlock(item.type)
}
function cloneRow(item: (typeof ROW_LAYOUTS)[number]) {
  return createRow(item.widths)
}
</script>
