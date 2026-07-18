# UI estilo Unlayer + DnD fluido — Diseño

**Fecha:** 2026-07-17
**Alcance:** rediseño de la capa de componentes UI del builder (v2 ya mergeada en main) + mejora del drag & drop + tab de imágenes stock. El modelo de documento, store, renderer y API pública existentes se conservan; solo se agregan settings nuevos y una prop.

## Objetivo

Que el builder se vea y se sienta como Unlayer Studio: header oscuro, canvas centrado con máximo espacio, un único sidebar derecho con riel vertical de tabs, y un drag & drop suave con ghost y placeholder estilizados.

## Decisiones cerradas

| Tema | Decisión |
|---|---|
| Tabs del sidebar | Los 4: Content (bloques), Blocks (layouts de fila), Body (settings), Images (banco de fotos) |
| Banco de imágenes | API de Openverse por defecto (gratuita, sin key, imágenes CC); prop `imageSearch?: (query: string) => Promise<ImageResult[]>` para override del integrador |
| DnD | Se mantiene vuedraggable/SortableJS pero con `forceFallback: true` + ghost/placeholder custom (modo suave, no HTML5 nativo) |
| Preview | El toggle Escritorio/Móvil pasa a la barra del canvas y redimensiona el canvas en vivo; el modal de vista previa (HTML real en iframe) se conserva tras el botón "ojo" |
| Paleta izquierda | Desaparece; sus bloques/layouts viven en los tabs Content y Blocks |

