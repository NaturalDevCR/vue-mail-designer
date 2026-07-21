import { Mark, mergeAttributes } from '@tiptap/core'

/**
 * Marca de estilo inline propia (color de texto + tamaño de fuente) sin depender
 * de @tiptap/extension-text-style / -color. Renderiza `<span style="color:…;font-size:…">`,
 * que el renderer de email conserva tal cual en el HTML exportado.
 */
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    inlineStyle: {
      setInlineColor: (color: string) => ReturnType
      setInlineFontSize: (fontSize: string) => ReturnType
      unsetInlineStyle: () => ReturnType
    }
  }
}

export const InlineStyle = Mark.create({
  name: 'inlineStyle',

  addAttributes() {
    return {
      color: { default: null as string | null },
      fontSize: { default: null as string | null },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'span[style]',
        getAttrs: (node) => {
          const el = node as HTMLElement
          const color = el.style.color || null
          const fontSize = el.style.fontSize || null
          return color || fontSize ? { color, fontSize } : false
        },
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    const { color, fontSize, ...rest } = HTMLAttributes as {
      color?: string | null
      fontSize?: string | null
    } & Record<string, unknown>
    const style = [color ? `color:${color}` : '', fontSize ? `font-size:${fontSize}` : '']
      .filter(Boolean)
      .join(';')
    return ['span', mergeAttributes(rest, style ? { style } : {}), 0]
  },

  addCommands() {
    return {
      setInlineColor:
        (color: string) =>
        ({ commands }) =>
          commands.setMark(this.name, { color }),
      setInlineFontSize:
        (fontSize: string) =>
        ({ commands }) =>
          commands.setMark(this.name, { fontSize }),
      unsetInlineStyle:
        () =>
        ({ commands }) =>
          commands.unsetMark(this.name),
    }
  },
})
