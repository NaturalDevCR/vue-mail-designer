# Sliders en los campos numéricos del inspector — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** todo campo de `NumberField` que ya declara `min` y `max` muestra un slider sincronizado con un input numérico angosto, en vez de solo el input actual. Sin `min`/`max`, el campo no cambia.

**Architecture:** un único componente (`NumberField.vue`) decide su propio template según si recibe `min`/`max`: con ambos, `<input type="range">` + `<input type="number">` angosto, ambos controlados por la misma prop `modelValue` y emitiendo el mismo evento; sin ellos, el `<input type="number">` de ancho completo de hoy, sin cambios. Ningún otro componente cambia — los ~28 callsites en `PropertiesPanel.vue` siguen intactos.

**Tech Stack:** Vue 3.5 (`<script setup>`, TS, `useId()`), Vitest + `@vue/test-utils` (jsdom).

**Spec:** [`docs/superpowers/specs/2026-08-08-inspector-number-sliders-design.md`](../specs/2026-08-08-inspector-number-sliders-design.md)

## Global Constraints

- Monorepo pnpm. Todo el trabajo ocurre en `packages/email-builder/`.
- Comandos desde la raíz del repo: tests `pnpm --filter @vue-mail-designer/builder test`, tipos `pnpm --filter @vue-mail-designer/builder typecheck`.
- TypeScript estricto: nada de `any`.
- Comentarios de código, nombres de tests y mensajes de commit en **español**.
- `NumberField` decide solo entre slider+input o input pelado, mirando si recibe `min` **y** `max`. Ningún callsite existente cambia.
- El único callsite sin `min`/`max` (el campo numérico de bloques `custom`, `PropertiesPanel.vue`) debe seguir renderizando exactamente el input pelado de hoy.
- No se agrega símbolo de unidad (`%`, `px`) junto al valor.
- No se cambia ningún valor de `min`/`max`/`step` existente en `PropertiesPanel.vue` — el cambio es puramente de presentación del componente.
- El `label` debe asociarse por `for`/`id` (vía `useId()`) al `input[type=number]`; el `input[type=range]` lleva `aria-label` con el mismo texto.

## File Structure

| Archivo | Responsabilidad | Acción |
|---|---|---|
| `src/components/fields/NumberField.vue` | campo numérico del inspector | modificar |
| `src/styles.css` | estilos `.vmd-field-*` | modificar (agrega 3 clases) |
| `tests/number-field.test.ts` | tests del componente | crear |

---

### Task 1: `NumberField.vue` con slider condicional

**Files:**
- Modify: `packages/email-builder/src/components/fields/NumberField.vue`
- Modify: `packages/email-builder/src/styles.css`
- Test: `packages/email-builder/tests/number-field.test.ts` (crear)

**Interfaces:**
- Consumes: nada nuevo — mismas props que hoy (`label: string; modelValue: number; min?: number; max?: number; step?: number`) y mismo evento (`update:modelValue: [value: number]`).
- Produces: el componente sigue exportando exactamente esa interfaz pública; ningún callsite de `PropertiesPanel.vue` necesita cambios.

- [ ] **Step 1: Escribir los tests que fallan**

