import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import ImagePreviewDialog from '../src/components/ImagePreviewDialog.vue'
import { en } from '../src/i18n/en'
import { I18N_KEY } from '../src/i18n/useI18n'
import type { ImageSelection } from '../src/components/tabs/imageTypes'

const image: ImageSelection = {
  src: 'https://cdn.example.com/full.jpg',
  thumbnailUrl: 'https://cdn.example.com/thumb.jpg',
  alt: 'Golden retriever',
  title: 'Golden retriever on the beach',
}

function mountDialog() {
  return mount(ImagePreviewDialog, {
    props: { image },
    global: {
      provide: {
        [I18N_KEY as symbol]: { t: (key: string) => en[key] ?? key },
      },
    },
  })
}

describe('ImagePreviewDialog', () => {
  it('shows the full image and emits add only when Add is pressed', async () => {
    const wrapper = mountDialog()
    const preview = wrapper.find('.vmd-image-preview-dialog img')

    expect(preview.attributes('src')).toBe(image.src)
    expect(preview.attributes('alt')).toBe(image.alt)
    expect(wrapper.text()).toContain(image.title as string)
    expect(wrapper.text()).toContain('Add')
    expect(wrapper.emitted('add')).toBeUndefined()

    await wrapper.find('[data-action="image-preview-add"]').trigger('click')

    expect(wrapper.emitted('add')).toHaveLength(1)
  })

  it('emits close when Cancel is pressed', async () => {
    const wrapper = mountDialog()

    await wrapper.find('[data-action="image-preview-cancel"]').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits close when the close button is pressed', async () => {
    const wrapper = mountDialog()

    await wrapper.find('[data-action="image-preview-close"]').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('emits close when the backdrop is clicked', async () => {
    const wrapper = mountDialog()

    await wrapper.find('.vmd-image-preview-dialog').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })

  it('renders title and alt text without changing the source URL', () => {
    const wrapper = mountDialog()
    const preview = wrapper.find('.vmd-image-preview-dialog img')

    expect(wrapper.find('.vmd-inspector-title').text()).toBe(image.title)
    expect(wrapper.find('.vmd-image-preview-alt').text()).toBe(image.alt)
    expect(preview.attributes('src')).toBe(image.src)
    expect(preview.attributes('src')).not.toBe(image.thumbnailUrl)
  })
})
