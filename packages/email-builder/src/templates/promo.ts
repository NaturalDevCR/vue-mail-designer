import { createBlock, createDocument, createRow } from '../schema'
import type { EmailDocument } from '../schema'

export function buildPromo(): EmailDocument {
  const doc = createDocument()

  const hero = createRow([100])
  hero.style.backgroundColor = '#ffffff'
  const title = createBlock('heading')
  if (title.type === 'heading') {
    title.text = '¡Hasta 30% de descuento!'
    title.level = 1
    title.style.align = 'center'
    title.style.fontSize = 36
  }
  hero.columns[0].blocks.push(title)

  const imageRow = createRow([100])
  imageRow.style.backgroundColor = '#ffffff'
  const image = createBlock('image')
  if (image.type === 'image') {
    image.src = ''
    image.alt = 'Oferta especial'
    image.widthPct = 100
  }
  imageRow.columns[0].blocks.push(image)

  const ctaRow = createRow([100])
  ctaRow.style.backgroundColor = '#ffffff'
  const cta = createBlock('button')
  if (cta.type === 'button') {
    cta.label = 'Aprovechar descuento'
    cta.href = 'https://example.com/oferta'
    cta.style.backgroundColor = '#ef4444'
  }
  ctaRow.columns[0].blocks.push(cta)

  doc.rows.push(hero, imageRow, ctaRow)
  return doc
}
