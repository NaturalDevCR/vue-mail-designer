<template>
  <div ref="root" class="vmd-ai">
    <button type="button" class="vmd-mini-btn vmd-ai-toggle" data-action="ai-menu-toggle" :title="t('ai.menu')" @click.stop="toggleMenu">
      <span class="vmd-ai-toggle-label">AI</span>
    </button>

    <div v-if="open" class="vmd-ai-popover" @click.stop>
      <template v-if="!activeTool">
        <button type="button" class="vmd-ai-item" data-action="ai-item-rewrite" :disabled="!canRewrite" :title="rewriteTooltip" @click="selectTool('rewrite')">
          {{ t('ai.rewrite') }}
        </button>
        <button type="button" class="vmd-ai-item" data-action="ai-item-write" :disabled="!canWrite" :title="writeTooltip" @click="selectTool('write')">
          {{ t('ai.write') }}
        </button>
        <button type="button" class="vmd-ai-item" data-action="ai-item-summarize" :disabled="!canSummarize" :title="summarizeTooltip" @click="selectTool('summarize')">
          {{ t('ai.summarize') }}
        </button>
        <button type="button" class="vmd-ai-item" data-action="ai-item-translate" :disabled="!canTranslate" :title="translateTooltip" @click="selectTool('translate')">
          {{ t('ai.translate') }}
        </button>
      </template>

      <div v-else class="vmd-ai-panel">
        <template v-if="!resultText">
          <template v-if="activeTool === 'rewrite'">
            <label class="vmd-ai-label">
              {{ t('ai.tone') }}
              <select v-model="rewriteTone" class="vmd-ai-select">
                <option value="as-is">{{ t('ai.toneAsIs') }}</option>
                <option value="more-formal">{{ t('ai.toneFormal') }}</option>
                <option value="more-casual">{{ t('ai.toneCasual') }}</option>
              </select>
            </label>
            <label class="vmd-ai-label">
              {{ t('ai.length') }}
              <select v-model="rewriteLength" class="vmd-ai-select">
                <option value="as-is">{{ t('ai.lengthAsIs') }}</option>
                <option value="shorter">{{ t('ai.lengthShorter') }}</option>
                <option value="longer">{{ t('ai.lengthLonger') }}</option>
              </select>
            </label>
          </template>

          <template v-else-if="activeTool === 'write'">
            <textarea v-model="writePrompt" class="vmd-ai-textarea" data-field="ai-prompt" :placeholder="t('ai.writePlaceholder')" />
            <label class="vmd-ai-label">
              {{ t('ai.tone') }}
              <select v-model="writeTone" class="vmd-ai-select">
                <option value="as-is">{{ t('ai.toneAsIs') }}</option>
                <option value="more-formal">{{ t('ai.toneFormal') }}</option>
                <option value="more-casual">{{ t('ai.toneCasual') }}</option>
              </select>
            </label>
            <label class="vmd-ai-label">
              {{ t('ai.length') }}
              <select v-model="writeLength" class="vmd-ai-select">
                <option value="as-is">{{ t('ai.lengthAsIs') }}</option>
                <option value="shorter">{{ t('ai.lengthShorter') }}</option>
                <option value="longer">{{ t('ai.lengthLonger') }}</option>
              </select>
            </label>
            <label class="vmd-ai-label">
              {{ t('ai.format') }}
              <select v-model="writeFormat" class="vmd-ai-select">
                <option value="plain-text">{{ t('ai.formatPlain') }}</option>
                <option value="markdown">{{ t('ai.formatMarkdown') }}</option>
              </select>
            </label>
          </template>

          <template v-else-if="activeTool === 'summarize'">
            <label class="vmd-ai-label">
              {{ t('ai.summaryType') }}
              <select v-model="summaryType" class="vmd-ai-select">
                <option value="key-points">{{ t('ai.summaryKeyPoints') }}</option>
                <option value="tldr">{{ t('ai.summaryTldr') }}</option>
                <option value="teaser">{{ t('ai.summaryTeaser') }}</option>
                <option value="headline">{{ t('ai.summaryHeadline') }}</option>
              </select>
            </label>
            <label class="vmd-ai-label">
              {{ t('ai.length') }}
              <select v-model="summaryLength" class="vmd-ai-select">
                <option value="short">{{ t('ai.lengthShort') }}</option>
                <option value="medium">{{ t('ai.lengthMedium') }}</option>
                <option value="long">{{ t('ai.lengthLong') }}</option>
              </select>
            </label>
          </template>

          <template v-else-if="activeTool === 'translate'">
            <label class="vmd-ai-label">
              {{ t('ai.language') }}
              <select v-model="targetLanguage" class="vmd-ai-select" data-field="ai-target-lang">
                <option v-for="language in languages" :key="language.code" :value="language.code">{{ language.label }}</option>
              </select>
            </label>
          </template>

          <p v-if="progressPct !== null" class="vmd-ai-progress">{{ t('ai.downloading') }} {{ progressPct }}%</p>
          <p v-if="errorMessage" class="vmd-ai-error">{{ errorMessage }}</p>

          <div class="vmd-ai-actions">
            <button type="button" class="vmd-btn" @click="close">{{ t('common.close') }}</button>
            <button type="button" class="vmd-btn vmd-btn--primary" data-action="ai-run" :disabled="!canRun" @click="run">
              {{ t('ai.generate') }}
            </button>
          </div>
        </template>

        <template v-else>
          <textarea v-model="resultText" class="vmd-ai-textarea vmd-ai-result" data-field="ai-result" />
          <div class="vmd-ai-actions">
            <button type="button" class="vmd-btn" data-action="ai-discard" @click="discard">{{ t('ai.discard') }}</button>
            <button type="button" class="vmd-btn vmd-btn--primary" data-action="ai-apply" @click="apply">{{ t('ai.apply') }}</button>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Editor } from '@tiptap/core'
