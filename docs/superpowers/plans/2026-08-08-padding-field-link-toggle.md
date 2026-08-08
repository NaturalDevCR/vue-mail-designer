# Padding vinculado/desvinculado en PaddingField — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** `PaddingField.vue` arranca colapsado en un solo campo cuando los 4 lados ya son iguales (el caso común), con un botón de cadena para pasar a los 4 campos independientes de siempre — sin agregar nada al schema ni tocar ninguno de sus ~15 callsites.

**Architecture:** un `ref<boolean>` local (`linked`) decide qué template se muestra; se inicializa comparando los 4 valores de `modelValue` al montar. La invariante `linked ⇒ los 4 iguales` se mantiene en el único punto donde podría romperse: el click del botón, que iguala los 4 al valor de `top` antes de colapsar si hacía falta.

**Tech Stack:** Vue 3 (`<script setup>`, TS), Vitest + `@vue/test-utils` (jsdom).

**Spec:** [`docs/superpowers/specs/2026-08-08-padding-field-link-toggle-design.md`](../specs/2026-08-08-padding-field-link-toggle-design.md)

## Global Constraints

- Monorepo pnpm. Comandos desde la raíz: tests `pnpm --filter vue-mailcraft test`, tipos `pnpm --filter vue-mailcraft typecheck`.
- TypeScript estricto: nada de `any`.
- Comentarios de código, nombres de tests y mensajes de commit en **español**.
- El tipo `Padding` (`{top,right,bottom,left}`) no cambia. Ningún callsite de `<PaddingField>` cambia.
- Botón reutiliza la clase `.vmd-mini-btn` ya existente en `styles.css` — sin CSS nuevo.
- Íconos: `ICONS.link` (vinculado) / `ICONS.unlink` (desvinculado), ya definidos en `src/components/icons.ts`.
- Invariante a mantener siempre: `linked === true` implica los 4 valores de `modelValue` iguales en ese instante.
- Sin `watch` sobre `props.modelValue` que reevalúe `linked` automáticamente después del montaje — el modo lo controla únicamente el botón.

## File Structure

| Archivo | Responsabilidad | Acción |
|---|---|---|
| `src/components/fields/PaddingField.vue` | campo de padding del inspector | modificar |
| `tests/padding-field.test.ts` | tests del componente | crear |

---

### Task 1: `PaddingField.vue` con modo vinculado/desvinculado

**Files:**
- Modify: `packages/email-builder/src/components/fields/PaddingField.vue`
- Test: `packages/email-builder/tests/padding-field.test.ts` (crear)

**Interfaces:**
- Consumes: nada nuevo — mismas props (`label: string; modelValue: Padding`) y mismo evento (`update:modelValue: [value: Padding]`) que hoy. `Padding` se sigue importando de `'../../schema'`.
- Produces: interfaz pública sin cambios — ningún callsite de `<PaddingField>` en `PropertiesPanel.vue` necesita tocarse.

- [ ] **Step 1: Escribir los tests que fallan**

Crear `packages/email-builder/tests/padding-field.test.ts`:

