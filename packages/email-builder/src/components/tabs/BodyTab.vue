<template>
  <div>
    <NumberField label="Ancho contenido" :model-value="store.doc.settings.contentWidth" :min="320" :max="900" @update:model-value="store.updateSettings({ contentWidth: $event })" />
    <ColorField label="Color de fondo" :model-value="store.doc.settings.backgroundColor" @update:model-value="store.updateSettings({ backgroundColor: $event })" />
    <TextField label="Fuente" :model-value="store.doc.settings.fontFamily" @update:model-value="store.updateSettings({ fontFamily: $event })" />
    <TextField label="Preheader" :model-value="store.doc.settings.preheader" @update:model-value="store.updateSettings({ preheader: $event })" />

    <div class="vmd-field">
      <span class="vmd-field-label">Alineación del contenido</span>
      <div class="vmd-align-group">
        <button
          type="button"
          class="vmd-mini-btn"
          :class="{ 'vmd-active': store.doc.settings.contentAlignment === 'left' }"
          title="Izquierda"
          @click="store.updateSettings({ contentAlignment: 'left' })"
        >⇤</button>
        <button
          type="button"
          class="vmd-mini-btn"
          :class="{ 'vmd-active': store.doc.settings.contentAlignment === 'center' }"
          title="Centro"
          @click="store.updateSettings({ contentAlignment: 'center' })"
        >↔</button>
      </div>
    </div>

    <ColorField label="Color de links" :model-value="store.doc.settings.linkColor" @update:model-value="store.updateSettings({ linkColor: $event })" />

    <label class="vmd-field">
      <span class="vmd-field-label">
        <input
          type="checkbox"
          :checked="store.doc.settings.linkUnderline"
          @change="store.updateSettings({ linkUnderline: ($event.target as HTMLInputElement).checked })"
        />
        Subrayar links
      </span>
    </label>
  </div>
</template>

<script setup lang="ts">
import { useDocumentStore } from '../../store/document'
import { useBuilderPinia } from '../../store/keys'
import ColorField from '../fields/ColorField.vue'
import NumberField from '../fields/NumberField.vue'
import TextField from '../fields/TextField.vue'

const store = useDocumentStore(useBuilderPinia())
</script>
