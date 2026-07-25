<template>
  <div class="vmd-media-tab">
    <div class="vmd-media-upload-row">
      <button type="button" class="vmd-btn" :disabled="uploading" @click="fileInput?.click()">
        <span class="vmd-ico" v-html="ICONS.upload" />{{ uploading ? 'Subiendo…' : 'Subir imagen' }}
      </button>
      <input ref="fileInput" type="file" accept="image/*" class="vmd-visually-hidden" @change="onUpload" />
    </div>
    <p v-if="uploadError" class="vmd-image-error">{{ uploadError }}</p>

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

    <button
      v-if="nextCursor"
      type="button"
      class="vmd-mini-btn vmd-mini-btn--text vmd-media-loadmore"
      :disabled="loadingMore"
      @click="loadMore"
    >
      {{ loadingMore ? 'Cargando…' : 'Cargar más' }}
    </button>
    <p v-if="loadMoreError" class="vmd-image-error">{{ loadMoreError }}</p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { MediaItem } from '../../mediaLibrary'
import { useBuilderOptions } from '../../options'
import { useDocumentStore } from '../../store/document'
import { useBuilderPinia } from '../../store/keys'
import { ICONS } from '../icons'

const store = useDocumentStore(useBuilderPinia())
const options = useBuilderOptions()

const items = ref<MediaItem[]>([])
const status = ref<'loading' | 'error' | 'empty' | 'results'>('loading')

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadError = ref<string | null>(null)

const nextCursor = ref<string | undefined>(undefined)
const loadingMore = ref(false)
const loadMoreError = ref<string | null>(null)

async function load() {
  if (!options.mediaLibrary) return
  status.value = 'loading'
  try {
    const page = await options.mediaLibrary.list()
    items.value = page.items
    nextCursor.value = page.nextCursor
    status.value = page.items.length ? 'results' : 'empty'
  } catch {
    status.value = 'error'
  }
}

onMounted(load)

async function loadMore() {
  if (!options.mediaLibrary || !nextCursor.value) return
  loadingMore.value = true
  loadMoreError.value = null
  try {
    const page = await options.mediaLibrary.list(nextCursor.value)
    items.value = [...items.value, ...page.items]
    nextCursor.value = page.nextCursor
  } catch {
    loadMoreError.value = 'No se pudo cargar más imágenes.'
  } finally {
    loadingMore.value = false
  }
}

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

async function onUpload(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !options.mediaLibrary) return
  uploading.value = true
  uploadError.value = null
  try {
    const item = await options.mediaLibrary.upload(file)
    items.value = [item, ...items.value]
    status.value = 'results'
  } catch {
    uploadError.value = 'No se pudo subir la imagen.'
  } finally {
    uploading.value = false
    input.value = ''
  }
}
</script>
