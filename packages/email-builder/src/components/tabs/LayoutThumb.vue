<template>
  <button ref="el" type="button" class="vmd-layout-thumb" :title="title" :aria-label="title" @click="emit('insert')">
    <span v-for="(w, i) in widths" :key="i" class="vmd-layout-cell" :style="{ flex: w }" />
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDraggableItem } from '../../dnd/usePragmatic'

const props = defineProps<{ widths: number[]; title: string }>()
const emit = defineEmits<{ insert: [] }>()

const el = ref<HTMLElement | null>(null)

useDraggableItem({
  el,
  getData: () => ({ kind: 'palette-row', widths: props.widths }),
  previewLabel: () => props.title,
})
</script>
