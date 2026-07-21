<template>
  <draggable
    :list="blockItems"
    :group="{ name: 'blocks', pull: 'clone', put: false }"
    :sort="false"
    v-bind="DND_OPTIONS"
    :clone="cloneBlock"
    :move="onMove"
    item-key="type"
    class="vmd-content-grid"
    @start="ui.isDragging = true"
    @end="onDragEnd"
  >
    <template #item="{ element }">
      <div
        class="vmd-content-item"
        :class="{ 'vmd-content-item--disabled': isDisabled(element.type) }"
        :title="isDisabled(element.type) ? t('palette.limitReached') : ''"
        v-html="itemHtml(element)"
      ></div>
    </template>
  </draggable>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import draggable from 'vuedraggable'
import { createBlock } from '../../schema'
import type { BlockType } from '../../schema'
import { useDocumentStore } from '../../store/document'
import { useBuilderPinia } from '../../store/keys'
import { useUiStore } from '../../store/ui'
import { useBuilderOptions } from '../../options'
import { useI18n } from '../../i18n/useI18n'
import { DND_OPTIONS } from '../dnd'
import { ICONS } from '../icons'
import { PALETTE_BLOCKS } from '../palette-items'

const store = useDocumentStore(useBuilderPinia())
const ui = useUiStore(useBuilderPinia())
const options = useBuilderOptions()
const { t } = useI18n()

// lista visible: filtra deshabilitados y ordena por `position`
const blockItems = computed(() => {
  const tools = options.tools ?? {}
  const withIndex = PALETTE_BLOCKS.map((b, i) => ({ ...b, i }))
    .filter((b) => tools[b.type]?.enabled !== false)
  return withIndex.sort((a, b) => {
    const pa = tools[a.type]?.position
    const pb = tools[b.type]?.position
    if (pa != null && pb != null) return pa - pb
    if (pa != null) return -1
    if (pb != null) return 1
    return a.i - b.i
  })
})

// conteo de uso por tipo en el documento actual
const counts = computed(() => {
  const map: Partial<Record<BlockType, number>> = {}
  for (const row of store.doc.rows)
    for (const col of row.columns)
      for (const blk of col.blocks) map[blk.type] = (map[blk.type] ?? 0) + 1
  return map
})

function isDisabled(type: BlockType): boolean {
  const limit = options.tools?.[type]?.usageLimit
  return limit != null && (counts.value[type] ?? 0) >= limit
}

function cloneBlock(item: (typeof PALETTE_BLOCKS)[number]) {
  return createBlock(item.type)
}

// bloquea el arrastre de un ítem que alcanzó su límite
function onMove(e: { draggedContext: { element: { type: BlockType } } }): boolean {
  return !isDisabled(e.draggedContext.element.type)
}

function onDragEnd() {
  ui.isDragging = false
  store.sealHistory()
}

// ícono estático propio + label traducido
function itemHtml(element: (typeof PALETTE_BLOCKS)[number]) {
  return `${ICONS[element.type] ?? ''}<span>${t(element.labelKey)}</span>`
}
</script>
