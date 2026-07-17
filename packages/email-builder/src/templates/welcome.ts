import { createBlock, createDocument, createRow } from '../schema'
import type { EmailDocument } from '../schema'

export function buildWelcome(): EmailDocument {
  const doc = createDocument()

  const hero = createRow([100])
  hero.style.backgroundColor = '#ffffff'
  const title = createBlock('heading')
  if (title.type === 'heading') {
    title.text = '¡Bienvenido!'
    title.level = 1
    title.style.align = 'center'
  }
  const body = createBlock('text')
  if (body.type === 'text') {
    body.html =
      '<p>Gracias por unirte, <span data-mt="customer_name">amigo</span>. ' +
      'Estamos felices de tenerte con nosotros. Explora todo lo que tenemos para ti.</p>'
  }
  const cta = createBlock('button')
  if (cta.type === 'button') {
    cta.label = 'Empezar'
    cta.align = 'center'
  }
  hero.columns[0].blocks.push(title, body, cta)

  doc.rows.push(hero)
  return doc
}
