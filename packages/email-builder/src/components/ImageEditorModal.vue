<!-- packages/email-builder/src/components/ImageEditorModal.vue -->
<template>
  <div class="vmd-modal" @click.self="cancel">
    <div class="vmd-modal-box vmd-image-editor">
      <div class="vmd-preview-bar">
        <h3 class="vmd-inspector-title" style="margin: 0">Editar imagen</h3>
        <div class="vmd-toolbar-group">
          <button type="button" class="vmd-btn" @click="cancel">Cancelar</button>
          <button type="button" class="vmd-btn vmd-btn--primary" :disabled="saving" @click="triggerSave">
            {{ saving ? 'Guardando…' : 'Guardar' }}
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
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'
import { ICONS } from './icons'
import CropPanel from './image-editor/CropPanel.vue'

const store = useDocumentStore(useBuilderPinia())
const ui = useUiStore(useBuilderPinia())

const block = computed(() => {
  const found = store.findBlock(ui.imageEditorBlockId ?? '')
  return found && found.block.type === 'image' ? found.block : null
})

type ToolKey = 'filter' | 'crop' | 'resize' | 'draw' | 'text'
const TOOLS: { key: ToolKey; label: string; icon: string }[] = [
  { key: 'filter', label: 'Filter', icon: 'edFilter' },
  { key: 'crop', label: 'Crop', icon: 'edCrop' },
  { key: 'resize', label: 'Resize', icon: 'edResize' },
  { key: 'draw', label: 'Draw', icon: 'edDraw' },
  { key: 'text', label: 'Text', icon: 'edText' },
]
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
