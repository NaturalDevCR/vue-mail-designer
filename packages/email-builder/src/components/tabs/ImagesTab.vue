<template>
  <div class="vmd-images-tab">
    <div class="vmd-image-search">
      <input
        v-model="query"
        type="text"
        placeholder="Buscar imágenes…"
        @input="onInput"
        @keydown.enter="runSearch"
      />
    </div>

    <p v-if="status === 'idle'" class="vmd-tab-placeholder">Busca imágenes gratuitas (CC) para tu email</p>
    <p v-else-if="status === 'loading'" class="vmd-tab-placeholder">Buscando…</p>
    <p v-else-if="status === 'error'" class="vmd-image-error">No se pudo buscar imágenes.</p>
    <p v-else-if="status === 'empty'" class="vmd-tab-placeholder">Sin resultados</p>

    <div v-else-if="status === 'results'" class="vmd-image-grid">
      <button
        v-for="(result, i) in results"
        :key="i"
        type="button"
        class="vmd-image-result"
        @click="selectImage(result)"
      >
        <img :src="result.thumbnailUrl" :alt="result.title ?? ''" />
      </button>
    </div>

    <p class="vmd-image-credit">Imágenes de Openverse (CC)</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { openverseSearch, type ImageResult } from '../../imageSearch'
import { useBuilderOptions } from '../../options'
import { useDocumentStore } from '../../store/document'
import { useBuilderPinia } from '../../store/keys'

const DEBOUNCE_MS = 400

const store = useDocumentStore(useBuilderPinia())
const options = useBuilderOptions()

const query = ref('')
const results = ref<ImageResult[]>([])
const status = ref<'idle' | 'loading' | 'error' | 'empty' | 'results'>('idle')

let timer: ReturnType<typeof setTimeout> | undefined
let searchSeq = 0

function onInput() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    runSearch()
  }, DEBOUNCE_MS)
}

async function runSearch() {
  if (timer) {
    clearTimeout(timer)
    timer = undefined
  }
  const q = query.value.trim()
  const seq = ++searchSeq
  if (!q) {
    status.value = 'idle'
    results.value = []
    return
  }
  status.value = 'loading'
  try {
    const search = options.imageSearch ?? openverseSearch
    const found = await search(q)
    if (seq !== searchSeq) return // llegó una búsqueda más nueva: descartar
    results.value = found
    status.value = found.length ? 'results' : 'empty'
  } catch {
    if (seq !== searchSeq) return
    results.value = []
    status.value = 'error'
  }
}

function selectImage(result: ImageResult) {
  const selected = store.selectedBlock
  if (selected && selected.type === 'image') {
    // no pisar alt escrito por el usuario: solo setearlo si está vacío
    store.updateBlock(selected.id, { src: result.url, ...(selected.alt ? {} : { alt: result.title ?? '' }) })
    return
  }
  const row = store.addRow([100])
  const block = store.addBlockToColumn(row.columns[0].id, 'image')
  store.updateBlock(block.id, { src: result.url, alt: result.title || '' })
}
</script>
