<template>
  <div class="vmd-root" :class="{ 'vmd-dark': ui.theme === 'dark' }">
    <BuilderToolbar />
    <div class="vmd-body">
      <BlockPalette />
      <BuilderCanvas />
      <InspectorPanel />
    </div>
  </div>
</template>

<script setup lang="ts">
import { createPinia } from 'pinia'
import { provide } from 'vue'
import { BUILDER_PINIA_KEY } from '../store/keys'
import { useUiStore } from '../store/ui'
import BlockPalette from './BlockPalette.vue'
import BuilderCanvas from './BuilderCanvas.vue'
import BuilderToolbar from './BuilderToolbar.vue'
import InspectorPanel from './InspectorPanel.vue'
import '../styles.css'

const pinia = createPinia()
provide(BUILDER_PINIA_KEY, pinia)
const ui = useUiStore(pinia)
</script>
