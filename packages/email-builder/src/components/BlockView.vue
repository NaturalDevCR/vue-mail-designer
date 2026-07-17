<template>
  <div
    class="vmd-block"
    :class="{ 'vmd-selected': isSelected }"
    @click.stop="store.select({ kind: 'block', id: block.id })"
  >
    {{ block.type }}
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Block } from '../schema'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'

const props = defineProps<{ block: Block }>()
const store = useDocumentStore(useBuilderPinia())
const isSelected = computed(() => store.selection?.kind === 'block' && store.selection.id === props.block.id)
</script>
