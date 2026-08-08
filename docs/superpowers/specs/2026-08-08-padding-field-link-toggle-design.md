# Padding vinculado/desvinculado en PaddingField — Diseño

**Fecha:** 2026-08-08
**Contexto:** `PaddingField.vue` siempre muestra los 4 lados (arriba/derecha/abajo/izquierda) por separado. Para el caso común —mismo valor en los 4— eso obliga a tipear el número 4 veces. El usuario pidió el equivalente al «All Sides + More Options» de Unlayer, pero **sin que se note que estamos copiándolos**: en vez de un switch con texto, se usa el par de íconos cadena/cadena-rota (`ICONS.link`/`ICONS.unlink`) que ya existe en `icons.ts` — mismo lenguaje visual que Figma o el box model de DevTools para «valores vinculados», nada parecido al toggle de Unlayer.

**Alcance:** un solo archivo, `src/components/fields/PaddingField.vue`. El tipo `Padding` (`{top,right,bottom,left}`) no cambia, así que los ~15 lugares que usan `<PaddingField>` (heading, text, image, button, divider, social, menu ×2, html, video, table, gallery, timer, row, column) siguen intactos.

## 1. Estado y la invariante

`linked` es un `ref<boolean>` local del componente (no vive en el schema ni se persiste). Se inicializa una sola vez al montar, comparando los 4 valores de `props.modelValue`:

```ts
const linked = ref(isUniform(props.modelValue))
function isUniform(p: Padding): boolean {
  return p.top === p.right && p.right === p.bottom && p.bottom === p.left
}
```

**Invariante que se mantiene todo el ciclo de vida:** `linked === true` implica que los 4 valores son iguales en ese instante. El componente nunca queda mostrando un solo campo mientras los 4 lados difieren de verdad — evita el caso confuso donde el campo colapsado "miente" sobre el padding real del bloque.

No hay `watch` sobre `props.modelValue` que reevalúe `linked` automáticamente: una vez montado, el usuario controla el modo con el botón de cadena. Si otro medio externo (undo, carga de plantilla) cambia el padding por debajo, el campo simplemente refleja los valores nuevos en el modo en que ya estaba — no salta de modo solo.

## 2. Template

```
[Label]                              [🔗/⛓️‍💥]
```

- **Vinculado:** un solo `<input type="number">`, muestra `modelValue.top` (por la invariante, da igual cuál de los 4 leer). Escribir emite `{top: v, right: v, bottom: v, left: v}`.
- **Desvinculado:** el grid de 4 campos que ya existe hoy (`vmd-padding-grid`), sin cambios de comportamiento.
- El botón es un `<button class="vmd-mini-btn">` reutilizando la clase ya existente en el proyecto (mismo tamaño/hover que los mini-botones de fila/bloque) — sin CSS nuevo. Ícono `ICONS.link` cuando `linked`, `ICONS.unlink` cuando no. `title` accesible: "Vincular lados" / "Lados independientes".

## 3. Click en el botón

```ts
function toggleLinked() {
  if (!linked.value && !isUniform(props.modelValue)) {
    // pasar a vinculado con valores distintos: igualar los 4 al de 'top', mutación real y visible
    emit('update:modelValue', { top: props.modelValue.top, right: props.modelValue.top, bottom: props.modelValue.top, left: props.modelValue.top })
  }
  linked.value = !linked.value
}
```

- Vinculado → desvinculado: solo cambia la vista, cero mutación (los 4 ya son iguales).
- Desvinculado (valores ya iguales) → vinculado: solo cambia la vista, cero mutación.
- Desvinculado (valores distintos) → vinculado: emite un `update:modelValue` que iguala los 4 a `top` **antes** de cambiar la vista — así la invariante se cumple apenas se muestra el campo único. Es un commit de historial normal, como cualquier otro cambio de padding.

## 4. Tests

`packages/email-builder/tests/` — nuevo `padding-field.test.ts` (no existe archivo dedicado hoy, igual que pasó con `NumberField`):

1. Con los 4 valores iguales, monta vinculado: un solo input visible, sin los 4 campos.
2. Con valores distintos, monta desvinculado: los 4 campos visibles, sin el input único.
3. Vinculado, escribir en el campo único emite los 4 lados con ese valor.
4. Click en la cadena estando vinculado (valores iguales): pasa a mostrar los 4 campos, **sin** emitir `update:modelValue`.
5. Click en la cadena estando desvinculado con valores iguales: pasa a mostrar el campo único, sin emitir.
6. Click en la cadena estando desvinculado con valores distintos: emite un `update:modelValue` con los 4 iguales al valor de `top` **y** pasa a mostrar el campo único.
7. Editar un lado individual en modo desvinculado sigue funcionando igual que hoy (regresión).
