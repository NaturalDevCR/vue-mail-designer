# Fase B — Schema rico + elementos nuevos — Diseño

**Fecha:** 2026-07-20
**Contexto:** segunda fase del roadmap de paridad funcional. Principio transversal: **clean-room** — identidad/nombres/íconos/código propios (`vmd-*`, "Vue Mail Designer"); compatibilidad de formato de datos permitida. Muchas de estas propiedades son además prerrequisito para importar templates de Unlayer con fidelidad (Fase C).

## Objetivo

Enriquecer el modelo de documento con propiedades que faltan y agregar tres bloques nuevos, manteniendo retrocompatibilidad total (los JSON v1 existentes siguen validando sin migración: campos nuevos `.default()` u `.optional()`).

## Alcance

### Bloques nuevos (3)

1. **`table`** — tabla de datos. `rows: string[][]` (celdas con HTML simple), `headerRow: boolean`, estilo `{ borderColor, borderWidth, cellPadding, headerBackground, padding }`. Render: `<table>` real con `<th>`/`<td>`, bordes colapsados, estilos inline.
2. **`gallery`** — grilla de imágenes. `images: { src, alt, href? }[]`, `columns: 2|3|4`, `gap: number`, `padding`. Render: tabla de N columnas (filas de celdas con `<img width="100%">`), responsive (stack en móvil vía la clase de columna existente).
3. **`timer`** — cuenta regresiva. Como email no ejecuta JS, el estándar honesto es una **imagen dinámica servida por el integrador**: `{ endDate: string(ISO), imageUrl: string, alt, widthPct, padding }`. Render: si `imageUrl` está seteado → `<img>` linkeable; si no → caja estática estilizada "Faltan X días" calculada al render (documentada como estática). El inspector arma la config; la URL del servicio la provee el integrador (sin remotes nuestros).

### Propiedades nuevas (para todos o por tipo)

- **Ocultar por dispositivo** — `hideDesktop?: boolean`, `hideMobile?: boolean` en **cada bloque** y en **cada fila**. Render:
  - `hideMobile`: clase `vmd-hide-mobile` + `@media (max-width:480px){ .vmd-hide-mobile{ display:none !important } }` en `<head>`.
  - `hideDesktop`: técnica estándar — inline `display:none;max-height:0;overflow:hidden;mso-hide:all` + `@media (max-width:480px){ .vmd-hide-desktop{ display:block !important; max-height:none !important } }`. Las filas ocultas envuelven su tabla; los bloques ocultos envuelven su `cellTable`.
- **Imagen de fondo de fila** — `row.style.backgroundImage?: { url, repeat, size, position }`. Render: en el `<td>` contenedor de la fila, `background="{url}"` (atributo) + `style="background-image:url();background-size;background-position;background-repeat"`. Outlook con soporte parcial → documentado (VML full-bleed queda para después).
- **Borde y radio de columna** — `column.style.border?: { width, style, color }` (uniforme) y `column.style.borderRadius?: number`. Render en el `<td>` interno de la columna.
- **Fuente por bloque** — `fontFamily?: string` opcional en `heading` y `text`; si está, sobreescribe la fuente del documento en ese bloque (render y canvas).

Todos opcionales/con default → `zEmailDocument.safeParse` sigue aceptando documentos v1.

## Cambios por capa

- **schema/document.ts**: `zTableBlock`, `zGalleryBlock`, `zTimerBlock` añadidos al `zBlock` discriminated union; `hideDesktop`/`hideMobile` opcionales en `zRow` y en cada bloque (via merge de un objeto base o repetición); `backgroundImage` opcional en `zRow.style`; `border`/`borderRadius` opcionales en `zColumn.style`; `fontFamily` opcional en heading/text. `BLOCK_TYPES` suma los 3 nuevos (orden de paleta).
- **schema/factories.ts**: `createBlock` cubre los 3 nuevos con defaults; helpers para arrays de tabla/galería.
- **render/html.ts**: cases nuevos en `renderBlock`; helpers `wrapHideClasses(html, block)` y equivalente para filas; `renderTable`, `renderGallery`, `renderTimer`; bg image de fila; border/radius de columna; fontFamily por bloque; la media query de hide se inyecta siempre en `<head>` (barata, idempotente).
- **components/BlockView.vue**: vista de canvas de los 3 nuevos; indicador visual sutil cuando un bloque está oculto en el device actual (badge "oculto en móvil/desktop"). El canvas no aplica el hide real (es edición) — solo lo indica.
- **components/PropertiesPanel.vue** + fields: paneles de los 3 nuevos; toggles hide desktop/mobile (reusable `CheckboxField` nuevo o dos checkboxes); selector de fuente (`SelectField` con una lista de familias email-safe + las de Google que ya usan templates); border de columna en el panel de fila/columna; bg image de fila (URL + repeat/size/position).
- **components/tabs/ContentTab.vue** + `icons.ts` + `palette-items.ts`: entradas de paleta (Tabla, Galería, Timer) con íconos SVG propios.

## Testing

- Schema: cada bloque nuevo valida; documento v1 sin campos nuevos valida y recibe defaults; `hideDesktop/hideMobile` opcionales.
- Renderer (snapshots + asserts): tabla con/ sin header; galería 2/3/4 columnas; timer con imageUrl y sin (caja estática); `hideMobile`/`hideDesktop` emiten las clases y la media query; bg image de fila; border/radius de columna; fontFamily por bloque sobreescribe.
- BlockView: los 3 nuevos renderizan; badge de "oculto" aparece según device del canvas.
- Inspector: editar cada campo nuevo refleja en el store.
- Suite + typecheck + build verdes.

## Fuera de alcance (fases futuras)

VML full-bleed de fondos en Outlook; border por-lado de columna (uniforme por ahora); merge tags dentro de celdas de tabla (funciona el texto plano/HTML, sin UI dedicada); animación real de timer (requiere servicio del integrador).

## Criterios de aceptación

- Se pueden agregar Tabla, Galería y Timer desde la paleta, editarlos en el inspector y exportarlos a HTML válido de email.
- Un bloque o fila marcado "ocultar en móvil"/"ocultar en escritorio" se oculta en el cliente correspondiente (clases + media query en el HTML exportado); el canvas lo indica.
- Filas con imagen de fondo, columnas con borde/radio y bloques de texto/título con fuente propia exportan correctamente.
- Los JSON v1 previos importan sin migración.
- Suite + typecheck + build de librería y demo verdes.
