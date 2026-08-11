<template>
  <div class="vmd-modal vmd-image-preview-dialog" @click.self="emit('close')">
    <div class="vmd-modal-box vmd-image-preview-box">
      <div class="vmd-preview-bar">
        <div class="vmd-image-preview-heading">
          <h3 class="vmd-inspector-title">{{ image.title || image.alt }}</h3>
          <p v-if="image.title && image.alt" class="vmd-image-preview-alt">{{ image.alt }}</p>
        </div>
        <button
          type="button"
          class="vmd-btn vmd-btn--icon"
          :title="t('common.close')"
          :aria-label="t('common.close')"
          data-action="image-preview-close"
          @click="emit('close')"
        >
          <span class="vmd-ico" v-html="ICONS.close" />
        </button>
      </div>

      <div class="vmd-image-preview-body">
        <img :src="image.src" :alt="image.alt" />
      </div>

      <div class="vmd-image-preview-actions">
        <button type="button" class="vmd-btn" data-action="image-preview-cancel" @click="emit('close')">
          {{ t('images.cancel') }}
        </button>
        <button type="button" class="vmd-btn vmd-btn--primary" data-action="image-preview-add" @click="emit('add')">
          {{ t('images.add') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '../i18n/useI18n'
import { ICONS } from './icons'
import type { ImageSelection } from './tabs/imageTypes'

defineProps<{ image: ImageSelection }>()

const emit = defineEmits<{ close: []; add: [] }>()
const { t } = useI18n()
</script>
