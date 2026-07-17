<template>
  <label class="vmd-field">
    <span class="vmd-field-label">{{ label }}</span>
    <input
      class="vmd-field-input"
      type="text"
      :value="modelValue"
      :data-field="dataField"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
  </label>
</template>

<script setup lang="ts">
defineProps<{ label: string; modelValue: string; dataField?: string }>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
