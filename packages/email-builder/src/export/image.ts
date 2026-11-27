import { isolatePreviewHtml } from '../editor/previewHtml'

/**
 * Exporta el HTML de un email a una imagen PNG (data URL) usando la técnica
 * DOM → SVG foreignObject → canvas, sin dependencias externas.
 *
 * El navegador puede omitir recursos externos al renderizar el SVG como imagen.
 * Las imágenes embebidas como data URLs se conservan.
 */
export async function exportDocumentImage(html: string, width: number): Promise<string> {
  const { height, content } = await prepareSnapshot(html, width)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<foreignObject width="100%" height="100%">` +
    content +
    `</foreignObject></svg>`
  const svgUrl = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg)

  const img = new Image()
  img.crossOrigin = 'anonymous'
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = () => reject(new Error('No se pudo renderizar la imagen.'))
    img.src = svgUrl
  })

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas no disponible.')
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, width, height)
  ctx.drawImage(img, 0, 0)
  return canvas.toDataURL('image/png')
}

async function prepareSnapshot(html: string, width: number): Promise<{ height: number; content: string }> {
  const frame = document.createElement('iframe')
  frame.setAttribute('sandbox', 'allow-same-origin')
  frame.setAttribute('aria-hidden', 'true')
  frame.referrerPolicy = 'no-referrer'
  frame.tabIndex = -1
  frame.style.cssText = `position:fixed;left:-99999px;top:0;width:${width}px;height:1px;border:0;`
  frame.srcdoc = isolatePreviewHtml(html)

  try {
    await new Promise<void>((resolve, reject) => {
      frame.onload = () => resolve()
      frame.onerror = () => reject(new Error('No se pudo cargar el diseño.'))
      document.body.appendChild(frame)
    })
    const source = frame.contentDocument
    if (!source?.body) throw new Error('No se pudo cargar el diseño.')
    const height = Math.max(source.body.scrollHeight, 100)
    const wrapper = source.createElement('div')
    wrapper.style.cssText = source.body.style.cssText
    wrapper.append(...source.head.querySelectorAll('style'), ...source.body.childNodes)

    // El contenido para Outlook y los demás comentarios no forman parte de la imagen.
    const walker = source.createTreeWalker(wrapper, NodeFilter.SHOW_COMMENT)
    const comments: Node[] = []
    for (let comment = walker.nextNode(); comment; comment = walker.nextNode()) comments.push(comment)
    for (const comment of comments) comment.parentNode?.removeChild(comment)

    return { height, content: new XMLSerializer().serializeToString(wrapper) }
  } finally {
    frame.remove()
  }
}
