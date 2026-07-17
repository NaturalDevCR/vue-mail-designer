import { createBlock, createDocument, createRow } from '../schema'
import type { EmailDocument } from '../schema'

export function buildTransactional(): EmailDocument {
  const doc = createDocument()

  const header = createRow([100])
  header.style.backgroundColor = '#ffffff'
  const title = createBlock('heading')
  if (title.type === 'heading') {
    title.text = 'Confirmación de pedido'
    title.level = 2
  }
  header.columns[0].blocks.push(title)

  const details = createRow([100])
  details.style.backgroundColor = '#ffffff'
  const info = createBlock('text')
  if (info.type === 'text') {
    info.html =
      '<p>Pedido #<span data-mt="order_id">12345</span><br>' +
      'Fecha: <span data-mt="order_date">17/07/2026</span><br>' +
      'Cliente: <span data-mt="customer_name">Nombre del cliente</span></p>'
  }
  const divider = createBlock('divider')
  const total = createBlock('text')
  if (total.type === 'text') {
    total.html = '<p><strong>Total: <span data-mt="order_total">$0.00</span></strong></p>'
  }
  details.columns[0].blocks.push(info, divider, total)

  doc.rows.push(header, details)
  return doc
}
