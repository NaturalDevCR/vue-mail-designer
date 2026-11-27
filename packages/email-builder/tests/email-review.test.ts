import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import { reviewEmailHtml } from '../src/export/review'
import { createBlock, createDocument, createRow } from '../src/schema'
import { findInBody, hasInBody } from './modal-test-utils'

describe('email review', () => {
  it('reports missing or blank alt text and skips images explicitly marked decorative', () => {
    const result = reviewEmailHtml(`
      <img src="https://example.test/banner.png?cache=123">
      <img src="detail.png" alt="&nbsp;">
      <img src="product.png" alt="Product photo">
      <img src="rule.png" alt="" role="presentation">
      <div aria-hidden="true"><img src="decoration.png"></div>
    `)

    expect(result.missingAlt).toEqual([
      { position: 1, label: 'banner.png' },
      { position: 2, label: 'detail.png' },
    ])
  })

  it('deduplicates variables in visible text and attributes and identifies configured names', () => {
    const result = reviewEmailHtml(`
      <title>News for {{first_name}}</title>
      <p>Hi {{ first_name }}. Your code is {{ coupon.id }}.</p>
      <a href="{{unsubscribe_url}}">Unsubscribe</a>
      <img src="{{ asset-url }}" alt="A product">
      <style>/* {{not_content}} */</style>
      <!-- {{comment_word}} -->
    `, new Set(['first_name', 'unsubscribe_url']))

    expect(result.variables).toEqual([
      { name: 'first_name', configured: true },
      { name: 'coupon.id', configured: false },
      { name: 'unsubscribe_url', configured: true },
      { name: 'asset-url', configured: false },
    ])
  })

  it('checks what the editor will export, including rich-text tags and custom markup', async () => {
    const design = createDocument()
    design.settings.preheader = 'Offer {{discount_code}}'
    const row = createRow([100])
    const richText = createBlock('text')
    const image = createBlock('image')
    const raw = createBlock('html')
    if (richText.type !== 'text' || image.type !== 'image' || raw.type !== 'html') throw new Error('Unexpected block types')
    richText.html = '<p>Hello <span class="vmd-mt" data-mt="first_name">Name</span></p>'
    image.src = 'https://example.test/header.png'
    raw.code = '<a href="{{unsubscribe_url}}">Unsubscribe</a><img src="footer.png">'
    row.columns[0].blocks.push(richText, image, raw)
    design.rows.push(row)
    const wrapper = mount(EmailBuilder, {
      props: { design, mergeTags: [{ name: 'Contact', tags: [{ name: 'Name', value: 'first_name' }] }] },
    })

    await wrapper.get('[data-tab="export"]').trigger('click')
    await wrapper.get('[data-action="email-review"]').trigger('click')
    const review = findInBody('[aria-label="Pre-send review"]')

    expect(review.text()).toContain('header.png')
    expect(review.text()).toContain('footer.png')
    expect(review.get('[data-variable="first_name"]').text()).toContain('Configured')
    expect(review.get('[data-variable="unsubscribe_url"]').text()).toContain('Configured')
    expect(review.get('[data-variable="discount_code"]').text()).toContain('Unrecognized')
    expect(wrapper.emitted('change')).toBeUndefined()
    expect(wrapper.get('[data-action="export-html"]').attributes('disabled')).toBeUndefined()

    await review.trigger('cancel')
    expect(hasInBody('[aria-label="Pre-send review"]')).toBe(false)
  })

  it('shows a clear result for an email without issues', async () => {
    const wrapper = mount(EmailBuilder, { props: { locale: 'es' } })
    await wrapper.get('[data-tab="export"]').trigger('click')
    await wrapper.get('[data-action="email-review"]').trigger('click')

    expect(findInBody('[aria-label="Revisión previa al envío"]').text())
      .toContain('No hay imágenes sin texto alternativo ni variables pendientes.')
  })
})
