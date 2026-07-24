import type { Block, EmailDocument, GalleryBlock, Padding, Row, SocialNetworkKind, TableBlock, TimerBlock } from '../schema'
import { DEFAULT_FONTS, usedFontUrls, type FontDef } from '../fonts'
import type { CustomBlockDef } from '../options'

export type RenderCtx = { fontFamily: string; linkColor: string; linkUnderline: boolean; customBlocks?: CustomBlockDef[] }

/** Glifos sociales propios (clean-room), en blanco sobre el círculo de marca. */
export const SOCIAL_GLYPHS: Record<SocialNetworkKind, string> = {
  facebook: '<path fill="#fff" d="M13.6 21v-7h2.3l.4-2.8h-2.7V9.4c0-.8.2-1.4 1.4-1.4h1.4V5.5C17.5 5.4 16.6 5.3 15.7 5.3c-2 0-3.4 1.2-3.4 3.5v2.4H9.9V14h2.4v7z"/>',
  instagram: '<rect x="5" y="5" width="14" height="14" rx="4.2" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="12" cy="12" r="3.3" fill="none" stroke="#fff" stroke-width="1.8"/><circle cx="16.2" cy="7.8" r="1" fill="#fff"/>',
  x: '<path fill="#fff" d="M6 5h3l3.4 4.7L16.3 5H19l-5 6.4L19.3 19h-3l-3.7-5-4.1 5H6l5.3-6.6z"/>',
  linkedin: '<rect x="5.5" y="9.5" width="2.6" height="9" fill="#fff"/><circle cx="6.8" cy="6.4" r="1.5" fill="#fff"/><path fill="#fff" d="M10.4 9.5h2.5v1.2c.5-.8 1.5-1.4 2.8-1.4 2.3 0 3.3 1.5 3.3 4v5.2h-2.6v-4.7c0-1.2-.4-1.9-1.4-1.9-1 0-1.5.7-1.5 1.9v4.7h-2.6z"/>',
  youtube: '<rect x="4" y="7" width="16" height="10" rx="3" fill="#fff"/><path fill="#ff0000" d="m10.5 9.5 4 2.5-4 2.5z"/>',
  tiktok: '<path fill="#fff" d="M14 4c.3 2 1.6 3.4 3.6 3.6v2.5c-1.2 0-2.4-.4-3.4-1.1v5.2c0 2.6-2 4.6-4.5 4.6S5.2 16.8 5.2 14.3c0-2.4 1.9-4.3 4.2-4.5v2.6c-.9.2-1.6 1-1.6 1.9 0 1.1.9 2 2 2s2-.9 2-2V4z"/>',
  whatsapp: '<path fill="#fff" d="M12 4.5a7.5 7.5 0 0 0-6.4 11.4L4.5 20l4.2-1.1A7.5 7.5 0 1 0 12 4.5zm3.9 10.4c-.2.5-1 .9-1.4 1-.4 0-.8.2-2.6-.5-2.2-.9-3.6-3.1-3.7-3.3-.1-.2-.9-1.2-.9-2.3s.6-1.6.8-1.8c.2-.2.4-.3.6-.3h.4c.1 0 .3 0 .5.4l.7 1.6c0 .2.1.3 0 .5l-.4.5c-.1.2-.3.3-.1.6.1.2.6 1 1.3 1.6.9.8 1.6 1 1.8 1.1.2.1.4.1.5-.1l.6-.7c.2-.2.3-.2.5-.1l1.5.7c.2.1.4.2.4.3s.1.6-.1 1.1z"/>',
  web: '<circle cx="12" cy="12" r="7.5" fill="none" stroke="#fff" stroke-width="1.6"/><path fill="none" stroke="#fff" stroke-width="1.6" d="M4.5 12h15M12 4.5c2.5 2.8 2.5 12.2 0 15M12 4.5c-2.5 2.8-2.5 12.2 0 15"/>',
}

