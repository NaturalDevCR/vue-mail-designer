import { describe, expect, it } from 'vitest'
import { renderHtml } from '../src/render/html'
import { createBlock, createDocument, createRow } from '../src/schema'
import type { Block, HtmlBlock, MenuBlock, SocialBlock, VideoBlock } from '../src/schema'

function render(block: Block): string {
  const doc = createDocument()
  const row = createRow([100])
  row.columns[0].blocks.push(block)
  doc.rows.push(row)
  return renderHtml(doc)
}

describe('renderBlock — bloques avanzados', () => {
  it('social: un link por red con círculo de marca', () => {
    const social = createBlock('social') as SocialBlock
    social.networks = [
      { kind: 'facebook', url: 'https://facebook.com/acme' },
      { kind: 'youtube', url: 'https://youtube.com/@acme' },
    ]
    const html = render(social)
    expect(html).toContain('href="https://facebook.com/acme"')
    expect(html).toContain('href="https://youtube.com/@acme"')
    expect(html).toContain('border-radius:50%')
  })

  it('social: exporta iconos con URLs HTTPS en lugar de data URIs', () => {
    const social = createBlock('social') as SocialBlock
    social.networks = [{ kind: 'facebook', url: 'https://facebook.com/acme' }]

    const html = render(social)

    expect(html).toContain('src="https://cdn.simpleicons.org/facebook/ffffff"')
    expect(html).not.toContain('data:image/svg+xml')
  })

  it('social: permite personalizar y escapar la URL de cada icono', () => {
    const social = createBlock('social') as SocialBlock
    social.networks = [{ kind: 'facebook', url: 'https://facebook.com/acme' }]
    const doc = createDocument()
    const row = createRow([100])
    row.columns[0].blocks.push(social)
    doc.rows.push(row)

    const html = renderHtml(doc, undefined, undefined, undefined, () => 'https://assets.example.test/facebook.svg?theme=light&size=24')

    expect(html).toContain('src="https://assets.example.test/facebook.svg?theme=light&amp;size=24"')
  })

  it('menu: items con separador escapado', () => {
    const menu = createBlock('menu') as MenuBlock
    menu.items = [
      { label: 'Inicio', href: 'https://a.com' },
      { label: 'Tienda', href: 'https://b.com' },
    ]
    menu.separator = '|'
    const html = render(menu)
    expect(html).toContain('>Inicio</a>')
    expect(html).toContain('>Tienda</a>')
    expect(html.split('|').length).toBeGreaterThanOrEqual(2)
  })

  it('html: el código pasa crudo, sin escapar', () => {
    const raw = createBlock('html') as HtmlBlock
    raw.code = '<table><tr><td>custom</td></tr></table>'
    const html = render(raw)
    expect(html).toContain('<table><tr><td>custom</td></tr></table>')
  })

  it('video: thumbnail linkeado al video', () => {
    const video = createBlock('video') as VideoBlock
    video.thumbnailUrl = 'https://cdn.example.com/thumb.jpg'
    video.videoUrl = 'https://youtu.be/xyz'
    video.alt = 'Ver demo'
    const html = render(video)
    expect(html).toContain('href="https://youtu.be/xyz"')
    expect(html).toContain('src="https://cdn.example.com/thumb.jpg"')
    expect(html).toContain('alt="Ver demo"')
  })

  it('preheader aparece oculto al inicio del body', () => {
    const doc = createDocument()
    doc.settings.preheader = 'Oferta exclusiva dentro'
    const html = renderHtml(doc)
    expect(html).toContain('Oferta exclusiva dentro')
    expect(html).toMatch(/display:none[^>]*>Oferta exclusiva dentro/)
  })

  it('snapshot integral con los 10 bloques', () => {
    const doc = createDocument()
    const row = createRow([100])
    for (const t of ['heading', 'text', 'image', 'button', 'divider', 'spacer', 'social', 'menu', 'html', 'video'] as const) {
      row.columns[0].blocks.push(createBlock(t))
    }
    doc.rows.push(row)
    let n = 0
    const fix = (o: { id: string }) => { o.id = `fix_${n++}` }
    doc.rows.forEach((r) => { fix(r); r.columns.forEach((c) => { fix(c); c.blocks.forEach(fix) }) })
    expect(renderHtml(doc)).toMatchSnapshot()
  })
})
