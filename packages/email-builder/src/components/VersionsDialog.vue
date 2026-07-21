<template>
  <div class="vmd-modal" @click.self="ui.versionsOpen = false">
    <div class="vmd-modal-box vmd-versions-box">
      <div class="vmd-preview-bar">
        <h3 class="vmd-inspector-title" style="margin: 0">{{ t('versions.title') }}</h3>
        <button type="button" class="vmd-btn" @click="ui.versionsOpen = false">{{ t('common.close') }} ✕</button>
      </div>
      <div class="vmd-versions-body">
        <div class="vmd-versions-save">
          <input v-model="name" class="vmd-field-input" :placeholder="t('versions.namePlaceholder')" />
          <button type="button" class="vmd-btn vmd-btn--primary" :disabled="!name.trim()" data-action="version-save" @click="save">{{ t('versions.save') }}</button>
        </div>
        <ul class="vmd-versions-list">
          <li v-for="v in store.versions" :key="v.id" class="vmd-versions-item">
            <span class="vmd-versions-name">{{ v.name }}</span>
            <span class="vmd-versions-date">{{ new Date(v.at).toLocaleString() }}</span>
            <button type="button" class="vmd-mini-btn" :title="t('versions.load')" @click="load(v.id)">↺</button>
            <button type="button" class="vmd-mini-btn vmd-mini-btn--danger" :title="t('versions.delete')" @click="store.deleteVersion(v.id)">🗑</button>
          </li>
          <li v-if="!store.versions.length" class="vmd-versions-empty">{{ t('versions.empty') }}</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '../i18n/useI18n'
import { useDocumentStore } from '../store/document'
import { useBuilderPinia } from '../store/keys'
import { useUiStore } from '../store/ui'

const pinia = useBuilderPinia()
const store = useDocumentStore(pinia)
const ui = useUiStore(pinia)
const { t } = useI18n()
const name = ref('')

function save() {
  if (!name.value.trim()) return
  store.saveVersion(name.value.trim())
  name.value = ''
}
function load(id: string) {
  store.loadVersion(id)
  ui.versionsOpen = false
}
</script>
