import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import { DND_OPTIONS } from '../src/components/dnd'

describe('contrato DnD', () => {
  it('opciones compartidas correctas', () => {
    expect(DND_OPTIONS.forceFallback).toBe(true)
    expect(DND_OPTIONS.animation).toBe(200)
    expect(DND_OPTIONS.ghostClass).toBe('vmd-ghost')
    expect(DND_OPTIONS.fallbackClass).toBe('vmd-drag-card')
  })

  it('los handles de mover aparecen en filas', async () => {
    const wrapper = mount(EmailBuilder)
    await wrapper.find('.vmd-canvas-empty button').trigger('click')
    await wrapper.find('.vmd-row').trigger('click')
    expect(wrapper.find('.vmd-row .vmd-drag-handle').exists()).toBe(true)
  })
})
