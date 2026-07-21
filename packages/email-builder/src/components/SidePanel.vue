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
            <ImagesTab v-else-if="ui.sidebarTab === 'images'" />
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

// clave de vista: cambia al alternar tab o al entrar/salir del modo propiedades.
// No cambia al seleccionar distintos elementos (evita animar cada edición).
const viewKey = computed(() =>
  store.selection && ui.panelMode === 'props' ? 'props' : ui.sidebarTab,
)

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
