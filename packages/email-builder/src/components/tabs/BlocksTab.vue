<template>
  <div class="vmd-blocks-grid">
    <LayoutThumb v-for="item in ROW_LAYOUTS" :key="item.key" :widths="item.widths" :title="t(item.labelKey)" @insert="store.addRow(item.widths)" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '../../i18n/useI18n'
import { useDocumentStore } from '../../store/document'
import { useBuilderPinia } from '../../store/keys'
import { ROW_LAYOUTS } from '../palette-items'
import LayoutThumb from './LayoutThumb.vue'

const { t } = useI18n()
const store = useDocumentStore(useBuilderPinia())
</script>
