import createDOMPurify from 'dompurify'

const richTextPurifier = createDOMPurify()
const documentPurifier = createDOMPurify()

const RICH_TEXT_STYLES = [
  'background-color', 'color', 'font-family', 'font-size', 'font-style', 'font-weight',
  'letter-spacing', 'line-height', 'text-align', 'text-decoration', 'text-transform',
  'vertical-align', 'white-space',
]

if (richTextPurifier.isSupported) {
  richTextPurifier.addHook('uponSanitizeAttribute', (node, attribute) => {
    if (attribute.attrName === 'class') {
      attribute.keepAttr = node.localName === 'span' && node.hasAttribute('data-mt')
        && attribute.attrValue.split(/\s+/).includes('vmd-mt')
      attribute.attrValue = 'vmd-mt'
    }
    if (attribute.attrName === 'style') {
      const style = (node as HTMLElement).style
      attribute.attrValue = RICH_TEXT_STYLES.flatMap((property) => {
        const value = style?.getPropertyValue(property)
        return value ? [`${property}:${value}`] : []
      }).join(';')
      attribute.keepAttr = attribute.attrValue.length > 0
    }
  })
}

export function sanitizeRichText(html: string): string {
  if (!richTextPurifier.isSupported) return ''
  return richTextPurifier.sanitize(html, {
    ALLOWED_TAGS: [
      'a', 'b', 'blockquote', 'br', 'caption', 'code', 'col', 'colgroup', 'dd', 'del', 'div',
      'dl', 'dt', 'em', 'font', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'hr', 'i', 'li', 'ol',
      'p', 'pre', 's', 'small', 'span', 'strong', 'sub', 'sup', 'table', 'tbody', 'td', 'tfoot',
      'th', 'thead', 'tr', 'u', 'ul',
    ],
    ALLOWED_ATTR: [
      'align', 'class', 'color', 'colspan', 'data-mt', 'dir', 'face', 'href', 'lang', 'rel',
      'rowspan', 'size', 'start', 'style', 'target', 'title', 'valign',
    ],
    ALLOW_DATA_ATTR: false,
  })
}

const PREVIEW_POLICY = [
  "default-src 'none'", "base-uri 'none'", "form-action 'none'",
  'img-src https: data: blob:', "style-src 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
].join('; ')
const PREVIEW_HEAD = '<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">'
  + '<meta name="referrer" content="no-referrer">'
  + `<meta http-equiv="Content-Security-Policy" content="${PREVIEW_POLICY}">`

if (documentPurifier.isSupported) {
  documentPurifier.addHook('uponSanitizeAttribute', (node, attribute) => {
    if (attribute.attrName === 'href') {
      attribute.keepAttr = node.localName === 'link' && node.getAttribute('rel')?.toLowerCase() === 'stylesheet'
        && attribute.attrValue.startsWith('https://fonts.googleapis.com/')
    }
  })
}

/** Builds display-only source for a sandboxed iframe. Keep the original email HTML for export. */
export function isolatePreviewHtml(html: string): string {
  const emptyDocument = `<!doctype html><html><head>${PREVIEW_HEAD}</head><body></body></html>`
  if (!documentPurifier.isSupported) return emptyDocument
  const clean = documentPurifier.sanitize(html, {
    USE_PROFILES: { html: true, svg: true, svgFilters: true },
    WHOLE_DOCUMENT: true,
    RETURN_DOM: true,
    ADD_TAGS: ['link'],
    FORBID_TAGS: [
      'animate', 'animatecolor', 'animatemotion', 'animatetransform', 'audio', 'base', 'button',
      'embed', 'form', 'frame', 'frameset', 'iframe', 'input', 'meta', 'object', 'script',
      'select', 'set', 'template', 'textarea', 'video',
    ],
    FORBID_ATTR: ['accesskey', 'autofocus', 'contenteditable', 'download', 'ping', 'tabindex', 'xlink:href'],
  })
  const head = clean.querySelector('head')
  if (!head) return emptyDocument
  // The policy must precede imported document content, including styles and resource references.
  head.insertAdjacentHTML('afterbegin', PREVIEW_HEAD)
  return `<!doctype html>${clean.outerHTML}`
}
