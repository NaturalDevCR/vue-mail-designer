import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('vmd-ui', () => {
  const theme = ref<'light' | 'dark'>('light')
  const previewOpen = ref(false)
  const previewWidth = ref(1000)
  const galleryOpen = ref(false)
  const versionsOpen = ref(false)
  const unlayerImportOpen = ref(false)
  const canvasDevice = ref<'desktop' | 'mobile'>('desktop')
  const sidebarTab = ref<'content' | 'blocks' | 'body' | 'images' | 'export'>('content')
  const isDragging = ref(false)
  const panelMode = ref<'tab' | 'props'>('tab')
  const imageEditorBlockId = ref<string | null>(null)

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  return {
    theme,
    previewOpen,
    previewWidth,
    galleryOpen,
    unlayerImportOpen,
    canvasDevice,
    sidebarTab,
    isDragging,
    panelMode,
    versionsOpen,
    imageEditorBlockId,
    toggleTheme,
  }
})
