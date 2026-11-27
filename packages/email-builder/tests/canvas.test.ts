import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import { createBlock, createDocument, createRow } from '../src/schema'

describe('paleta y canvas', () => {
  it('only undoes edits in the builder whose canvas is focused', async () => {
    const first = mount(EmailBuilder, { attachTo: document.body })
    const second = mount(EmailBuilder, { attachTo: document.body })

    try {
      await first.get('.vmd-canvas-empty button').trigger('click')
      await second.get('.vmd-canvas-empty button').trigger('click')
      second.get<HTMLElement>('.vmd-canvas').element.focus()
      document.activeElement?.dispatchEvent(new KeyboardEvent('keydown', { ctrlKey: true, key: 'z', bubbles: true, cancelable: true }))
      await second.vm.$nextTick()

      expect(first.findAll('.vmd-row')).toHaveLength(1)
      expect(second.find('.vmd-canvas-empty').exists()).toBe(true)
    } finally {
      first.unmount()
      second.unmount()
    }
  })

  it('adds a content block with a button and undoes the new row in one step', async () => {
    const wrapper = mount(EmailBuilder)
    const button = wrapper.get('button.vmd-content-item[aria-label="Heading"]')
    await button.trigger('click')

    expect(wrapper.findAll('.vmd-row')).toHaveLength(1)
    expect(wrapper.findAll('.vmd-block')).toHaveLength(1)
    await wrapper.get('[data-action="undo"]').trigger('click')
    expect(wrapper.find('.vmd-canvas-empty').exists()).toBe(true)
    wrapper.unmount()
  })

  it('adds the chosen column layout without dragging it', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.get('[data-tab="blocks"]').trigger('click')
    const layout = wrapper.findAll('button.vmd-layout-thumb').find((item) => item.findAll('.vmd-layout-cell').length === 2)
    expect(layout).toBeDefined()
    await layout!.trigger('click')

    expect(wrapper.findAll('.vmd-column')).toHaveLength(2)
    wrapper.unmount()
  })

  it('canvas vacío muestra hint; agregar fila renderiza RowView con columnas', async () => {
    const wrapper = mount(EmailBuilder)
    expect(wrapper.find('.vmd-canvas-empty').exists()).toBe(true)
    // botón de "agregar fila" del empty state agrega una fila 100%
    await wrapper.find('.vmd-canvas-empty button').trigger('click')
    expect(wrapper.find('.vmd-row').exists()).toBe(true)
    expect(wrapper.findAll('.vmd-column')).toHaveLength(1)
  })

  it('click en fila la selecciona visualmente', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('.vmd-canvas-empty button').trigger('click')
    await wrapper.find('.vmd-row').trigger('click')
    expect(wrapper.find('.vmd-row.vmd-selected').exists()).toBe(true)
  })

  it('dibuja el fondo del cuerpo en todo el ancho de la superficie del correo', () => {
    const design = createDocument()
    design.settings.backgroundColor = '#223355'
    design.settings.backgroundImage = {
      url: 'https://example.com/body.png', size: 'contain', position: 'left top', repeat: 'repeat-y', fullWidth: false,
    }
    const wrapper = mount(EmailBuilder, { props: { design } })
    const body = wrapper.get<HTMLElement>('.vmd-canvas-body-bg').element.style
    expect(body.width).toBe('')
    expect(body.backgroundColor).toBe('rgb(34, 51, 85)')
    expect(body.backgroundImage).toContain('/body.png')
    expect(body.backgroundSize).toBe('contain')
    expect(body.backgroundPosition).toBe('left top')
    expect(body.backgroundRepeat).toBe('repeat-y')
    wrapper.unmount()
  })

  it('separa el fondo exterior de una fila y su contenido alineado, con padding y borde redondeado', () => {
    const design = createDocument()
    design.settings.contentWidth = 601
    design.settings.contentAlignment = 'left'
    const row = createRow([50, 50])
    row.style.backgroundColor = '#223355'
    row.style.contentBackgroundColor = '#ffeedd'
    row.style.padding = { top: 12, right: 16, bottom: 20, left: 24 }
    row.style.borderRadius = 8
    row.style.backgroundImage = {
      url: 'https://example.com/row.png', size: 'cover', position: 'center', repeat: 'no-repeat', fullWidth: true,
    }
    const constrained = createRow([100])
    constrained.style.backgroundImage = { ...row.style.backgroundImage, url: 'https://example.com/content.png', fullWidth: false }
    design.rows.push(row, constrained)
    const wrapper = mount(EmailBuilder, { props: { design } })
    const [fullRow, contentRow] = wrapper.findAll<HTMLElement>('.vmd-row')
    const fullStyle = fullRow.element.style
    const innerStyle = fullRow.get<HTMLElement>('.vmd-row-inner').element.style

    expect(fullStyle.backgroundColor).toBe('rgb(34, 51, 85)')
    expect(fullStyle.backgroundImage).toContain('/row.png')
    expect(innerStyle.backgroundColor).toBe('rgb(255, 238, 221)')
    expect(innerStyle.backgroundImage).toBe('')
    expect(innerStyle.maxWidth).toBe('601px')
    expect(innerStyle.marginLeft).toBe('0px')
    expect(innerStyle.padding).toBe('12px 16px 20px 24px')
    expect(innerStyle.borderRadius).toBe('8px')
    expect(contentRow.element.style.backgroundImage).toBe('')
    expect(contentRow.get<HTMLElement>('.vmd-row-inner').element.style.backgroundImage).toContain('/content.png')
    wrapper.unmount()
  })

  it('simula el ancho móvil y apila las columnas sin cambiar el ancho del documento', async () => {
    const design = createDocument()
    design.settings.contentWidth = 320
    design.rows.push(createRow([35, 65]))
    const wrapper = mount(EmailBuilder, { props: { design } })
    const surface = wrapper.get('.vmd-canvas-surface')
    const widths = () => wrapper.findAll<HTMLElement>('.vmd-column').map((column) => column.element.style.width)

    expect(surface.attributes('data-device')).toBe('desktop')
    expect(widths()).toEqual(['35%', '65%'])
    await wrapper.get('.vmd-canvasbar [data-device="mobile"]').trigger('click')
    expect(surface.attributes('data-device')).toBe('mobile')
    expect(widths()).toEqual(['100%', '100%'])
    expect(wrapper.get<HTMLElement>('.vmd-row-inner').element.style.maxWidth).toBe('320px')
    wrapper.unmount()
  })

  it('mantiene editables las filas y bloques ocultos en el dispositivo activo', async () => {
    const design = createDocument()
    const row = createRow([100])
    row.hideMobile = true
    const visibleRow = createRow([100])
    const block = createBlock('text')
    block.hideMobile = true
    visibleRow.columns[0].blocks.push(block)
    design.rows.push(row, visibleRow)
    const wrapper = mount(EmailBuilder, { props: { design } })
    const first = wrapper.findAll('.vmd-row')[0]

    expect(first.get<HTMLElement>('.vmd-row-columns').element.style.display).toBe('')
    expect(wrapper.find('.vmd-block--hidden').exists()).toBe(false)
    await wrapper.get('.vmd-canvasbar [data-device="mobile"]').trigger('click')
    expect(first.get<HTMLElement>('.vmd-row-columns').element.style.display).toBe('none')
    await first.get('button.vmd-row-hidden').trigger('click')
    expect(first.classes()).toContain('vmd-selected')
    const hiddenBlock = wrapper.get('.vmd-block--hidden')
    expect(hiddenBlock.find('.vmd-hidden-badge').exists()).toBe(true)
    await hiddenBlock.trigger('click')
    expect(hiddenBlock.classes()).toContain('vmd-selected')
    wrapper.unmount()
  })
})