/** SVG cuadrado con un glifo social centrado (para canvas y como data-URI en export). */
export function socialSvg(kind: SocialNetworkKind): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${SOCIAL_GLYPHS[kind]}</svg>`
}

export const SOCIAL_BRANDS: Record<SocialNetworkKind, { color: string }> = {
  facebook: { color: '#1877f2' },
  instagram: { color: '#e4405f' },
  x: { color: '#000000' },
  linkedin: { color: '#0a66c2' },
  youtube: { color: '#ff0000' },
  tiktok: { color: '#010101' },
  whatsapp: { color: '#25d366' },
  web: { color: '#6b7280' },
}

export const MERGE_TAG_RE = /<span[^>]*\bdata-mt="([^"]+)"[^>]*>.*?<\/span>/gs

export function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

export function paddingCss(p: Padding): string {
  return `${p.top}px ${p.right}px ${p.bottom}px ${p.left}px`
}

function convertMergeTags(html: string): string {
  return html.replace(MERGE_TAG_RE, (_m, value: string) => `{{${value}}}`)
}

function styleLinks(html: string, color: string, underline: boolean): string {
  return html.replace(
    /<a\s/g,
    `<a style="color:${color};text-decoration:${underline ? 'underline' : 'none'};" `,
  )
}

/** Tabla 100% de una celda — wrapper estándar para el contenido de un bloque. */
function cellTable(innerTd: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${innerTd}</table>`
}

/** Envuelve `html` en un div con clases de ocultamiento por dispositivo, si aplica. */
function wrapHidden(html: string, hideDesktop?: boolean, hideMobile?: boolean): string {
  if (!hideDesktop && !hideMobile) return html
  const classes = [hideDesktop && 'vmd-hide-desktop', hideMobile && 'vmd-hide-mobile'].filter(Boolean).join(' ')
  const inline = hideDesktop ? ' style="display:none;max-height:0;overflow:hidden;mso-hide:all;"' : ''
  return `<div class="${classes}"${inline}>${html}</div>`
}

export function renderBlock(block: Block, ctx: RenderCtx): string {
  const inner = renderBlockInner(block, ctx)
  return wrapHidden(inner, block.hideDesktop, block.hideMobile)
}

