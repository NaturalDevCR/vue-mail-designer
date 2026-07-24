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
        :title="a.value"
        @click="$emit('update:modelValue', a.value)"
      ><span class="vmd-ico" v-html="ICONS[a.icon]" /></button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Align } from '../../schema'
import { ICONS } from '../icons'
defineProps<{ label: string; modelValue: Align }>()
defineEmits<{ 'update:modelValue': [value: Align] }>()
const ALIGNS: { value: Align; icon: 'alignLeft' | 'alignCenter' | 'alignRight' }[] = [
  { value: 'left', icon: 'alignLeft' },
  { value: 'center', icon: 'alignCenter' },
  { value: 'right', icon: 'alignRight' },
]
</script>