Crear `packages/email-builder/tests/number-field.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import NumberField from '../src/components/fields/NumberField.vue'

describe('NumberField', () => {
  it('con min y max, renderiza un range y un number, ambos con el valor actual', () => {
    const wrapper = mount(NumberField, { props: { label: 'Ancho %', modelValue: 50, min: 10, max: 100 } })
    const range = wrapper.find('input[type="range"]')
    const number = wrapper.find('input[type="number"]')
    expect(range.exists()).toBe(true)
    expect(number.exists()).toBe(true)
    expect((range.element as HTMLInputElement).value).toBe('50')
    expect((number.element as HTMLInputElement).value).toBe('50')
  })

  it('mover el range emite update:modelValue con el valor nuevo', async () => {
    const wrapper = mount(NumberField, { props: { label: 'Ancho %', modelValue: 50, min: 10, max: 100 } })
    const range = wrapper.find('input[type="range"]')
    await range.setValue('75')
    expect(wrapper.emitted('update:modelValue')).toEqual([[75]])
  })

  it('escribir en el number emite update:modelValue con el valor nuevo', async () => {
    const wrapper = mount(NumberField, { props: { label: 'Ancho %', modelValue: 50, min: 10, max: 100 } })
    const number = wrapper.find('input[type="number"]')
    await number.setValue('30')
    expect(wrapper.emitted('update:modelValue')).toEqual([[30]])
  })

  it('sin min/max, no renderiza ningún range — solo el number de ancho completo', () => {
    const wrapper = mount(NumberField, { props: { label: 'Cantidad', modelValue: 3 } })
    expect(wrapper.find('input[type="range"]').exists()).toBe(false)
    const number = wrapper.find('input[type="number"]')
    expect(number.exists()).toBe(true)
    expect(number.classes()).not.toContain('vmd-field-range-number')
    expect((number.element as HTMLInputElement).value).toBe('3')
  })

  it('el label apunta (for) al id del number, y el range tiene el mismo texto en aria-label', () => {
    const wrapper = mount(NumberField, { props: { label: 'Ancho %', modelValue: 50, min: 10, max: 100 } })
    const label = wrapper.find('label')
    const number = wrapper.find('input[type="number"]')
    const range = wrapper.find('input[type="range"]')
    expect(label.attributes('for')).toBe(number.attributes('id'))
    expect(range.attributes('aria-label')).toBe('Ancho %')
  })

  it('step se propaga a ambos inputs', () => {
    const wrapper = mount(NumberField, { props: { label: 'Interlineado', modelValue: 1.4, min: 1, max: 3, step: 0.1 } })
    expect(wrapper.find('input[type="range"]').attributes('step')).toBe('0.1')
    expect(wrapper.find('input[type="number"]').attributes('step')).toBe('0.1')
  })
})
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

```bash
pnpm --filter @vue-mail-designer/builder test -- tests/number-field.test.ts
```

Esperado: FAIL — con `min`/`max` no existe ningún `input[type="range"]` todavía (el componente actual renderiza un solo `input[type="number"]` sin `id`, y el `label` no tiene `for`).

- [ ] **Step 3: Reescribir `NumberField.vue`**

Reemplazar el archivo completo:

```vue
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
```

Nota: el `<label class="vmd-field">` original se convierte en `<div class="vmd-field"><label class="vmd-field-label" :for>`, porque ahora hay dos controles dentro y un `<label>` no puede envolver dos inputs de forma no ambigua — la asociación pasa a ser explícita por `for`/`id`, como pide el spec §3.

- [ ] **Step 4: Agregar los estilos nuevos**

En `packages/email-builder/src/styles.css`, después de la línea `.vmd-field-input { ... }`:

```css
.vmd-field-range-row { display: flex; align-items: center; gap: 8px; }
.vmd-field-range { flex: 1; accent-color: var(--vmd-accent); }
.vmd-field-range-number { width: 64px; flex: none; text-align: right; }
```

- [ ] **Step 5: Correr los tests y verificar que pasan**

```bash
pnpm --filter @vue-mail-designer/builder test
```

Esperado: PASS — los 6 tests nuevos y toda la suite existente (los ~28 callsites de `PropertiesPanel.vue` no cambiaron su interfaz, así que sus tests de montaje siguen en verde).

- [ ] **Step 6: Verificar tipos**

```bash
pnpm --filter @vue-mail-designer/builder typecheck
```

Esperado: sin errores.

- [ ] **Step 7: Verificación manual en el navegador**

Levantar el demo (`pnpm dev`), abrir el inspector de un bloque `image` y comprobar:
1. El campo "Ancho %" muestra slider + número, y arrastrar el slider mueve el ancho de la imagen en el canvas en vivo.
2. Escribir un número en el campo angosto también actualiza el canvas.
3. Un solo Ctrl/Cmd+Z revierte un arrastre continuo del slider.
4. En un bloque `custom` con un campo `number` (si el demo tiene alguno configurado), el campo sigue siendo un input de ancho completo sin slider.

- [ ] **Step 8: Commit**

```bash
git add packages/email-builder/src/components/fields/NumberField.vue packages/email-builder/src/styles.css packages/email-builder/tests/number-field.test.ts
git commit -m "feat: NumberField dibuja slider cuando tiene min y max, como Unlayer"
```
