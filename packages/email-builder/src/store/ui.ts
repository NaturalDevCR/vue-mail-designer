import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUiStore = defineStore('vmd-ui', () => {
  const theme = ref<'light' | 'dark'>('light')
  const previewOpen = ref(false)
  const previewDevice = ref<'desktop' | 'mobile'>('desktop')
  const galleryOpen = ref(false)

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }

  return { theme, previewOpen, previewDevice, galleryOpen, toggleTheme }
})
