<template>
  <div class="vmd-modal" @click.self="ui.galleryOpen = false">
    <div class="vmd-modal-box vmd-gallery-box">
      <div class="vmd-preview-bar">
        <h3 class="vmd-inspector-title" style="margin: 0">Elegir plantilla</h3>
        <button class="vmd-btn" @click="ui.galleryOpen = false">Cerrar ✕</button>
      </div>
      <div class="vmd-gallery-grid">
        <button v-for="tpl in templates" :key="tpl.id" class="vmd-gallery-card" @click="pick(tpl)">
          <img v-if="tpl.thumbnail" :src="tpl.thumbnail" :alt="tpl.name" />
          <div v-else class="vmd-gallery-thumb">{{ tpl.name.charAt(0) }}</div>
          <span>{{ tpl.name }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useBuilderOptions } from '../options'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'
import { BUILTIN_TEMPLATES, type EmailTemplate } from '../templates'

const pinia = useBuilderPinia()
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)
const options = useBuilderOptions()
const templates = computed(() => [...BUILTIN_TEMPLATES, ...(options.templates ?? [])])

function pick(tpl: EmailTemplate) {
  store.loadDesign(tpl.build())
  store.select(null)
  ui.galleryOpen = false
}
</script>
