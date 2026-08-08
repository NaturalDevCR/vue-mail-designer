<template>
  <EmailBuilder
    v-model:design="design"
    :merge-tags="mergeTags"
    :special-links="specialLinks"
    :custom-blocks="customBlocks"
    :upload-image="uploadImage"
    :media-library="mediaLibrary"
    :unlayer-fetch="unlayerFetch"
    style="height: 100vh"
    @export-html="onExportHtml"
  />
</template>

<script setup lang="ts">
import { EmailBuilder, escapeHtml, type CustomBlockDef, type EmailDocument, type MergeTagItem, type SpecialLink } from '@naturaldevcr/vue-mail-designer'
import { ref, watch } from 'vue'
import { createDemoMediaLibrary } from './mediaLibrary'

const STORAGE_KEY = 'vmd-demo-design'
const saved = localStorage.getItem(STORAGE_KEY)
const design = ref<EmailDocument | undefined>(saved ? (JSON.parse(saved) as EmailDocument) : undefined)

watch(design, (d) => {
  if (d) localStorage.setItem(STORAGE_KEY, JSON.stringify(d))
})

const mergeTags: MergeTagItem[] = [
  { name: 'Email', value: 'email' },
  {
    name: 'Cliente',
    tags: [
      { name: 'Nombre', value: 'first_name' },
      { name: 'Apellido', value: 'last_name' },
    ],
  },
]

const specialLinks: SpecialLink[] = [
  { name: 'Cancelar suscripción', href: '{{unsubscribe_url}}' },
  { name: 'Ver en el navegador', href: '{{view_in_browser_url}}' },
]

// bloque personalizado de ejemplo: una tarjeta con título + texto + color
const customBlocks: CustomBlockDef[] = [
  {
    type: 'callout',
    label: 'Aviso',
    defaultData: { title: 'Título', body: 'Escribe tu aviso aquí.', color: '#fef3c7' },
    fields: [
      { key: 'title', label: 'Título', type: 'text' },
      { key: 'body', label: 'Texto', type: 'textarea' },
      { key: 'color', label: 'Color de fondo', type: 'color' },
    ],
    // escapa la data del usuario (puede venir de un JSON importado) — buena práctica en render()
    render: (d) =>
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:16px;background-color:${escapeHtml(String(d.color))};border-radius:8px;font-family:Arial,sans-serif;"><strong style="font-size:16px">${escapeHtml(String(d.title))}</strong><p style="margin:8px 0 0">${escapeHtml(String(d.body))}</p></td></tr></table>`,
  },
]

// demo: convierte el archivo a data URL (un backend real subiría a un CDN)
async function uploadImage(file: File): Promise<string> {
  return await new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.readAsDataURL(file)
  })
}

// demo: galería en memoria con latencia artificial (un backend real usaría, ej., Firebase Storage)
const mediaLibrary = createDemoMediaLibrary()

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
