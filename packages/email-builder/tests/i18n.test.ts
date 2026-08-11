import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it, vi } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import { en } from '../src/i18n/en'
import { es } from '../src/i18n/es'
import { useI18n } from '../src/i18n/useI18n'
import { createBlock, createDocument, createRow } from '../src/schema'
import type { MediaItem } from '../src/mediaLibrary'
import './modal-test-utils'

const TASK_4_COMPONENT_SOURCES = import.meta.glob<string>(
  [
  '../src/components/UnlayerImportDialog.vue',
  '../src/components/TemplateGallery.vue',
  '../src/components/PreviewDialog.vue',
  '../src/components/ImageEditorModal.vue',
  '../src/components/image-editor/CropPanel.vue',
  '../src/components/BlockView.vue',
  '../src/components/PropertiesPanel.vue',
  '../src/components/tabs/BodyTab.vue',
  '../src/components/fields/PaddingField.vue',
  '../src/components/tabs/ImagesPanel.vue',
  '../src/components/tabs/ImagesTab.vue',
  '../src/components/tabs/MediaLibraryTab.vue',
  '../src/components/ImagePreviewDialog.vue',
  ],
  { eager: true, import: 'default', query: '?raw' },
)

const TASK_4_SPANISH_LITERALS = [
  'Importar de Unlayer',
  'Elegir plantilla',
  'Copiar HTML',
  'Editar imagen',
  'Rotar izquierda',
  'Selecciona una imagen en el inspector',
  'Configura el video en el inspector',
] as const

const TASK_4_ENGLISH_LITERALS = [
  'Import from Unlayer',
  'Choose template',
  'Copy HTML',
  'Edit image',
  'Rotate left',
  'Select an image in the inspector',
  'Configure the video in the inspector',
] as const

function task4Design() {
  const design = createDocument()
  const row = createRow([100])
  row.style.backgroundImage = {
    url: 'https://cdn.example.com/background.png',
    repeat: 'no-repeat',
    size: 'cover',
    position: 'center',
    fullWidth: false,
  }

  const cropImage = createBlock('image')
  if (cropImage.type !== 'image') throw new Error('expected image block')
  cropImage.src = 'https://cdn.example.com/crop-source.png'
  cropImage.alt = ''
  row.columns[0].blocks.push(cropImage)

  const emptyImage = createBlock('image')
  if (emptyImage.type !== 'image') throw new Error('expected image block')
  emptyImage.hideDesktop = true
  row.columns[0].blocks.push(emptyImage)

  const video = createBlock('video')
  if (video.type !== 'video') throw new Error('expected video block')
  video.thumbnailUrl = ''
  row.columns[0].blocks.push(video)

  const timer = createBlock('timer')
  if (timer.type !== 'timer') throw new Error('expected timer block')
  timer.endDate = '2099-01-03T00:00:00.000Z'
  timer.imageUrl = ''
  row.columns[0].blocks.push(timer)

  design.rows.push(row)
  return {
    design,
    cropImage,
    emptyImage,
    video,
    timer,
    rowId: row.id,
  }
}

function makeMediaLibrary(items: MediaItem[] = []) {
  return {
    list: vi.fn().mockResolvedValue({ items }),
    upload: vi.fn(),
    delete: vi.fn(),
    rename: vi.fn(),
  }
}

async function openExportMenu(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('[data-tab="export"]').trigger('click')
}

async function openImagesSearch(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('[data-tab="images"]').trigger('click')
}

async function openImagesGallery(wrapper: ReturnType<typeof mount>) {
  await openImagesSearch(wrapper)
  await wrapper.find('[data-subtab="gallery"]').trigger('click')
}

async function openTask4Chrome(locale: 'en' | 'es') {
  const { design, cropImage, emptyImage, video, timer, rowId } = task4Design()
  const mediaLibrary = makeMediaLibrary([
    {
      id: 'media-1',
      url: 'https://cdn.example.com/library-full.jpg',
      thumbnailUrl: 'https://cdn.example.com/library-thumb.jpg',
      name: locale === 'es' ? 'Foto de portada' : 'Cover photo',
    },
  ])
  const wrapper = mount(EmailBuilder, {
    props: {
      design,
      locale,
      uploadImage: vi.fn().mockResolvedValue('https://cdn.example.com/cropped.png'),
      mediaLibrary,
      imageSearch: vi.fn().mockResolvedValue([
        {
          url: 'https://cdn.example.com/search-full.jpg',
          thumbnailUrl: 'https://cdn.example.com/search-thumb.jpg',
          title: locale === 'es' ? 'Foto de playa' : 'Beach photo',
        },
      ]),
    },
  })

  await openExportMenu(wrapper)
  await wrapper.find('[data-action="import-unlayer"]').trigger('click')
  const importOverlayText = document.body.textContent ?? ''

  await wrapper.find('[data-action="templates"]').trigger('click')

  await wrapper.find('[data-action="preview"]').trigger('click')

  await openImagesGallery(wrapper)
  await wrapper.find('.vmd-media-item-thumb').trigger('click')

  await wrapper.findAll('.vmd-block')[0].trigger('click')
  await wrapper.find('[data-action="crop-image"]').trigger('click')

  await wrapper.setProps({ locale })
  await wrapper.find('[data-action="props-close"]').trigger('click')
  wrapper.vm.loadDesign(design)
  await wrapper.vm.$nextTick()
  await wrapper.find('.vmd-row').trigger('click')

  await wrapper.find('[data-tab="body"]').trigger('click')
  await wrapper.find('[data-tab="content"]').trigger('click')

  const blocks = wrapper.findAll('.vmd-block')
  await blocks[1].trigger('click')
  await wrapper.find('[data-action="props-close"]').trigger('click')
  await blocks[2].trigger('click')
  await wrapper.find('[data-action="props-close"]').trigger('click')
  await blocks[3].trigger('click')

  return { wrapper, cropImage, emptyImage, video, timer, rowId, importOverlayText }
}

