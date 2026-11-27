<template>
  <section class="vmd-export-panel" data-panel="export">
    <div class="vmd-export-panel-heading">
      <div>
        <h3 class="vmd-export-panel-title">{{ t('rail.export') }}</h3>
        <p class="vmd-export-panel-description">{{ t('export.description') }}</p>
      </div>
      <span class="vmd-ico vmd-export-panel-icon" aria-hidden="true" v-html="ICONS.html" />
    </div>

    <div class="vmd-export-actions">
      <button type="button" class="vmd-export-action" data-action="email-review" @click="openEmailReview">
        <span class="vmd-ico" aria-hidden="true" v-html="ICONS.check" />
        <span>{{ t('review.title') }}</span>
      </button>
      <button type="button" class="vmd-export-action" data-action="export-html" @click="exportHtmlFile">
        <span class="vmd-ico" aria-hidden="true" v-html="ICONS.html" />
        <span>{{ t('header.exportHtml') }}</span>
      </button>
      <button type="button" class="vmd-export-action" data-action="export-json" @click="exportJsonFile">
        <span class="vmd-ico" aria-hidden="true" v-html="ICONS.code" />
        <span>{{ t('header.exportJson') }}</span>
      </button>
      <button type="button" class="vmd-export-action" data-action="import-json" @click="fileInput?.click()">
        <span class="vmd-ico" aria-hidden="true" v-html="ICONS.upload" />
        <span>{{ t('header.importJson') }}</span>
      </button>
      <button type="button" class="vmd-export-action" data-action="import-unlayer" @click="openUnlayerImport">
        <span class="vmd-ico" aria-hidden="true" v-html="ICONS.import" />
        <span>{{ t('header.importUnlayer') }}</span>
      </button>
      <button type="button" class="vmd-export-action" data-action="export-image" @click="exportImageFile">
        <span class="vmd-ico" aria-hidden="true" v-html="ICONS.image" />
        <span>{{ t('header.exportImage') }}</span>
      </button>
      <button type="button" class="vmd-export-action" data-action="versions" @click="openVersions">
        <span class="vmd-ico" aria-hidden="true" v-html="ICONS.history" />
        <span>{{ t('header.versions') }}</span>
      </button>
    </div>

    <input ref="fileInput" type="file" accept="application/json,.json" class="vmd-visually-hidden" @change="onFile" />
    <ModalPortal v-if="emailReviewOpen" :label="t('review.title')" @cancel="emailReviewOpen = false">
      <EmailReviewDialog :report="emailReview" @close="emailReviewOpen = false" />
    </ModalPortal>
    <ModalPortal v-if="ui.unlayerImportOpen" :label="t('dialog.unlayerTitle')" @cancel="ui.unlayerImportOpen = false">
      <UnlayerImportDialog />
    </ModalPortal>
    <ModalPortal v-if="ui.versionsOpen" :label="t('versions.title')" @cancel="ui.versionsOpen = false">
      <VersionsDialog />
    </ModalPortal>
  </section>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from '../../i18n/useI18n'
import { DEFAULT_SPECIAL_LINKS, flattenMergeTags, useBuilderOptions } from '../../options'
import { exportDocumentImage } from '../../export/image'
import { mergeVariableNames, reviewEmailHtml, type EmailReview } from '../../export/review'
import { renderHtml } from '../../render/html'
import { useDocumentStore } from '../../store/document'
import { useBuilderPinia } from '../../store/keys'
import { useUiStore } from '../../store/ui'
import EmailReviewDialog from '../EmailReviewDialog.vue'
import ModalPortal from '../ModalPortal.vue'
import UnlayerImportDialog from '../UnlayerImportDialog.vue'
import VersionsDialog from '../VersionsDialog.vue'
import { ICONS } from '../icons'

const store = useDocumentStore(useBuilderPinia())
const ui = useUiStore(useBuilderPinia())
const options = useBuilderOptions()
const { t } = useI18n()
const fileInput = ref<HTMLInputElement | null>(null)
const emailReviewOpen = ref(false)
const emailReview = ref<EmailReview | null>(null)

function renderCurrentHtml(): string {
  return renderHtml(store.doc, options.fonts, options.customBlocks, options.timerImageUrlBuilder, options.socialIconUrlBuilder)
}

function openEmailReview(): void {
  emailReviewOpen.value = true
  try {
    const tags = flattenMergeTags(options.mergeTags).map((tag) => tag.value.trim())
    const links = (options.specialLinks ?? DEFAULT_SPECIAL_LINKS).flatMap((link) => mergeVariableNames(link.href))
    emailReview.value = reviewEmailHtml(renderCurrentHtml(), new Set([...tags, ...links]))
  } catch {
    emailReview.value = null
  }
}

function downloadFile(name: string, content: string, mime: string): void {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = name
  anchor.click()
  URL.revokeObjectURL(url)
}

function exportHtmlFile(): void {
  downloadFile(
    'email.html',
    renderCurrentHtml(),
    'text/html',
  )
}

function exportJsonFile(): void {
  downloadFile('email-design.json', store.exportJson(), 'application/json')
}

async function exportImageFile(): Promise<void> {
  try {
    const dataUrl = await exportDocumentImage(renderCurrentHtml(), store.doc.settings.contentWidth)
    const anchor = document.createElement('a')
    anchor.href = dataUrl
    anchor.download = 'email.png'
    anchor.click()
  } catch {
    window.alert(t('export.imageError'))
  }
}

function openVersions(): void {
  ui.versionsOpen = true
}

function openUnlayerImport(): void {
  ui.unlayerImportOpen = true
}

async function onFile(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  const result = store.importJson(await file.text())
  if (!result.ok) window.alert(result.error)
  input.value = ''
}
</script>
