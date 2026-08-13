<template>
  <div v-if="enabled" class="vmd-ai-template">
    <button
      type="button"
      class="vmd-header-btn vmd-ai-template-toggle"
      data-action="ai-template-toggle"
      :title="t('aiTemplates.menu')"
      @click="openMenu"
    >
      <span class="vmd-ai-template-mark" aria-hidden="true">AI</span>
      <span class="vmd-ai-template-toggle-label">{{ t('aiTemplates.menu') }}</span>
    </button>

    <ModalPortal v-if="open">
      <div class="vmd-modal vmd-ai-template-modal" @click.self="closeMenu">
        <AiTemplatePanel @error="forwardError" @close="closeMenu" />
      </div>
    </ModalPortal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { AiTemplateErrorPayload } from '../options'
import { useBuilderOptions } from '../options'
import { useI18n } from '../i18n/useI18n'
import ModalPortal from './ModalPortal.vue'
import AiTemplatePanel from './AiTemplatePanel.vue'

const emit = defineEmits<{ error: [payload: AiTemplateErrorPayload] }>()
const options = useBuilderOptions()
const { t } = useI18n()
const enabled = computed(() => options.aiTemplates?.enabled === true)
const open = ref(false)

function openMenu(): void {
  open.value = true
}

function closeMenu(): void {
  open.value = false
}

function forwardError(payload: AiTemplateErrorPayload): void {
  emit('error', payload)
}
</script>
