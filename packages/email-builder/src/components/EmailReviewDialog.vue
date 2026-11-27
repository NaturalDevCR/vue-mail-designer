<template>
  <div class="vmd-modal" @click.self="emit('close')">
    <div class="vmd-modal-box vmd-review-box">
      <div class="vmd-preview-bar">
        <h3 class="vmd-inspector-title">{{ t('review.title') }}</h3>
        <button type="button" class="vmd-btn vmd-btn--icon" :aria-label="t('common.close')" @click="emit('close')">
          <span class="vmd-ico" aria-hidden="true" v-html="ICONS.close" />
        </button>
      </div>
      <div class="vmd-review-body">
        <p v-if="!report" role="alert">{{ t('review.error') }}</p>
        <p v-else-if="!report.missingAlt.length && !report.variables.length">{{ t('review.clear') }}</p>
        <template v-else>
          <section v-if="report.missingAlt.length">
            <h4>{{ t('review.altTitle') }}</h4>
            <p>{{ t('review.altHelp') }}</p>
            <ol>
              <li v-for="item in report.missingAlt" :key="item.position" :value="item.position">
                {{ item.label || t('review.image') }}
              </li>
            </ol>
          </section>
          <section v-if="report.variables.length">
            <h4>{{ t('review.variablesTitle') }}</h4>
            <p>{{ t('review.variablesHelp') }}</p>
            <ul>
              <li v-for="item in report.variables" :key="item.name" :data-variable="item.name">
                <code v-text="'{{' + item.name + '}}'" />
                <span>{{ t(item.configured ? 'review.configured' : 'review.unrecognized') }}</span>
              </li>
            </ul>
          </section>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { EmailReview } from '../export/review'
import { useI18n } from '../i18n/useI18n'
import { ICONS } from './icons'

defineProps<{ report: EmailReview | null }>()
const emit = defineEmits<{ close: [] }>()
const { t } = useI18n()
</script>

<style scoped>
.vmd-review-box { width: min(90vw, 580px); max-height: 88vh; display: flex; flex-direction: column; }
.vmd-review-box h3 { align-self: center; margin: 0; }
.vmd-review-body { overflow: auto; padding: 16px; overflow-wrap: anywhere; }
.vmd-review-body h4 { margin: 0 0 6px; }
.vmd-review-body p { margin: 0; color: var(--vmd-muted); }
.vmd-review-body section + section { margin-top: 18px; }
.vmd-review-body ol, .vmd-review-body ul { margin: 10px 0 0; padding-inline-start: 24px; }
.vmd-review-body li + li { margin-top: 6px; }
.vmd-review-body code { margin-inline-end: 8px; }
</style>