import { computed, onBeforeUnmount, onMounted, ref, toRaw, watch } from 'vue'
import {
  detectLanguage,
  isRewriterAvailable,
  isSummarizerAvailable,
  isTranslatorAvailable,
  isWriterAvailable,
  rewrite,
  summarize,
  translate,
  translateAvailability,
  write,
  type AiAvailability,
  type AiFormat,
  type AiLength,
  type AiSummaryLength,
  type AiSummaryType,
  type AiTone,
} from '../ai/chromeAi'
import { useI18n } from '../i18n/useI18n'
import { useBuilderOptions } from '../options'

type Tool = 'rewrite' | 'write' | 'summarize' | 'translate'

const props = defineProps<{ editor?: Editor }>()

const options = useBuilderOptions()
const { locale, t } = useI18n()

const root = ref<HTMLElement | null>(null)
const open = ref(false)
const activeTool = ref<Tool | null>(null)
const hasSelection = ref(false)
const selectedText = ref('')
const loading = ref(false)
const progressPct = ref<number | null>(null)
const errorMessage = ref('')
const resultText = ref('')

const rewriteTone = ref<AiTone>('as-is')
const rewriteLength = ref<AiLength>('as-is')
const writePrompt = ref('')
const writeTone = ref<AiTone>('as-is')
const writeLength = ref<AiLength>('as-is')
const writeFormat = ref<AiFormat>('plain-text')
const summaryType = ref<AiSummaryType>('key-points')
const summaryLength = ref<AiSummaryLength>('medium')
const sourceLanguage = ref('')
const targetLanguage = ref('')
const translationAvailability = ref<AiAvailability | null>(null)

const languages = computed(() => options.ai?.languages ?? [])
const canRewrite = computed(() => isRewriterAvailable() && hasSelection.value)
const canWrite = computed(() => isWriterAvailable())
const canSummarize = computed(() => isSummarizerAvailable() && hasSelection.value)
const canTranslate = computed(() => isTranslatorAvailable() && hasSelection.value && languages.value.length > 0)
const canRun = computed(() => {
  if (loading.value || !activeTool.value) return false
  if (activeTool.value === 'write') return writePrompt.value.trim().length > 0
  if (activeTool.value === 'translate') return targetLanguage.value.length > 0 && translationAvailability.value !== null && translationAvailability.value !== 'no'
  return true
})

const rewriteTooltip = computed(() => {
  if (!isRewriterAvailable()) return t('ai.unavailable')
  if (!hasSelection.value) return t('ai.noSelection')
  return undefined
})

const writeTooltip = computed(() => {
  if (!isWriterAvailable()) return t('ai.unavailable')
  return undefined
})

const summarizeTooltip = computed(() => {
  if (!isSummarizerAvailable()) return t('ai.unavailable')
  if (!hasSelection.value) return t('ai.noSelection')
  return undefined
})

const translateTooltip = computed(() => {
  if (!isTranslatorAvailable()) return t('ai.unavailable')
  if (!hasSelection.value) return t('ai.noSelection')
  if (!languages.value.length) return t('ai.noLanguages')
  return undefined
})

function getEditor(): Editor | undefined {
  return props.editor ? toRaw(props.editor) : undefined
}

