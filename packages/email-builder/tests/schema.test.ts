import { describe, expect, it } from 'vitest'
import {
  BLOCK_TYPES,
  createBlock,
  createDocument,
  createId,
  createRow,
  zEmailDocument,
} from '../src/schema'

describe('schema', () => {
  it('createId genera ids únicos con prefijo', () => {
    const a = createId('row')
    const b = createId('row')
    expect(a).toMatch(/^row_/)
    expect(a).not.toBe(b)
  })

  it('createDocument produce un documento válido según zod', () => {
    const doc = createDocument()
    expect(doc.rows).toEqual([])
    expect(doc.settings.contentWidth).toBe(600)
    expect(() => zEmailDocument.parse(doc)).not.toThrow()
  })

  it('createRow reparte columnas según widths', () => {
    const row = createRow([33, 34, 33])
    expect(row.columns).toHaveLength(3)
    expect(row.columns.map((c) => c.widthPct)).toEqual([33, 34, 33])
  })

  it('cada tipo de bloque tiene factory válida', () => {
    for (const type of BLOCK_TYPES) {
      const doc = createDocument()
      const row = createRow([100])
      row.columns[0].blocks.push(createBlock(type))
      doc.rows.push(row)
      const result = zEmailDocument.safeParse(doc)
      expect(result.success, `bloque ${type} inválido`).toBe(true)
    }
  })

  it('rechaza documentos malformados', () => {
    expect(zEmailDocument.safeParse({ rows: 'nope' }).success).toBe(false)
    expect(
      zEmailDocument.safeParse({
        version: 1,
        settings: {},
        rows: [{ id: 'x', style: {}, columns: [{ id: 'c', widthPct: 100, style: {}, blocks: [{ type: 'inexistente', id: 'b' }] }] }],
      }).success,
    ).toBe(false)
  })
})
