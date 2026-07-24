<template>
  <div
    ref="el"
    class="vmd-content-item"
    :class="{ 'vmd-content-item--disabled': disabled }"
    :title="title"
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

const el = ref<HTMLElement | null>(null)

useDraggableItem({
  el,
  getData: () => ({ kind: 'palette-block', create: props.create }),
  previewLabel: () => props.previewLabel,
  canDrag: () => !props.disabled,
})
</script>