function resetToolState(): void {
  activeTool.value = null
  loading.value = false
  progressPct.value = null
  errorMessage.value = ''
  resultText.value = ''
  sourceLanguage.value = ''
  targetLanguage.value = ''
  translationAvailability.value = null
  writePrompt.value = ''
}

function refreshSelection(): void {
  const editor = getEditor()
  const selection =
    editor && !editor.state.selection.empty
      ? editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to, ' ')
      : ''

  selectedText.value = selection
  hasSelection.value = selection.trim().length > 0
}

function toggleMenu(): void {
  if (open.value) {
    close()
    return
  }

  refreshSelection()
  resetToolState()
  open.value = true
}

function close(): void {
  resetToolState()
  open.value = false
}

function selectTool(tool: Tool): void {
  activeTool.value = tool
  errorMessage.value = ''
  resultText.value = ''
  progressPct.value = null
  translationAvailability.value = null

  if (tool === 'translate') {
    void prepareTranslate()
  }
}

function errorCode(error: unknown): string | undefined {
  return typeof error === 'object' && error !== null && 'code' in error && typeof (error as { code: unknown }).code === 'string'
    ? (error as { code: string }).code
    : undefined
}

function localizeError(error: unknown): string {
  switch (errorCode(error)) {
    case 'not-supported':
      return t('ai.errorUnavailable')
    case 'language-detection-failed':
      return t('ai.errorLanguageDetectionFailed')
    case 'request-failed':
      return t('ai.errorRequestFailed')
    default:
      if (error instanceof Error && /not available/i.test(error.message)) return t('ai.errorUnavailable')
      return t('ai.errorRequestFailed')
  }
}

async function refreshTranslateAvailability(): Promise<void> {
  if (activeTool.value !== 'translate' || !targetLanguage.value || !sourceLanguage.value) {
    translationAvailability.value = null
    return
  }

  try {
    const availability = await translateAvailability(sourceLanguage.value, targetLanguage.value)
    if (activeTool.value !== 'translate') return

    translationAvailability.value = availability
    if (availability === 'no') {
      errorMessage.value = t('ai.errorUnavailable')
    } else if (errorMessage.value === t('ai.errorUnavailable')) {
      errorMessage.value = ''
    }
  } catch (error) {
    translationAvailability.value = 'no'
    errorMessage.value = localizeError(error)
  }
}

async function prepareTranslate(): Promise<void> {
  sourceLanguage.value = locale
  targetLanguage.value = languages.value[0]?.code ?? ''
  translationAvailability.value = null

  if (!selectedText.value) return

  try {
    sourceLanguage.value = (await detectLanguage(selectedText.value)) ?? locale
  } catch (error) {
    errorMessage.value = localizeError(error)
    sourceLanguage.value = locale
  }

  await refreshTranslateAvailability()
}

async function run(): Promise<void> {
  if (!activeTool.value || !canRun.value) return

  loading.value = true
  progressPct.value = null
  errorMessage.value = ''

  const onProgress = (pct: number) => {
    progressPct.value = pct
  }

  try {
    if (activeTool.value === 'rewrite') {
      resultText.value = await rewrite(selectedText.value, { tone: rewriteTone.value, length: rewriteLength.value }, onProgress)
    } else if (activeTool.value === 'write') {
      resultText.value = await write(
        writePrompt.value,
        { tone: writeTone.value, length: writeLength.value, format: writeFormat.value },
        onProgress,
      )
    } else if (activeTool.value === 'summarize') {
      resultText.value = await summarize(selectedText.value, { type: summaryType.value, length: summaryLength.value }, onProgress)
    } else if (activeTool.value === 'translate') {
      resultText.value = await translate(selectedText.value, sourceLanguage.value || locale, targetLanguage.value, onProgress)
    }
  } catch (error) {
    errorMessage.value = localizeError(error)
  } finally {
    loading.value = false
    progressPct.value = null
  }
}

function apply(): void {
  const editor = getEditor()
  if (!editor || !resultText.value) return

  if (hasSelection.value) {
    editor.chain().focus().deleteSelection().insertContent(resultText.value).run()
  } else {
    editor.chain().focus().insertContent(resultText.value).run()
  }

  close()
}

function discard(): void {
  close()
}

function onDocumentClick(event: MouseEvent): void {
  if (open.value && root.value && !root.value.contains(event.target as Node)) close()
}

onMounted(() => {
  document.addEventListener('click', onDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
})

watch([activeTool, sourceLanguage, targetLanguage], async ([tool, source, target]) => {
  if (tool !== 'translate') return
  if (!source || !target) {
    translationAvailability.value = null
    return
  }
  await refreshTranslateAvailability()
})
</script>
