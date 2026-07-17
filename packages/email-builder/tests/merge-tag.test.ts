import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'
import { MergeTag, insertMergeTag } from '../src/editor/mergeTag'
import { MERGE_TAG_RE } from '../src/render/html'

describe('MergeTag', () => {
  it('inserta un span data-mt que el renderer convierte a {{value}}', () => {
    const editor = new Editor({ extensions: [StarterKit, MergeTag], content: '<p>Hola </p>' })
    insertMergeTag(editor, { name: 'Nombre', value: 'first_name' })
    const html = editor.getHTML()
    expect(html).toContain('data-mt="first_name"')
    expect(html.replace(MERGE_TAG_RE, (_m, v) => `{{${v}}}`)).toContain('{{first_name}}')
    editor.destroy()
  })

  it('parsea de vuelta HTML con spans data-mt como nodos atómicos', () => {
    const editor = new Editor({
      extensions: [StarterKit, MergeTag],
      content: '<p>Hola <span data-mt="first_name">Nombre</span></p>',
    })
    expect(editor.getHTML()).toContain('data-mt="first_name"')
    editor.destroy()
  })
})
