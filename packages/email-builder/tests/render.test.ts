import { describe, expect, it } from 'vitest'
import { renderHtml } from '../src/render/html'
import { createBlock, createDocument, createRow } from '../src/schema'
import type { HeadingBlock, TextBlock } from '../src/schema'

function docWith(widths: number[], blocks: Parameters<typeof createBlock>[0][][]) {
  const doc = createDocument()
  const row = createRow(widths)
  blocks.forEach((types, i) => {
    for (const t of types) row.columns[i].blocks.push(createBlock(t))
  })
  doc.rows.push(row)
  return { doc, row }
}

describe('renderHtml — frame y layout', () => {
  it('genera documento completo con tablas de presentación', () => {
    const { doc } = docWith([100], [['heading']])
    const html = renderHtml(doc)
    expect(html).toContain('<!doctype html>')
    expect(html).toContain('role="presentation"')
    expect(html).toContain(`width="600"`)
    expect(html).toContain('@media (max-width: 480px)')
    expect(html).not.toContain('display:flex')
  })

  it('varias columnas generan ghost tables MSO con widths en px', () => {
    const { doc } = docWith([50, 50], [['heading'], ['text']])
    const html = renderHtml(doc)
    expect(html).toContain('<!--[if mso]>')
    // 50% de 600 = 300px
    expect(html).toContain('width="300"')
    expect((html.match(/class="vmd-col"/g) ?? []).length).toBe(2)
  })

  it('heading escapa el texto y respeta align/color', () => {
    const { doc, row } = docWith([100], [['heading']])
    const h = row.columns[0].blocks[0] as HeadingBlock
    h.text = 'Hola <script>'
    h.style.align = 'center'
    h.style.color = '#ff0000'
    const html = renderHtml(doc)
    expect(html).toContain('Hola &lt;script&gt;')
    expect(html).toContain('text-align:center')
    expect(html).toContain('#ff0000')
  })

  it('text conserva HTML de tiptap y convierte merge tags', () => {
    const { doc, row } = docWith([100], [['text']])
    const t = row.columns[0].blocks[0] as TextBlock
    t.html = '<p>Hola <span data-mt="first_name">Nombre</span>, bienvenido</p>'
    const html = renderHtml(doc)
    expect(html).toContain('{{first_name}}')
    expect(html).not.toContain('data-mt')
  })

  it('snapshot estable de un documento de referencia', () => {
    const { doc } = docWith([33, 34, 33], [['heading'], ['text'], ['text']])
    // ids deterministas para el snapshot
    let n = 0
    const fix = (o: { id: string }) => { o.id = `fix_${n++}` }
    doc.rows.forEach((r) => { fix(r); r.columns.forEach((c) => { fix(c); c.blocks.forEach(fix) }) })
    expect(renderHtml(doc)).toMatchSnapshot()
  })

  it('columnas usan fluid-hybrid sin min-width', () => {
    const { doc } = docWith([33, 34, 33], [['heading'], ['text'], ['text']])
    const html = renderHtml(doc)
    expect(html).not.toContain('min-width')
    expect(html).toContain('max-width:198px')
  })

  it('los widths MSO restan el padding horizontal de la fila', () => {
    const { doc } = docWith([50, 50], [['heading'], ['text']])
    doc.rows[0].style.padding = { top: 0, right: 50, bottom: 0, left: 50 }
    const html = renderHtml(doc)
    // (600 - 100) * 50% = 250
    expect(html).toContain('width="250"')
  })
})
