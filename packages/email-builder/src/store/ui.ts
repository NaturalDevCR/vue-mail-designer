import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('vmd-ui', () => {
  const theme = ref<'light' | 'dark'>('light')
  const previewOpen = ref(false)
  const previewWidth = ref(1000)
  const galleryOpen = ref(false)
  const canvasDevice = ref<'desktop' | 'mobile'>('desktop')
  const sidebarTab = ref<'content' | 'blocks' | 'body' | 'images'>('content')
  const isDragging = ref(false)
  const panelMode = ref<'tab' | 'props'>('tab')

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  return {
    theme,
    previewOpen,
    previewWidth,
    galleryOpen,
    canvasDevice,
    sidebarTab,
    isDragging,
    panelMode,
    toggleTheme,
  }
})
