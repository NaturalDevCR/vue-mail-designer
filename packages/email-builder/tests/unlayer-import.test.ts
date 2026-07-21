import { describe, expect, it } from 'vitest'
import { parseShorthandPadding, unlayerToDocument } from '../src/import/unlayer'
import { zEmailDocument } from '../src/schema'

describe('parseShorthandPadding', () => {
  it('1/2/4 valores', () => {
    expect(parseShorthandPadding('10px')).toEqual({ top: 10, right: 10, bottom: 10, left: 10 })
    expect(parseShorthandPadding('10px 20px')).toEqual({ top: 10, right: 20, bottom: 10, left: 20 })
    expect(parseShorthandPadding('5px 10px 15px 20px')).toEqual({ top: 5, right: 10, bottom: 15, left: 20 })
    expect(parseShorthandPadding(undefined)).toEqual({ top: 0, right: 0, bottom: 0, left: 0 })
  })
})

const design = {
  body: {
    values: { contentWidth: '600px', backgroundColor: '#f1f1ec', contentAlign: 'center',
      fontFamily: { value: "'Raleway',sans-serif" }, preheaderText: 'Hola' },
    rows: [
      { cells: [1], values: { backgroundColor: '#ffffff', padding: '0px', hideDesktop: false },
        columns: [{ values: { backgroundColor: '#ffffff', padding: '0px', borderRadius: '0px' }, contents: [
          { type: 'heading', values: { text: '<strong>Título</strong>', headingType: 'h2', fontSize: '26px', textAlign: 'left', containerPadding: '10px 20px', fontFamily: { value: 'Georgia' } } },
          { type: 'text', values: { text: '<p>Hola <a href="#">link</a></p>', fontSize: '14px', lineHeight: '140%', textAlign: 'left', containerPadding: '10px 60px' } },
          { type: 'button', values: { text: '<span>Comprar</span>', href: { values: { href: 'https://x.com', target: '_blank' } }, buttonColors: { color: '#fff', backgroundColor: '#ae2328' }, borderRadius: '4px', padding: '10px 20px', fontSize: '14px', textAlign: 'center', containerPadding: '10px' } },
          { type: 'divider', values: { width: '20%', border: { borderTopColor: '#ae2328', borderTopStyle: 'solid', borderTopWidth: '5px' }, containerPadding: '5px 20px' } },
          { type: 'image', values: { src: { url: 'https://cdn.templates.unlayer.com/a.png' }, altText: 'foto', action: { values: { href: 'https://y.com' } }, textAlign: 'center', containerPadding: '0px' } },
          { type: 'html', values: { html: '<div>crudo</div>' } },
        ] }] },
      { cells: [60, 40], values: { padding: '0px' }, columns: [
        { values: { padding: '0px' }, contents: [] },
        { values: { padding: '0px' }, contents: [] },
      ] },
    ],
  },
}

describe('unlayerToDocument', () => {
  it('mapea settings, filas, columnas y bloques comunes; valida el schema', () => {
    const { document } = unlayerToDocument(design)
    expect(zEmailDocument.safeParse(document).success).toBe(true)
    expect(document.settings.contentWidth).toBe(600)
    expect(document.settings.fontFamily).toBe("'Raleway',sans-serif")
    expect(document.settings.preheader).toBe('Hola')
    expect(document.settings.contentAlignment).toBe('center')

    const r0 = document.rows[0]
    const blocks = r0.columns[0].blocks
    expect(blocks.map((b) => b.type)).toEqual(['heading', 'text', 'button', 'divider', 'image', 'html'])
    const heading = blocks[0]
    expect(heading.type === 'heading' && heading.level).toBe(2)
    expect(heading.type === 'heading' && heading.text).toBe('Título') // tags eliminadas
    expect(heading.type === 'heading' && heading.fontFamily).toBe('Georgia')
    const button = blocks[2]
    expect(button.type === 'button' && button.label).toBe('Comprar')
    expect(button.type === 'button' && button.href).toBe('https://x.com')
    expect(button.type === 'button' && button.style.backgroundColor).toBe('#ae2328')
    const image = blocks[4]
    expect(image.type === 'image' && image.src).toBe('https://cdn.templates.unlayer.com/a.png')
    expect(image.type === 'image' && image.href).toBe('https://y.com')

    // fila 2: dos columnas con ratios 60/40
    expect(document.rows[1].columns.map((c) => c.widthPct)).toEqual([60, 40])
  })

  it('nota legal sobre imágenes de Unlayer cuando hay cdn.templates.unlayer.com', () => {
    const { warnings } = unlayerToDocument(design)
    expect(warnings.some((w) => w.toLowerCase().includes('imágenes') && w.includes('Unlayer'))).toBe(true)
  })

  it('tipo desconocido genera advertencia y se omite', () => {
    const d = { rows: [{ cells: [1], values: {}, columns: [{ values: {}, contents: [{ type: 'carousel', values: {} }] }] }], values: {} }
    const { document, warnings } = unlayerToDocument(d)
    expect(document.rows[0].columns[0].blocks).toHaveLength(0)
    expect(warnings.some((w) => w.includes('carousel'))).toBe(true)
  })

  it('JSON irreconocible lanza error legible', () => {
    expect(() => unlayerToDocument({ foo: 1 })).toThrow(/Unlayer/)
  })
})
