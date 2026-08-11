import { flushPromises, mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import RichTextEditor from '../src/components/RichTextEditor.vue'
import { BUILDER_OPTIONS_KEY } from '../src/options'

function mountEditor(ai?: { enabled: boolean; languages?: { code: string; label: string }[] }) {
  return mount(RichTextEditor, {
    props: { modelValue: '<p>Hello world</p>' },
    global: {
      provide: {
        [BUILDER_OPTIONS_KEY as symbol]: {
          mergeTags: [],
          ai,
        },
      },
    },
  })
}

describe('RichTextEditor', () => {
  it('does not render the AI menu when AI is disabled', async () => {
    const wrapper = mountEditor({ enabled: false, languages: [{ code: 'es', label: 'Spanish' }] })

    await flushPromises()

    expect(wrapper.find('[data-action="ai-menu-toggle"]').exists()).toBe(false)
  })

  it('renders the AI menu when AI is enabled', async () => {
    const wrapper = mountEditor({ enabled: true, languages: [{ code: 'es', label: 'Spanish' }] })

    await flushPromises()

    expect(wrapper.find('[data-action="ai-menu-toggle"]').exists()).toBe(true)
  })
})
