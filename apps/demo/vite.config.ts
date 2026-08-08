import { fileURLToPath } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@naturaldevcr/vue-mail-designer': fileURLToPath(
        new URL('../../packages/email-builder/src/index.ts', import.meta.url),
      ),
    },
  },
  server: {
    proxy: {
      '/unlayer-api': {
        target: 'https://studio.unlayer.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/unlayer-api/, '/api/v1/graphql'),
      },
    },
  },
})
