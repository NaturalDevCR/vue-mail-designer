<template>
  <div ref="el" class="vmd-layout-thumb" :title="title">
    <div v-for="(w, i) in widths" :key="i" class="vmd-layout-cell" :style="{ flex: w }" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDraggableItem } from '../../dnd/usePragmatic'

const props = defineProps<{ widths: number[]; title: string }>()

const el = ref<HTMLElement | null>(null)

useDraggableItem({
  el,
  getData: () => ({ kind: 'palette-row', widths: props.widths }),
  previewLabel: () => props.title,
})
</script>
