import { describe, expect, it } from 'vitest'
import { createCustomBlock, createDocument, createRow, zEmailDocument } from '../src/schema'
import { renderHtml } from '../src/render/html'
import type { CustomBlockDef } from '../src/options'

const def: CustomBlockDef = {
  type: 'promo',
  label: 'Promo',
  defaultData: { text: 'Oferta', color: '#ff0000' },
  fields: [
    { key: 'text', label: 'Texto', type: 'text' },
    { key: 'color', label: 'Color', type: 'color' },
  ],
  render: (data) => `<div style="color:${data.color}">${data.text}</div>`,
}

describe('bloques personalizados', () => {
  it('createCustomBlock produce un bloque válido y clona la data', () => {
    const b = createCustomBlock(def.type, def.defaultData)
    expect(b.type).toBe('custom')
    expect(b.customType).toBe('promo')
    expect(b.data.text).toBe('Oferta')
    b.data.text = 'otro'
    expect(def.defaultData.text).toBe('Oferta') // no muta el default
  })

  it('renderHtml con registry llama al render del bloque', () => {
    const doc = createDocument()
    const row = createRow([100])
    row.columns[0].blocks.push(createCustomBlock(def.type, def.defaultData))
    doc.rows.push(row)
    expect(zEmailDocument.safeParse(doc).success).toBe(true)
    const html = renderHtml(doc, undefined, [def])
    expect(html).toContain('<div style="color:#ff0000">Oferta</div>')
  })

  it('sin registro emite un comentario placeholder, no rompe', () => {
    const doc = createDocument()
    const row = createRow([100])
    row.columns[0].blocks.push(createCustomBlock('desconocido', {}))
    doc.rows.push(row)
    const html = renderHtml(doc, undefined, [])
    expect(html).toContain('sin registrar')
  })
})