## Layout

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER oscuro (#0e1a2b): nombre · Plantillas   ·  Guardado ☾ [EXPORTAR ▾] │
├──────────────────────────────────────────────┬───────────┬───┤
│ BARRA CANVAS: ↶ ↷ │ [🖥 📱] centro │ 👁      │  SIDEBAR  │ R │
├──────────────────────────────────────────────┤  (~380px) │ I │
│                                              │           │ E │
│              CANVAS centrado                 │  tab      │ L │
│        (ancho 600 desktop / 375 móvil,       │  activo   │   │
│         transición animada)                  │           │ 4 │
│                                              │           │tabs│
└──────────────────────────────────────────────┴───────────┴───┘
```

- **Header** (`BuilderHeader.vue`, reemplaza la mitad del toolbar): título "Vue Mail Designer", botón Plantillas, indicador de guardado (emitido tras cada `change`: "Guardado" fijo — la persistencia es del integrador, el texto es informativo tipo Unlayer "Draft Saved"), toggle tema ☾/☀, botón primario **EXPORTAR** con menú desplegable: Exportar HTML, Exportar JSON, Importar JSON.
- **Barra del canvas** (`CanvasBar.vue`): undo/redo izquierda; centro toggle 🖥 Escritorio / 📱 Móvil (cambia `ui.canvasDevice`); derecha botón 👁 que abre el `PreviewDialog` existente.
- **Canvas** (`BuilderCanvas.vue` modificado): sin paleta izquierda; página centrada; en modo móvil la página se estrecha a 375px con `transition: width .25s` (los estilos del email no cambian — es la misma vista de edición más angosta).
- **Sidebar** (`SidePanel.vue`, nuevo): panel de ~380px + riel vertical de 4 tabs con ícono+label (Content/Blocks/Body/Images). Estado en `ui.sidebarTab`.
  - **Modo propiedades**: cuando hay selección (bloque o fila), el panel completo muestra las propiedades (los sub-paneles por tipo del `InspectorPanel` actual, reorganizados) con header: nombre del elemento + 🗑 borrar + ⧉ duplicar + ✕ cerrar (deselecciona). Al cerrar/deseleccionar vuelve al tab activo.

## Tabs

1. **Content** (`ContentTab.vue`): grid 3 columnas de los 10 bloques, arrastrables (clone) al canvas. Íconos SVG inline propios (sin emoji, sin dependencia de icon-font).
2. **Blocks** (`BlocksTab.vue`): los 6 layouts de fila como miniaturas dibujadas (rectángulos proporcionales estilo Unlayer), arrastrables al canvas (grupo rows).
3. **Body** (`BodyTab.vue`): settings del documento — los actuales (ancho, color de fondo, fuente, preheader) + nuevos: **alineación de contenido** (izquierda/centro), **color de links** y **subrayado de links**.
4. **Images** (`ImagesTab.vue`): input de búsqueda con debounce; grid de 2 columnas; estados vacío/cargando/error/sin-resultados; al hacer click: si hay un bloque imagen seleccionado, le setea `src` (+`alt` con el título si está vacío); si no, agrega una fila nueva con un bloque imagen al final del documento. Crédito "Imágenes de Openverse (CC)".

## Cambios de schema y renderer

`zEmailSettings` gana tres campos **con `.default()`** para que los JSON v1 existentes sigan validando sin migración:

```
contentAlignment: z.enum(['left','center']).default('center')
linkColor: z.string().default('#3b82f6')
linkUnderline: z.boolean().default(true)
```

Renderer (`render/html.ts`):
- `contentAlignment` → atributo `align` del `<td>` contenedor de la tabla principal (hoy hardcodeado `center`).
- Links de bloques de texto: post-proceso del HTML de Tiptap que inyecta estilo inline en cada `<a ` (`color:{linkColor};text-decoration:{underline|none}`) — inline porque el CSS del `<head>` no es confiable en email. Los links de menú/botón conservan sus estilos propios.
- Tests: casos nuevos + snapshots actualizados.

## Drag & drop

En todos los `<draggable>` (tabs y canvas):
- `:force-fallback="true"`, `:fallback-on-body="true"`, `:animation="200"`, `:swap-threshold="0.65"`, `fallback-class="vmd-drag-card"`, `ghost-class="vmd-ghost"`.
- **`.vmd-drag-card`** (el elemento que sigue el cursor): tarjeta compacta con sombra, escala 0.9, opacidad 0.9.
- **`.vmd-ghost`** (el hueco de inserción): bloque azul translúcido con borde — el "placeholder" de Unlayer.
- **Handle de mover** ✥ en bloques y filas, visible al hover/selección (junto a duplicar/borrar); el elemento entero sigue siendo arrastrable.
- Columnas vacías: `.vmd-column-empty` se ilumina cuando un drag está encima (clase `vmd-dropping` vía eventos de Sortable o CSS `:has`/hover del fallback).
- Con forceFallback el drag responde a eventos de mouse sintéticos → la verificación de gestos por automatización pasa a ser posible y **se hace en browser** al final.

## API pública

- Nueva prop: `imageSearch?: (query: string) => Promise<ImageResult[]>` con `type ImageResult = { url: string; thumbnailUrl: string; title?: string }`. Default interno: Openverse (`https://api.openverse.org/v1/images/?q=...&license_type=commercial&page_size=20`), mapeando `results[].{url,thumbnail,title}`.
- Todo lo demás (props, eventos, expose) queda igual.

## Componentes: altas y bajas

| Componente | Destino |
|---|---|
| `BlockPalette.vue` | ELIMINADO (contenido migra a ContentTab/BlocksTab) |
| `BuilderToolbar.vue` | ELIMINADO (se divide en BuilderHeader + CanvasBar; atajos ⌘Z viven en CanvasBar) |
| `InspectorPanel.vue` | Se convierte en `PropertiesPanel.vue` (modo propiedades del sidebar, con header de acciones); los fields/ se conservan |
| `SidePanel.vue`, `ContentTab.vue`, `BlocksTab.vue`, `BodyTab.vue`, `ImagesTab.vue`, `BuilderHeader.vue`, `CanvasBar.vue`, `icons.ts` | NUEVOS |
| `EmailBuilder.vue` | Layout nuevo: header / (canvas-area + sidepanel) |
| `useUiStore` | + `canvasDevice: 'desktop'|'mobile'`, `sidebarTab: 'content'|'blocks'|'body'|'images'` |

## Testing

- Schema/renderer: defaults de settings nuevos, inyección de estilo en links, `align` del contenedor, snapshots regenerados.
- Componentes: SidePanel cambia a modo propiedades al seleccionar y vuelve al cerrar; toggle device cambia el ancho del canvas; ImagesTab con `imageSearch` mock (estados y click-para-insertar); EXPORT menu abre y dispara export.
- Los tests existentes que referencian `BlockPalette`/`BuilderToolbar` se adaptan a los componentes nuevos (mismas aserciones de conducta).
- Verificación final en browser incluyendo gestos de drag reales (posible gracias a forceFallback).

## Fuera de alcance

Edición responsive por dispositivo (estilos distintos en móvil), tab Audit/AI de Unlayer, subida de imágenes al banco (sigue el `uploadImage` del inspector), i18n (la UI sigue en español).

## Criterios de aceptación

- Layout Unlayer: header oscuro con EXPORTAR, barra de canvas con device toggle centrado, canvas centrado sin paleta izquierda, sidebar único derecho con riel de 4 tabs.
- Seleccionar un elemento muestra sus propiedades en el sidebar con acciones (borrar/duplicar/cerrar); cerrar vuelve al tab.
- Arrastrar desde Content/Blocks al canvas y reordenar se siente suave: tarjeta que sigue el cursor + placeholder azul de inserción (verificado con gestos en browser).
- Toggle móvil estrecha el canvas a 375px con animación; el modal de preview sigue mostrando el HTML real.
- Buscar en Images sin configurar nada devuelve resultados de Openverse; click inserta/setea la imagen.
- Links de texto exportan con color/subrayado de settings; JSON v1 viejos importan sin migración.
- `pnpm check` y suite completa en verde; build de librería y demo OK.
