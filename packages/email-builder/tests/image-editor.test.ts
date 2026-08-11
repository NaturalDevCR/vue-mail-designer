// packages/email-builder/tests/image-editor.test.ts
import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import { createBlock, createDocument, createRow } from '../src/schema'
import type { ImageBlock } from '../src/schema'

function fakeCanvas(shouldFailToBlob = false) {
  return {
    toBlob(callback: (b: Blob | null) => void) {
      callback(shouldFailToBlob ? null : new Blob(['x'], { type: 'image/png' }))
    },
  } as unknown as HTMLCanvasElement
}

function makeCropperStub(options: { throwOnGetResult?: boolean; failToBlob?: boolean } = {}) {
  const rotate = vi.fn()
  const flip = vi.fn()
  const reset = vi.fn()
  const component = defineComponent({
    name: 'Cropper',
    props: ['src', 'stencilProps'],
    emits: ['change'],
    setup(_props, { expose }) {
      expose({
        getResult: () => {
          if (options.throwOnGetResult) throw new Error('tainted canvas')
          return { canvas: fakeCanvas(options.failToBlob) }
        },
        rotate,
        flip,
        reset,
      })
      return () => h('div', { class: 'cropper-stub' })
    },
  })
  return Object.assign(component, { spies: { rotate, flip, reset } })
}

function designWithImage() {
  const design = createDocument()
  const row = createRow([100])
  const img = createBlock('image') as ImageBlock
  img.src = 'https://cdn.example.com/a.png'
  row.columns[0].blocks.push(img)
  design.rows.push(row)
  return { design, img }
}

async function openEditor(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('.vmd-block').trigger('click')
  await wrapper.find('[data-action="crop-image"]').trigger('click')
  await flushPromises()
}

