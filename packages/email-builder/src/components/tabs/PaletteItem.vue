<template>
  <button
    ref="el"
    type="button"
    class="vmd-content-item"
    :class="{ 'vmd-content-item--disabled': disabled }"
    :title="title"
    :aria-label="previewLabel"
    :disabled="disabled"
    @click="emit('insert')"
    v-html="html"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Block } from '../../schema'
import { useDraggableItem } from '../../dnd/usePragmatic'

const props = defineProps<{
  html: string
  title: string
  disabled: boolean
  previewLabel: string
  create: () => Block
}>()
const emit = defineEmits<{ insert: [] }>()

const el = ref<HTMLElement | null>(null)

useDraggableItem({
  el,
  getData: () => ({ kind: 'palette-block', create: props.create }),
  previewLabel: () => props.previewLabel,
  canDrag: () => !props.disabled,
})
</script>
