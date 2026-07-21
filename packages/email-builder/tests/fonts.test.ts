import { describe, expect, it } from 'vitest'
import { DEFAULT_FONTS, usedFontUrls } from '../src/fonts'
import { renderHtml } from '../src/render/html'
import { createBlock, createDocument, createRow } from '../src/schema'
import type { HeadingBlock } from '../src/schema'

describe('fuentes', () => {
  it('DEFAULT_FONTS incluye email-safe y Google Fonts con url', () => {
    expect(DEFAULT_FONTS.some((f) => f.label === 'Arial' && !f.url)).toBe(true)
    expect(DEFAULT_FONTS.some((f) => f.label === 'Roboto' && f.url)).toBe(true)
  })

  it('usedFontUrls solo devuelve las urls de fuentes usadas', () => {
    const doc = createDocument()
    doc.settings.fontFamily = "'Roboto', sans-serif"
    const urls = usedFontUrls(doc, DEFAULT_FONTS)
    expect(urls.some((u) => u.includes('Roboto'))).toBe(true)
    expect(urls.some((u) => u.includes('Lato'))).toBe(false)
  })

  it('renderHtml emite <link> solo para fuentes usadas con url', () => {
    const doc = createDocument()
    const row = createRow([100])
    const h = createBlock('heading') as HeadingBlock
    h.fontFamily = "'Montserrat', sans-serif"
    row.columns[0].blocks.push(h)
    doc.rows.push(row)
    const html = renderHtml(doc)
    expect(html).toContain('fonts.googleapis.com')
    expect(html).toContain('Montserrat')
  })

  it('sin Google Fonts usadas no emite links', () => {
    const html = renderHtml(createDocument())
    expect(html).not.toContain('<link href="https://fonts.googleapis.com')
  })
})
