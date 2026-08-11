import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'
import { findInBody, hasInBody } from './modal-test-utils'

const VALID_DESIGN = {
  body: {
    values: {},
    rows: [
      {
        cells: [1],
        values: {},
        columns: [
          {
            values: {},
            contents: [{ type: 'text', values: { text: '<p>hi</p>' } }],
          },
        ],
      },
    ],
  },
}

async function openDialog(wrapper: ReturnType<typeof mount>) {
  await wrapper.find('[data-action="export"]').trigger('click')
  await wrapper.find('[data-action="import-unlayer"]').trigger('click')
}

describe('UnlayerImportDialog', () => {
  it('pega JSON válido, carga, muestra advertencias/aplicar y llena el canvas al aplicar', async () => {
    const wrapper = mount(EmailBuilder)
    await openDialog(wrapper)
    expect(findInBody('.vmd-import-json').exists()).toBe(true)

    await findInBody('.vmd-import-json').setValue(JSON.stringify(VALID_DESIGN))
    await findInBody('[data-action="unlayer-load"]').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 0))

    expect(
      hasInBody('.vmd-import-warnings') || hasInBody('[data-action="unlayer-apply"]'),
    ).toBe(true)
    expect(findInBody('[data-action="unlayer-apply"]').exists()).toBe(true)

    await findInBody('[data-action="unlayer-apply"]').trigger('click')
    expect(wrapper.find('.vmd-row').exists()).toBe(true)
    expect(document.body.querySelector('.vmd-import-json')).toBeNull()
  })

  it('JSON inválido muestra error', async () => {
    const wrapper = mount(EmailBuilder)
    await openDialog(wrapper)

    await findInBody('.vmd-import-json').setValue('{ esto no es json')
    await findInBody('[data-action="unlayer-load"]').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 0))

    expect(findInBody('.vmd-import-error').exists()).toBe(true)
  })

  it('modo URL usa el unlayerFetch inyectado y convierte el resultado', async () => {
    const fetchMock = vi.fn().mockResolvedValue(VALID_DESIGN)
    const wrapper = mount(EmailBuilder, { props: { unlayerFetch: fetchMock } })
    await openDialog(wrapper)

    await findInBody('.vmd-import-url').setValue('https://studio.unlayer.com/create/foo')
    await findInBody('[data-action="unlayer-load"]').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 0))

    expect(fetchMock).toHaveBeenCalledWith('foo')
    expect(findInBody('[data-action="unlayer-apply"]').exists()).toBe(true)

    await findInBody('[data-action="unlayer-apply"]').trigger('click')
    expect(wrapper.find('.vmd-row').exists()).toBe(true)
  })
})
