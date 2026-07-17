<template>
  <div class="vmd-field">
    <span class="vmd-field-label">{{ label }}</span>
    <div class="vmd-align-group">
      <button
        v-for="a in ALIGNS"
        :key="a.value"
        type="button"
        class="vmd-mini-btn"
        :class="{ 'vmd-active': modelValue === a.value }"
        @click="$emit('update:modelValue', a.value)"
      >{{ a.icon }}</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Align } from '../../schema'
defineProps<{ label: string; modelValue: Align }>()
defineEmits<{ 'update:modelValue': [value: Align] }>()
const ALIGNS: { value: Align; icon: string }[] = [
  { value: 'left', icon: '⇤' },
  { value: 'center', icon: '↔' },
  { value: 'right', icon: '⇥' },
]
</script>
