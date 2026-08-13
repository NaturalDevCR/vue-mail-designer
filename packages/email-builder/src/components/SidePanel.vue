<template>
  <aside class="vmd-sidepanel">
    <div class="vmd-sidepanel-content">
      <Transition name="vmd-tab" mode="out-in">
        <div :key="viewKey" class="vmd-tab-view">
          <PropertiesPanel v-if="store.selection && ui.panelMode === 'props'" />
          <template v-else>
            <ContentTab v-if="ui.sidebarTab === 'content'" />
            <BlocksTab v-else-if="ui.sidebarTab === 'blocks'" />
            <BodyTab v-else-if="ui.sidebarTab === 'body'" />
            <ImagesPanel v-else-if="ui.sidebarTab === 'images'" />
            <ExportPanel v-else-if="ui.sidebarTab === 'export'" />
            <AiTemplatePanel v-else-if="ui.sidebarTab === 'ai-templates'" embedded data-panel="ai-templates" />
          </template>
        </div>
      </Transition>
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
import { computed, watch } from 'vue'
import { useI18n } from '../i18n/useI18n'
import { useBuilderOptions } from '../options'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'
import { ICONS } from './icons'
import PropertiesPanel from './PropertiesPanel.vue'
import BlocksTab from './tabs/BlocksTab.vue'
import BodyTab from './tabs/BodyTab.vue'
import ContentTab from './tabs/ContentTab.vue'
import ImagesPanel from './tabs/ImagesPanel.vue'
import ExportPanel from './tabs/ExportPanel.vue'
import AiTemplatePanel from './AiTemplatePanel.vue'

const pinia = useBuilderPinia()
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)
const { t } = useI18n()
const options = useBuilderOptions()

// clave de vista: cambia al alternar tab o al entrar/salir del modo propiedades.
// No cambia al seleccionar distintos elementos (evita animar cada edición).
const viewKey = computed(() =>
  store.selection && ui.panelMode === 'props' ? 'props' : ui.sidebarTab,
)

type TabKey = 'content' | 'blocks' | 'body' | 'images' | 'export' | 'ai-templates'

const TABS = computed<{ key: TabKey; labelKey: string; icon: string }[]>(() => {
  const tabs: { key: TabKey; labelKey: string; icon: string }[] = [
    { key: 'content', labelKey: 'rail.content', icon: 'tabContent' },
    { key: 'blocks', labelKey: 'rail.blocks', icon: 'tabBlocks' },
    { key: 'body', labelKey: 'rail.body', icon: 'tabBody' },
    { key: 'images', labelKey: 'rail.images', icon: 'tabImages' },
    { key: 'export', labelKey: 'rail.export', icon: 'tabExport' },
  ]
  if (options.aiTemplates?.enabled === true) {
    tabs.push({ key: 'ai-templates', labelKey: 'rail.aiTemplates', icon: 'tabAi' })
  }
  return tabs
})

watch(
  () => store.selection,
  (selection) => {
    if (!selection) ui.panelMode = 'tab'
  },
)

watch(
  () => options.aiTemplates?.enabled,
  (enabled) => {
    if (!enabled && ui.sidebarTab === 'ai-templates') {
      ui.sidebarTab = 'content'
      ui.panelMode = 'tab'
    }
  },
)
</script>
