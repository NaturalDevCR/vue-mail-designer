<template>
  <div class="vmd-content-grid">
    <PaletteItem
      v-for="item in blockItems"
      :key="item.key"
      :html="itemHtml(item)"
      :title="isDisabled(item.type) ? t('palette.limitReached') : ''"
      :disabled="isDisabled(item.type)"
      :preview-label="itemLabel(item)"
      :create="() => cloneBlock(item)"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { createBlock, createCustomBlock } from '../../schema'
import type { Block, BlockType } from '../../schema'
import { useDocumentStore } from '../../store/document'
import { useBuilderPinia } from '../../store/keys'
import { useBuilderOptions } from '../../options'
import { useI18n } from '../../i18n/useI18n'
import { ICONS } from '../icons'
import { PALETTE_BLOCKS } from '../palette-items'
import PaletteItem from './PaletteItem.vue'

const store = useDocumentStore(useBuilderPinia())
const options = useBuilderOptions()
const { t } = useI18n()

type PaletteEntry = { key: string; type: BlockType; labelKey?: string; label?: string; icon?: string; customType?: string }

// lista visible: nativos (filtrados/ordenados por `tools`) + bloques personalizados
const blockItems = computed<PaletteEntry[]>(() => {
  const tools = options.tools ?? {}
  const natives: PaletteEntry[] = PALETTE_BLOCKS.map((b, i) => ({ ...b, i, key: b.type }))
    .filter((b) => tools[b.type]?.enabled !== false)
    .sort((a, b) => {
      const pa = tools[a.type]?.position
      const pb = tools[b.type]?.position
      if (pa != null && pb != null) return pa - pb
      if (pa != null) return -1
      if (pb != null) return 1
      return a.i - b.i
    })
  const customs: PaletteEntry[] = (options.customBlocks ?? []).map((d) => ({
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

function cloneBlock(item: PaletteEntry): Block {
  if (item.customType) {
    const def = options.customBlocks?.find((d) => d.type === item.customType)
    if (def) return createCustomBlock(def.type, def.defaultData)
  }
  return createBlock(item.type)
}

function itemLabel(item: PaletteEntry): string {
  return item.labelKey ? t(item.labelKey) : (item.label ?? '')
}

// ícono + label; los custom traen su propio label/icon, los nativos usan i18n
function itemHtml(item: PaletteEntry): string {
  const icon = item.customType ? (item.icon ?? ICONS.html) : (ICONS[item.type] ?? '')
  return `${icon}<span>${escapeHtml(itemLabel(item))}</span>`
}

function escapeHtml(s: string): string {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}
</script>
