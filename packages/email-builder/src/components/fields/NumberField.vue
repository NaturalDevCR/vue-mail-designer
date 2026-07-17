<template>
  <label class="vmd-field">
    <span class="vmd-field-label">{{ label }}</span>
    <input
      class="vmd-field-input"
      type="number"
      :value="modelValue"
      :min="min"
      :max="max"
      @input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
    />
  </label>
</template>

<script setup lang="ts">
defineProps<{ label: string; modelValue: number; min?: number; max?: number }>()
defineEmits<{ 'update:modelValue': [value: number] }>()
</script>
