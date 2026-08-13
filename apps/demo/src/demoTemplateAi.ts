import {
  createBlock,
  createDocument,
  createRow,
  type AiTemplateProposal,
  type AiTemplateRequest,
  type ButtonBlock,
  type EmailDocument,
  type HeadingBlock,
  type TextBlock,
} from '@naturaldevcr/vue-mail-designer'

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function addDemoSection(document: EmailDocument, index: number, brandName: string): EmailDocument {
  const next = clone(document)
  const row = createRow([100])
  const heading = createBlock('heading') as HeadingBlock
  heading.text = `${brandName} · propuesta ${index}`
  heading.level = 1
  const text = createBlock('text') as TextBlock
  text.html = '<p>Una sección generada localmente para demostrar el flujo de revisión.</p>'
  const button = createBlock('button') as ButtonBlock
  button.label = 'Descubrir más'
  button.href = 'https://example.com'
  row.columns[0].blocks.push(heading, text, button)
  next.rows.push(row)
  return next
}

export async function generateDemoTemplateProposals(request: AiTemplateRequest): Promise<AiTemplateProposal[]> {
  const brandName = String(request.context.brandName ?? 'Vue Mail Designer')
  const base = request.mode === 'edit' && request.currentDesign ? request.currentDesign : createDocument()

  return Array.from({ length: request.count }, (_, index) => ({
    title: `${request.mode === 'edit' ? 'Edición' : 'Nueva plantilla'} ${index + 1}`,
    description: request.mode === 'edit'
      ? 'Conserva el diseño actual y añade una sección de demostración.'
      : 'Empieza con una plantilla sencilla generada sin red.',
    design: addDemoSection(base, index + 1, brandName),
  }))
}
