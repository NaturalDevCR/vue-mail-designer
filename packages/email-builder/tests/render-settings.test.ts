import { describe, expect, it } from 'vitest'
import { renderHtml } from '../src/render/html'
import { createBlock, createDocument, createRow, zEmailDocument } from '../src/schema'
import type { TextBlock } from '../src/schema'

describe('settings nuevos', () => {
  it('JSON v1 sin los campos nuevos valida y recibe defaults', () => {
    const doc = createDocument() as Record<string, unknown>
    const settings = { ...(doc.settings as Record<string, unknown>) }
    delete settings.contentAlignment
    delete settings.linkColor
    delete settings.linkUnderline
    const result = zEmailDocument.safeParse({ ...doc, settings })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.settings.contentAlignment).toBe('center')
      expect(result.data.settings.linkColor).toBe('#3b82f6')
      expect(result.data.settings.linkUnderline).toBe(true)
    }
  })

  it('contentAlignment controla el align del contenedor', () => {
    const doc = createDocument()
    doc.settings.contentAlignment = 'left'
    expect(renderHtml(doc)).toContain('<td align="left"')
    doc.settings.contentAlignment = 'center'
    expect(renderHtml(doc)).toContain('<td align="center"')
  })

  it('links de texto reciben color y subrayado inline', () => {
    const doc = createDocument()
    const row = createRow([100])
    const text = createBlock('text') as TextBlock
    text.html = '<p>Ver <a href="https://example.com">oferta</a></p>'
    row.columns[0].blocks.push(text)
    doc.rows.push(row)
    doc.settings.linkColor = '#ff0000'
    doc.settings.linkUnderline = false
    const html = renderHtml(doc)
    expect(html).toContain('<a style="color:#ff0000;text-decoration:none;" href="https://example.com">')
  })
})
