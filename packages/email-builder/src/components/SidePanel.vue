<template>
  <aside class="vmd-sidepanel">
    <div class="vmd-sidepanel-content">
      <!-- la pestaña Imágenes se muestra aun con selección: permite cambiar la imagen del bloque seleccionado -->
      <ImagesTab v-if="ui.sidebarTab === 'images'" />
      <PropertiesPanel v-else-if="store.selection" />
      <template v-else>
        <ContentTab v-if="ui.sidebarTab === 'content'" />
        <BlocksTab v-else-if="ui.sidebarTab === 'blocks'" />
        <BodyTab v-else-if="ui.sidebarTab === 'body'" />
      </template>
    </div>
    <nav class="vmd-rail">
      <button
        v-for="tab in TABS"
        :key="tab.key"
        type="button"
        :data-tab="tab.key"
        :class="{ 'vmd-active': ui.sidebarTab === tab.key }"
        @click="ui.sidebarTab = tab.key"
      >
        <span v-html="ICONS[tab.icon]"></span>
        <span>{{ tab.label }}</span>
      </button>
    </nav>
  </aside>
</template>

<script setup lang="ts">
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

const TABS: { key: 'content' | 'blocks' | 'body' | 'images'; label: string; icon: string }[] = [
  { key: 'content', label: 'Contenido', icon: 'tabContent' },
  { key: 'blocks', label: 'Bloques', icon: 'tabBlocks' },
  { key: 'body', label: 'Cuerpo', icon: 'tabBody' },
  { key: 'images', label: 'Imágenes', icon: 'tabImages' },
]
</script>
