<template>
  <header class="vmd-header">
    <div class="vmd-header-leading">
      <div class="vmd-header-brand">
        <span class="vmd-header-brand-mark" aria-hidden="true">V</span>
        <span class="vmd-header-brand-name">Vue Mail Designer</span>
      </div>
      <nav class="vmd-header-nav" :aria-label="t('header.templates')">
        <button type="button" class="vmd-header-tab" data-action="templates" :aria-label="t('header.templates')" @click="ui.galleryOpen = true">
          <span class="vmd-ico" aria-hidden="true" v-html="ICONS.gallery" />
          <span class="vmd-header-tab-label">{{ t('header.templates') }}</span>
        </button>
      </nav>
    </div>
    <div class="vmd-header-actions">
      <span
        v-if="autosaveStatus !== 'disabled'"
        class="vmd-header-status"
        role="status"
        :data-status="autosaveStatus"
        :title="autosaveLabel"
      >
        <span class="vmd-status-dot" aria-hidden="true" />
        <span>{{ autosaveLabel }}</span>
      </span>
      <AiTemplateMenu @error="forwardAiTemplateError" />
      <button
        type="button"
        class="vmd-header-btn vmd-header-btn--icon"
        data-action="theme"
        :title="ui.theme === 'dark' ? t('header.themeLight') : t('header.themeDark')"
        :aria-label="ui.theme === 'dark' ? t('header.themeLight') : t('header.themeDark')"
        @click="ui.toggleTheme()"
      >
        <span class="vmd-ico" aria-hidden="true" v-html="ui.theme === 'dark' ? ICONS.sun : ICONS.moon" />
      </button>
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import AiTemplateMenu from './AiTemplateMenu.vue'
import type { AutosaveStatus } from '../autosave/types'
import type { AiTemplateErrorPayload } from '../options'
import { useI18n } from '../i18n/useI18n'
import { ICONS } from './icons'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'

const ui = useUiStore(useBuilderPinia())
const { t } = useI18n()
const props = withDefaults(defineProps<{ autosaveStatus?: AutosaveStatus | 'pending' }>(), { autosaveStatus: 'disabled' })
const autosaveLabel = computed(() => t(props.autosaveStatus === 'saved' ? 'header.saved' : `header.autosave.${props.autosaveStatus}`))

const emit = defineEmits<{ 'ai-templates-error': [payload: AiTemplateErrorPayload] }>()

function forwardAiTemplateError(payload: AiTemplateErrorPayload): void {
  emit('ai-templates-error', payload)
}
</script>
