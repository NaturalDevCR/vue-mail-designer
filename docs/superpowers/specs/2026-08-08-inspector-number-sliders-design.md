# Sliders en los campos numéricos del inspector — Diseño

**Fecha:** 2026-08-08
**Contexto:** el usuario comparó la importación de una plantilla stock de Unlayer (`black-friday-laptop-deals`) contra el resultado en el builder y notó, aparte de un bug de fidelidad ya corregido ([2026-08-05](#), commit `a19394e`), que el inspector de propiedades de Unlayer usa **sliders** para campos numéricos acotados (ancho de imagen, tamaño de fuente, interlineado, etc.), mientras el nuestro usa siempre `<input type="number">`. Pide paridad visual en ese punto.

**Alcance acordado con el usuario:** todo campo que hoy usa [`NumberField.vue`](../../../packages/email-builder/src/components/fields/NumberField.vue) y ya declara `min` **y** `max` pasa a mostrar slider + input numérico sincronizados. El único callsite de `NumberField` sin `min`/`max` — el campo numérico de bloques `custom` ([PropertiesPanel.vue:240](../../../packages/email-builder/src/components/PropertiesPanel.vue)) — sigue siendo un input pelado, porque no hay rango que dibujar. Ningún otro campo (`TextField`, `ColorField`, `PaddingField`, `SelectField`, `AlignField`, `CheckboxField`, `DateTimeField`) cambia: Unlayer tampoco usa slider para padding, altura o fecha, así que no hay pedido de paridad ahí.

## 1. Por qué `NumberField` decide solo, no un componente nuevo

Hay ~28 usos de `NumberField` en `PropertiesPanel.vue`, prácticamente todos ya con `min`/`max` puestos (son rangos con sentido de dominio: `widthPct` 10–100, `fontSize` 10–72, etc.). Cambiar el propio componente para que dibuje slider cuando tiene ambos límites deja esos 28 callsites intactos y hace **imposible** que un campo nuevo quede inconsistente por olvido — la alternativa (un `SliderField` separado, o una prop `variant` opt-in) depende de que cada futuro callsite recuerde usarlo.

## 2. Template y comportamiento de `NumberField.vue`

Con `min` y `max` presentes, el campo pasa de un único `<input type="number">` a una fila con dos controles que escriben el mismo `update:modelValue`:

- `<input type="range">`, ocupa el ancho disponible (`flex: 1`).
- `<input type="number">` angosto (`width: 64px`), a la derecha, mismo comportamiento que hoy.

Sin `min`/`max` (el único caso: el campo numérico de bloques custom), se renderiza exactamente el `<input type="number">` de hoy — cero cambio visual ni de comportamiento ahí.

`step` se sigue aceptando y se propaga a **ambos** inputs (hoy solo iba al number). Sin `step`, el navegador usa su default (`1`) en los dos.

## 3. Accesibilidad: dos controles, un label

Hoy el `<label class="vmd-field">` envuelve el único input — válido en HTML porque asocia label e input por anidamiento. Con dos controles esa asociación es ambigua, así que:

- El `<span class="vmd-field-label">` pasa a `<label :for="fieldId">`, apuntando al `<input type="number">` (el control de valor exacto, coherente con qué hace foco al hacer tab desde el label).
- El `<input type="range">` lleva `:aria-label="label"` — mismo texto, para que un lector de pantalla lo anuncie aunque no tenga label visual propio.
- `fieldId` se genera con `useId()` de Vue (el proyecto fija `"vue": "^3.5.0"` en `package.json`, que ya lo trae) para no colisionar si el mismo campo se monta más de una vez en la página (no ocurre hoy, pero el inspector reemplaza su contenido entero al cambiar de selección, y un `id` fijo sería frágil).

## 4. Sincronización de valor

Ambos inputs son controlados por la misma prop `modelValue`: el `range` y el `number` muestran siempre `modelValue`, y cualquiera de los dos emite `update:modelValue` con `Number(...)` del valor nuevo. No hay estado local en el componente — sigue siendo un campo controlado puro, como hoy.

Mover el slider dispara `input` en cada frame de arrastre (comportamiento nativo del navegador), igual que ya ocurre hoy al mantener presionadas las flechas del number. Eso ya funciona bien con el store: `updateBlock` coalesce commits de la misma key (`block:${id}`) dentro de `COALESCE_MS` (600ms), así que un arrastre continuo del slider queda como un solo paso de undo — igual que una ráfaga de tecleo hoy. Soltar y volver a arrastrar pasados los 600ms genera un segundo paso, que es el comportamiento esperable.

## 5. Estilos

Nuevas clases en `styles.css`, junto a las `.vmd-field-*` existentes:

- `.vmd-field-range-row` — `display: flex; align-items: center; gap: 8px;`, contenedor de los dos inputs.
- `.vmd-field-range` — `flex: 1; accent-color: var(--vmd-accent);` (la variable ya existe en `styles.css` y es la usada por el resto de los controles interactivos, p. ej. `.vmd-btn--primary`).
- `.vmd-field-range-number` — mismo aspecto que `.vmd-field-input` pero con `width: 64px` en vez de `width: 100%`, y `text-align: right`.

`.vmd-field-input` no cambia — la sigue usando el campo sin rango y el `<input type="number">` de dentro de la fila (comparte la clase base, se le agrega la de ancho).

## 6. Fuera de alcance

- No se agrega símbolo de unidad (`%`, `px`) junto al valor: los labels ya lo dicen (`"Ancho %"`, `"Tamaño fuente"`), y agregarlo exige pasar una prop de unidad por los 28 callsites sin que el usuario lo haya pedido.
- No se toca ningún otro tipo de campo del inspector.
- No se cambia ningún valor de `min`/`max`/`step` existente — el spec es puramente de presentación.

## 7. Tests

No existe hoy un archivo de test dedicado a `NumberField` (se ejercita indirectamente vía los tests del inspector). Se crea `packages/email-builder/tests/number-field.test.ts`, montando el componente directo:

1. Con `min`/`max`, se renderizan un `input[type=range]` y un `input[type=number]`, ambos mostrando `modelValue`.
2. Mover el `range` (`trigger('input')` con un nuevo valor) emite `update:modelValue` con ese valor convertido a `Number`.
3. Escribir en el `input[type=number]` sigue emitiendo `update:modelValue`, como hoy.
4. Sin `min`/`max`, no se renderiza ningún `input[type=range]` — solo el `input[type=number]` de ancho completo, igual que el comportamiento actual.
5. El `label` apunta (`for`) al `id` del `input[type=number]`, y el `range` tiene el mismo texto en `aria-label`.
