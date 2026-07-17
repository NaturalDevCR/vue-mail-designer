<template>
  <label class="vmd-field">
    <span class="vmd-field-label">{{ label }}</span>
    <select class="vmd-field-input" :value="modelValue" @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)">
      <option v-for="o in options" :key="o.value" :value="o.value">{{ o.label }}</option>
    </select>
  </label>
</template>

<script setup lang="ts">
defineProps<{ label: string; modelValue: string; options: { label: string; value: string }[] }>()
defineEmits<{ 'update:modelValue': [value: string] }>()
</script>
