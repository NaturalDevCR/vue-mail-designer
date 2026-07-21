# Fase E — Extras (fuentes, merge tags, bloques custom, export/versiones) — Diseño

**Fecha:** 2026-07-20
**Contexto:** quinta y última fase del roadmap. Clean-room. Cubre las cuatro piezas seleccionadas, en orden. Todo aditivo y retrocompatible.

## 1. Fuentes personalizadas

- `FontDef = { label: string; value: string; url?: string }` — `value` es el font-family CSS (ej. `"'Roboto', sans-serif"`), `url` opcional es el CSS de Google Fonts.
- `DEFAULT_FONTS: FontDef[]` — email-safe (Arial, Georgia, Times New Roman, Verdana, Tahoma, Courier New) + populares con url (Roboto, Open Sans, Lato, Montserrat, Poppins).
- Prop `fonts?: FontDef[]` reemplaza/extiende la lista. Provista vía opciones.
- **UI**: el tab Cuerpo y el inspector de heading/text usan un selector de fuente poblado con la lista (label visible, value aplicado). Reemplaza el `TextField`/`SelectField` de fuente actual.
- **WYSIWYG en canvas**: al montar, se inyecta un `<link>` en `document.head` por cada fuente con `url` (idempotente por url), para que el canvas muestre la tipografía.
- **Export**: `renderHtml` recolecta las fuentes usadas (settings.fontFamily + fontFamily de bloques), las cruza con la lista, y emite un `<link>` en el `<head>` por cada una con `url`. La lista se pasa a `renderHtml` como segundo arg opcional `fonts` (default `DEFAULT_FONTS`).

## 2. Merge tags agrupados + special links

- `mergeTags` acepta además grupos: `MergeTagGroup = { name: string; tags: MergeTagDef[] }`; la prop pasa a `Array<MergeTagDef | MergeTagGroup>`. El dropdown "Variable…" del editor muestra `<optgroup>` para los grupos y sueltas para las planas. Helper `flattenMergeTags()` normaliza.
- `specialLinks?: SpecialLink[]` con `SpecialLink = { name: string; href: string }` (ej. `{ name: 'Cancelar suscripción', href: '{{unsubscribe_url}}' }`). Un segundo dropdown en el editor los inserta como `<a href>` sobre la selección. `DEFAULT_SPECIAL_LINKS` incluye cancelar suscripción y ver en navegador.

## 3. Bloques personalizados (API)

- `CustomBlockDef = { type: string; label: string; icon?: string; defaultData: Record<string, unknown>; fields: CustomField[]; render: (data) => string }` donde `CustomField = { key: string; label: string; type: 'text' | 'number' | 'color' | 'textarea' }`.
- Prop `customBlocks?: CustomBlockDef[]`.
- **Schema**: bloque genérico `custom` `{ id, type: 'custom', customType: string, data: Record<string, unknown> }` en el union (retrocompat: opcional/nuevo miembro). `createBlock('custom')` no aplica (los custom se crean con su `customType`); helper `createCustomBlock(def)`.
- **Paleta**: los custom aparecen en Contenido (después de los nativos) con su `icon`/`label`; al arrastrar crean un bloque `custom` con `customType` y `defaultData` clonado.
- **Renderer**: el `custom` case llama al `render(data)` registrado (pasado a `renderHtml` vía las opciones/registry); si no hay registro para ese `customType`, emite un placeholder comentado. Se envuelve con `wrapHidden` como el resto.
- **Canvas**: `BlockView` renderiza el custom con el mismo `render(data)` (v-html) o un placeholder si no hay registro.
- **Inspector**: editor genérico que recorre `fields` y edita `data[key]` con el control según `field.type`.

## 4. Export a imagen + versiones

- **Export imagen**: función `exportImage(): Promise<string>` expuesta que renderiza el HTML del email en un contenedor oculto y usa una captura a canvas → PNG data URL. Para no agregar una dependencia pesada, se implementa con `foreignObject` de SVG + `canvas.drawImage` (técnica DOM→SVG→canvas, sin libs); si el navegador la bloquea (tainted canvas por imágenes cross-origin), se documenta la limitación. Botón "Exportar imagen" en el menú EXPORTAR.
- **Versiones**: acciones del store `saveVersion(name)`, `versions` (lista `{ id, name, at, doc }`), `loadVersion(id)`, `deleteVersion(id)` (snapshots en memoria, no persistidos por la librería). UI: un diálogo "Versiones" (en el header) para guardar/cargar/borrar. La demo persiste `versions` en localStorage.

## Testing

- Fuentes: `DEFAULT_FONTS` presente; `renderHtml` emite `<link>` solo para fuentes usadas con url; selector en Cuerpo aplica el value.
- Merge tags: `flattenMergeTags` normaliza grupos+planas; el dropdown muestra optgroups; special link inserta `<a>`.
- Custom blocks: `createCustomBlock` produce un bloque válido; `renderHtml` con registry llama al render; sin registry → placeholder; paleta muestra los custom; inspector edita `data`.
- Export/versiones: `saveVersion`/`loadVersion`/`deleteVersion` sobre el store; el diálogo guarda y restaura. `exportImage` se testea a nivel de que produce un data URL (o se marca como no-testeable en jsdom y se verifica en browser).
- Retrocompat + suite + typecheck + build verdes.

## Fuera de alcance

Persistencia de versiones/fuentes en la librería (la hace el integrador/demo); edición visual avanzada de bloques custom (más allá de los `fields` simples); export a PDF.

## Criterios de aceptación

- Selección de fuente con lista curada; las Google Fonts se ven en el canvas y en el HTML exportado.
- Merge tags agrupados en el dropdown; special links insertables.
- El integrador registra un bloque propio y funciona (paleta → canvas → inspector → export).
- Export a imagen del diseño y versiones nombradas guardar/cargar.
- Retrocompat total; suite + typecheck + builds verdes.
