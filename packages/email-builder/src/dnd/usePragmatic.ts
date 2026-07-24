import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'
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
import { packDrag, readDrag, type DragData, type Edge } from './dragData'

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
  let cleanup = () => {}
  onMounted(() => {
    const element = opts.el.value
    if (!element) return
    cleanup = draggable({
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
    })
  })
  onBeforeUnmount(() => cleanup())
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
  let cleanup = () => {}
  onMounted(() => {
    const element = opts.el.value
    if (!element) return
    cleanup = dropTargetForElements({
      element,
      canDrop: ({ source }) => {
        const d = readDrag(source.data as Record<string, unknown>)
        return d ? opts.accept(d) : false
      },
      getData: ({ input, element: el }) =>
        attachClosestEdge(opts.getData(), { input, element: el, allowedEdges: ['top', 'bottom'] }),
      getIsSticky: () => true,
      onDrag: ({ self }) => {
        const e = extractClosestEdge(self.data)
        edge.value = e === 'top' ? 'before' : e === 'bottom' ? 'after' : null
      },
      onDragLeave: () => {
        edge.value = null
      },
      onDrop: ({ self, source }) => {
        const d = readDrag(source.data as Record<string, unknown>)
        const e = extractClosestEdge(self.data)
        edge.value = null
        if (d) opts.onDrop(d, e === 'top' ? 'before' : e === 'bottom' ? 'after' : null)
      },
    })
  })
  onBeforeUnmount(() => cleanup())
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
