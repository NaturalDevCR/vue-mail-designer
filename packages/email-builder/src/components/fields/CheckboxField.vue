<template>
  <label class="vmd-field vmd-checkbox-field">
    <input
      type="checkbox"
      :checked="modelValue"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span class="vmd-field-label">{{ label }}</span>
  </label>
</template>

<script setup lang="ts">
defineProps<{ label: string; modelValue: boolean }>()
defineEmits<{ 'update:modelValue': [value: boolean] }>()
</script>