function renderBlockInner(block: Block, ctx: RenderCtx): string {
  switch (block.type) {
    case 'heading': {
      const s = block.style
      const fam = block.fontFamily ?? ctx.fontFamily
      const ls = s.letterSpacing ? `letter-spacing:${s.letterSpacing}px;` : ''
      return cellTable(
        `<tr><td style="padding:${paddingCss(s.padding)};font-family:${fam};font-size:${s.fontSize}px;line-height:${s.lineHeight};${ls}font-weight:${block.fontWeight};color:${s.color};text-align:${s.align};">${escapeHtml(block.text)}</td></tr>`,
      )
    }
    case 'text': {
      const s = block.style
      const fam = block.fontFamily ?? ctx.fontFamily
      const ls = s.letterSpacing ? `letter-spacing:${s.letterSpacing}px;` : ''
      const linkColor = block.linkColor ?? ctx.linkColor
      const linkUnderline = block.linkUnderline ?? ctx.linkUnderline
      return cellTable(
        `<tr><td style="padding:${paddingCss(s.padding)};font-family:${fam};font-size:${s.fontSize}px;line-height:${s.lineHeight};${ls}color:${s.color};">${styleLinks(convertMergeTags(block.html), linkColor, linkUnderline)}</td></tr>`,
      )
    }
    case 'image': {
      const s = block.style
      if (!block.src) {
        return cellTable(`<tr><td style="padding:${paddingCss(s.padding)};"></td></tr>`)
      }
      const imgStyle = block.widthAuto
        ? 'display:block;width:auto;max-width:100%;height:auto;border:0;'
        : 'display:block;width:100%;max-width:100%;height:auto;border:0;'
      const img = `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" ${block.widthAuto ? '' : 'width="100%" '}style="${imgStyle}">`
      const content = block.href ? `<a href="${escapeHtml(block.href)}" target="${block.target}">${img}</a>` : img
      const tableWidth = block.widthAuto ? '' : ` width="${block.widthPct}%"`
      return cellTable(
        `<tr><td align="${block.align}" style="padding:${paddingCss(s.padding)};">` +
        `<table role="presentation"${tableWidth} cellpadding="0" cellspacing="0" border="0"><tr><td>${content}</td></tr></table>` +
        `</td></tr>`,
      )
    }
    case 'button': {
      const s = block.style
      const border = s.border ? `border:${s.border.width}px ${s.border.style} ${s.border.color};` : ''
      const ls = s.letterSpacing ? `letter-spacing:${s.letterSpacing}px;` : ''
      // ancho fijo (%) → la tabla del botón ocupa ese % y el <a> se estira (display:block, centrado)
      const hasWidth = typeof block.widthPct === 'number'
      const btnTableWidth = hasWidth ? ` width="${block.widthPct}%"` : ''
      const linkDisplay = hasWidth ? 'block' : 'inline-block'
      const textAlign = hasWidth ? 'text-align:center;' : ''
      return cellTable(
        `<tr><td align="${block.align}" style="padding:${paddingCss(s.padding)};">` +
        `<table role="presentation"${btnTableWidth} cellpadding="0" cellspacing="0" border="0"><tr>` +
        `<td style="border-radius:${s.borderRadius}px;background-color:${s.backgroundColor};${border}${textAlign}">` +
        `<a href="${escapeHtml(block.href)}" target="${block.target}" style="display:${linkDisplay};padding:${s.innerPaddingY}px ${s.innerPaddingX}px;font-family:${ctx.fontFamily};font-size:${s.fontSize}px;line-height:${s.lineHeight};${ls}font-weight:bold;color:${s.color};text-decoration:none;border-radius:${s.borderRadius}px;">${escapeHtml(block.label)}</a>` +
        `</td></tr></table></td></tr>`,
      )
    }
    case 'divider': {
      const s = block.style
      return cellTable(
        `<tr><td align="${s.align}" style="padding:${paddingCss(s.padding)};">` +
        `<table role="presentation" width="${s.widthPct}%" cellpadding="0" cellspacing="0" border="0"><tr>` +
        `<td style="border-top:${s.thickness}px ${s.lineStyle} ${s.color};font-size:0;line-height:0;">&nbsp;</td>` +
        `</tr></table></td></tr>`,
      )
    }
    case 'spacer':
      return cellTable(
        `<tr><td style="height:${block.height}px;font-size:0;line-height:0;">&nbsp;</td></tr>`,
      )
    case 'social': {
      const s = block.style
      const glyphSize = Math.round(block.iconSize * 0.62)
      const iconRadius = block.iconShape === 'circle' ? '50%' : block.iconShape === 'rounded' ? '8px' : '0'
      const icons = block.networks
        .map(({ kind, url }) => {
          const brand = SOCIAL_BRANDS[kind]
          const dataUri = `data:image/svg+xml,${encodeURIComponent(socialSvg(kind))}`
          // fondo de marca como color sólido (degrada bien si el cliente bloquea la imagen) + glifo SVG centrado
          return (
            `<td style="padding:0 ${block.spacing / 2}px;">` +
            `<a href="${escapeHtml(url)}" target="_blank" style="display:inline-block;width:${block.iconSize}px;height:${block.iconSize}px;line-height:${block.iconSize}px;border-radius:${iconRadius};background-color:${brand.color};text-align:center;text-decoration:none;">` +
            `<img src="${dataUri}" alt="${kind}" width="${glyphSize}" height="${glyphSize}" style="display:inline-block;vertical-align:middle;border:0;">` +
            `</a>` +
            `</td>`
          )
        })
        .join('')
      return cellTable(
        `<tr><td align="${block.align}" style="padding:${paddingCss(s.padding)};">` +
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${icons}</tr></table>` +
        `</td></tr>`,
      )
    }
    case 'menu': {
      const s = block.style
      const fam = block.fontFamily ?? ctx.fontFamily
      const linkColor = block.linkColor ?? s.color
      const ls = s.letterSpacing ? `letter-spacing:${s.letterSpacing}px;` : ''
      const itemStyle = `padding:${paddingCss(s.itemPadding)};color:${linkColor};font-family:${fam};font-size:${s.fontSize}px;font-weight:${block.fontWeight};${ls}text-decoration:none;`
      if (block.layout === 'vertical') {
        const rows = block.items
          .map((it) => `<tr><td align="${block.align}"><a href="${escapeHtml(it.href)}" target="_blank" style="display:block;${itemStyle}">${escapeHtml(it.label)}</a></td></tr>`)
          .join('')
        return cellTable(`<tr><td style="padding:${paddingCss(s.padding)};"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${rows}</table></td></tr>`)
      }
      const sep = `<span style="padding:0 4px;color:${s.color};">${escapeHtml(block.separator)}</span>`
      const items = block.items
        .map((it) => `<a href="${escapeHtml(it.href)}" target="_blank" style="display:inline-block;${itemStyle}">${escapeHtml(it.label)}</a>`)
        .join(sep)
      return cellTable(
        `<tr><td align="${block.align}" style="padding:${paddingCss(s.padding)};font-family:${fam};font-size:${s.fontSize}px;">${items}</td></tr>`,
      )
    }
    case 'html': {
      const s = block.style
      return cellTable(`<tr><td style="padding:${paddingCss(s.padding)};">${block.code}</td></tr>`)
    }
    case 'video': {
      const s = block.style
      if (!block.thumbnailUrl || !block.videoUrl) {
        return cellTable(`<tr><td style="padding:${paddingCss(s.padding)};"></td></tr>`)
      }
      return cellTable(
        `<tr><td align="center" style="padding:${paddingCss(s.padding)};">` +
        `<table role="presentation" width="${block.widthPct}%" cellpadding="0" cellspacing="0" border="0"><tr><td>` +
        `<a href="${escapeHtml(block.videoUrl)}" target="_blank">` +
        `<img src="${escapeHtml(block.thumbnailUrl)}" alt="${escapeHtml(block.alt)}" width="100%" style="display:block;width:100%;max-width:100%;height:auto;border:0;">` +
        `</a></td></tr></table></td></tr>`,
      )
    }
    case 'table':
      return renderTable(block)
    case 'gallery':
      return renderGallery(block)
    case 'timer':
      return renderTimer(block)
    case 'custom': {
      const def = ctx.customBlocks?.find((d) => d.type === block.customType)
      if (!def) return `<!-- bloque personalizado "${escapeHtml(block.customType)}" sin registrar -->`
      return cellTable(`<tr><td>${def.render(block.data)}</td></tr>`)
    }
  }
}

function renderTable(block: TableBlock): string {
  const s = block.style
  const rows = block.rows.map((cells, r) => {
    const isHeader = block.headerRow && r === 0
    const tag = isHeader ? 'th' : 'td'
    const stripe = !isHeader && block.stripedRows && (block.headerRow ? r % 2 === 0 : r % 2 === 1)
    const bg = isHeader
      ? `background-color:${s.headerBackground};`
      : stripe ? 'background-color:rgba(0,0,0,.03);' : ''
    const color = isHeader && s.headerColor ? s.headerColor : s.color
    const tds = cells.map((c) =>
      `<${tag} style="border:${s.borderWidth}px solid ${s.borderColor};padding:${s.cellPadding}px;font-size:${s.fontSize}px;color:${color};${bg}text-align:left;">${escapeHtml(c)}</${tag}>`,
    ).join('')
    return `<tr>${tds}</tr>`
  }).join('')
  return cellTable(
    `<tr><td style="padding:${paddingCss(s.padding)};">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${rows}</table>` +
    `</td></tr>`,
  )
}

function renderGallery(block: GalleryBlock): string {
  const s = block.style
  const cols = block.columns
  const cellW = Math.floor(100 / cols)
  const withSrc = block.images.filter((i) => i.src)
  const cells = withSrc.map((im) => {
    const img = `<img src="${escapeHtml(im.src)}" alt="${escapeHtml(im.alt)}" width="100%" style="display:block;width:100%;max-width:100%;height:auto;border:0;">`
    const inner = im.href ? `<a href="${escapeHtml(im.href)}" target="_blank">${img}</a>` : img
    return `<td class="vmd-gallery-cell" width="${cellW}%" style="padding:${block.gap / 2}px;" valign="top">${inner}</td>`
  })
  // agrupar en filas de `cols`
  const trs: string[] = []
  for (let i = 0; i < cells.length; i += cols) {
    trs.push(`<tr>${cells.slice(i, i + cols).join('')}</tr>`)
  }
  return cellTable(
    `<tr><td style="padding:${paddingCss(s.padding)};">` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${trs.join('')}</table>` +
    `</td></tr>`,
  )
}

function renderTimer(block: TimerBlock): string {
  const s = block.style
  if (block.imageUrl) {
    return cellTable(
      `<tr><td align="center" style="padding:${paddingCss(s.padding)};">` +
      `<img src="${escapeHtml(block.imageUrl)}" alt="${escapeHtml(block.alt)}" width="${block.widthPct}%" style="display:block;max-width:100%;height:auto;border:0;margin:0 auto;">` +
      `</td></tr>`,
    )
  }
  const days = Math.max(0, Math.ceil((new Date(block.endDate).getTime() - Date.now()) / 864e5))
  return cellTable(
    `<tr><td align="center" class="vmd-timer-static" style="padding:${paddingCss(s.padding)};font-family:Arial,sans-serif;font-size:28px;font-weight:bold;color:#111827;">` +
    `${days} ${days === 1 ? 'día' : 'días'}` +
    `</td></tr>`,
  )
}

function renderColumnBlocks(blocks: Block[], ctx: RenderCtx): string {
  return blocks.map((b) => renderBlock(b, ctx)).join('')
}

/**
 * Cada fila es su propia tabla de 100% de ancho (bleedea hasta el borde del cliente de
 * correo) con una tabla interna centrada al ancho de contenido — igual que Unlayer:
 * `backgroundColor`/imagen con `fullWidth` pintan la tabla exterior; `contentBackgroundColor`
 * (e imagen sin `fullWidth`) pintan solo el área de contenido.
 */
function renderRow(row: Row, contentWidth: number, contentAlignment: 'left' | 'center', ctx: RenderCtx): string {
  const rs = row.style
  const outerBg = rs.backgroundColor === 'transparent' ? '' : `background-color:${rs.backgroundColor};`
  const contentBg = rs.contentBackgroundColor && rs.contentBackgroundColor !== 'transparent'
    ? `background-color:${rs.contentBackgroundColor};`
    : ''
  const radius = rs.borderRadius > 0 ? `border-radius:${rs.borderRadius}px;` : ''
  const innerWidth = contentWidth - rs.padding.left - rs.padding.right // el padding de fila resta ancho disponible para las columnas

  const bgImg = rs.backgroundImage
  const fullImg = bgImg && bgImg.fullWidth ? bgImg : undefined
  const contentImg = bgImg && !bgImg.fullWidth ? bgImg : undefined
  const bgAttr = (img?: typeof bgImg) => (img ? ` background="${escapeHtml(img.url)}"` : '')
  const bgStyle = (img?: typeof bgImg) =>
    img ? `background-image:url(${escapeHtml(img.url)});background-size:${img.size};background-position:${escapeHtml(img.position)};background-repeat:${img.repeat};` : ''

  const cols = row.columns
    .map((col) => {
      const pxWidth = Math.round((innerWidth * col.widthPct) / 100)
      const colBg = col.style.backgroundColor === 'transparent' ? '' : `background-color:${col.style.backgroundColor};`
      const colBorder = col.style.border
        ? `border:${col.style.border.width}px ${col.style.border.style} ${col.style.border.color};`
        : ''
      const colRadius = col.style.borderRadius ? `border-radius:${col.style.borderRadius}px;` : ''
      return (
        `<!--[if mso]><td width="${pxWidth}" valign="top"><![endif]-->` +
        `<div class="vmd-col" style="display:inline-block;width:100%;max-width:${pxWidth}px;vertical-align:top;font-size:14px;">` +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:${paddingCss(col.style.padding)};${colBg}${colBorder}${colRadius}">` +
        renderColumnBlocks(col.blocks, ctx) +
        `</td></tr></table></div>` +
        `<!--[if mso]></td><![endif]-->`
      )
    })
    .join('')

  const contentTable = (
    `<table role="presentation" width="${contentWidth}" cellpadding="0" cellspacing="0" border="0" class="vmd-container" style="width:${contentWidth}px;max-width:100%;">` +
    `<tr><td${bgAttr(contentImg)} style="${contentBg}${radius}${bgStyle(contentImg)}padding:${paddingCss(rs.padding)};font-size:0;">` +
    `<!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><![endif]-->` +
    cols +
    `<!--[if mso]></tr></table><![endif]-->` +
    `</td></tr></table>`
  )

  const outerTable = (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${bgAttr(fullImg)} style="${outerBg}${bgStyle(fullImg)}">` +
    `<tr><td align="${contentAlignment}" style="padding:0;">` +
    contentTable +
    `</td></tr></table>`
  )

  return wrapHidden(outerTable, row.hideDesktop, row.hideMobile)
}

export function renderHtml(doc: EmailDocument, fonts: FontDef[] = DEFAULT_FONTS, customBlocks?: CustomBlockDef[]): string {
  const fontUrls = usedFontUrls(doc, fonts)
  const fontLinks = fontUrls.length
    ? fontUrls.map((url) => `<link href="${escapeHtml(url)}" rel="stylesheet">`).join('\n') + '\n'
    : ''
  const { settings } = doc
  const ctx: RenderCtx = { fontFamily: settings.fontFamily, linkColor: settings.linkColor, linkUnderline: settings.linkUnderline, customBlocks }
  const preheader = settings.preheader
    ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(settings.preheader)}</div>`
    : ''

  const rows = doc.rows.map((r) => renderRow(r, settings.contentWidth, settings.contentAlignment, ctx)).join('')

  const bodyBgImg = settings.backgroundImage
  const bodyBgAttr = bodyBgImg ? ` background="${escapeHtml(bodyBgImg.url)}"` : ''
  const bodyBgStyle = bodyBgImg
    ? `background-image:url(${escapeHtml(bodyBgImg.url)});background-size:${bodyBgImg.size};background-position:${escapeHtml(bodyBgImg.position)};background-repeat:${bodyBgImg.repeat};`
    : ''
  const titleTag = settings.htmlTitle ? `<title>${escapeHtml(settings.htmlTitle)}</title>\n` : ''
  const bodyFontWeight = settings.fontWeight === 'bold' ? 'font-weight:bold;' : ''

  return `<!doctype html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
${titleTag}<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
${fontLinks}<style>
  body { margin: 0; padding: 0; }
  img { border: 0; }
  .vmd-hide-desktop { display:none; mso-hide:all; }
  @media (max-width: 480px) {
    .vmd-col { width: 100% !important; max-width: 100% !important; display: block !important; }
    .vmd-container { width: 100% !important; }
    .vmd-hide-desktop { display:block !important; max-height:none !important; }
    .vmd-hide-mobile { display:none !important; }
    .vmd-gallery-cell { display: block !important; width: 100% !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${settings.backgroundColor};color:${settings.textColor};${bodyFontWeight}font-family:${settings.fontFamily};">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"${bodyBgAttr} style="background-color:${settings.backgroundColor};${bodyBgStyle}">
<tr><td align="${settings.contentAlignment}" style="padding:0;">
${rows}
</td></tr></table>
</body>
</html>`
}
