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
          getOffset: pointerOutsideOfPreview({ x: '14px', y: '10px' }),
          render: ({ container }) => {
            const chip = document.createElement('div')
            chip.className = 'vmd-drag-preview'
            chip.textContent = opts.previewLabel()
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