function usedLocaleKeys(source: string): string[] {
  const matches = source.matchAll(/\bt\(\s*['"]([^'"]+)['"]\s*\)/g)
  return [...new Set([...matches].map((match) => match[1]))].sort()
}

describe('i18n', () => {
  it('defaults to English', () => {
    const w = mount(EmailBuilder)
    expect(w.find('[data-action="templates"]').text()).toContain('Templates')
  })
  it("locale 'en' cambia el chrome a inglés", () => {
    const w = mount(EmailBuilder, { props: { locale: 'en' } })
    expect(w.find('[data-action="templates"]').text()).toContain('Templates')
    expect(w.find('[data-tab="export"]').text().toLowerCase()).toContain('export')
  })
  it('uses English as the fallback for a partial custom dictionary', () => {
    const w = mount(EmailBuilder, { props: { locale: { 'rail.images': 'Assets' } } })
    expect(w.find('[data-tab="images"]').text()).toContain('Assets')
    expect(w.text()).toContain('Content')
  })
  it('renders Spanish when explicitly selected', () => {
    const w = mount(EmailBuilder, { props: { locale: 'es' } })
    expect(w.find('[data-tab="images"]').text()).toContain('Imágenes')
  })
  it('objeto parcial sobreescribe solo esas claves', () => {
    const w = mount(EmailBuilder, { props: { locale: { 'header.templates': 'Modelos' } } })
    expect(w.find('[data-action="templates"]').text()).toContain('Modelos')
    // the rest keeps the English fallback
    expect(w.find('[data-tab="export"]').text()).toContain('Export')
  })
  it('la paleta usa labels traducidos', () => {
    const w = mount(EmailBuilder, { props: { locale: 'en' } })
    const texts = w.findAll('.vmd-content-item').map((i) => i.text())
    expect(texts.some((t) => t.includes('Heading'))).toBe(true)
  })
  it('keeps Spanish and English dictionaries aligned', () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort())
  })

  it('localizes the Task 4 editor chrome in English and Spanish', async () => {
    vi.setSystemTime(new Date('2099-01-01T00:00:00.000Z'))

    const { wrapper: englishWrapper, importOverlayText: englishImportText } = await openTask4Chrome('en')
    const englishText = `${englishWrapper.text()} ${englishImportText} ${document.body.textContent ?? ''}`

    for (const literal of TASK_4_SPANISH_LITERALS) {
      expect(englishText).not.toContain(literal)
    }
    for (const literal of TASK_4_ENGLISH_LITERALS) {
      expect(englishText).toContain(literal)
    }
    expect(englishText).toContain('Hidden here')
    expect(englishText).toContain('days')

    englishWrapper.unmount()

    const { wrapper: spanishWrapper, importOverlayText: spanishImportText } = await openTask4Chrome('es')
    const spanishText = `${spanishWrapper.text()} ${spanishImportText} ${document.body.textContent ?? ''}`

    expect(spanishText).toContain('Importar de Unlayer')
    expect(spanishText).toContain('Elegir plantilla')
    expect(spanishText).toContain('Oculto aquí')
    expect(spanishText).toContain('días')

    vi.useRealTimers()
  })

  it('keeps every Task 4 i18n key aligned across English and Spanish', () => {
    const keys = new Set(Object.values(TASK_4_COMPONENT_SOURCES).flatMap((source) => usedLocaleKeys(source)))

    expect(keys.size).toBeGreaterThan(0)
    for (const key of keys) {
      expect(en[key]).toBeTypeOf('string')
      expect(es[key]).toBeTypeOf('string')
    }
  })
})

describe('i18n reactividad', () => {
  it('cambiar la prop locale en caliente actualiza el chrome', async () => {
    const w = mount(EmailBuilder, { props: { locale: 'es' } })
    expect(w.find('[data-action="templates"]').text()).toContain('Plantillas')
    await w.setProps({ locale: 'en' })
    expect(w.find('[data-action="templates"]').text()).toContain('Templates')
  })

  it('updates Task 4 option labels when the locale changes', async () => {
    const { design } = task4Design()
    const w = mount(EmailBuilder, { props: { design, locale: 'es' } })

    await w.find('.vmd-row').trigger('click')
    expect(w.text()).toContain('Sin repetir')

    await w.setProps({ locale: 'en' })

    expect(w.text()).toContain('No repeat')
    expect(w.text()).not.toContain('Sin repetir')
  })
})

describe('useI18n fallback', () => {
  it('defaults to English locale outside EmailBuilder provider', () => {
    const Probe = defineComponent({
      setup() {
        return useI18n()
      },
      template: '<output>{{ locale }}|{{ t("missing.key") }}</output>',
    })

    const w = mount(Probe)
    expect(w.text()).toBe('en|missing.key')
  })
})
