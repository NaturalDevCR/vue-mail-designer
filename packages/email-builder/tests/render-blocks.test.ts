import { describe, expect, it } from 'vitest'
import { renderHtml } from '../src/render/html'
import { createBlock, createDocument, createRow } from '../src/schema'
import type { Block, ButtonBlock, DividerBlock, ImageBlock, SpacerBlock } from '../src/schema'

function render(block: Block): string {
  const doc = createDocument()
  const row = createRow([100])
  row.columns[0].blocks.push(block)
  doc.rows.push(row)
  return renderHtml(doc)
}

describe('renderBlock — bloques básicos', () => {
  it('image: display:block, alt escapado y link opcional', () => {
    const img = createBlock('image') as ImageBlock
    img.src = 'https://cdn.example.com/a.png'
    img.alt = 'Logo & marca'
    img.href = 'https://example.com'
    const html = render(img)
    expect(html).toContain('display:block')
    expect(html).toContain('alt="Logo &amp; marca"')
    expect(html).toContain('<a href="https://example.com"')
  })

  it('image sin src renderiza celda vacía sin <img>', () => {
    const img = createBlock('image') as ImageBlock
    const html = render(img)
    expect(html).not.toContain('<img')
  })

  it('image: aplica border-radius al <img> cuando está definido', () => {
    const img = createBlock('image') as ImageBlock
    img.src = 'https://cdn.example.com/a.png'
    img.borderRadius = 12
    const html = render(img)
    expect(html).toContain('border-radius:12px')
  })

  it('button: tabla anidada bulletproof con estilos inline', () => {
    const btn = createBlock('button') as ButtonBlock
    btn.label = 'Comprar <ya>'
    btn.href = 'https://example.com/buy'
    btn.style.backgroundColor = '#16a34a'
    const html = render(btn)
    expect(html).toContain('Comprar &lt;ya&gt;')
    expect(html).toContain('background-color:#16a34a')
    expect(html).toContain('href="https://example.com/buy"')
    // bulletproof: el <a> vive dentro de una celda con bg, no es un <a> suelto con display:block
    expect(html).toMatch(/<td[^>]*background-color:#16a34a[^>]*>\s*<a/)
  })

  it('divider: hr como borde de celda con ancho porcentual', () => {
    const div = createBlock('divider') as DividerBlock
    div.style.widthPct = 50
    div.style.thickness = 3
    div.style.color = '#000000'
    const html = render(div)
    expect(html).toContain('border-top:3px solid #000000')
    expect(html).toContain('width="50%"')
  })

  it('spacer: celda con altura fija', () => {
    const sp = createBlock('spacer') as SpacerBlock
    sp.height = 40
    const html = render(sp)
    expect(html).toContain('height:40px')
  })
})
