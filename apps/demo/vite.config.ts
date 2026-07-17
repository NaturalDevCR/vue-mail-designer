import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@vue-mail-designer/builder': fileURLToPath(
        new URL('../../packages/email-builder/src/index.ts', import.meta.url),
      ),
    },
  },
})
