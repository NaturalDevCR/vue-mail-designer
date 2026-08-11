import { describe, expect, it } from 'vitest'
import { BLOCK_TYPES, createBlock, createDocument, createRow, zEmailDocument } from '../src/schema'
import type { GalleryBlock, TableBlock, TimerBlock } from '../src/schema'

describe('schema fase B', () => {
  it('BLOCK_TYPES incluye los 3 nuevos', () => {
    expect(BLOCK_TYPES).toContain('table')
    expect(BLOCK_TYPES).toContain('gallery')
    expect(BLOCK_TYPES).toContain('timer')
    expect(BLOCK_TYPES).toHaveLength(13)
  })

  it('cada bloque nuevo tiene factory válida', () => {
    for (const t of ['table', 'gallery', 'timer'] as const) {
      const doc = createDocument()
      const row = createRow([100])
      row.columns[0].blocks.push(createBlock(t))
      doc.rows.push(row)
      expect(zEmailDocument.safeParse(doc).success, t).toBe(true)
    }
  })

  it('un JSON v1 sin campos nuevos valida (retrocompat)', () => {
    // documento mínimo v1 con una fila/columna/heading SIN hideDesktop/backgroundImage/border/fontFamily
    const v1 = {
      version: 1,
      settings: { contentWidth: 600, backgroundColor: '#fff', fontFamily: 'Arial', preheader: '' },
      rows: [{ id: 'r', style: { backgroundColor: '#fff', padding: { top: 0, right: 0, bottom: 0, left: 0 }, borderRadius: 0 },
        columns: [{ id: 'c', widthPct: 100, style: { backgroundColor: 'transparent', padding: { top: 0, right: 0, bottom: 0, left: 0 } },
          blocks: [{ id: 'b', type: 'heading', text: 'Hi', level: 1, style: { color: '#000', fontSize: 20, align: 'left', padding: { top: 0, right: 0, bottom: 0, left: 0 } } }] }] }],
    }
    expect(zEmailDocument.safeParse(v1).success).toBe(true)
  })

  it('hideDesktop/hideMobile son opcionales en bloque y fila', () => {
    const row = createRow([100])
    row.hideMobile = true
    const block = createBlock('text')
    block.hideDesktop = true
    row.columns[0].blocks.push(block)
    const doc = createDocument()
    doc.rows.push(row)
    expect(zEmailDocument.safeParse(doc).success).toBe(true)
  })

  it('defaults de tabla/galería/timer', () => {
    const table = createBlock('table') as TableBlock
    expect(table.rows.length).toBeGreaterThan(0)
    const gallery = createBlock('gallery') as GalleryBlock
    expect([2, 3, 4]).toContain(gallery.columns)
    const timer = createBlock('timer') as TimerBlock
    expect(typeof timer.endDate).toBe('string')
    expect(timer.style.backgroundColor).toBe('#ffffff')
    expect(timer.style.borderColor).toBe('#e5e7eb')
    expect(timer.style.borderRadius).toBe(12)
    expect(timer.style.numberColor).toBe('#111827')
    expect(timer.style.labelColor).toBe('#718096')
  })
})
