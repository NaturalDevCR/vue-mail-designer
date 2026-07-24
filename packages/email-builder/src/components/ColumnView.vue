<template>
  <div ref="el" class="vmd-column" :style="columnStyle">
    <BlockView v-for="block in column.blocks" :key="block.id" :block="block" :column-id="column.id" />
    <div
      v-if="column.blocks.length === 0"
      class="vmd-column-empty"
      :class="{ 'vmd-drop-active': edge !== null }"
    >{{ t('canvas.dropHere') }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CSSProperties } from 'vue'
import type { Column } from '../schema'
import { useI18n } from '../i18n/useI18n'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useDropTarget } from '../dnd/usePragmatic'
import { dropBlock } from '../dnd/applyDrop'
import BlockView from './BlockView.vue'

const props = defineProps<{ column: Column }>()
const el = ref<HTMLElement | null>(null)
const store = useDocumentStore(useBuilderPinia())
const { t } = useI18n()

const columnStyle = computed<CSSProperties>(() => {
  const s = props.column.style
  const style: CSSProperties = {
    width: props.column.widthPct + '%',
    padding: `${s.padding.top}px ${s.padding.right}px ${s.padding.bottom}px ${s.padding.left}px`,
    boxSizing: 'border-box',
  }
  if (s.backgroundColor && s.backgroundColor !== 'transparent') style.background = s.backgroundColor
  if (s.borderRadius) style.borderRadius = s.borderRadius + 'px'
  if (s.border) style.border = `${s.border.width}px ${s.border.style} ${s.border.color}`
  return style
})

// drop de bloques: agrega al final de esta columna (las BlockView internas hacen la posición precisa)
const { edge } = useDropTarget({
  el,
  getData: () => ({ vmdColumnId: props.column.id }),
  accept: (d) => d.kind === 'palette-block' || d.kind === 'canvas-block',
  onDrop: (drag) => dropBlock(store, drag, props.column.id, null, null),
})
</script>
