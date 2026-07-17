<template>
  <div class="vmd-field">
    <span class="vmd-field-label">{{ label }}</span>
    <div class="vmd-padding-grid">
      <input v-for="side in SIDES" :key="side.key" class="vmd-field-input" type="number" min="0"
        :value="modelValue[side.key]" :title="side.label"
        @input="onSide(side.key, $event)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Padding } from '../../schema'
const props = defineProps<{ label: string; modelValue: Padding }>()
const emit = defineEmits<{ 'update:modelValue': [value: Padding] }>()
const SIDES = [
  { key: 'top', label: 'Arriba' },
  { key: 'right', label: 'Derecha' },
  { key: 'bottom', label: 'Abajo' },
  { key: 'left', label: 'Izquierda' },
] as const

function onSide(key: keyof Padding, e: Event) {
  emit('update:modelValue', { ...props.modelValue, [key]: Number((e.target as HTMLInputElement).value) })
}
</script>
