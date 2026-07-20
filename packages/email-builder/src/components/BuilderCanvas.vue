<template>
  <section class="vmd-canvas" @click.self="store.select(null)">
    <div
      class="vmd-canvas-page"
      :style="{ width: pageWidth + 'px', background: store.doc.settings.backgroundColor }"
    >
      <div v-if="store.doc.rows.length === 0" class="vmd-canvas-empty">
        <p>Arrastra una fila desde el tab Bloques o</p>
        <button type="button" class="vmd-btn vmd-btn--primary" @click="store.addRow([100])">Agregar fila</button>
      </div>
      <draggable
        :model-value="store.doc.rows"
        group="rows"
        item-key="id"
        class="vmd-canvas-rows"
        v-bind="DND_OPTIONS"
        @update:model-value="store.replaceRows($event)"
        @start="ui.isDragging = true"
        @end="onDragEnd"
      >
        <template #item="{ element }">
          <RowView :row="element" />
        </template>
      </draggable>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import draggable from 'vuedraggable'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'
import { DND_OPTIONS } from './dnd'
import RowView from './RowView.vue'

const pinia = useBuilderPinia()
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)

const pageWidth = computed(() => (ui.canvasDevice === 'mobile' ? 375 : store.doc.settings.contentWidth))

function onDragEnd() {
  ui.isDragging = false
  store.sealHistory()
}
</script>
