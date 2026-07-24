<template>
  <label class="vmd-field">
    <span class="vmd-field-label">{{ label }}</span>
    <input class="vmd-field-input" type="datetime-local" :value="localValue" @input="onInput" />
  </label>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ label: string; modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

function toLocalInputValue(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const localValue = computed(() => toLocalInputValue(props.modelValue))

function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  if (!v) return
  // el input datetime-local no lleva zona horaria: el constructor Date lo interpreta en hora local
  const d = new Date(v)
  if (Number.isNaN(d.getTime())) return
  emit('update:modelValue', d.toISOString())
}
</script>
