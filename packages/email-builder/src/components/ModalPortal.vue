<template>
  <Teleport to="body">
    <div class="vmd-overlay-root" :class="{ 'vmd-dark': theme === 'dark' }" :style="style">
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import { MODAL_CONTEXT_KEY } from '../modalContext'

const props = defineProps<{
  appearanceStyle?: Record<string, string>
  theme?: 'light' | 'dark'
}>()

const context = inject(MODAL_CONTEXT_KEY, null)
const theme = computed(() => props.theme ?? context?.theme.value ?? 'light')
const style = computed(() => props.appearanceStyle ?? context?.appearanceStyle.value ?? {})
</script>
