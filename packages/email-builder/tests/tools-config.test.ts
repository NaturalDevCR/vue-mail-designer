import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import { createBlock, createDocument, createRow } from '../src/schema'

describe('config de herramientas (tools)', () => {
  it('enabled:false oculta el bloque de la paleta', () => {
    const w = mount(EmailBuilder, { props: { tools: { html: { enabled: false } } } })
    const items = w.findAll('.vmd-content-item').map((i) => i.text())
    expect(items).toHaveLength(12)
    expect(items.some((t) => t.includes('HTML'))).toBe(false)
  })

  it('position reordena la paleta', () => {
    const w = mount(EmailBuilder, { props: { tools: { image: { position: 0 } } } })
    const first = w.findAll('.vmd-content-item')[0].text()
    expect(first).toContain('Imagen')
  })

  it('usageLimit deshabilita el ítem cuando el documento alcanza el límite', () => {
    const design = createDocument()
    const row = createRow([100])
    row.columns[0].blocks.push(createBlock('html'))
    design.rows.push(row)
    const w = mount(EmailBuilder, { props: { design, tools: { html: { usageLimit: 1 } } } })
    const htmlItem = w.findAll('.vmd-content-item').find((i) => i.text().includes('HTML'))
    expect(htmlItem?.classes()).toContain('vmd-content-item--disabled')
  })

  it('sin tools, todos los 13 bloques aparecen', () => {
    const w = mount(EmailBuilder)
    expect(w.findAll('.vmd-content-item')).toHaveLength(13)
  })
})
