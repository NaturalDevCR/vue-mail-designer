import { Editor } from '@tiptap/core'
import StarterKit from '@tiptap/starter-kit'
import { describe, expect, it } from 'vitest'
import { InlineStyle } from '../src/editor/inlineStyle'

function makeEditor() {
  return new Editor({ extensions: [StarterKit, InlineStyle], content: '<p>hola mundo</p>' })
}

describe('InlineStyle (color y tamaño de fuente)', () => {
  it('aplica color de texto como span con style inline', () => {
    const editor = makeEditor()
    editor.commands.selectAll()
    editor.commands.setInlineColor('#ff0000')
    const html = editor.getHTML()
    // el DOM normaliza #ff0000 → rgb(255, 0, 0); válido igual en email
    expect(html).toContain('rgb(255, 0, 0)')
    expect(html).toMatch(/<span[^>]*style="[^"]*color:/)
    editor.destroy()
  })

  it('aplica tamaño de fuente', () => {
    const editor = makeEditor()
    editor.commands.selectAll()
    editor.commands.setInlineFontSize('24px')
    expect(editor.getHTML()).toContain('font-size: 24px')
    editor.destroy()
  })

  it('parsea de vuelta un span con color', () => {
    const editor = new Editor({
      extensions: [StarterKit, InlineStyle],
      content: '<p><span style="color: #00ff00">verde</span></p>',
    })
    expect(editor.getAttributes('inlineStyle').color).toContain('0, 255, 0')
    editor.destroy()
  })

  it('aplica fuente por selección sin perder color/tamaño ya aplicados', () => {
    const editor = makeEditor()
    editor.commands.selectAll()
    editor.commands.setInlineColor('#ff0000')
    editor.commands.setInlineFontSize('24px')
    editor.commands.setInlineFontFamily("'Roboto', sans-serif")
    const html = editor.getHTML()
    expect(html).toContain('font-family')
    expect(html).toContain('Roboto')
    expect(html).toContain('font-size: 24px')
    expect(html).toContain('rgb(255, 0, 0)')
    editor.destroy()
  })

  it('parsea de vuelta un span con font-family', () => {
    const editor = new Editor({
      extensions: [StarterKit, InlineStyle],
      content: '<p><span style="font-family: Georgia, serif">serif</span></p>',
    })
    expect(editor.getAttributes('inlineStyle').fontFamily).toContain('Georgia')
    editor.destroy()
  })
})
