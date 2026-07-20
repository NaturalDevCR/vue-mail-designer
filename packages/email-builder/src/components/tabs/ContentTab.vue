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
    @end="ui.isDragging = false"
  >
    <template #item="{ element }">
      <div class="vmd-content-item" v-html="itemHtml(element)"></div>
    </template>
  </draggable>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'
import { createBlock } from '../../schema'
import { useBuilderPinia } from '../../store/keys'
import { useUiStore } from '../../store/ui'
import { DND_OPTIONS } from '../dnd'
import { ICONS } from '../icons'
import { PALETTE_BLOCKS } from '../palette-items'

const ui = useUiStore(useBuilderPinia())
const blockItems = [...PALETTE_BLOCKS]

function cloneBlock(item: (typeof PALETTE_BLOCKS)[number]) {
  return createBlock(item.type)
}

// contenido estático propio (no user input), seguro para v-html
function itemHtml(element: (typeof PALETTE_BLOCKS)[number]) {
  return `${ICONS[element.type] ?? ''}<span>${element.label}</span>`
}
</script>
