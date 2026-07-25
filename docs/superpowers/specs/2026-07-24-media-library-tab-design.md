# Galería de medios (Fase 1: listar, insertar, subir, borrar, renombrar) — Diseño

**Fecha:** 2026-07-24
**Contexto:** el integrador quiere poder ofrecer una galería de imágenes propias (ej. su bucket de Firebase Storage) desde la que el usuario elige/sube/administra imágenes al armar el email, similar al picker "My Images" de Unlayer. La librería expone únicamente el contrato (tipos + prop) y la UI que lo consume; el implementador escribe las funciones reales contra su propio backend — no se asume ningún proveedor de storage.

Esta es la Fase 1 de un roadmap de 3: listar/paginar, insertar, subir, borrar, renombrar. Crop de imagen y optimización/compresión quedan **fuera de alcance** de este spec y se diseñarán por separado más adelante.

Es una pestaña **nueva y separada** de la pestaña "Imágenes" existente (que hace búsqueda de stock vía `imageSearch`/Openverse) — no se reutiliza ni se mezcla con ese flujo.

## 1. Contrato de la API

Nuevo archivo `src/mediaLibrary.ts` (paralelo a `imageSearch.ts`):

```ts
export type MediaItem = {
  id: string
  url: string
  thumbnailUrl: string
  name?: string
  size?: number
  createdAt?: string | number
}

export type MediaListPage = { items: MediaItem[]; nextCursor?: string }

export type MediaLibraryOptions = {
  list: (cursor?: string) => Promise<MediaListPage>
  upload: (file: File) => Promise<MediaItem>
  delete: (id: string) => Promise<void>
  rename: (id: string, name: string) => Promise<MediaItem>
}
```

`options.ts`: nuevo campo `mediaLibrary?: MediaLibraryOptions` en `BuilderOptions`, inyectado igual que el resto de las opciones vía `BUILDER_OPTIONS_KEY`/`useBuilderOptions()`.

Las cuatro funciones las implementa el integrador. La librería solo las invoca y reacciona a la promesa resuelta/rechazada; no asume paginación por offset, ni un shape particular de id (string libre, ej. un path de storage).

## 2. Pestaña y visibilidad

- Nuevo componente `src/components/tabs/MediaLibraryTab.vue`, montado en `SidePanel.vue` igual que `ImagesTab.vue`.
- Nueva entrada en el array `TABS` de `SidePanel.vue`: `{ key: 'media', labelKey: 'rail.media', icon: 'gallery' }` (el ícono `gallery` ya existe en `icons.ts`, sin usar hoy).
- **La pestaña solo aparece en el rail si `options.mediaLibrary` está definido** — igual que el patrón implícito de `imageSearch` (siempre visible hoy, porque tiene fallback a Openverse), pero acá sin fallback: sin `mediaLibrary`, la pestaña ni se renderiza en `TABS`.
- Nuevas claves i18n `rail.media`, y las de estados/acciones de la pestaña (subir, renombrar, borrar, confirmar, cancelar, cargar más, vacío, error) en `i18n/es.ts`, `i18n/en.ts`, `i18n/keys.ts`.

## 3. Flujo de UI (`MediaLibraryTab.vue`)

- **Carga inicial**: al montar (o al entrar a la pestaña por primera vez), llama `list()` sin cursor. Estados `loading` / `error` / `empty` / `results`, mismo patrón de `status` que `ImagesTab.vue`. A diferencia de Imágenes (que arranca en `idle` hasta que el usuario escribe), acá se arranca directo en `loading` — es un browse, no un buscador.
- **Subir**: botón "Subir imagen" arriba del grid, con un `<input type="file" accept="image/*">` oculto (mismo patrón que `PropertiesPanel.vue`). Al elegir archivo, llama `mediaLibrary.upload(file)`; mientras está en vuelo, el botón muestra estado de carga y queda deshabilitado. Al resolver, el `MediaItem` devuelto se **antepone** al array `items` local (no se vuelve a llamar `list()`). Si falla, mensaje de error inline junto al botón; el input se limpia para permitir reintentar.
- **Insertar**: click en el thumbnail de un ítem (fuera del botón "⋮" y su menú) inserta la imagen, con **la misma lógica que `selectImage()` de `ImagesTab.vue`**: si hay un bloque `image` seleccionado, `store.updateBlock(id, { src: item.url, ...(alt vacío ? { alt: item.name ?? '' } : {}) })`; si no hay selección, crea fila (`addRow([100])`) + bloque imagen (`addBlockToColumn(..., 'image')`) con ese `src`/`alt`.
- **Menú por ítem**: cada thumbnail muestra un botón "⋮" al hover (no en mobile/touch siempre visible sería aceptable si hace falta, pero el caso base es hover), que abre un menú pequeño con "Renombrar" y "Borrar". Solo un menú puede estar abierto a la vez (estado local `openMenuId`).
  - **Renombrar**: al elegir la opción, el nombre debajo del thumbnail se reemplaza por un `<input>` con el valor actual, autofocus y texto seleccionado. `Enter` o `blur` confirma → llama `mediaLibrary.rename(id, valor)`; mientras resuelve, el input queda disabled; al resolver OK actualiza el `MediaItem` local con la respuesta; si fallar, vuelve al label anterior y muestra un mensaje de error breve inline. `Escape` cancela sin llamar a la función.
  - **Borrar**: al elegir la opción, se abre un popover inline anclado al ítem: "¿Borrar esta imagen?" con botones Confirmar/Cancelar. Confirmar llama `mediaLibrary.delete(id)`; mientras resuelve, el ítem se muestra con un estado de "borrando" (opacidad reducida, sin bloquear el resto del grid); al resolver OK se quita del array local; si falla, vuelve al estado normal y muestra un mensaje de error inline en el popover (no se cierra solo, el usuario decide reintentar o cancelar).
