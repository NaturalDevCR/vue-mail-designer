import { describe, expect, it } from 'vitest'
import { parseShorthandPadding, stripTags, unlayerToDocument } from '../src/import/unlayer'
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

describe('conversor robusto', () => {
  it('cells [0, 100] no lanza y clampea la columna de peso 0 a widthPct 5', () => {
    const d = { rows: [{ cells: [0, 100], values: {}, columns: [
      { values: {}, contents: [] },
      { values: {}, contents: [] },
    ] }], values: {} }
    const { document } = unlayerToDocument(d)
    expect(zEmailDocument.safeParse(document).success).toBe(true)
    expect(document.rows[0].columns[0].widthPct).toBe(5)
  })

  it('21 celdas iguales no lanza y produce un doc válido', () => {
    const cells = Array.from({ length: 21 }, () => 1)
    const d = { rows: [{ cells, values: {}, columns: cells.map(() => ({ values: {}, contents: [] })) }], values: {} }
    const { document } = unlayerToDocument(d)
    expect(zEmailDocument.safeParse(document).success).toBe(true)
    expect(document.rows[0].columns).toHaveLength(21)
  })

  it('cells como strings ["50","50"] no lanza y cae a anchos iguales', () => {
    const d = { rows: [{ cells: ['50', '50'], values: {}, columns: [
      { values: {}, contents: [] },
      { values: {}, contents: [] },
    ] }], values: {} }
    const { document } = unlayerToDocument(d)
    expect(zEmailDocument.safeParse(document).success).toBe(true)
    expect(document.rows[0].columns.map((c) => c.widthPct)).toEqual([50, 50])
  })

  it('divisor con width 0% no lanza y clampea widthPct a 10', () => {
    const d = { rows: [{ cells: [1], values: {}, columns: [{ values: {}, contents: [
      { type: 'divider', values: { width: '0%', border: { borderTopColor: '#000', borderTopWidth: '1px' }, containerPadding: '0px' } },
    ] }] }], values: {} }
    const { document } = unlayerToDocument(d)
    expect(zEmailDocument.safeParse(document).success).toBe(true)
    const block = document.rows[0].columns[0].blocks[0]
    expect(block.type === 'divider' && block.style.widthPct).toBe(10)
  })

  it('stripTags decodifica entidades en una sola pasada sin residuo', () => {
    expect(stripTags('Hola&nbsp;&amp;nbsp;mundo')).toBe('Hola &nbsp;mundo')
  })

  it('borde de columna con solo el lado superior no dispara advertencia de lados distintos', () => {
    const d = { rows: [{ cells: [1], values: {}, columns: [{
      values: { border: { borderTopColor: '#ae2328', borderTopStyle: 'solid', borderTopWidth: '5px' } },
      contents: [],
    }] }], values: {} }
    const { document, warnings } = unlayerToDocument(d)
    expect(warnings.some((w) => w.includes('colapsados'))).toBe(false)
    expect(document.rows[0].columns[0].style.border).toEqual({ width: 5, style: 'solid', color: '#ae2328' })
  })

  it('borde de columna con lados genuinamente distintos dispara advertencia', () => {
    const d = { rows: [{ cells: [1], values: {}, columns: [{
      values: { border: { borderTopColor: '#ae2328', borderTopWidth: '5px', borderRightWidth: '1px' } },
      contents: [],
    }] }], values: {} }
    const { warnings } = unlayerToDocument(d)
    expect(warnings.some((w) => w.includes('colapsados'))).toBe(true)
  })
})

it('social mapea íconos por nombre a nuestras redes', () => {
  const d = { rows: [{ cells: [1], values: {}, columns: [{ values: {}, contents: [
    { type: 'social', values: { align: 'center', spacing: 12, icons: { icons: [
      { url: 'https://facebook.com/x', name: 'Facebook' },
      { url: 'https://twitter.com/x', name: 'Twitter' },
      { url: 'https://unknown.com/x', name: 'Threads' },
    ] } } },
  ] }] }], values: {} }
  const { document } = unlayerToDocument(d)
  const b = document.rows[0].columns[0].blocks[0]
  expect(b.type).toBe('social')
  if (b.type === 'social') {
    expect(b.networks.map((n) => n.kind)).toEqual(['facebook', 'x', 'web'])
    expect(b.networks[0].url).toBe('https://facebook.com/x')
  }
})

it('advierte sobre _override, displayCondition y fuentes de Google', () => {
  const d = { rows: [{ cells: [1], values: { displayCondition: { type: 'x' } }, columns: [{ values: {}, contents: [
    { type: 'text', values: { text: '<p>hi</p>', _override: { mobile: { containerPadding: '5px' } }, fontFamily: { value: 'Roboto', url: 'https://fonts.googleapis.com/x' } } },
  ] }] }], values: {} }
  const { warnings } = unlayerToDocument(d)
  expect(warnings.some((w) => w.toLowerCase().includes('móviles'))).toBe(true)
  expect(warnings.some((w) => w.toLowerCase().includes('visualización'))).toBe(true)
  expect(warnings.some((w) => w.toLowerCase().includes('fuentes'))).toBe(true)
})
