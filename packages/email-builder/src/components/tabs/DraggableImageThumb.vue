<template>
  <button type="button" :class="thumbClass" @click="$emit('click')">
    <span class="vmd-image-thumb-viewport">
      <img ref="imageEl" :src="thumbnailUrl" :alt="alt" />
    </span>
  </button>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDraggableItem } from '../../dnd/usePragmatic'
import { useI18n } from '../../i18n/useI18n'

const props = defineProps<{
  src: string
  thumbnailUrl: string
  alt: string
  thumbClass: string
}>()
defineEmits<{ click: [] }>()

const { t } = useI18n()
const imageEl = ref<HTMLImageElement | null>(null)

useDraggableItem({
  // Register the visible image itself. Native dragstart events originate on the
  // <img>, and pragmatic-dnd resolves the source from the event target directly.
  el: imageEl,
  getData: () => ({ kind: 'media-image', src: props.src, alt: props.alt }),
  previewLabel: () => props.alt || t('palette.image'),
})
</script>
