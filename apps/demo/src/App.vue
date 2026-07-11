<template>
  <div :class="['app', themeClass]">
    <EmailBuilder />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { EmailBuilder, useUiStore } from 'email-builder';

/**
 * Initialize UI store for theme management
 */
const ui = useUiStore();

/**
 * Computed theme class based on current theme setting
 */
const themeClass = computed(() => 
  ui.theme === 'dark' ? 'theme--dark' : 'theme--light'
);
</script>

<style>
.app {
  width: 100vw;
  height: 100vh;
  background-color: var(--bg);
  color: var(--fg);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}
</style>