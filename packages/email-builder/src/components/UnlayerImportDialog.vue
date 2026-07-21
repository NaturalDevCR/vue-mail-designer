<template>
  <div class="vmd-modal" @click.self="close">
    <div class="vmd-modal-box vmd-import-box">
      <div class="vmd-preview-bar">
        <h3 class="vmd-inspector-title" style="margin: 0">Importar de Unlayer</h3>
        <button type="button" class="vmd-btn" @click="close">Cerrar ✕</button>
      </div>
      <div class="vmd-import-body">
        <label class="vmd-field-label" for="vmd-import-json">Pega aquí el JSON de diseño de Unlayer</label>
        <textarea
          id="vmd-import-json"
          v-model="json"
          class="vmd-import-json"
          rows="8"
          placeholder="Pega aquí el JSON de diseño de Unlayer"
        />
        <label class="vmd-field-label" for="vmd-import-url">…o pega la URL de la plantilla del studio</label>
        <input
          id="vmd-import-url"
          v-model="url"
          type="text"
          class="vmd-import-url vmd-field-input"
          placeholder="…o pega la URL de la plantilla del studio"
        />

        <div class="vmd-toolbar-group">
          <button type="button" class="vmd-btn" data-action="unlayer-load" :disabled="loading" @click="load">
            {{ loading ? 'Cargando…' : 'Cargar' }}
          </button>
        </div>

        <p v-if="error" class="vmd-import-error">{{ error }}</p>

        <template v-if="result">
          <ul v-if="result.warnings.length" class="vmd-import-warnings">
            <li v-for="(w, i) in result.warnings" :key="i">{{ w }}</li>
          </ul>
          <div class="vmd-toolbar-group">
            <button type="button" class="vmd-btn vmd-btn--primary" data-action="unlayer-apply" @click="apply">
              Aplicar
            </button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { defaultUnlayerFetch, unlayerSlugFromUrl } from '../import/unlayerUrl'
import { unlayerToDocument } from '../import/unlayer'
import { useBuilderOptions } from '../options'
import type { EmailDocument } from '../schema'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'

const pinia = useBuilderPinia()
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)
const options = useBuilderOptions()

const json = ref('')
const url = ref('')
const loading = ref(false)
const error = ref('')
const result = ref<{ document: EmailDocument; warnings: string[] } | null>(null)

function close() {
  ui.unlayerImportOpen = false
}

async function load() {
  error.value = ''
  result.value = null
  loading.value = true
  try {
    if (url.value.trim()) {
      const slug = unlayerSlugFromUrl(url.value)
      if (!slug) throw new Error('URL de Unlayer no válida.')
      const fetcher = options.unlayerFetch ?? defaultUnlayerFetch
      const design = await fetcher(slug)
      result.value = unlayerToDocument(design)
    } else if (json.value.trim()) {
      const parsed = JSON.parse(json.value)
      result.value = unlayerToDocument(parsed)
    } else {
      throw new Error('Pega un JSON o una URL de Unlayer.')
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e)
  } finally {
    loading.value = false
  }
}

function apply() {
  if (!result.value) return
  store.loadDesign(result.value.document)
  ui.unlayerImportOpen = false
}
</script>
