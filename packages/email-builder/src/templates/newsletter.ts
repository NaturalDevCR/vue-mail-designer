import { createBlock, createDocument, createRow } from '../schema'
import type { EmailDocument } from '../schema'

export function buildNewsletter(): EmailDocument {
  const doc = createDocument()

  const header = createRow([100])
  const logo = createBlock('heading')
  if (logo.type === 'heading') {
    logo.text = 'Mi Empresa'
    logo.style.align = 'center'
  }
  header.columns[0].blocks.push(logo)

  const hero = createRow([100])
  hero.style.backgroundColor = '#ffffff'
  const title = createBlock('heading')
  if (title.type === 'heading') {
    title.text = 'Novedades de este mes'
    title.level = 2
  }
  const body = createBlock('text')
  if (body.type === 'text') {
    body.html = '<p>Hola, estas son las noticias más importantes de este mes. Gracias por acompañarnos.</p>'
  }
  const cta = createBlock('button')
  if (cta.type === 'button') cta.label = 'Leer más'
  hero.columns[0].blocks.push(title, body, cta)

  const footer = createRow([100])
  footer.style.backgroundColor = '#f4f4f5'
  const social = createBlock('social')
  const legal = createBlock('text')
  if (legal.type === 'text') {
    legal.html = '<p style="text-align:center;font-size:12px;color:#9ca3af">© 2026 Mi Empresa · <span data-mt="unsubscribe_url">Cancelar suscripción</span></p>'
    legal.style.fontSize = 12
  }
  footer.columns[0].blocks.push(social, legal)

  doc.rows.push(header, hero, footer)
  return doc
}
