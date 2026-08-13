<template>
  <div v-if="enabled" class="vmd-ai-template">
    <button
      type="button"
      class="vmd-header-btn vmd-ai-template-toggle"
      data-action="ai-template-toggle"
      :title="t('aiTemplates.menu')"
      @click="openMenu"
    >
      <span class="vmd-ai-template-mark" aria-hidden="true">AI</span>
      <span class="vmd-ai-template-toggle-label">{{ t('aiTemplates.menu') }}</span>
    </button>

    <ModalPortal v-if="open">
      <div class="vmd-modal vmd-ai-template-modal" @click.self="closeMenu">
        <section class="vmd-modal-box vmd-ai-template-box" role="dialog" aria-modal="true" :aria-label="t('aiTemplates.title')">
          <header class="vmd-ai-template-header">
            <div>
              <h2>{{ t('aiTemplates.title') }}</h2>
              <p>{{ t('aiTemplates.subtitle') }}</p>
            </div>
            <button type="button" class="vmd-btn vmd-btn--icon" :title="t('common.close')" @click="closeMenu">×</button>
          </header>

          <div v-if="proposals.length === 0" class="vmd-ai-template-form">
            <fieldset class="vmd-ai-template-fieldset">
              <legend>{{ t('aiTemplates.modeLabel') }}</legend>
              <div class="vmd-ai-template-mode-grid">
                <button
                  type="button"
                  class="vmd-ai-template-mode"
                  :class="{ 'vmd-ai-template-mode--selected': mode === 'create' }"
                  data-action="ai-template-mode-create"
                  @click="mode = 'create'"
                >
                  <strong>{{ t('aiTemplates.create') }}</strong>
                  <span>{{ t('aiTemplates.createDescription') }}</span>
                </button>
                <button
                  type="button"
                  class="vmd-ai-template-mode"
                  :class="{ 'vmd-ai-template-mode--selected': mode === 'edit' }"
                  data-action="ai-template-mode-edit"
                  @click="mode = 'edit'"
                >
                  <strong>{{ t('aiTemplates.edit') }}</strong>
                  <span>{{ t('aiTemplates.editDescription') }}</span>
                </button>
              </div>
            </fieldset>

            <label class="vmd-ai-template-label" for="vmd-ai-template-prompt">{{ t('aiTemplates.promptLabel') }}</label>
            <textarea
              id="vmd-ai-template-prompt"
              v-model="prompt"
              class="vmd-ai-template-prompt"
              data-field="ai-template-prompt"
              :placeholder="t('aiTemplates.promptPlaceholder')"
              :disabled="loading"
            />

            <label class="vmd-ai-template-label" for="vmd-ai-template-count">{{ t('aiTemplates.countLabel') }}</label>
            <select id="vmd-ai-template-count" v-model.number="count" class="vmd-ai-template-count" data-field="ai-template-count" :disabled="loading">
              <option :value="1">1</option>
              <option :value="2">2</option>
              <option :value="3">3</option>
            </select>

            <p v-if="errorMessage" class="vmd-ai-template-error" role="alert">{{ errorMessage }}</p>
            <p v-if="loading" class="vmd-ai-template-loading">{{ t('aiTemplates.loading') }}</p>

            <div class="vmd-ai-template-actions">
              <button type="button" class="vmd-btn" :disabled="loading" @click="closeMenu">{{ t('common.close') }}</button>
              <button type="button" class="vmd-btn vmd-btn--primary" data-action="ai-template-run" :disabled="!canRun" @click="run">
                {{ loading ? t('common.loading') : t('aiTemplates.generate') }}
              </button>
            </div>
          </div>

          <div v-else class="vmd-ai-template-results">
            <div class="vmd-ai-template-proposals">
              <article v-for="(proposal, index) in proposals" :key="`${proposal.title}-${index}`" class="vmd-ai-template-proposal">
                <div class="vmd-ai-template-proposal-copy">
                  <h3>{{ proposal.title }}</h3>
                  <p v-if="proposal.description">{{ proposal.description }}</p>
                </div>
                <iframe class="vmd-ai-template-preview" :srcdoc="proposalHtml(proposal)" :title="proposal.title" />
                <button type="button" class="vmd-btn vmd-btn--primary" data-action="ai-template-proposal-apply" @click="apply(proposal)">
                  {{ t('aiTemplates.apply') }}
                </button>
              </article>
            </div>
            <div class="vmd-ai-template-actions">
              <button type="button" class="vmd-btn" data-action="ai-template-discard" @click="discard">{{ t('aiTemplates.discard') }}</button>
              <button type="button" class="vmd-btn" data-action="ai-template-regenerate" @click="regenerate">{{ t('aiTemplates.regenerate') }}</button>
            </div>
          </div>
        </section>
      </div>
    </ModalPortal>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue'
