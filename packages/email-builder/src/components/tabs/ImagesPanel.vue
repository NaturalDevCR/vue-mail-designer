<template>
  <div class="vmd-images-panel">
    <div class="vmd-images-subtabs">
      <button
        type="button"
        class="vmd-images-subtab"
        :class="{ 'vmd-active': activeTab === 'search' }"
        data-subtab="search"
        @click="activeTab = 'search'"
      >
        {{ t('images.search') }}
      </button>
      <button
        v-if="options.mediaLibrary"
        type="button"
        class="vmd-images-subtab"
        :class="{ 'vmd-active': activeTab === 'gallery' }"
        data-subtab="gallery"
        @click="activeTab = 'gallery'"
      >
        {{ t('images.gallery') }}
      </button>
    </div>

    <ImagesTab v-if="activeTab === 'search'" @select="openPreview" />
    <MediaLibraryTab v-else-if="options.mediaLibrary" @select="openPreview" />

    <ImagePreviewDialog
      v-if="previewImage"
      :image="previewImage"
      @close="closePreview"
      @add="addPreviewImage"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from '../../i18n/useI18n'
import { useBuilderOptions } from '../../options'
import { useDocumentStore } from '../../store/document'
import { useBuilderPinia } from '../../store/keys'
import ImagePreviewDialog from '../ImagePreviewDialog.vue'
import ImagesTab from './ImagesTab.vue'
import MediaLibraryTab from './MediaLibraryTab.vue'
import type { ImageSelection } from './imageTypes'

const options = useBuilderOptions()
const store = useDocumentStore(useBuilderPinia())
const { t } = useI18n()

const activeTab = ref<'search' | 'gallery'>('search')
const previewImage = ref<ImageSelection | null>(null)

watch(
  () => options.mediaLibrary,
  (mediaLibrary) => {
    if (!mediaLibrary && activeTab.value === 'gallery') activeTab.value = 'search'
  },
)

function openPreview(image: ImageSelection): void {
  previewImage.value = image
}

function closePreview(): void {
  previewImage.value = null
}

function addPreviewImage(): void {
  const image = previewImage.value
  if (!image) return

  const selected = store.selectedBlock
  if (selected && selected.type === 'image') {
    store.updateBlock(selected.id, { src: image.src, ...(selected.alt ? {} : { alt: image.alt }) })
    closePreview()
    return
  }

  const row = store.addRow([100])
  const block = store.addBlockToColumn(row.columns[0].id, 'image')
  store.updateBlock(block.id, { src: image.src, alt: image.alt })
  closePreview()
}
</script>
