<template>
  <button ref="el" type="button" :class="thumbClass" @click="$emit('click')">
    <img :src="thumbnailUrl" :alt="alt" />
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDraggableItem } from '../../dnd/usePragmatic'

const props = defineProps<{
  src: string
  thumbnailUrl: string
  alt: string
  thumbClass: string
}>()
defineEmits<{ click: [] }>()

const el = ref<HTMLElement | null>(null)

useDraggableItem({
  el,
  getData: () => ({ kind: 'media-image', src: props.src, alt: props.alt }),
  previewLabel: () => props.alt || 'Imagen',
})
</script>
