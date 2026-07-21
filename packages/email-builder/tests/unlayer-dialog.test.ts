import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import EmailBuilder from '../src/components/EmailBuilder.vue'

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
    expect(wrapper.find('.vmd-import-json').exists()).toBe(true)

    await wrapper.find('.vmd-import-json').setValue(JSON.stringify(VALID_DESIGN))
    await wrapper.find('[data-action="unlayer-load"]').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 0))

    expect(
      wrapper.find('.vmd-import-warnings').exists() || wrapper.find('[data-action="unlayer-apply"]').exists(),
    ).toBe(true)
    expect(wrapper.find('[data-action="unlayer-apply"]').exists()).toBe(true)

    await wrapper.find('[data-action="unlayer-apply"]').trigger('click')
    expect(wrapper.find('.vmd-row').exists()).toBe(true)
    expect(wrapper.find('.vmd-import-json').exists()).toBe(false)
  })

  it('JSON inválido muestra error', async () => {
    const wrapper = mount(EmailBuilder)
    await openDialog(wrapper)

    await wrapper.find('.vmd-import-json').setValue('{ esto no es json')
    await wrapper.find('[data-action="unlayer-load"]').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 0))

    expect(wrapper.find('.vmd-import-error').exists()).toBe(true)
  })

  it('modo URL usa el unlayerFetch inyectado y convierte el resultado', async () => {
    const fetchMock = vi.fn().mockResolvedValue(VALID_DESIGN)
    const wrapper = mount(EmailBuilder, { props: { unlayerFetch: fetchMock } })
    await openDialog(wrapper)

    await wrapper.find('.vmd-import-url').setValue('https://studio.unlayer.com/create/foo')
    await wrapper.find('[data-action="unlayer-load"]').trigger('click')
    await wrapper.vm.$nextTick()
    await new Promise((r) => setTimeout(r, 0))

    expect(fetchMock).toHaveBeenCalledWith('foo')
    expect(wrapper.find('[data-action="unlayer-apply"]').exists()).toBe(true)

    await wrapper.find('[data-action="unlayer-apply"]').trigger('click')
    expect(wrapper.find('.vmd-row').exists()).toBe(true)
  })
})
