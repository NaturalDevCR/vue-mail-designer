import { describe, expect, it } from 'vitest'
import { renderHtml } from '../src/render/html'
import { createBlock, createDocument, createRow } from '../src/schema'
import type { HeadingBlock } from '../src/schema'

function docWith(build: (doc: ReturnType<typeof createDocument>) => void) {
  const doc = createDocument()
  build(doc)
  return renderHtml(doc)
}

describe('renderer fase B — props ricas', () => {
  it('hideMobile emite la clase y la media query', () => {
    const html = docWith((doc) => {
      const row = createRow([100])
      const b = createBlock('text'); b.hideMobile = true
      row.columns[0].blocks.push(b); doc.rows.push(row)
    })
    expect(html).toContain('vmd-hide-mobile')
    expect(html).toContain('.vmd-hide-mobile')
    expect(html).toMatch(/@media[^}]*max-width:\s*480px/)
  })

  it('hideDesktop emite inline display:none y regla de reaparición', () => {
    const html = docWith((doc) => {
      const row = createRow([100])
      const b = createBlock('text'); b.hideDesktop = true
      row.columns[0].blocks.push(b); doc.rows.push(row)
    })
    expect(html).toContain('vmd-hide-desktop')
    expect(html).toMatch(/vmd-hide-desktop[^>]*display:none/)
    expect(html).toContain('display:block !important')
  })

  it('fila con imagen de fondo emite background y estilos', () => {
    const html = docWith((doc) => {
      const row = createRow([100])
      row.style.backgroundImage = { url: 'https://cdn.x/bg.jpg', repeat: 'no-repeat', size: 'cover', position: 'center' }
      doc.rows.push(row)
    })
    expect(html).toContain('background="https://cdn.x/bg.jpg"')
    expect(html).toContain('background-image:url(https://cdn.x/bg.jpg)')
    expect(html).toContain('background-size:cover')
  })

  it('columna con borde y radio', () => {
    const html = docWith((doc) => {
      const row = createRow([100])
      row.columns[0].style.border = { width: 2, style: 'solid', color: '#ff0000' }
      row.columns[0].style.borderRadius = 8
      doc.rows.push(row)
    })
    expect(html).toContain('border:2px solid #ff0000')
    expect(html).toContain('border-radius:8px')
  })

  it('fuente por bloque sobreescribe la del documento', () => {
    const html = docWith((doc) => {
      const row = createRow([100])
      const h = createBlock('heading') as HeadingBlock; h.fontFamily = 'Georgia, serif'
      row.columns[0].blocks.push(h); doc.rows.push(row)
    })
    expect(html).toContain('font-family:Georgia, serif')
  })
})

describe('fondo del cuerpo (settings.backgroundImage)', () => {
  it('emite background image en el body y valida retrocompat sin el campo', () => {
    const doc = createDocument()
    doc.settings.backgroundImage = { url: 'https://cdn.x/bg.jpg', repeat: 'repeat', size: 'contain', position: 'top' }
    const html = renderHtml(doc)
    expect(html).toContain('background="https://cdn.x/bg.jpg"')
    expect(html).toContain('background-image:url(https://cdn.x/bg.jpg)')
    expect(html).toContain('background-size:contain')
  })
})
