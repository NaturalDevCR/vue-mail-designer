<!-- packages/email-builder/src/components/ImageEditorModal.vue -->
<template>
  <div class="vmd-modal" @click.self="!saving && cancel()">
    <div class="vmd-modal-box vmd-image-editor">
      <div class="vmd-preview-bar">
        <h3 class="vmd-inspector-title" style="margin: 0">{{ t('dialog.imageEditorTitle') }}</h3>
        <div class="vmd-toolbar-group">
          <button type="button" class="vmd-btn" :disabled="saving" @click="cancel">{{ t('common.cancel') }}</button>
          <button type="button" class="vmd-btn vmd-btn--primary" :disabled="saving" @click="triggerSave">
            {{ saving ? t('common.saving') : t('common.save') }}
          </button>
        </div>
      </div>
      <div class="vmd-image-editor-body">
        <div class="vmd-image-editor-content">
          <CropPanel v-if="activeTab === 'crop' && block" ref="cropPanelRef" :block="block" />
        </div>
        <nav class="vmd-image-editor-rail">
          <button
            v-for="tool in TOOLS"
            :key="tool.key"
            type="button"
            :disabled="tool.key !== 'crop'"
            :class="{ 'vmd-active': activeTab === tool.key }"
            @click="activeTab = tool.key"
          >
            <span class="vmd-ico" v-html="ICONS[tool.icon]"></span>
            <span>{{ tool.label }}</span>
          </button>
        </nav>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from '../i18n/useI18n'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'
import { ICONS } from './icons'
import CropPanel from './image-editor/CropPanel.vue'

const store = useDocumentStore(useBuilderPinia())
const ui = useUiStore(useBuilderPinia())
const { t } = useI18n()

const block = computed(() => {
  const found = store.findBlock(ui.imageEditorBlockId ?? '')
  return found && found.block.type === 'image' ? found.block : null
})

type ToolKey = 'filter' | 'crop' | 'resize' | 'draw' | 'text'
const TOOLS = computed<{ key: ToolKey; label: string; icon: string }[]>(() => [
  { key: 'filter', label: t('image.filter'), icon: 'edFilter' },
  { key: 'crop', label: t('image.crop'), icon: 'edCrop' },
  { key: 'resize', label: t('image.resize'), icon: 'edResize' },
  { key: 'draw', label: t('image.draw'), icon: 'edDraw' },
  { key: 'text', label: t('image.textTool'), icon: 'edText' },
])
const activeTab = ref<ToolKey>('crop')

const cropPanelRef = ref<{ save: () => Promise<void> } | null>(null)
const saving = ref(false)

async function triggerSave() {
  if (!cropPanelRef.value) return
  saving.value = true
  try {
    await cropPanelRef.value.save()
  } finally {
    saving.value = false
  }
}

function cancel() {
  ui.imageEditorBlockId = null
}
</script>
