<template>
  <div>
    <div class="vmd-props-section-title">General</div>
    <ColorField label="Color de texto" :model-value="store.doc.settings.textColor" @update:model-value="store.updateSettings({ textColor: $event })" />
    <ColorField label="Color de fondo" :model-value="store.doc.settings.backgroundColor" @update:model-value="store.updateSettings({ backgroundColor: $event })" />
    <NumberField label="Ancho contenido" :model-value="store.doc.settings.contentWidth" :min="320" :max="900" @update:model-value="store.updateSettings({ contentWidth: $event })" />

    <div class="vmd-field">
      <span class="vmd-field-label">Alineación del contenido</span>
      <div class="vmd-align-group">
        <button
          type="button"
          class="vmd-mini-btn"
          :class="{ 'vmd-active': store.doc.settings.contentAlignment === 'left' }"
          title="Izquierda"
          @click="store.updateSettings({ contentAlignment: 'left' })"
        ><span class="vmd-ico" v-html="ICONS.alignLeft" /></button>
        <button
          type="button"
          class="vmd-mini-btn"
          :class="{ 'vmd-active': store.doc.settings.contentAlignment === 'center' }"
          title="Centro"
          @click="store.updateSettings({ contentAlignment: 'center' })"
        ><span class="vmd-ico" v-html="ICONS.alignCenter" /></button>
      </div>
    </div>

    <SelectField label="Fuente" :model-value="store.doc.settings.fontFamily" :options="fontOptions" @update:model-value="store.updateSettings({ fontFamily: $event })" />
    <SelectField label="Peso de fuente" :model-value="store.doc.settings.fontWeight" :options="FONT_WEIGHT_OPTIONS" @update:model-value="store.updateSettings({ fontWeight: $event as 'normal' | 'bold' })" />

    <div class="vmd-props-section-title">Imagen de fondo</div>
    <TextField label="URL" :model-value="bgUrl" @update:model-value="setBgUrl" />
    <template v-if="bgUrl">
      <SelectField label="Tamaño" :model-value="bgImage.size" :options="SIZE_OPTIONS" @update:model-value="setBg({ size: $event as 'auto' | 'cover' | 'contain' })" />
      <SelectField label="Repetición" :model-value="bgImage.repeat" :options="REPEAT_OPTIONS" @update:model-value="setBg({ repeat: $event as 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y' })" />
      <TextField label="Posición" :model-value="bgImage.position" @update:model-value="setBg({ position: $event })" />
    </template>

    <div class="vmd-props-section-title">Configuración de email</div>
    <TextField label="Texto del preheader" :model-value="store.doc.settings.preheader" @update:model-value="store.updateSettings({ preheader: $event })" />

    <div class="vmd-props-section-title">Links</div>
    <ColorField label="Color" :model-value="store.doc.settings.linkColor" @update:model-value="store.updateSettings({ linkColor: $event })" />
    <CheckboxField label="Subrayado" :model-value="store.doc.settings.linkUnderline" @update:model-value="store.updateSettings({ linkUnderline: $event })" />

    <div class="vmd-props-section-title">Accesibilidad</div>
    <TextField label="Título HTML" :model-value="store.doc.settings.htmlTitle" @update:model-value="store.updateSettings({ htmlTitle: $event })" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DEFAULT_FONTS } from '../../fonts'
import { useBuilderOptions } from '../../options'
import type { BackgroundImage } from '../../schema'
import { useDocumentStore } from '../../store/document'
import { useBuilderPinia } from '../../store/keys'
import { ICONS } from '../icons'
import CheckboxField from '../fields/CheckboxField.vue'
import ColorField from '../fields/ColorField.vue'
import NumberField from '../fields/NumberField.vue'
import SelectField from '../fields/SelectField.vue'
import TextField from '../fields/TextField.vue'

const store = useDocumentStore(useBuilderPinia())
const options = useBuilderOptions()

const fontOptions = computed(() => {
  const fonts = options.fonts ?? DEFAULT_FONTS
  const opts = fonts.map((f) => ({ label: f.label, value: f.value }))
  const current = store.doc.settings.fontFamily
  if (current && !opts.some((o) => o.value === current)) opts.unshift({ label: 'Actual', value: current })
  return opts
})

const FONT_WEIGHT_OPTIONS = [
  { label: 'Regular', value: 'normal' },
  { label: 'Negrita', value: 'bold' },
]

const SIZE_OPTIONS = [
  { label: 'Cubrir', value: 'cover' },
  { label: 'Contener', value: 'contain' },
  { label: 'Auto', value: 'auto' },
]
const REPEAT_OPTIONS = [
  { label: 'Sin repetir', value: 'no-repeat' },
  { label: 'Repetir', value: 'repeat' },
  { label: 'Horizontal', value: 'repeat-x' },
  { label: 'Vertical', value: 'repeat-y' },
]

const DEFAULT_BG: BackgroundImage = { url: '', repeat: 'no-repeat', size: 'cover', position: 'center', fullWidth: false }
const bgImage = computed<BackgroundImage>(() => store.doc.settings.backgroundImage ?? DEFAULT_BG)
const bgUrl = computed(() => bgImage.value.url)

function setBg(patch: Partial<BackgroundImage>) {
  store.updateSettings({ backgroundImage: { ...bgImage.value, ...patch } })
}
function setBgUrl(url: string) {
  if (url) setBg({ url })
  else store.updateSettings({ backgroundImage: undefined })
}
</script>
