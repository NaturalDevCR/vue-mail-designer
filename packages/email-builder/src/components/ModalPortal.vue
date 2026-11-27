<template>
  <Teleport to="body">
    <dialog
      v-if="label"
      ref="dialog"
      class="vmd-overlay-root vmd-dialog"
      :class="{ 'vmd-dark': theme === 'dark' }"
      :style="style"
      :aria-label="label"
      @cancel.prevent="emit('cancel')"
    >
      <slot />
    </dialog>
    <div v-else class="vmd-overlay-root" :class="{ 'vmd-dark': theme === 'dark' }" :style="style">
      <slot />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, onMounted, ref } from 'vue'
import { MODAL_CONTEXT_KEY } from '../modalContext'

const props = defineProps<{
  appearanceStyle?: Record<string, string>
  theme?: 'light' | 'dark'
  label?: string
}>()
const emit = defineEmits<{ cancel: [] }>()

const context = inject(MODAL_CONTEXT_KEY, null)
const theme = computed(() => props.theme ?? context?.theme.value ?? 'light')
const style = computed(() => props.appearanceStyle ?? context?.appearanceStyle.value ?? {})
const dialog = ref<HTMLDialogElement | null>(null)

onMounted(() => dialog.value?.showModal?.())
onBeforeUnmount(() => dialog.value?.close?.())
</script>
