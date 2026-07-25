# Editor de imagen — Crop (primera herramienta) — Diseño

**Fecha:** 2026-07-25
**Contexto:** primera fase de un editor de imagen inspirado en Unlayer (captura de referencia provista por el usuario). El roadmap completo son 5 herramientas — Filter, Crop, Resize, Draw, Text — cada una con su propio spec/plan/implementación. Shapes, Stickers y Frame quedan explícitamente fuera de alcance (decisión del usuario). Este spec cubre solo **Crop**, pero también el shell de modal compartido que usarán las 4 herramientas siguientes.

## 1. Dependencia nueva

`vue-advanced-cropper` (componente Vue 3 nativo, no wrapper de una lib vanilla) resuelve la interacción de recorte: rectángulo arrastrable/redimensionable, aspect ratio libre/fijo, rotación y flip. Es una desviación deliberada del patrón "cero dependencias nuevas" seguido en fases anteriores (fuentes, bloques custom, export de imagen, versiones) — decisión explícita del usuario, justificada porque la interacción de crop (drag/resize con handles, aspect-lock, touch) es sustancialmente más compleja que lo que se viene hand-rolling en este proyecto.

## 2. Shell de modal compartido

Nuevo componente `packages/email-builder/src/components/ImageEditorModal.vue`:
- Header: título de la herramienta activa + botones "Cancelar"/"Guardar".
- Riel derecho con 5 entradas: Filter, Crop, Resize, Draw, Text. Solo **Crop** está habilitada en esta fase; las otras 4 se muestran deshabilitadas con indicación "Próximamente" (sin funcionalidad, solo placeholder visual para no tener que rehacer el layout cuando se agreguen).
- El contenido central renderiza el panel de la herramienta activa — en esta fase, siempre `CropPanel.vue` (única opción habilitada).
- Mismo patrón de montaje condicional que `TemplateGallery`/`ui.galleryOpen`: `EmailBuilder.vue` monta `<ImageEditorModal v-if="ui.imageEditorBlockId" />`.

Nuevo campo en `packages/email-builder/src/store/ui.ts`: `imageEditorBlockId: Ref<string | null>` — el id del bloque imagen que se está editando (`null` = modal cerrado). Se resetea a `null` al cancelar o guardar.

## 3. Punto de entrada

En `PropertiesPanel.vue`, dentro del bloque `v-else-if="block.type === 'image'"`, junto al bloque de "Subir imagen" existente: nuevo botón "Recortar", visible solo si `options.uploadImage` está definido **y** `block.src` no está vacío (no tiene sentido recortar una imagen que no existe todavía). Click → `ui.imageEditorBlockId = block.id`.

## 4. `CropPanel.vue` — controles (según la captura de referencia)

- **Aspect ratio**: grilla de botones — Free, Original, Square, 4:3, 3:2, 16:9, 3:4, 2:3, 9:16. Mapea a la prop `stencil-props.aspectRatio` del `<Cropper>` de `vue-advanced-cropper` (`Free` = `undefined`, `Original` = aspect ratio natural de la imagen cargada, el resto = valores fijos).
- **Rotar & Flip**: botones "Rotar izquierda"/"Rotar derecha" (±90°) y "Flip horizontal"/"Flip vertical", más un slider "Enderezar" (rotación fina, rango -45°/45°). Rotar-izq/der y enderezar comparten un único estado `rotationDeg` (acumulado) aplicado vía el método `rotate()` del cropper; flip usa flags booleanos `flippedH`/`flippedV` aplicados vía `flip()`.
- **Esquinas → Radio**: slider que **no** modifica los píxeles recortados. Se guarda directo como `block.borderRadius` (px) y se renderiza con CSS `border-radius` tanto en el canvas del builder como en el HTML exportado — evita compositing de PNG con transparencia (frágil, y innecesario ya que `border-radius` en `<img>` tiene soporte aceptable en los clientes de correo modernos, mismo criterio ya aceptado en el proyecto para otras propiedades visuales).
- **Reset**: vuelve aspect ratio, rotación, flip y radio a su estado inicial (el que tenía el bloque al abrir el modal).

## 5. Cambio de schema

