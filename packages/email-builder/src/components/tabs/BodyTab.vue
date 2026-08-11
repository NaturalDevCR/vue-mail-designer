<template>
  <div>
    <div class="vmd-props-section-title">{{ t('body.general') }}</div>
    <ColorField :label="t('body.textColor')" :model-value="store.doc.settings.textColor" @update:model-value="store.updateSettings({ textColor: $event })" />
    <ColorField :label="t('body.backgroundColor')" :model-value="store.doc.settings.backgroundColor" @update:model-value="store.updateSettings({ backgroundColor: $event })" />
    <NumberField :label="t('body.contentWidth')" :model-value="store.doc.settings.contentWidth" :min="320" :max="900" @update:model-value="store.updateSettings({ contentWidth: $event })" />

    <div class="vmd-field">
      <span class="vmd-field-label">{{ t('body.contentAlignment') }}</span>
      <div class="vmd-align-group">
        <button
          type="button"
          class="vmd-mini-btn"
          :class="{ 'vmd-active': store.doc.settings.contentAlignment === 'left' }"
          :title="t('rte.alignLeft')"
          @click="store.updateSettings({ contentAlignment: 'left' })"
        ><span class="vmd-ico" v-html="ICONS.alignLeft" /></button>
        <button
          type="button"
          class="vmd-mini-btn"
          :class="{ 'vmd-active': store.doc.settings.contentAlignment === 'center' }"
          :title="t('rte.alignCenter')"
          @click="store.updateSettings({ contentAlignment: 'center' })"
        ><span class="vmd-ico" v-html="ICONS.alignCenter" /></button>
      </div>
    </div>

    <SelectField :label="t('props.font')" :model-value="store.doc.settings.fontFamily" :options="fontOptions" @update:model-value="store.updateSettings({ fontFamily: $event })" />
    <SelectField :label="t('props.fontWeight')" :model-value="store.doc.settings.fontWeight" :options="FONT_WEIGHT_OPTIONS" @update:model-value="store.updateSettings({ fontWeight: $event as 'normal' | 'bold' })" />

    <div class="vmd-props-section-title">{{ t('body.backgroundImage') }}</div>
    <TextField :label="t('props.url')" :model-value="bgUrl" @update:model-value="setBgUrl" />
    <template v-if="bgUrl">
      <SelectField :label="t('props.size')" :model-value="bgImage.size" :options="SIZE_OPTIONS" @update:model-value="setBg({ size: $event as 'auto' | 'cover' | 'contain' })" />
      <SelectField :label="t('props.repeat')" :model-value="bgImage.repeat" :options="REPEAT_OPTIONS" @update:model-value="setBg({ repeat: $event as 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y' })" />
      <TextField :label="t('props.position')" :model-value="bgImage.position" @update:model-value="setBg({ position: $event })" />
    </template>

    <div class="vmd-props-section-title">{{ t('body.emailSettings') }}</div>
    <TextField :label="t('body.preheaderText')" :model-value="store.doc.settings.preheader" @update:model-value="store.updateSettings({ preheader: $event })" />

    <div class="vmd-props-section-title">{{ t('body.links') }}</div>
    <ColorField :label="t('props.color')" :model-value="store.doc.settings.linkColor" @update:model-value="store.updateSettings({ linkColor: $event })" />
    <CheckboxField :label="t('props.underline')" :model-value="store.doc.settings.linkUnderline" @update:model-value="store.updateSettings({ linkUnderline: $event })" />

    <div class="vmd-props-section-title">{{ t('body.accessibility') }}</div>
    <TextField :label="t('body.htmlTitle')" :model-value="store.doc.settings.htmlTitle" @update:model-value="store.updateSettings({ htmlTitle: $event })" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { DEFAULT_FONTS } from '../../fonts'
import { useI18n } from '../../i18n/useI18n'
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
const { t } = useI18n()

const fontOptions = computed(() => {
  const fonts = options.fonts ?? DEFAULT_FONTS
  const opts = fonts.map((f) => ({ label: f.label, value: f.value }))
  const current = store.doc.settings.fontFamily
  if (current && !opts.some((o) => o.value === current)) opts.unshift({ label: t('body.currentFont'), value: current })
  return opts
})

const FONT_WEIGHT_OPTIONS = computed(() => [
  { label: t('body.fontWeightRegular'), value: 'normal' },
  { label: t('body.fontWeightBold'), value: 'bold' },
])

const SIZE_OPTIONS = computed(() => [
  { label: t('body.cover'), value: 'cover' },
  { label: t('body.contain'), value: 'contain' },
  { label: t('body.auto'), value: 'auto' },
])
const REPEAT_OPTIONS = computed(() => [
  { label: t('body.noRepeat'), value: 'no-repeat' },
  { label: t('body.repeat'), value: 'repeat' },
  { label: t('body.repeatHorizontal'), value: 'repeat-x' },
  { label: t('body.repeatVertical'), value: 'repeat-y' },
])

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
