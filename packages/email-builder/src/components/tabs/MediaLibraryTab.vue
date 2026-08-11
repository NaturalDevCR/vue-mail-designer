<template>
  <div class="vmd-media-tab">
    <div class="vmd-media-upload-row">
      <button type="button" class="vmd-btn" :disabled="uploading" @click="fileInput?.click()">
        <span class="vmd-ico" v-html="ICONS.upload" />{{ uploading ? 'Subiendo…' : 'Subir imagen' }}
      </button>
      <input ref="fileInput" type="file" accept="image/*" class="vmd-visually-hidden" @change="onUpload" />
    </div>
    <p v-if="uploadError" class="vmd-image-error">{{ uploadError }}</p>
    <button
      v-if="listFailed && status === 'results'"
      type="button"
      class="vmd-mini-btn vmd-mini-btn--text"
      @click="load()"
    >
      Recargar galería completa
    </button>

    <p v-if="status === 'loading'" class="vmd-tab-placeholder">Cargando…</p>
    <template v-else-if="status === 'error'">
      <p class="vmd-image-error">No se pudo cargar la galería.</p>
      <button type="button" class="vmd-mini-btn vmd-mini-btn--text" @click="load()">Reintentar</button>
    </template>
    <p v-else-if="status === 'empty'" class="vmd-tab-placeholder">Todavía no subiste imágenes.</p>

    <div v-else-if="status === 'results'" class="vmd-media-grid">
      <div
        v-for="item in items"
        :key="item.id"
        class="vmd-media-item"
        :class="{ 'vmd-media-item--busy': deleting && confirmingDeleteId === item.id }"
      >
        <DraggableImageThumb
          :src="item.url"
          :thumbnail-url="item.thumbnailUrl"
          :alt="item.name ?? ''"
          thumb-class="vmd-media-item-thumb"
          @click="insert(item)"
        />

        <template v-if="renamingId === item.id">
          <input
            ref="renameInputEl"
            type="text"
            class="vmd-media-item-name-input"
            :value="renameValue"
            :disabled="renaming"
            @input="renameValue = ($event.target as HTMLInputElement).value"
            @keydown.enter="confirmRename(item)"
            @keydown.escape="cancelRename"
            @blur="confirmRename(item)"
          />
          <p v-if="renameError" class="vmd-image-error">{{ renameError }}</p>
        </template>
        <div v-else class="vmd-media-item-name" :title="item.name ?? ''">{{ item.name ?? '' }}</div>

        <button type="button" class="vmd-media-item-menu-btn" @click.stop="toggleMenu(item.id)">⋮</button>
        <div v-if="openMenuId === item.id" class="vmd-media-menu" @click.stop>
          <button type="button" @click="startRename(item)">Renombrar</button>
          <button type="button" class="vmd-media-menu-danger" @click="startDelete(item.id)">Borrar</button>
        </div>

        <div v-if="confirmingDeleteId === item.id" class="vmd-media-confirm" @click.stop>
          <p>¿Borrar esta imagen?</p>
          <p v-if="deleteError" class="vmd-image-error">{{ deleteError }}</p>
          <div class="vmd-media-confirm-actions">
            <button type="button" class="vmd-mini-btn vmd-mini-btn--text" @click="cancelDelete">Cancelar</button>
            <button
              type="button"
              class="vmd-mini-btn vmd-mini-btn--text vmd-mini-btn--danger"
              :disabled="deleting"
              @click="confirmDelete(item.id)"
            >
              Confirmar
            </button>
          </div>
        </div>
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
import { nextTick, onMounted, ref } from 'vue'
import type { MediaItem } from '../../mediaLibrary'
import { useBuilderOptions } from '../../options'
import { ICONS } from '../icons'
import DraggableImageThumb from './DraggableImageThumb.vue'
import type { ImageSelection } from './imageTypes'

const options = useBuilderOptions()
const emit = defineEmits<{ select: [image: ImageSelection] }>()

const items = ref<MediaItem[]>([])
const status = ref<'loading' | 'error' | 'empty' | 'results'>('loading')
const listFailed = ref(false)

const fileInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const uploadError = ref<string | null>(null)

const nextCursor = ref<string | undefined>(undefined)
const loadingMore = ref(false)
const loadMoreError = ref<string | null>(null)

const openMenuId = ref<string | null>(null)
const confirmingDeleteId = ref<string | null>(null)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

const renamingId = ref<string | null>(null)
const renameValue = ref('')
const renameInputEl = ref<HTMLInputElement | null>(null)
const renaming = ref(false)
const renameError = ref<string | null>(null)

async function load() {
  if (!options.mediaLibrary) return
  status.value = 'loading'
  try {
    const page = await options.mediaLibrary.list()
    items.value = page.items
    nextCursor.value = page.nextCursor
    status.value = page.items.length ? 'results' : 'empty'
    listFailed.value = false
  } catch {
    status.value = 'error'
    listFailed.value = true
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
  emit('select', {
    src: item.url,
    thumbnailUrl: item.thumbnailUrl,
    alt: item.name ?? '',
    title: item.name,
  })
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

function toggleMenu(id: string) {
  openMenuId.value = openMenuId.value === id ? null : id
  confirmingDeleteId.value = null
}

function startDelete(id: string) {
  openMenuId.value = null
  confirmingDeleteId.value = id
  deleteError.value = null
}

function cancelDelete() {
  confirmingDeleteId.value = null
}

async function confirmDelete(id: string) {
  if (!options.mediaLibrary) return
  deleting.value = true
  deleteError.value = null
  try {
    await options.mediaLibrary.delete(id)
    items.value = items.value.filter((i) => i.id !== id)
    confirmingDeleteId.value = null
    if (items.value.length === 0) status.value = 'empty'
  } catch {
    deleteError.value = 'No se pudo borrar la imagen.'
  } finally {
    deleting.value = false
  }
}

function focusRenameInput() {
  nextTick(() => {
    const el = Array.isArray(renameInputEl.value) ? renameInputEl.value[0] : renameInputEl.value
    el?.focus()
    el?.select()
  })
}

function startRename(item: MediaItem) {
  openMenuId.value = null
  renamingId.value = item.id
  renameValue.value = item.name ?? ''
  renameError.value = null
  focusRenameInput()
}

function cancelRename() {
  renamingId.value = null
  renameError.value = null
}

async function confirmRename(item: MediaItem) {
  if (renaming.value || renamingId.value !== item.id) return
  const value = renameValue.value.trim()
  if (!value || !options.mediaLibrary) {
    renamingId.value = null
    return
  }
  renaming.value = true
  renameError.value = null
  try {
    const updated = await options.mediaLibrary.rename(item.id, value)
    const idx = items.value.findIndex((i) => i.id === item.id)
    if (idx !== -1) items.value = [...items.value.slice(0, idx), updated, ...items.value.slice(idx + 1)]
    renamingId.value = null
  } catch {
    renameError.value = 'No se pudo renombrar la imagen.'
  } finally {
    renaming.value = false
    if (renamingId.value === item.id) focusRenameInput()
  }
}
</script>
