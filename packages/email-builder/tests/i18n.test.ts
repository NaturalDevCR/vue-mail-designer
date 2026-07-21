import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'

describe('i18n', () => {
  it('por defecto en español', () => {
    const w = mount(EmailBuilder)
    expect(w.find('[data-action="templates"]').text()).toContain('Plantillas')
  })
  it("locale 'en' cambia el chrome a inglés", () => {
    const w = mount(EmailBuilder, { props: { locale: 'en' } })
    expect(w.find('[data-action="templates"]').text()).toContain('Templates')
    expect(w.find('[data-action="export"]').text().toLowerCase()).toContain('export')
  })
  it('objeto parcial sobreescribe solo esas claves', () => {
    const w = mount(EmailBuilder, { props: { locale: { 'header.templates': 'Modelos' } } })
    expect(w.find('[data-action="templates"]').text()).toContain('Modelos')
    // el resto sigue en español
    expect(w.find('[data-action="export"]').text()).toContain('EXPORTAR')
  })
  it('la paleta usa labels traducidos', () => {
    const w = mount(EmailBuilder, { props: { locale: 'en' } })
    const texts = w.findAll('.vmd-content-item').map((i) => i.text())
    expect(texts.some((t) => t.includes('Heading'))).toBe(true)
  })
})
