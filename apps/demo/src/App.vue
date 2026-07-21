<template>
  <EmailBuilder
    v-model:design="design"
    :merge-tags="mergeTags"
    :upload-image="uploadImage"
    :unlayer-fetch="unlayerFetch"
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

// demo: pasa por el proxy /unlayer-api para esquivar CORS del studio de Unlayer
async function unlayerFetch(slug: string): Promise<unknown> {
  try {
    const res = await fetch('/unlayer-api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operationName: 'StockTemplateLoad',
        query:
          'query StockTemplateLoad($slug: String!){ StockTemplate(slug:$slug){ StockTemplatePages{ design } } }',
        variables: { slug },
      }),
    })

    if (!res.ok) throw new Error('No se pudo cargar la plantilla de Unlayer.')

    const json = await res.json()
    const design = json?.data?.StockTemplate?.StockTemplatePages?.[0]?.design
    if (design == null) throw new Error('No se pudo cargar la plantilla de Unlayer.')
    return design
  } catch {
    throw new Error('No se pudo cargar la plantilla de Unlayer.')
  }
}
</script>

<style>
html, body, #app { height: 100%; margin: 0; }
</style>
