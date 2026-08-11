import { mount } from '@vue/test-utils'
import { defineComponent } from 'vue'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import { en } from '../src/i18n/en'
import { es } from '../src/i18n/es'
import { useI18n } from '../src/i18n/useI18n'

describe('i18n', () => {
  it('defaults to English', () => {
    const w = mount(EmailBuilder)
    expect(w.find('[data-action="templates"]').text()).toContain('Templates')
  })
  it("locale 'en' cambia el chrome a inglés", () => {
    const w = mount(EmailBuilder, { props: { locale: 'en' } })
    expect(w.find('[data-action="templates"]').text()).toContain('Templates')
    expect(w.find('[data-action="export"]').text().toLowerCase()).toContain('export')
  })
  it('uses English as the fallback for a partial custom dictionary', () => {
    const w = mount(EmailBuilder, { props: { locale: { 'rail.images': 'Assets' } } })
    expect(w.find('[data-tab="images"]').text()).toContain('Assets')
    expect(w.text()).toContain('Content')
  })
  it('renders Spanish when explicitly selected', () => {
    const w = mount(EmailBuilder, { props: { locale: 'es' } })
    expect(w.find('[data-tab="images"]').text()).toContain('Imágenes')
  })
  it('objeto parcial sobreescribe solo esas claves', () => {
    const w = mount(EmailBuilder, { props: { locale: { 'header.templates': 'Modelos' } } })
    expect(w.find('[data-action="templates"]').text()).toContain('Modelos')
    // the rest keeps the English fallback
    expect(w.find('[data-action="export"]').text()).toContain('EXPORT')
  })
  it('la paleta usa labels traducidos', () => {
    const w = mount(EmailBuilder, { props: { locale: 'en' } })
    const texts = w.findAll('.vmd-content-item').map((i) => i.text())
    expect(texts.some((t) => t.includes('Heading'))).toBe(true)
  })
  it('keeps Spanish and English dictionaries aligned', () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort())
  })
})

describe('i18n reactividad', () => {
  it('cambiar la prop locale en caliente actualiza el chrome', async () => {
    const w = mount(EmailBuilder, { props: { locale: 'es' } })
    expect(w.find('[data-action="templates"]').text()).toContain('Plantillas')
    await w.setProps({ locale: 'en' })
    expect(w.find('[data-action="templates"]').text()).toContain('Templates')
  })
})

describe('useI18n fallback', () => {
  it('defaults to English locale outside EmailBuilder provider', () => {
    const Probe = defineComponent({
      setup() {
        return useI18n()
      },
      template: '<output>{{ locale }}|{{ t("missing.key") }}</output>',
    })

    const w = mount(Probe)
    expect(w.text()).toBe('en|missing.key')
  })
})