describe('ImageEditorModal — Crop', () => {
  it('el botón Recortar no aparece sin uploadImage', async () => {
    const { design } = designWithImage()
    const wrapper = mount(EmailBuilder, { props: { design } })
    await wrapper.find('.vmd-block').trigger('click')
    expect(wrapper.find('[data-action="crop-image"]').exists()).toBe(false)
  })

  it('el botón Recortar no aparece si el bloque no tiene src', async () => {
    const design = createDocument()
    const row = createRow([100])
    row.columns[0].blocks.push(createBlock('image'))
    design.rows.push(row)
    const wrapper = mount(EmailBuilder, { props: { design, uploadImage: vi.fn() } })
    await wrapper.find('.vmd-block').trigger('click')
    expect(wrapper.find('[data-action="crop-image"]').exists()).toBe(false)
  })

  it('abre el modal con Crop habilitado y el resto de las pestañas deshabilitadas', async () => {
    const { design } = designWithImage()
    const wrapper = mount(EmailBuilder, {
      props: { design, uploadImage: vi.fn() },
      global: { stubs: { Cropper: makeCropperStub() } },
    })
    await openEditor(wrapper)

    expect(wrapper.find('.vmd-image-editor').exists()).toBe(true)
    const railButtons = wrapper.findAll('.vmd-image-editor-rail button')
    expect(railButtons).toHaveLength(5)
    const disabled = railButtons.filter((b) => b.attributes('disabled') !== undefined)
    expect(disabled).toHaveLength(4)
  })

  it('Cancel closes the modal without touching the block', async () => {
    const { design } = designWithImage()
    const wrapper = mount(EmailBuilder, {
      props: { design, uploadImage: vi.fn() },
      global: { stubs: { Cropper: makeCropperStub() } },
    })
    await openEditor(wrapper)

    const cancelBtn = wrapper.findAll('.vmd-image-editor .vmd-btn').find((b) => b.text() === 'Cancel')
    await cancelBtn!.trigger('click')

    expect(wrapper.find('.vmd-image-editor').exists()).toBe(false)
    expect(wrapper.emitted('update:design')).toBeUndefined()
  })

  it('Save uploads the cropped result and updates the block src', async () => {
    const { design } = designWithImage()
    const uploadImage = vi.fn().mockResolvedValue('https://cdn.example.com/cropped.png')
    const wrapper = mount(EmailBuilder, {
      props: { design, uploadImage },
      global: { stubs: { Cropper: makeCropperStub() } },
    })
    await openEditor(wrapper)

    const saveBtn = wrapper.findAll('.vmd-image-editor .vmd-btn').find((b) => b.text().includes('Save'))
    await saveBtn!.trigger('click')
    await flushPromises()

    expect(uploadImage).toHaveBeenCalledTimes(1)
    const file = uploadImage.mock.calls[0][0] as File
    expect(file.name).toBe('cropped.png')
    expect(file.type).toBe('image/png')

    const emitted = wrapper.emitted('update:design')
    const doc = emitted![emitted!.length - 1][0] as {
      rows: { columns: { blocks: { type: string; src?: string }[] }[] }[]
    }
    const blocks = doc.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks))
    const image = blocks.find((b) => b.type === 'image')
    expect(image?.src).toBe('https://cdn.example.com/cropped.png')
    expect(wrapper.find('.vmd-image-editor').exists()).toBe(false)
  })

  it('persists the adjusted corner radius when saving', async () => {
    const { design } = designWithImage()
    const uploadImage = vi.fn().mockResolvedValue('https://cdn.example.com/cropped.png')
    const wrapper = mount(EmailBuilder, {
      props: { design, uploadImage },
      global: { stubs: { Cropper: makeCropperStub() } },
    })
    await openEditor(wrapper)

    // input[1] es el slider de "Radio" (input[0] es "Enderezar")
    const radiusInput = wrapper.findAll('.vmd-crop-panel input[type="range"]')[1]
    await radiusInput.setValue('20')

    const saveBtn = wrapper.findAll('.vmd-image-editor .vmd-btn').find((b) => b.text().includes('Save'))
    await saveBtn!.trigger('click')
    await flushPromises()

    const emitted = wrapper.emitted('update:design')
    const doc = emitted![emitted!.length - 1][0] as {
      rows: { columns: { blocks: { type: string; borderRadius?: number }[] }[] }[]
    }
    const blocks = doc.rows.flatMap((r) => r.columns.flatMap((c) => c.blocks))
    const image = blocks.find((b) => b.type === 'image')
    expect(image?.borderRadius).toBe(20)
  })

  it('keeps the modal open and shows an error when uploadImage fails', async () => {
    const { design } = designWithImage()
    const uploadImage = vi.fn().mockRejectedValue(new Error('boom'))
    const wrapper = mount(EmailBuilder, {
      props: { design, uploadImage },
      global: { stubs: { Cropper: makeCropperStub() } },
    })
    await openEditor(wrapper)

    const saveBtn = wrapper.findAll('.vmd-image-editor .vmd-btn').find((b) => b.text().includes('Save'))
    await saveBtn!.trigger('click')
    await flushPromises()

    expect(wrapper.find('.vmd-image-editor').exists()).toBe(true)
    expect(wrapper.find('.vmd-image-editor .vmd-image-error').text()).toContain('Could not upload')
  })

  it('shows an error without closing the modal when crop extraction fails', async () => {
    const { design } = designWithImage()
    const uploadImage = vi.fn()
    const wrapper = mount(EmailBuilder, {
      props: { design, uploadImage },
      global: { stubs: { Cropper: makeCropperStub({ throwOnGetResult: true }) } },
    })
    await openEditor(wrapper)

    const saveBtn = wrapper.findAll('.vmd-image-editor .vmd-btn').find((b) => b.text().includes('Save'))
    await saveBtn!.trigger('click')
    await flushPromises()

    expect(uploadImage).not.toHaveBeenCalled()
    expect(wrapper.find('.vmd-image-editor').exists()).toBe(true)
    expect(wrapper.find('.vmd-image-editor .vmd-image-error').text()).toContain('Could not process')
  })

  it('shows an error without calling uploadImage when toBlob returns null', async () => {
    const { design } = designWithImage()
    const uploadImage = vi.fn()
    const wrapper = mount(EmailBuilder, {
      props: { design, uploadImage },
      global: { stubs: { Cropper: makeCropperStub({ failToBlob: true }) } },
    })
    await openEditor(wrapper)

    const saveBtn = wrapper.findAll('.vmd-image-editor .vmd-btn').find((b) => b.text().includes('Save'))
    await saveBtn!.trigger('click')
    await flushPromises()

    expect(uploadImage).not.toHaveBeenCalled()
    expect(wrapper.find('.vmd-image-editor').exists()).toBe(true)
    expect(wrapper.find('.vmd-image-editor .vmd-image-error').text()).toContain('Could not process')
  })

  it('calls the cropper methods from the rotate, flip, and reset buttons', async () => {
    const { design } = designWithImage()
    const cropperStub = makeCropperStub()
    const wrapper = mount(EmailBuilder, {
      props: { design, uploadImage: vi.fn() },
      global: { stubs: { Cropper: cropperStub } },
    })
    await openEditor(wrapper)

    const buttons = wrapper.findAll('.vmd-crop-panel .vmd-mini-btn')
    const findByText = (text: string) => buttons.find((b) => b.text().includes(text))

    await findByText('Rotate left')!.trigger('click')
    expect(cropperStub.spies.rotate).toHaveBeenLastCalledWith(-90)

    await findByText('Rotate right')!.trigger('click')
    expect(cropperStub.spies.rotate).toHaveBeenLastCalledWith(90)

    await findByText('Flip horizontal')!.trigger('click')
    expect(cropperStub.spies.flip).toHaveBeenLastCalledWith(true, false)

    await findByText('Flip vertical')!.trigger('click')
    expect(cropperStub.spies.flip).toHaveBeenLastCalledWith(false, true)

    await findByText('Reset')!.trigger('click')
    expect(cropperStub.spies.reset).toHaveBeenCalledTimes(1)
  })
})
