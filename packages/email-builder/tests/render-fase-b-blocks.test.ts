import { describe, expect, it } from 'vitest'
import { renderHtml } from '../src/render/html'
import { createBlock, createDocument, createRow } from '../src/schema'
import type { Block, GalleryBlock, TableBlock, TimerBlock } from '../src/schema'

function render(block: Block): string {
  const doc = createDocument(); const row = createRow([100])
  row.columns[0].blocks.push(block); doc.rows.push(row)
  return renderHtml(doc)
}

describe('renderer fase B — bloques nuevos', () => {
  it('tabla con header usa th y escapa celdas', () => {
    const t = createBlock('table') as TableBlock
    t.rows = [['A & B', 'C'], ['<x>', 'y']]; t.headerRow = true
    const html = render(t)
    expect(html).toContain('<th')
    expect(html).toContain('A &amp; B')
    expect(html).toContain('&lt;x&gt;')
  })

  it('tabla sin header solo td', () => {
    const t = createBlock('table') as TableBlock
    t.headerRow = false
    expect(render(t)).not.toContain('<th')
  })

  it('galería renderiza N imágenes en filas de `columns`', () => {
    const g = createBlock('gallery') as GalleryBlock
    g.columns = 2
    g.images = [
      { src: 'https://x/1.jpg', alt: 'uno' }, { src: 'https://x/2.jpg', alt: 'dos' },
      { src: 'https://x/3.jpg', alt: 'tres' },
    ]
    const html = render(g)
    expect((html.match(/<img/g) ?? []).length).toBe(3)
    expect(html).toContain('https://x/2.jpg')
  })

  it('timer con imageUrl renderiza img linkeable', () => {
    const t = createBlock('timer') as TimerBlock
    t.imageUrl = 'https://timers.x/abc.gif'
    const html = render(t)
    expect(html).toContain('src="https://timers.x/abc.gif"')
  })

  it('timer sin imageUrl renderiza caja estática con días restantes', () => {
    const t = createBlock('timer') as TimerBlock
    t.imageUrl = ''
    t.endDate = new Date(Date.now() + 3 * 864e5).toISOString()
    const html = render(t)
    expect(html).toMatch(/vmd-timer-static/)
  })
})
