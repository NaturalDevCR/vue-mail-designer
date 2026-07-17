<template>
  <div class="vmd-root" :class="{ 'vmd-dark': ui.theme === 'dark' }">
    <BuilderToolbar />
    <div class="vmd-body">
      <BlockPalette />
      <BuilderCanvas />
      <InspectorPanel />
    </div>
    <TemplateGallery v-if="ui.galleryOpen" />
  </div>
</template>

<script setup lang="ts">
import { createPinia } from 'pinia'
import { provide, reactive } from 'vue'
import { BUILDER_OPTIONS_KEY, type MergeTagDef } from '../options'
import { BUILDER_PINIA_KEY } from '../store/keys'
import { useUiStore } from '../store/ui'
import type { EmailTemplate } from '../templates'
import BlockPalette from './BlockPalette.vue'
import BuilderCanvas from './BuilderCanvas.vue'
import BuilderToolbar from './BuilderToolbar.vue'
import InspectorPanel from './InspectorPanel.vue'
import TemplateGallery from './TemplateGallery.vue'
import '../styles.css'

const props = defineProps<{
  mergeTags?: MergeTagDef[]
  uploadImage?: (file: File) => Promise<string>
  templates?: EmailTemplate[]
}>()

const pinia = createPinia()
provide(BUILDER_PINIA_KEY, pinia)
const ui = useUiStore(pinia)

// reactive con getters para que los cambios de props lleguen a los hijos
// (computed(...).value pierde la reactividad al desenvolver el .value una sola vez)
provide(
  BUILDER_OPTIONS_KEY,
  reactive({
    get mergeTags() {
      return props.mergeTags ?? []
    },
    get uploadImage() {
      return props.uploadImage
    },
    get templates() {
      return props.templates
    },
  }),
)
</script>
