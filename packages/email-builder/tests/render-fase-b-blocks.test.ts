import { describe, expect, it } from 'vitest'
import { renderHtml } from '../src/render/html'
import { createBlock, createDocument, createRow } from '../src/schema'
import type { TimerImageUrlBuilder } from '../src/options'
import type { Block, GalleryBlock, TableBlock, TimerBlock } from '../src/schema'

function render(block: Block, timerImageUrlBuilder?: TimerImageUrlBuilder): string {
  const doc = createDocument(); const row = createRow([100])
  row.columns[0].blocks.push(block); doc.rows.push(row)
  return renderHtml(doc, undefined, undefined, timerImageUrlBuilder)
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

  it('galería de 3 columnas apila en mobile via clase vmd-gallery-cell', () => {
    const g = createBlock('gallery') as GalleryBlock
    g.columns = 3
    g.images = [
      { src: 'https://x/1.jpg', alt: 'uno' }, { src: 'https://x/2.jpg', alt: 'dos' },
      { src: 'https://x/3.jpg', alt: 'tres' },
    ]
    const html = render(g)
    expect(html).toContain('vmd-gallery-cell')
    expect(html).toMatch(/@media \(max-width: 480px\)[\s\S]*\.vmd-gallery-cell\s*\{\s*display:\s*block\s*!important;\s*width:\s*100%\s*!important;\s*\}/)
  })

  it('timer con imageUrl renderiza img linkeable', () => {
    const t = createBlock('timer') as TimerBlock
    t.imageUrl = 'https://timers.x/abc.gif'
    const html = render(t)
    expect(html).toContain('src="https://timers.x/abc.gif"')
  })

  it('uses the configured timer image builder when the block has no image URL', () => {
    const t = createBlock('timer') as TimerBlock
    t.imageUrl = ''
    const html = render(t, () => 'https://timers.example/countdown.gif?end=1')
    expect(html).toContain('src="https://timers.example/countdown.gif?end=1"')
  })

  it('prefers an explicit timer image URL over the configured builder', () => {
    const t = createBlock('timer') as TimerBlock
    t.imageUrl = 'https://timers.example/explicit.gif'
    const html = render(t, () => 'https://timers.example/generated.gif')
    expect(html).toContain('src="https://timers.example/explicit.gif"')
    expect(html).not.toContain('https://timers.example/generated.gif')
  })

  it('timer sin imageUrl renderiza caja estática con días restantes', () => {
    const t = createBlock('timer') as TimerBlock
    t.imageUrl = ''
    t.endDate = new Date(Date.now() + 3 * 864e5).toISOString()
    t.style.backgroundColor = '#111827'
    t.style.borderColor = '#f97316'
    t.style.borderWidth = 2
    t.style.borderRadius = 24
    t.style.numberColor = '#f97316'
    t.style.labelColor = '#fef3c7'
    t.style.fontFamily = 'Georgia, serif'
    t.labels = { days: 'D', hours: 'H', minutes: 'M', seconds: 'S' }
    const html = render(t)
    expect(html).toMatch(/vmd-timer-static/)
    expect(html).toContain('vmd-timer-unit')
    expect(html).toContain('>H</span>')
    expect(html).toContain('>M</span>')
    expect(html).toContain('>S</span>')
    expect(html).toContain('background-color:#111827')
    expect(html).toContain('border:2px solid #f97316')
    expect(html).toContain('border-radius:24px')
    expect(html).toContain('font-family:Georgia, serif')
    expect(html).toContain('>D</span>')
  })
})
