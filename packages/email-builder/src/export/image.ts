/**
 * Exporta el HTML de un email a una imagen PNG (data URL) usando la técnica
 * DOM → SVG foreignObject → canvas, sin dependencias externas.
 *
 * Limitación conocida: si el email incluye imágenes de otro origen (CORS), el
 * canvas queda "tainted" y `toDataURL` lanza; en ese caso el llamador muestra un
 * aviso. Reemplazá esas imágenes por assets del mismo origen (o data URIs) para
 * exportar a imagen.
 */
export async function exportDocumentImage(html: string, width: number): Promise<string> {
  const height = measureHeight(html, width)
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">` +
    `<foreignObject width="100%" height="100%">` +
    `<div xmlns="http://www.w3.org/1999/xhtml">${html}</div>` +
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

/** Mide la altura del HTML renderizado a un ancho dado, en un contenedor oculto. */
function measureHeight(html: string, width: number): number {
  const container = document.createElement('div')
  container.style.cssText = `position:absolute;left:-99999px;top:0;width:${width}px;`
  container.innerHTML = html
  document.body.appendChild(container)
  const height = Math.max(container.scrollHeight, 100)
  document.body.removeChild(container)
  return height
}
