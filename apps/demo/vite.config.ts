import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'email-builder': resolve(__dirname, '../../packages/email-builder/src')
    }
  },
  server: {
    port: 3000,
    open: true
  }
});