import { describe, expect, it } from 'vitest'
import { renderHtml } from '../src/render/html'
import { createBlock, createDocument, createRow } from '../src/schema'
import type { Block, ButtonBlock, CustomBlock, DividerBlock, HeadingBlock, ImageBlock, MenuBlock, SpacerBlock, TableBlock, TextBlock } from '../src/schema'

function render(block: Block): string {
  const doc = createDocument()
  const row = createRow([100])
  row.columns[0].blocks.push(block)
  doc.rows.push(row)
  return renderHtml(doc)
}

describe('renderBlock — paridad con Unlayer (campos nuevos)', () => {
  it('heading: peso de fuente y espaciado entre letras', () => {
    const h = createBlock('heading') as HeadingBlock
    h.fontWeight = 'normal'
    h.style.letterSpacing = 2
    const html = render(h)
    expect(html).toContain('font-weight:normal')
    expect(html).toContain('letter-spacing:2px')
  })

  it('text: override de color/subrayado de link ignora el del body', () => {
    const t = createBlock('text') as TextBlock
    t.html = '<p><a href="https://x.com">link</a></p>'
    t.linkColor = '#ff0000'
    t.linkUnderline = false
    const html = render(t)
    expect(html).toContain('color:#ff0000;text-decoration:none;')
  })

  it('image: ancho automático omite el % y el atributo width', () => {
    const img = createBlock('image') as ImageBlock
    img.src = 'https://cdn.example.com/a.png'
    img.widthAuto = true
    const html = render(img)
    expect(html).not.toContain('<img src="https://cdn.example.com/a.png" alt="" width="100%"')
    expect(html).toContain('width:auto;max-width:100%;')
  })

  it('button: target configurable', () => {
    const b = createBlock('button') as ButtonBlock
    b.target = '_self'
    const html = render(b)
    expect(html).toContain('target="_self"')
  })

  it('divider: estilo de línea y alineación', () => {
    const d = createBlock('divider') as DividerBlock
    d.style.lineStyle = 'dashed'
    d.style.align = 'left'
    const html = render(d)
    expect(html).toContain('border-top:1px dashed')
    expect(html).toContain('<td align="left"')
  })

  it('menu: layout vertical apila los items sin separador inline', () => {
    const m = createBlock('menu') as MenuBlock
    m.layout = 'vertical'
    const html = render(m)
    expect(html).toContain('display:block')
    expect(html).not.toContain('padding:0 4px;color')
  })

  it('table: filas alternadas y color de encabezado independiente', () => {
    const t = createBlock('table') as TableBlock
    t.stripedRows = true
    t.style.headerColor = '#ffffff'
    const html = render(t)
    expect(html).toContain('rgba(0,0,0,.03)')
    expect(html).toContain('color:#ffffff')
  })

  it('spacer: exports configurable padding', () => {
    const spacer = createBlock('spacer') as SpacerBlock
    spacer.style.padding = { top: 1, right: 2, bottom: 3, left: 4 }
    expect(render(spacer)).toContain('padding:1px 2px 3px 4px;')
  })

  it('custom block: exports configurable padding', () => {
    const custom = {
      id: 'custom-1',
      type: 'custom',
      customType: 'promo',
      data: {},
      style: { padding: { top: 1, right: 2, bottom: 3, left: 4 } },
    } as CustomBlock
    expect(render(custom)).toContain('padding:1px 2px 3px 4px;')
  })
})
