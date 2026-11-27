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
        @input="updateNumber"
      />
      <input
        :id="fieldId"
        class="vmd-field-input vmd-field-range-number"
        type="number"
        :value="modelValue"
        :min="min"
        :max="max"
        :step="step"
        @input="updateNumber"
        @blur="restoreNumber"
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
      @input="updateNumber"
      @blur="restoreNumber"
    />
  </div>
</template>

<script setup lang="ts">
import { useId } from 'vue'

const props = defineProps<{ label: string; modelValue: number; min?: number; max?: number; step?: number }>()
const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const fieldId = useId()

function updateNumber(event: Event) {
  const input = event.target as HTMLInputElement
  const value = input.valueAsNumber
  if (!Number.isFinite(value) || input.validity.rangeUnderflow || input.validity.rangeOverflow) return
  emit('update:modelValue', value)
}

function restoreNumber(event: FocusEvent) {
  const input = event.target as HTMLInputElement
  input.value = String(props.modelValue)
}
</script>
