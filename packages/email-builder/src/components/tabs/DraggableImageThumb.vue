<template>
  <button ref="el" type="button" :class="thumbClass" @click="$emit('click')">
    <img :src="thumbnailUrl" :alt="alt" />
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
const el = ref<HTMLElement | null>(null)

useDraggableItem({
  el,
  getData: () => ({ kind: 'media-image', src: props.src, alt: props.alt }),
  previewLabel: () => props.alt || t('palette.image'),
})
</script>
