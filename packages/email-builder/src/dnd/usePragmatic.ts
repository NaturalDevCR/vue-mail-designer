import { onBeforeUnmount, onMounted, ref, watch, type Ref } from 'vue'
import { combine } from '@atlaskit/pragmatic-drag-and-drop/combine'
import {
  draggable,
  dropTargetForElements,
  monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import { setCustomNativeDragPreview } from '@atlaskit/pragmatic-drag-and-drop/element/set-custom-native-drag-preview'
import { pointerOutsideOfPreview } from '@atlaskit/pragmatic-drag-and-drop/element/pointer-outside-of-preview'
import { autoScrollForElements } from '@atlaskit/pragmatic-drag-and-drop-auto-scroll/element'
import { attachClosestEdge, extractClosestEdge } from '@atlaskit/pragmatic-drag-and-drop-hitbox/closest-edge'
import { packDrag, readDrag, type DragData, type Edge, type ImageSlot } from './dragData'
import { useI18n } from '../i18n/useI18n'

/**
 * Ata `bind(element)` al elemento actual de `el` y lo re-ata si el ref pasa a apuntar a otro nodo.
 * Necesario porque varias plantillas ponen el mismo ref en las dos ramas de un v-if/v-else
 * (p. ej. <img> con src vs. placeholder sin src): con un `onMounted` a secas el binding quedaría
 * pegado al nodo descartado. `flush: 'post'` garantiza que el DOM ya se actualizó al re-atar.
 */
function bindToElement(el: Ref<HTMLElement | null>, bind: (element: HTMLElement) => () => void): void {
  let cleanup = () => {}
  const stop = watch(
    el,
    (element) => {
      cleanup()
      cleanup = element ? bind(element) : () => {}
    },
    { immediate: true, flush: 'post' },
  )
  onBeforeUnmount(() => {
    stop()
    cleanup()
  })
}

/** Hace `el` arrastrable con un preview propio (chip) que no se desplaza ni se transparenta. */
export function useDraggableItem(opts: {
  el: Ref<HTMLElement | null>
  handle?: Ref<HTMLElement | null>
  getData: () => DragData
  previewLabel: () => string
  canDrag?: () => boolean
  onStart?: () => void
  onDrop?: () => void
}): void {
  bindToElement(opts.el, (element) =>
    draggable({
      element,
      dragHandle: opts.handle?.value ?? undefined,
      canDrag: () => (opts.canDrag ? opts.canDrag() : true),
      getInitialData: () => packDrag(opts.getData()),
      onGenerateDragPreview: ({ nativeSetDragImage }) => {
        setCustomNativeDragPreview({
          nativeSetDragImage,
          getOffset: pointerOutsideOfPreview({ x: '12px', y: '8px' }),
          render: ({ container }) => {
            // el contenedor se monta en <body>, fuera de .vmd-root: los estilos deben ser
            // autocontenidos (nada de var(--vmd-*), que aquí no está definido).
            const chip = document.createElement('div')
            chip.className = 'vmd-drag-preview'
            chip.style.cssText =
              'display:inline-flex;align-items:center;gap:8px;padding:8px 14px 8px 10px;' +
              'border-radius:10px;font:600 13px/1.2 system-ui,-apple-system,"Segoe UI",sans-serif;' +
              'background:#2563eb;color:#fff;box-shadow:0 10px 30px rgba(37,99,235,.45);' +
              'white-space:nowrap;transform:translateZ(0);'
            chip.innerHTML =
              '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">' +
              '<circle cx="5" cy="3" r="1.4"/><circle cx="11" cy="3" r="1.4"/>' +
              '<circle cx="5" cy="8" r="1.4"/><circle cx="11" cy="8" r="1.4"/>' +
              '<circle cx="5" cy="13" r="1.4"/><circle cx="11" cy="13" r="1.4"/></svg>' +
              '<span></span>'
            const span = chip.querySelector('span')
            if (span) span.textContent = opts.previewLabel()
            container.appendChild(chip)
          },
        })
      },
      onDragStart: () => opts.onStart?.(),
      onDrop: () => opts.onDrop?.(),
    }),
  )
}

/**
 * Convierte `el` en zona de drop con detección de borde (arriba/abajo).
 * `accept` filtra por tipo de arrastre; `onDrop` recibe el dato y el borde más cercano.
 * Devuelve un ref reactivo con el borde activo (para dibujar el indicador).
 */
export function useDropTarget(opts: {
  el: Ref<HTMLElement | null>
  getData: () => Record<string, unknown>
  accept: (drag: DragData) => boolean
  onDrop: (drag: DragData, edge: Edge | null) => void
}): { edge: Ref<Edge | null> } {
  const edge = ref<Edge | null>(null)
  bindToElement(opts.el, (element) => {
    // los drop targets anidados (bloque dentro de columna dentro de fila) burbujean el
    // evento a TODOS los targets ancestros compatibles — sin este chequeo, soltar sobre un
    // bloque dispara también el onDrop de su columna y duplica la inserción.
    const isInnermost = (location: { current: { dropTargets: { element: Element }[] } }) =>
      location.current.dropTargets[0]?.element === element
    return dropTargetForElements({
      element,
      canDrop: ({ source }) => {
        const d = readDrag(source.data as Record<string, unknown>)
        return d ? opts.accept(d) : false
      },
      getData: ({ input, element: el }) =>
        attachClosestEdge(opts.getData(), { input, element: el, allowedEdges: ['top', 'bottom'] }),
      getIsSticky: () => true,
      onDrag: ({ self, location }) => {
        if (!isInnermost(location)) {
          edge.value = null
          return
        }
        const e = extractClosestEdge(self.data)
        edge.value = e === 'top' ? 'before' : e === 'bottom' ? 'after' : null
      },
      onDragLeave: () => {
        edge.value = null
      },
      onDrop: ({ self, source, location }) => {
        edge.value = null
        if (!isInnermost(location)) return
        const d = readDrag(source.data as Record<string, unknown>)
        const e = extractClosestEdge(self.data)
        if (d) opts.onDrop(d, e === 'top' ? 'before' : e === 'bottom' ? 'after' : null)
      },
    })
  })
  return { edge }
}

/** Monitor global de arrastres: mantiene el estado isDragging y hace autoscroll del contenedor. */
export function useDragMonitor(opts: {
  scrollEl: Ref<HTMLElement | null>
  onStart: () => void
  onEnd: () => void
}): void {
  let cleanup = () => {}
  onMounted(() => {
    const parts = [
      monitorForElements({
        onDragStart: () => opts.onStart(),
        onDrop: () => opts.onEnd(),
      }),
    ]
    if (opts.scrollEl.value) parts.push(autoScrollForElements({ element: opts.scrollEl.value }))
    cleanup = combine(...parts)
  })
  onBeforeUnmount(() => cleanup())
}

/** Los dos arrastres que llevan una imagen: desde los tabs (copia) y desde el canvas (mueve). */
export type ImageDrag = Extract<DragData, { kind: 'media-image' | 'canvas-image' }>

function isImageDrag(d: DragData | null): d is ImageDrag {
  return d?.kind === 'media-image' || d?.kind === 'canvas-image'
}

/**
 * Zona de drop de "reemplazo" para imágenes (kinds `media-image` y `canvas-image`): a diferencia
 * de `useDropTarget`, no calcula borde de inserción — solo expone `isOver` para resaltar el
 * destino. Solo el target de imagen más interno debe aplicar el drop: el canvas y el contenedor
 * de filas también aceptan `media-image` como fallback para crear un bloque nuevo.
 */
export function useMediaDropTarget(opts: {
  el: Ref<HTMLElement | null>
  onDrop: (drag: ImageDrag) => void
}): { isOver: Ref<boolean> } {
  const isOver = ref(false)
  bindToElement(opts.el, (element) =>
    dropTargetForElements({
      element,
      canDrop: ({ source }) => isImageDrag(readDrag(source.data as Record<string, unknown>)),
      onDragEnter: ({ location }) => {
        if (location.current.dropTargets[0]?.element === element) isOver.value = true
      },
      onDragLeave: () => {
        isOver.value = false
      },
      onDrop: ({ source, location }) => {
        isOver.value = false
        if (location.current.dropTargets[0]?.element !== element) return
        const d = readDrag(source.data as Record<string, unknown>)
        if (isImageDrag(d)) opts.onDrop(d)
      },
    }),
  )
  return { isOver }
}

/**
 * Hace arrastrable una imagen que ya está en el canvas (el <img> de un bloque `image` o de un
 * ítem de galería). Sin `handle`: arrastra el elemento entero — no choca con el arrastre del
 * bloque, que está restringido a su handle de mover. Un hueco vacío no arrastra nada.
 */
export function useCanvasImageDrag(opts: {
  el: Ref<HTMLElement | null>
  getData: () => { src: string; alt: string; from: ImageSlot }
}): void {
  const { t } = useI18n()
  useDraggableItem({
    el: opts.el,
    getData: () => ({ kind: 'canvas-image', ...opts.getData() }),
    previewLabel: () => opts.getData().alt || t('palette.image'),
    canDrag: () => !!opts.getData().src,
  })
}
