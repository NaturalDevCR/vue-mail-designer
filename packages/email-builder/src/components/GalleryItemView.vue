<template>
  <img
    v-if="img.src"
    ref="el"
    :src="img.src"
    :alt="img.alt"
    :class="{ 'vmd-media-drop-active': isOver }"
    style="width: 100%; display: block"
  />
  <div
    v-else
    ref="el"
    class="vmd-b-image-placeholder vmd-b-gallery-placeholder"
    :class="{ 'vmd-media-drop-active': isOver }"
  ><span class="vmd-ico" v-html="ICONS.image" /></div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { GalleryBlock } from '../schema'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useMediaDropTarget } from '../dnd/usePragmatic'
import { dropMediaImageOnGalleryItem } from '../dnd/applyDrop'
import { ICONS } from './icons'

const props = defineProps<{
  img: GalleryBlock['images'][number]
  index: number
  blockId: string
}>()

const store = useDocumentStore(useBuilderPinia())
const el = ref<HTMLElement | null>(null)

const { isOver } = useMediaDropTarget({
  el,
  // TODO(Tarea 4): manejar también el kind 'canvas-image' (mover) con dropCanvasImage.
  onDrop: (drag) => {
    if (drag.kind === 'media-image') dropMediaImageOnGalleryItem(store, props.blockId, props.index, drag)
  },
})
</script>