```ts
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import PaddingField from '../src/components/fields/PaddingField.vue'

const uniform = { top: 10, right: 10, bottom: 10, left: 10 }
const mixed = { top: 10, right: 20, bottom: 30, left: 40 }

describe('PaddingField', () => {
  it('con los 4 valores iguales, monta vinculado: un solo input, sin el grid de 4', () => {
    const wrapper = mount(PaddingField, { props: { label: 'Padding', modelValue: uniform } })
    expect(wrapper.findAll('input')).toHaveLength(1)
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('10')
  })

  it('con valores distintos, monta desvinculado: los 4 campos, sin el input único', () => {
    const wrapper = mount(PaddingField, { props: { label: 'Padding', modelValue: mixed } })
    const inputs = wrapper.findAll('input')
    expect(inputs).toHaveLength(4)
    expect(inputs.map((i) => (i.element as HTMLInputElement).value)).toEqual(['10', '20', '30', '40'])
  })

  it('vinculado, escribir en el campo único emite los 4 lados con ese valor', async () => {
    const wrapper = mount(PaddingField, { props: { label: 'Padding', modelValue: uniform } })
    await wrapper.find('input').setValue('25')
    expect(wrapper.emitted('update:modelValue')).toEqual([[{ top: 25, right: 25, bottom: 25, left: 25 }]])
  })

  it('click en la cadena vinculado (valores iguales) pasa a los 4 campos sin emitir', async () => {
    const wrapper = mount(PaddingField, { props: { label: 'Padding', modelValue: uniform } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.findAll('input')).toHaveLength(4)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('click en la cadena desvinculado con valores ya iguales pasa al campo único sin emitir', async () => {
    const wrapper = mount(PaddingField, { props: { label: 'Padding', modelValue: uniform } })
    await wrapper.find('button').trigger('click') // vinculado → desvinculado
    await wrapper.find('button').trigger('click') // desvinculado → vinculado (ya eran iguales)
    expect(wrapper.findAll('input')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
  })

  it('click en la cadena desvinculado con valores distintos iguala los 4 a "top" y colapsa', async () => {
    const wrapper = mount(PaddingField, { props: { label: 'Padding', modelValue: mixed } })
    await wrapper.find('button').trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([[{ top: 10, right: 10, bottom: 10, left: 10 }]])
    expect(wrapper.findAll('input')).toHaveLength(1)
    expect((wrapper.find('input').element as HTMLInputElement).value).toBe('10')
  })

  it('desvinculado, editar un lado individual sigue funcionando (regresión)', async () => {
    const wrapper = mount(PaddingField, { props: { label: 'Padding', modelValue: mixed } })
    const inputs = wrapper.findAll('input')
    await inputs[1].setValue('99') // right
    expect(wrapper.emitted('update:modelValue')).toEqual([[{ top: 10, right: 99, bottom: 30, left: 40 }]])
  })

  it('el botón muestra el ícono y title correctos según el modo', async () => {
    const wrapper = mount(PaddingField, { props: { label: 'Padding', modelValue: uniform } })
    expect(wrapper.find('button').attributes('title')).toBe('Vincular lados')
    await wrapper.find('button').trigger('click')
    expect(wrapper.find('button').attributes('title')).toBe('Lados independientes')
  })
})
```

- [ ] **Step 2: Correr los tests y verificar que fallan**

```bash
pnpm --filter vue-mailcraft test -- tests/padding-field.test.ts
```

Esperado: FAIL — hoy `PaddingField` siempre renderiza los 4 inputs y no tiene ningún `<button>`, así que la mayoría de estos tests fallan (conteo de inputs, ausencia de botón, etc).

- [ ] **Step 3: Reescribir `PaddingField.vue`**

Reemplazar el archivo completo:

```vue
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
```

- [ ] **Step 4: Agregar el estilo del label-row**

En `packages/email-builder/src/styles.css`, después de la línea `.vmd-field-label { ... }`:

```css
.vmd-field-label-row { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
.vmd-field-label-row .vmd-field-label { margin-bottom: 0; }
.vmd-field-label-row .vmd-mini-btn { width: 22px; height: 22px; padding: 0; }
```

(`.vmd-mini-btn` ya trae su propio look de borde/hover; estas tres reglas solo lo achican para que quepa junto al label sin desalinear el resto del inspector, y anulan el `margin-bottom` del label porque ahora vive dentro de la fila flex.)

- [ ] **Step 5: Correr los tests y verificar que pasan**

```bash
pnpm --filter vue-mailcraft test
```

Esperado: PASS — los 8 tests nuevos y toda la suite existente (los ~15 callsites de `PropertiesPanel.vue` no cambiaron su interfaz).

- [ ] **Step 6: Verificar tipos**

```bash
pnpm --filter vue-mailcraft typecheck
```

Esperado: sin errores.

- [ ] **Step 7: Verificación manual en el navegador**

Levantar el demo (`pnpm dev`), abrir el inspector de cualquier bloque (p. ej. un heading recién creado, padding de fábrica ya uniforme) y comprobar:
1. El campo de padding arranca vinculado (un solo input).
2. Escribir ahí cambia el padding en las 4 direcciones a la vez, visible en el canvas.
3. Click en la cadena: pasa a mostrar los 4 campos, con los mismos valores.
4. Editar un lado por separado, después click en la cadena: los 4 pasan a valer lo que tenía "Arriba", y vuelve a mostrar un solo campo.
5. Un solo Ctrl/Cmd+Z revierte ese "igualar" como un paso normal de edición.

- [ ] **Step 8: Commit**

```bash
git add packages/email-builder/src/components/fields/PaddingField.vue packages/email-builder/src/styles.css packages/email-builder/tests/padding-field.test.ts
git commit -m "feat: padding vinculado/desvinculado en PaddingField con botón de cadena"
```
