<template>
  <draggable
    :list="blockItems"
    :group="{ name: 'blocks', pull: 'clone', put: false }"
    :sort="false"
    v-bind="DND_OPTIONS"
    :clone="cloneBlock"
    :move="onMove"
    item-key="key"
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
import { createBlock, createCustomBlock } from '../../schema'
import type { Block, BlockType } from '../../schema'
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

type PaletteItem = { key: string; type: BlockType; labelKey?: string; label?: string; icon?: string; customType?: string }

// lista visible: nativos (filtrados/ordenados por `tools`) + bloques personalizados
const blockItems = computed<PaletteItem[]>(() => {
  const tools = options.tools ?? {}
  const natives: PaletteItem[] = PALETTE_BLOCKS.map((b, i) => ({ ...b, i, key: b.type }))
    .filter((b) => tools[b.type]?.enabled !== false)
    .sort((a, b) => {
      const pa = tools[a.type]?.position
      const pb = tools[b.type]?.position
      if (pa != null && pb != null) return pa - pb
      if (pa != null) return -1
      if (pb != null) return 1
      return a.i - b.i
    })
  const customs: PaletteItem[] = (options.customBlocks ?? []).map((d) => ({
    key: 'custom:' + d.type,
    type: 'custom' as BlockType,
    label: d.label,
    icon: d.icon,
    customType: d.type,
  }))
  return [...natives, ...customs]
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

function cloneBlock(item: PaletteItem): Block {
  if (item.customType) {
    const def = options.customBlocks?.find((d) => d.type === item.customType)
    if (def) return createCustomBlock(def.type, def.defaultData)
  }
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

// ícono + label; los custom traen su propio label/icon, los nativos usan i18n
function itemHtml(element: PaletteItem) {
  const icon = element.customType ? (element.icon ?? ICONS.html) : (ICONS[element.type] ?? '')
  const label = element.labelKey ? t(element.labelKey) : (element.label ?? '')
  return `${icon}<span>${label}</span>`
}
</script>
