<template>
  <EmailBuilder
    v-model:design="design"
    :merge-tags="mergeTags"
    :upload-image="uploadImage"
    style="height: 100vh"
    @export-html="onExportHtml"
  />
</template>

<script setup lang="ts">
import { EmailBuilder, type EmailDocument, type MergeTagDef } from '@vue-mail-designer/builder'
import { ref, watch } from 'vue'

const STORAGE_KEY = 'vmd-demo-design'
const saved = localStorage.getItem(STORAGE_KEY)
const design = ref<EmailDocument | undefined>(saved ? (JSON.parse(saved) as EmailDocument) : undefined)

watch(design, (d) => {
  if (d) localStorage.setItem(STORAGE_KEY, JSON.stringify(d))
})

const mergeTags: MergeTagDef[] = [
  { name: 'Nombre', value: 'first_name' },
  { name: 'Apellido', value: 'last_name' },
  { name: 'Email', value: 'email' },
  { name: 'Cancelar suscripción', value: 'unsubscribe_url' },
]

// demo: convierte el archivo a data URL (un backend real subiría a un CDN)
async function uploadImage(file: File): Promise<string> {
  return await new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

function onExportHtml(html: string) {
  console.log('HTML exportado:', html.length, 'caracteres')
}
</script>

<style>
html, body, #app { height: 100%; margin: 0; }
</style>