- **Paginación**: botón "Cargar más" al final del grid, visible solo si la última respuesta (`list()` inicial o `list(cursor)`) trajo `nextCursor`. Al hacer click, llama `list(nextCursor)` y **concatena** los `items` devueltos a los ya cargados (nunca reemplaza). Si `list(cursor)` falla, conserva lo ya cargado, muestra error inline junto al botón y permite reintentar (no descarta el cursor).

## 4. Estado y manejo de errores

- Todo el estado (`items`, `nextCursor`, `status`, `uploading`, `openMenuId`, `renamingId`, `confirmingDeleteId`, mensajes de error por acción) vive en `ref`s locales del componente — mismo criterio que `ImagesTab.vue` (sin store Pinia nuevo).
- Reutiliza `useDocumentStore()` solo para las mutaciones de inserción (`updateBlock`, `addRow`, `addBlockToColumn`), igual que `ImagesTab.vue`.
- Cada acción (`list`, `upload`, `delete`, `rename`) va en su propio try/catch; un fallo nunca tira abajo el resto del grid ni descarta datos ya cargados — el error se muestra acotado a la acción que falló.

## Testing

Nuevo `tests/media-library-tab.test.ts`, siguiendo el patrón de `tests/images-tab.test.ts` (mount de `EmailBuilder` con `mediaLibrary` mockeado vía `vi.fn()`):

- La pestaña "Galería" no aparece en el rail si no se pasa `mediaLibrary`.
- Al abrir la pestaña, llama `list()` y renderiza el grid con los ítems devueltos.
- Click en un ítem sin bloque seleccionado inserta un bloque imagen nuevo con `src`/`alt` del ítem.
- Click en un ítem con bloque imagen seleccionado pisa `src` sin pisar un `alt` ya existente (mismo caso que el test análogo de `ImagesTab`).
- Error de `list()` inicial muestra el estado de error.
- Subir un archivo llama `upload(file)` y antepone el ítem devuelto al grid sin volver a llamar `list()`.
- Borrar: abre confirmación, no llama `delete` hasta confirmar; al confirmar y resolver OK quita el ítem; si `delete` rechaza, el ítem permanece y se ve el error.
- Renombrar: confirma con Enter, llama `rename(id, valor)`, actualiza el nombre mostrado; `Escape` cancela sin llamar la función.
- "Cargar más": visible solo con `nextCursor`, concatena la página siguiente sin perder los ítems previos, y desaparece cuando la respuesta ya no trae `nextCursor`.

## Fuera de alcance

Crop de imagen (Fase 2) y optimización/compresión (Fase 3) — specs separados. Persistencia/backend real de storage (responsabilidad exclusiva del integrador). Soporte de imágenes inline dentro del rich text editor (no existe hoy, tema aparte). Selección múltiple/borrado en lote. Drag & drop de archivos sobre el grid para subir (se puede agregar después sin romper este contrato).

## Criterios de aceptación

- Con `mediaLibrary` configurado, aparece la pestaña "Galería" en el rail; sin esa prop, no aparece.
- Se puede listar (con paginado por cursor), insertar, subir, borrar (con confirmación) y renombrar (inline) imágenes desde la pestaña, todo contra funciones provistas por el integrador.
- Ningún error de red dado por el integrador rompe el resto de la UI del builder.
- Retrocompat total (prop opcional, tab condicional); suite + typecheck + build verdes.
