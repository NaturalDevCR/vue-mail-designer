<template>
  <aside class="vmd-sidepanel">
    <div class="vmd-sidepanel-content">
      <PropertiesPanel v-if="store.selection && ui.panelMode === 'props'" />
      <template v-else>
        <ContentTab v-if="ui.sidebarTab === 'content'" />
        <BlocksTab v-else-if="ui.sidebarTab === 'blocks'" />
        <BodyTab v-else-if="ui.sidebarTab === 'body'" />
        <ImagesTab v-else-if="ui.sidebarTab === 'images'" />
      </template>
    </div>
    <nav class="vmd-rail">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        type="button"
        :data-tab="tab.key"
        :class="{ 'vmd-active': ui.panelMode === 'tab' && ui.sidebarTab === tab.key }"
        @click="ui.sidebarTab = tab.key; ui.panelMode = 'tab'"
      >
        <span v-html="ICONS[tab.icon]"></span>
        <span>{{ t(tab.labelKey) }}</span>
      </button>
    </nav>
  </aside>
</template>

<script setup lang="ts">
import { watch } from 'vue'
import { useI18n } from '../i18n/useI18n'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'
import { ICONS } from './icons'
import PropertiesPanel from './PropertiesPanel.vue'
import BlocksTab from './tabs/BlocksTab.vue'
import BodyTab from './tabs/BodyTab.vue'
import ContentTab from './tabs/ContentTab.vue'
import ImagesTab from './tabs/ImagesTab.vue'

const pinia = useBuilderPinia()
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)
const { t } = useI18n()

const TABS: { key: 'content' | 'blocks' | 'body' | 'images'; labelKey: string; icon: string }[] = [
  { key: 'content', labelKey: 'rail.content', icon: 'tabContent' },
  { key: 'blocks', labelKey: 'rail.blocks', icon: 'tabBlocks' },
  { key: 'body', labelKey: 'rail.body', icon: 'tabBody' },
  { key: 'images', labelKey: 'rail.images', icon: 'tabImages' },
]

watch(
  () => store.selection,
  (selection) => {
    if (!selection) ui.panelMode = 'tab'
  },
)
</script>
