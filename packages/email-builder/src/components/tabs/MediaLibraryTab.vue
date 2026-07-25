<template>
  <div class="vmd-media-tab">
    <p v-if="status === 'loading'" class="vmd-tab-placeholder">Cargando…</p>
    <template v-else-if="status === 'error'">
      <p class="vmd-image-error">No se pudo cargar la galería.</p>
      <button type="button" class="vmd-mini-btn vmd-mini-btn--text" @click="load()">Reintentar</button>
    </template>
    <p v-else-if="status === 'empty'" class="vmd-tab-placeholder">Todavía no subiste imágenes.</p>

    <div v-else-if="status === 'results'" class="vmd-media-grid">
      <div v-for="item in items" :key="item.id" class="vmd-media-item">
        <button type="button" class="vmd-media-item-thumb" @click="insert(item)">
          <img :src="item.thumbnailUrl" :alt="item.name ?? ''" />
        </button>
        <div class="vmd-media-item-name" :title="item.name ?? ''">{{ item.name ?? '' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { MediaItem } from '../../mediaLibrary'
import { useBuilderOptions } from '../../options'
import { useDocumentStore } from '../../store/document'
import { useBuilderPinia } from '../../store/keys'

const store = useDocumentStore(useBuilderPinia())
const options = useBuilderOptions()

const items = ref<MediaItem[]>([])
const status = ref<'loading' | 'error' | 'empty' | 'results'>('loading')

async function load() {
  if (!options.mediaLibrary) return
  status.value = 'loading'
  try {
    const page = await options.mediaLibrary.list()
    items.value = page.items
    status.value = page.items.length ? 'results' : 'empty'
  } catch {
    status.value = 'error'
  }
}

onMounted(load)

function insert(item: MediaItem) {
  const selected = store.selectedBlock
  if (selected && selected.type === 'image') {
    store.updateBlock(selected.id, { src: item.url, ...(selected.alt ? {} : { alt: item.name ?? '' }) })
    return
  }
  const row = store.addRow([100])
  const block = store.addBlockToColumn(row.columns[0].id, 'image')
  store.updateBlock(block.id, { src: item.url, alt: item.name ?? '' })
}
</script>
