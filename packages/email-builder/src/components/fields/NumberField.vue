<template>
  <div class="vmd-field">
    <label class="vmd-field-label" :for="fieldId">{{ label }}</label>
    <div v-if="min !== undefined && max !== undefined" class="vmd-field-range-row">
      <input
        class="vmd-field-range"
        type="range"
        :value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        :aria-label="label"
        @input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
      />
      <input
        :id="fieldId"
        class="vmd-field-input vmd-field-range-number"
        type="number"
        :value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        @input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
      />
    </div>
    <input
      v-else
      :id="fieldId"
      class="vmd-field-input"
      type="number"
      :value="modelValue"
      :min="min"
      :max="max"
      :step="step"
      @input="$emit('update:modelValue', Number(($event.target as HTMLInputElement).value))"
    />
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue'

defineProps<{ label: string; modelValue: number; min?: number; max?: number; step?: number }>()
defineEmits<{ 'update:modelValue': [value: number] }>()

const fieldId = useId()
</script>
