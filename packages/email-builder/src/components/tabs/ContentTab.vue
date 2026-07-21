<template>
  <draggable
    :list="blockItems"
    :group="{ name: 'blocks', pull: 'clone', put: false }"
    :sort="false"
    v-bind="DND_OPTIONS"
    :clone="cloneBlock"
    item-key="type"
    class="vmd-content-grid"
    @start="ui.isDragging = true"
    @end="onDragEnd"
  >
    <template #item="{ element }">
      <div class="vmd-content-item" v-html="itemHtml(element)"></div>
    </template>
  </draggable>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { createBlock } from '../../schema'
import { useDocumentStore } from '../../store/document'
import { useBuilderPinia } from '../../store/keys'
import { useUiStore } from '../../store/ui'
import { useI18n } from '../../i18n/useI18n'
import { DND_OPTIONS } from '../dnd'
import { ICONS } from '../icons'
import { PALETTE_BLOCKS } from '../palette-items'

const store = useDocumentStore(useBuilderPinia())
const ui = useUiStore(useBuilderPinia())
const { t } = useI18n()
const blockItems = [...PALETTE_BLOCKS]

function cloneBlock(item: (typeof PALETTE_BLOCKS)[number]) {
  return createBlock(item.type)
}

function onDragEnd() {
  ui.isDragging = false
  store.sealHistory()
}

// ícono estático propio + label traducido (escapado por t/textContent seguro)
function itemHtml(element: (typeof PALETTE_BLOCKS)[number]) {
  return `${ICONS[element.type] ?? ''}<span>${t(element.labelKey)}</span>`
}
</script>
