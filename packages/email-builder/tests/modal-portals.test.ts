import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import { createBlock, createDocument, createRow } from '../src/schema'
import { findInBody } from './modal-test-utils'

const mountedHosts: HTMLDivElement[] = []

afterEach(() => {
  for (const host of mountedHosts.splice(0)) host.remove()
})

describe('modal portals', () => {
  function assertBodyPortal(selector: string): void {
    const element = document.body.querySelector(selector)
    expect(element).not.toBeNull()
    expect(element?.closest('.vmd-overlay-root')?.parentElement).toBe(document.body)
  }

  it('renders preview outside constrained hosts and preserves appearance variables', async () => {
    const host = document.createElement('div')
    host.style.contain = 'strict'
    host.style.overflow = 'hidden'
    host.style.transform = 'translateZ(0)'
    document.body.append(host)
    mountedHosts.push(host)

    const wrapper = mount(EmailBuilder, {
      attachTo: host,
      props: {
        appearance: { accent: '#ff0000', panel: '#eeeeee' },
      },
    })

    await wrapper.find('[data-action="preview"]').trigger('click')

    const portal = document.body.querySelector<HTMLElement>('.vmd-overlay-root')
    const modal = portal?.querySelector<HTMLElement>('.vmd-modal')
    expect(portal?.parentElement).toBe(document.body)
    expect(modal).not.toBeNull()
    if (!portal || !modal) throw new Error('Expected the modal portal to be mounted')
    expect(host.contains(modal)).toBe(false)
    expect(portal?.classList.contains('vmd-dark')).toBe(false)
    expect(portal?.style.getPropertyValue('--vmd-accent')).toBe('#ff0000')
    expect(portal?.style.getPropertyValue('--vmd-panel')).toBe('#eeeeee')

    wrapper.unmount()
    expect(document.body.querySelector('.vmd-overlay-root')).toBeNull()
  })

  it('uses a body portal for every editor modal entry point', async () => {
    const design = createDocument()
    const row = createRow([100])
    const image = createBlock('image')
    if (image.type !== 'image') throw new Error('Expected an image block')
    image.src = 'https://cdn.example.com/image.png'
    row.columns[0].blocks.push(image)
    design.rows.push(row)

    const wrapper = mount(EmailBuilder, {
      props: {
        design,
        uploadImage: vi.fn(),
        imageSearch: vi.fn().mockResolvedValue([
          { url: 'https://cdn.example.com/search.png', thumbnailUrl: 'https://cdn.example.com/search-thumb.png', title: 'Search image' },
        ]),
      },
      global: { stubs: { Cropper: { template: '<div />' } } },
    })

    await wrapper.find('[data-action="templates"]').trigger('click')
    assertBodyPortal('.vmd-gallery-box')
    await findInBody('.vmd-modal').trigger('click')

    await wrapper.find('[data-action="preview"]').trigger('click')
    assertBodyPortal('.vmd-preview-box')
    await findInBody('.vmd-modal').trigger('click')

    await wrapper.find('[data-action="export"]').trigger('click')
    await wrapper.find('[data-action="import-unlayer"]').trigger('click')
    assertBodyPortal('.vmd-import-box')
    await findInBody('.vmd-modal').trigger('click')

    await wrapper.find('[data-action="export"]').trigger('click')
    await wrapper.find('[data-action="versions"]').trigger('click')
    assertBodyPortal('.vmd-versions-box')
    await findInBody('.vmd-modal').trigger('click')

    await wrapper.find('.vmd-block').trigger('click')
    await wrapper.find('[data-action="crop-image"]').trigger('click')
    assertBodyPortal('.vmd-image-editor')
    await findInBody('.vmd-modal').trigger('click')

    await wrapper.find('[data-tab="images"]').trigger('click')
    await wrapper.find('.vmd-image-search input').setValue('travel')
    await new Promise((resolve) => setTimeout(resolve, 450))
    await flushPromises()
    await wrapper.find('.vmd-image-result').trigger('click')
    assertBodyPortal('.vmd-image-preview-box')
    await findInBody('.vmd-modal').trigger('click')

    wrapper.unmount()
    expect(document.body.querySelector('.vmd-overlay-root')).toBeNull()
  })

  it('carries the dark theme onto the portal root', async () => {
    const wrapper = mount(EmailBuilder, { props: { theme: 'dark' } })

    await wrapper.find('[data-action="preview"]').trigger('click')

    expect(document.body.querySelector('.vmd-overlay-root')?.classList.contains('vmd-dark')).toBe(true)

    wrapper.unmount()
  })
})
