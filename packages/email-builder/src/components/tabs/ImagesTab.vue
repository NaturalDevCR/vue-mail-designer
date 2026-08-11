<template>
  <div class="vmd-images-tab">
    <div class="vmd-image-search">
      <input
        v-model="query"
        type="text"
        :placeholder="t('image.searchPlaceholder')"
        @input="onInput"
        @keydown.enter="runSearch"
      />
    </div>

    <p v-if="status === 'idle'" class="vmd-tab-placeholder">{{ t('image.searchIdle') }}</p>
    <p v-else-if="status === 'loading'" class="vmd-tab-placeholder">{{ t('image.searchLoading') }}</p>
    <p v-else-if="status === 'error'" class="vmd-image-error">{{ t('image.searchError') }}</p>
    <p v-else-if="status === 'empty'" class="vmd-tab-placeholder">{{ t('image.searchEmpty') }}</p>

    <div v-else-if="status === 'results'" class="vmd-image-grid">
      <DraggableImageThumb
        v-for="(result, i) in results"
        :key="i"
        :src="result.url"
        :thumbnail-url="result.thumbnailUrl"
        :alt="result.title ?? ''"
        thumb-class="vmd-image-result"
        @click="selectImage(result)"
      />
    </div>

    <p class="vmd-image-credit">{{ t('image.credit') }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { openverseSearch, type ImageResult } from '../../imageSearch'
import { useI18n } from '../../i18n/useI18n'
import { useBuilderOptions } from '../../options'
import DraggableImageThumb from './DraggableImageThumb.vue'
import type { ImageSelection } from './imageTypes'

const DEBOUNCE_MS = 400

const options = useBuilderOptions()
const emit = defineEmits<{ select: [image: ImageSelection] }>()
const { t } = useI18n()

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
  emit('select', {
    src: result.url,
    thumbnailUrl: result.thumbnailUrl,
    alt: result.title ?? '',
    title: result.title,
  })
}
</script>
