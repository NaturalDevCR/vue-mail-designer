<template>
  <label class="vmd-field">
    <span class="vmd-field-label">{{ label }}</span>
    <span class="vmd-field-color">
      <input type="color" :value="colorValue" @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)" />
      <input
        class="vmd-field-input"
        type="text"
        :value="modelValue"
        @change="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
    </span>
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue'
const props = defineProps<{ label: string; modelValue: string }>()
defineEmits<{ 'update:modelValue': [value: string] }>()
// input[type=color] solo acepta #rrggbb
const colorValue = computed(() => (/^#[0-9a-fA-F]{6}$/.test(props.modelValue) ? props.modelValue : '#000000'))
</script>
