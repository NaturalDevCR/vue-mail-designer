# Fase A — Pulido core (DnD, tabs, preview, undo) — Diseño

**Fecha:** 2026-07-20
**Contexto:** primera fase del roadmap de paridad funcional (5 fases aprobadas). Principio transversal del proyecto: **implementación clean-room** — paridad de funcionalidad con otros builders comerciales pero con identidad, nombres, código e íconos propios (prefijo `vmd-*`, marca "Vue Mail Designer"); nunca copiar assets, textos ni marcas de terceros. Compatibilidad de formatos de datos: permitida.

## Problemas que resuelve (reportados por el usuario)

1. Al arrastrar se selecciona texto del fondo.
2. Mover bloques entre columnas no es fluido; falta feedback y animación; todo se siente tosco.
3. Con un elemento seleccionado, click en un tab del riel no cambia el panel (solo Imágenes tiene precedencia); el tab clickeado debe tomar precedencia siempre.
4. El preview solo tiene Escritorio/Móvil; falta selector de tamaños tipo breakpoints + ancho custom.
5. Undo/redo: garantizar que **toda** mutación pasa por el historial con granularidad correcta (un drag = un paso).

## Diseño

### 1. DnD fluido

`DND_OPTIONS` (`components/dnd.ts`) se amplía:

```ts
{ ...lo existente,
  easing: 'cubic-bezier(0.2, 0, 0, 1)',
  fallbackTolerance: 5,        // px de movimiento antes de iniciar drag — evita drags accidentales
  emptyInsertThreshold: 24,    // px de cercanía para insertar en listas vacías
  scroll: true, scrollSensitivity: 80, scrollSpeed: 12, bubbleScroll: true,  // autoscroll
  direction: 'vertical',
}
```

**Estado global de drag:** `ui.isDragging: boolean`. Todos los `<draggable>` emiten `@start` → `ui.isDragging = true` y `@end` → `false`. Con eso:

```css
.vmd-root.vmd-is-dragging { user-select: none; -webkit-user-select: none; cursor: grabbing; }
.vmd-root.vmd-is-dragging .vmd-column-blocks { min-height: 36px; }  /* target generoso */
.vmd-root.vmd-is-dragging .vmd-column { outline: 1px dashed var(--vmd-border); outline-offset: -1px; }
.vmd-block, .vmd-row { transition: transform .15s ease; }
```

(la clase `vmd-is-dragging` se aplica en el div raíz de `EmailBuilder.vue` con `:class`). El outline por columna hace visibles los targets; el `min-height` evita que columnas con poco contenido sean imposibles de acertar.

### 2. Precedencia de tabs

Nuevo estado `ui.panelMode: 'tab' | 'props'` (default `'tab'`):
- `store.select(sel)` con `sel != null` → `panelMode = 'props'` (lo setea el componente que selecciona; centralizado en un watcher de `store.selection` dentro de `SidePanel.vue`: selección nueva → `'props'`).
- Click en cualquier botón del riel → `ui.sidebarTab = X` y `ui.panelMode = 'tab'`.
- Botón ✕ de PropertiesPanel → `store.select(null)` (el watcher no fuerza nada al deseleccionar; `panelMode` vuelve a `'tab'`).
- Render de `SidePanel`: `PropertiesPanel` si `selection && panelMode === 'props'`; si no, el tab activo. Se elimina el caso especial del tab Imágenes (la regla general ya lo cubre).
- El riel resalta el tab activo solo en modo tab; en modo props ningún tab se marca activo.

### 3. Preview con tamaños

`ui.previewDevice: 'desktop' | 'mobile'` se reemplaza por `ui.previewWidth: number` (default 1000) + presets en `PreviewDialog`:
- Botones: Escritorio (1000), Tablet (768), Móvil (375) — íconos propios; el activo se resalta comparando `previewWidth`.
- Input numérico de ancho custom (320–1400 px) siempre visible con el valor actual.
- El iframe usa `width: previewWidth px` con transición. (El HTML del email es fluido hasta su `contentWidth`; anchos mayores muestran el fondo — igual que un cliente real.)
- El toggle del canvas (`ui.canvasDevice`) NO cambia.

### 4. Auditoría undo/redo

Garantías a cubrir con tests (y fixes donde falten):
- **Un drag = un paso de undo**, incluso mover entre columnas (que dispara `replaceColumnBlocks` en origen y destino): las dos llamadas coalescen (`'dnd-blocks'`). Riesgo actual: dos drags rápidos (<600ms) también coalescen. Fix: al terminar un drag (`@end` → `ui.isDragging = false`), el store "sella" el historial (`sealHistory()`: nueva action que resetea `lastCommitKey`) para que el próximo commit nunca coalesca con el drag anterior.
- Tipeo en un bloque de texto coalesce por bloque (ya existe, `block:{id}`); editar OTRO campo/bloque no coalesce con el anterior (cubierto por keys distintos — test).
- `updateSettings` coalesce (`'settings'`) — aceptado.
- Cambios de UI (tabs, preview, device, tema) NO entran al historial — test negativo.
- Atajos: ⌘Z fuera de campos editables → historial del documento; dentro de Tiptap → historial de Tiptap (comportamiento actual, se documenta con test del guard).

## Sin cambios

Schema, renderer, API pública, formato JSON. Solo `useUiStore` (campos nuevos/renombrados: `isDragging`, `panelMode`, `previewWidth` reemplaza `previewDevice`) y componentes de UI.

## Testing

- Contrato de `DND_OPTIONS` ampliado; `vmd-is-dragging` aparece en la raíz al disparar `@start` (test de componente simulando el evento del draggable).
- panelMode: seleccionar → props; click tab → tab (con selección viva); ✕ → tab; re-seleccionar → props.
- previewWidth: presets y custom cambian el ancho del iframe; adaptar tests existentes de `data-device` en preview (los selectores cambian a `data-preset`).
- Historial: drag entre columnas = 1 undo; dos drags separados = 2 undos (con `sealHistory`); mutación de UI no toca `past`.
- Verificación en browser con gestos sintéticos: drag sin selección de texto (assert `window.getSelection().isCollapsed`), drop en columna con poco contenido, autoscroll.

## Criterios de aceptación

- Arrastrar nunca selecciona texto; los targets de drop son fáciles de acertar; hay feedback visual de targets durante el drag; el canvas autoscrollea al arrastrar cerca de los bordes.
- Click en cualquier tab del riel siempre muestra ese tab, haya o no selección; volver a propiedades es re-clickear el elemento.
- El preview permite Escritorio/Tablet/Móvil y ancho custom en px.
- Un gesto de drag es exactamente un paso de undo; la UI no ensucia el historial.
- Suite + typecheck + build verdes.
