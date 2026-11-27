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
  it('keeps safe formatting and merge tags when displaying a replacement document', async () => {
    const wrapper = mountEditor()
    await wrapper.setProps({ modelValue: '<p><span style="color:#1269b0">Colored</span> <a class="sample" href="mailto:editor@example.com">Contact</a> <span data-mt="{{first_name}}" class="vmd-mt">First name</span></p>' })
    await flushPromises()
    const body = wrapper.get('.tiptap')
    expect(body.get('a').attributes('href')).toBe('mailto:editor@example.com')
    expect(body.get('a').attributes('class')).toBeUndefined()
    expect((body.get('span[style]').element as HTMLElement).style.color).toBe('rgb(18, 105, 176)')
    expect(body.get('.vmd-mt').attributes('data-mt')).toBe('{{first_name}}')
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    wrapper.unmount()
  })

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