`packages/email-builder/src/schema/document.ts`, `zImageBlock`: nuevo campo opcional `borderRadius: z.number().min(0).optional()`. Retrocompatible (opcional, sin default forzado — los diseños existentes sin el campo siguen renderizando igual).

Render: `border-radius:${block.borderRadius}px` se agrega al `imgStyle` en `render/html.ts` (case `'image'`, junto a `display/width/height/border`) y al binding `:style` del `<img>` en `BlockView.vue`, en ambos casos solo cuando `block.borderRadius` está definido.

## 6. Flujo de guardado

1. Usuario ajusta aspect ratio / recorte / rotación / flip / radio en `CropPanel.vue`.
2. "Guardar": se llama `cropper.getResult()` (de `vue-advanced-cropper`) para obtener el `canvas` ya recortado+rotado+flippeado.
3. `canvas.toBlob()` → se envuelve en un `File` llamado `cropped.png`, tipo `image/png` (formato fijo, sin intentar inferir el tipo MIME de la imagen original — `canvas.toBlob()` solo garantiza soporte de png/jpeg/webp de forma consistente entre navegadores).
4. `options.uploadImage(file)` → `Promise<string>`. Mientras está en vuelo, "Guardar" muestra estado de carga y queda deshabilitado.
5. Al resolver: `store.updateBlock(blockId, { src: url, borderRadius: <valor del slider o undefined> })`, se cierra el modal (`ui.imageEditorBlockId = null`).
6. "Cancelar": cierra el modal sin llamar `updateBlock` — el bloque queda exactamente como estaba.

## 7. Manejo de errores

- **Imagen cross-origin sin CORS**: `canvas.toBlob()`/`getResult()` puede fallar por "tainted canvas" si `block.src` es de otro origen y ese origen no habilita CORS. Se captura el error y se muestra un mensaje inline en el modal ("No se pudo procesar esta imagen (¿es de otro origen sin CORS habilitado?)."), sin cerrar el modal — mismo límite ya documentado para `exportImage` (Fase E).
- **Falla de `uploadImage`**: mensaje inline análogo, el modal permanece abierto y el usuario puede reintentar "Guardar" sin perder los ajustes de recorte ya hechos.

## Testing

- El botón "Recortar" aparece solo con `options.uploadImage` **y** `block.src` presentes; no aparece si falta cualquiera de los dos.
- Click en "Recortar" abre el modal (`ui.imageEditorBlockId` pasa a tener el id del bloque); "Cancelar" lo cierra sin tocar el bloque.
- "Guardar" llama a `uploadImage` con un `File` y actualiza `block.src` con la URL resuelta; si se ajustó el radio, `block.borderRadius` queda seteado.
- Falla de `uploadImage` en el flujo de guardado: el modal no se cierra, se ve el mensaje de error, el bloque no cambia.
- `border-radius` se refleja en el render del canvas (`BlockView.vue`) y en el HTML exportado (`render/html.ts`) cuando `block.borderRadius` está definido; ausente cuando no lo está (retrocompat).
- **Fuera de lo testeable en jsdom** (se verifica manualmente en browser, mismo criterio que `exportImage`): arrastrar/redimensionar el rectángulo de recorte provisto por `vue-advanced-cropper`, aplicar aspect ratio/rotar/flip/enderezar visualmente, y el caso de tainted canvas real contra una imagen cross-origin sin CORS.

## Fuera de alcance

Filter, Resize, Draw y Text (próximas fases, cada una con su propio spec). Shapes, Stickers, Frame (excluidos del roadmap por decisión del usuario). Recortar desde la Galería de medios (solo el bloque imagen seleccionado, por ahora). Radio de esquinas horneado en los píxeles (se implementa como CSS, no como compositing de canvas).

## Criterios de aceptación

- Con `uploadImage` configurado y un bloque imagen con `src`, aparece "Recortar" en el inspector.
- El modal abre con el shell compartido (riel con Crop habilitado, las otras 4 pestañas visibles pero deshabilitadas).
- Ajustar aspect ratio/rotar/flip/enderezar/radio y guardar produce una nueva imagen subida vía `uploadImage`, con `block.src` actualizado y `block.borderRadius` reflejado en el render.
- Cancelar no modifica el bloque. Un fallo (CORS o upload) se muestra inline sin romper el modal.
- Retrocompat total (campo de schema opcional); suite + typecheck + build verdes.
