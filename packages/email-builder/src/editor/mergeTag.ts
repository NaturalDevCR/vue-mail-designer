import { Node, mergeAttributes } from '@tiptap/core'
import type { Editor } from '@tiptap/core'
import type { MergeTagDef } from '../options'

export const MergeTag = Node.create({
  name: 'mergeTag',
  group: 'inline',
  inline: true,
  atom: true,
  selectable: true,

  addAttributes() {
    return {
      value: { default: '' },
      label: { default: '' },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-mt]',
        getAttrs: (el) => ({
          value: (el as HTMLElement).getAttribute('data-mt') ?? '',
          label: (el as HTMLElement).textContent ?? '',
        }),
      },
    ]
  },

  renderHTML({ node }) {
    return [
      'span',
      mergeAttributes({ 'data-mt': node.attrs.value as string, class: 'vmd-mt' }),
      (node.attrs.label as string) || (node.attrs.value as string),
    ]
  },
})

export function insertMergeTag(editor: Editor, tag: MergeTagDef) {
  editor
    .chain()
    .focus()
    .insertContent({ type: 'mergeTag', attrs: { value: tag.value, label: tag.name } })
    .run()
}
