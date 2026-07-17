<template>
  <section class="vmd-canvas" @click.self="store.select(null)">
    <div
      class="vmd-canvas-page"
      :style="{ width: store.doc.settings.contentWidth + 'px', background: store.doc.settings.backgroundColor }"
    >
      <div v-if="store.doc.rows.length === 0" class="vmd-canvas-empty">
        <p>Arrastra una fila desde la paleta o</p>
        <button type="button" class="vmd-btn vmd-btn--primary" @click="store.addRow([100])">Agregar fila</button>
      </div>
      <draggable
        :model-value="store.doc.rows"
        group="rows"
        item-key="id"
        class="vmd-canvas-rows"
        ghost-class="vmd-ghost"
        :animation="150"
        @update:model-value="store.replaceRows($event)"
      >
        <template #item="{ element }">
          <RowView :row="element" />
        </template>
      </draggable>
    </div>
  </section>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import RowView from './RowView.vue'

const store = useDocumentStore(useBuilderPinia())
</script>
