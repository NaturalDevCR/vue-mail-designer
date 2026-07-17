<template>
  <div
    class="vmd-row"
    :class="{ 'vmd-selected': isSelected }"
    :style="{ background: row.style.backgroundColor, borderRadius: row.style.borderRadius + 'px' }"
    @click.stop="store.select({ kind: 'row', id: row.id })"
  >
    <div class="vmd-row-actions" v-if="isSelected">
      <button class="vmd-mini-btn" title="Duplicar fila" @click.stop="store.duplicateRow(row.id)">⧉</button>
      <button class="vmd-mini-btn vmd-mini-btn--danger" title="Eliminar fila" @click.stop="store.removeRow(row.id)">🗑</button>
    </div>
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
          ghost-class="vmd-ghost"
          :animation="150"
          @update:model-value="store.replaceColumnBlocks(column.id, $event)"
        >
          <template #item="{ element }">
            <BlockView :block="element" />
          </template>
        </draggable>
        <div v-if="column.blocks.length === 0" class="vmd-column-empty">Suelta un bloque aquí</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import draggable from 'vuedraggable'
import type { Row } from '../schema'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import BlockView from './BlockView.vue'

const props = defineProps<{ row: Row }>()
const store = useDocumentStore(useBuilderPinia())
const isSelected = computed(() => store.selection?.kind === 'row' && store.selection.id === props.row.id)
</script>