import { renderHtml } from '../render/html'
import {
  buildAiTemplateRequest,
  resolveAiTemplateContext,
  validateAiTemplateProposals,
} from '../ai/templateGeneration'
import type {
  AiTemplateErrorPayload,
  AiTemplateMode,
  AiTemplateOptions,
  AiTemplateProposal,
} from '../options'
import { useBuilderOptions } from '../options'
import { useI18n } from '../i18n/useI18n'
import { useBuilderPinia } from '../store/keys'
import { useDocumentStore } from '../store/document'
import ModalPortal from './ModalPortal.vue'

const emit = defineEmits<{ error: [payload: AiTemplateErrorPayload] }>()
const options = useBuilderOptions()
const pinia = useBuilderPinia()
const store = useDocumentStore(pinia)
const { t } = useI18n()

const enabled = computed(() => options.aiTemplates?.enabled === true)
const open = ref(false)
const mode = ref<AiTemplateMode | null>(null)
const prompt = ref('')
const count = ref<1 | 2 | 3>(1)
const proposals = ref<AiTemplateProposal[]>([])
const loading = ref(false)
const errorMessage = ref('')
let requestId = 0
let mounted = true

function currentOptions(): AiTemplateOptions | undefined {
  return options.aiTemplates
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function closeMenu(): void {
  requestId += 1
  open.value = false
  loading.value = false
  proposals.value = []
  errorMessage.value = ''
  mode.value = null
  prompt.value = ''
  count.value = 1
}

function openMenu(): void {
  if (!currentOptions()) return
  open.value = true
  proposals.value = []
  errorMessage.value = ''
  mode.value = null
  prompt.value = ''
  count.value = 1
}

function report(operation: AiTemplateErrorPayload['operation'], error: unknown, message: string): void {
  errorMessage.value = message
  emit('error', { operation, error })
}

const canRun = computed(() => mode.value !== null && prompt.value.trim().length > 0 && !loading.value)

async function run(): Promise<void> {
  const configured = currentOptions()
  if (!configured || !mode.value || !prompt.value.trim() || loading.value) return

  const activeRequestId = ++requestId
  loading.value = true
  errorMessage.value = ''

  try {
    const context = await resolveAiTemplateContext(configured.context)
    if (!mounted || activeRequestId !== requestId) return

    const design = clone(store.doc)
    const request = buildAiTemplateRequest({
      mode: mode.value,
      prompt: prompt.value.trim(),
      count: count.value,
      context,
      design,
      mergeTags: options.mergeTags,
      customBlocks: options.customBlocks ?? [],
    })
    const rawProposals = await configured.generate(request)
    if (!mounted || activeRequestId !== requestId) return

    try {
      proposals.value = validateAiTemplateProposals(rawProposals, options.customBlocks ?? []).slice(0, count.value)
    } catch (error) {
      report('validate', error, t('aiTemplates.invalidResponse'))
    }
  } catch (error) {
    if (!mounted || activeRequestId !== requestId) return
    const operation = error instanceof Error && error.message.includes('context') ? 'context' : 'generate'
    report(operation, error, operation === 'context' ? t('aiTemplates.contextError') : t('aiTemplates.generateError'))
  } finally {
    if (mounted && activeRequestId === requestId) loading.value = false
  }
}

function proposalHtml(proposal: AiTemplateProposal): string {
  return renderHtml(proposal.design, options.fonts, options.customBlocks, options.timerImageUrlBuilder, options.socialIconUrlBuilder)
}

function apply(proposal: AiTemplateProposal): void {
  store.loadDesign(clone(proposal.design))
  closeMenu()
}

function discard(): void {
  closeMenu()
}

function regenerate(): void {
  proposals.value = []
  errorMessage.value = ''
}

onBeforeUnmount(() => {
  mounted = false
  requestId += 1
})

currentOptions()
</script>
