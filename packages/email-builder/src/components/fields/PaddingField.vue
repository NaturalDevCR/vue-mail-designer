<template>
  <div class="vmd-field">
    <div class="vmd-field-label-row">
      <span class="vmd-field-label">{{ label }}</span>
      <button
        type="button"
        class="vmd-mini-btn"
        :title="linked ? 'Vincular lados' : 'Lados independientes'"
        @click="toggleLinked"
      ><span class="vmd-ico" v-html="linked ? ICONS.link : ICONS.unlink" /></button>
    </div>
    <input
      v-if="linked"
      class="vmd-field-input"
      type="number"
      :value="modelValue.top"
      @input="onLinked($event)"
    />
    <div v-else class="vmd-padding-grid">
      <input v-for="side in SIDES" :key="side.key" class="vmd-field-input" type="number" min="0"
        :value="modelValue[side.key]" :title="side.label"
        @input="onSide(side.key, $event)" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Padding } from '../../schema'
import { ICONS } from '../icons'

const props = defineProps<{ label: string; modelValue: Padding }>()
const emit = defineEmits<{ 'update:modelValue': [value: Padding] }>()
const SIDES = [
  { key: 'top', label: 'Arriba' },
  { key: 'right', label: 'Derecha' },
  { key: 'bottom', label: 'Abajo' },
  { key: 'left', label: 'Izquierda' },
] as const

function isUniform(p: Padding): boolean {
  return p.top === p.right && p.right === p.bottom && p.bottom === p.left
}

// Arranca vinculado si los 4 lados ya son iguales (caso común); si difieren, arranca mostrando
// los 4 por separado. No hay watch sobre modelValue: una vez montado, el modo lo decide
// únicamente el botón — así no salta de modo solo porque undo/redo cambió el padding por debajo.
const linked = ref(isUniform(props.modelValue))

function onSide(key: keyof Padding, e: Event) {
  emit('update:modelValue', { ...props.modelValue, [key]: Number((e.target as HTMLInputElement).value) })
}

function onLinked(e: Event) {
  const v = Number((e.target as HTMLInputElement).value)
  emit('update:modelValue', { top: v, right: v, bottom: v, left: v })
}

// Invariante: linked === true implica los 4 valores iguales. Pasar de desvinculado a vinculado
// con valores distintos por lo tanto DEBE igualarlos (al de 'top') antes de colapsar la vista —
// si no, el campo único mostraría un padding que no es el real. Los otros tres casos (ya
// iguales, o vinculado → desvinculado) no mutan nada, solo cambian qué se muestra.
function toggleLinked() {
  if (!linked.value && !isUniform(props.modelValue)) {
    const v = props.modelValue.top
    emit('update:modelValue', { top: v, right: v, bottom: v, left: v })
  }
  linked.value = !linked.value
}
</script>
