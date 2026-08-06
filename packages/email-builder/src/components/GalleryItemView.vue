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
import { useCanvasImageDrag, useMediaDropTarget } from '../dnd/usePragmatic'
import { dropCanvasImage, dropMediaImageOnGalleryItem } from '../dnd/applyDrop'
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
  onDrop: (drag) => {
    if (drag.kind === 'media-image') dropMediaImageOnGalleryItem(store, props.blockId, props.index, drag)
    else dropCanvasImage(store, drag, { blockId: props.blockId, index: props.index })
  },
})

useCanvasImageDrag({
  el,
  getData: () => ({ src: props.img.src, alt: props.img.alt, from: { blockId: props.blockId, index: props.index } }),
})
</script>
