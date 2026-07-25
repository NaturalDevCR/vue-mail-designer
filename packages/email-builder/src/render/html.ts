import type { Block, EmailDocument, GalleryBlock, Padding, Row, SocialNetworkKind, TableBlock, TimerBlock } from '../schema'
import { DEFAULT_FONTS, usedFontUrls, type FontDef } from '../fonts'
import type { CustomBlockDef } from '../options'

export type RenderCtx = { fontFamily: string; linkColor: string; linkUnderline: boolean; customBlocks?: CustomBlockDef[] }

/**
 * Glifos sociales: paths oficiales de simple-icons (CC0-1.0, https://simpleicons.org),
 * reutilizables libremente sin atribución. LinkedIn y Web (no es una marca) son propios.
 * En blanco sobre el círculo de marca.
 */
export const SOCIAL_GLYPHS: Record<SocialNetworkKind, string> = {
  facebook: '<path fill="#fff" d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"/>',
  instagram: '<path fill="#fff" d="M7.0301.084c-1.2768.0602-2.1487.264-2.911.5634-.7888.3075-1.4575.72-2.1228 1.3877-.6652.6677-1.075 1.3368-1.3802 2.127-.2954.7638-.4956 1.6365-.552 2.914-.0564 1.2775-.0689 1.6882-.0626 4.947.0062 3.2586.0206 3.6671.0825 4.9473.061 1.2765.264 2.1482.5635 2.9107.308.7889.72 1.4573 1.388 2.1228.6679.6655 1.3365 1.0743 2.1285 1.38.7632.295 1.6361.4961 2.9134.552 1.2773.056 1.6884.069 4.9462.0627 3.2578-.0062 3.668-.0207 4.9478-.0814 1.28-.0607 2.147-.2652 2.9098-.5633.7889-.3086 1.4578-.72 2.1228-1.3881.665-.6682 1.0745-1.3378 1.3795-2.1284.2957-.7632.4966-1.636.552-2.9124.056-1.2809.0692-1.6898.063-4.948-.0063-3.2583-.021-3.6668-.0817-4.9465-.0607-1.2797-.264-2.1487-.5633-2.9117-.3084-.7889-.72-1.4568-1.3876-2.1228C21.2982 1.33 20.628.9208 19.8378.6165 19.074.321 18.2017.1197 16.9244.0645 15.6471.0093 15.236-.005 11.977.0014 8.718.0076 8.31.0215 7.0301.0839m.1402 21.6932c-1.17-.0509-1.8053-.2453-2.2287-.408-.5606-.216-.96-.4771-1.3819-.895-.422-.4178-.6811-.8186-.9-1.378-.1644-.4234-.3624-1.058-.4171-2.228-.0595-1.2645-.072-1.6442-.079-4.848-.007-3.2037.0053-3.583.0607-4.848.05-1.169.2456-1.805.408-2.2282.216-.5613.4762-.96.895-1.3816.4188-.4217.8184-.6814 1.3783-.9003.423-.1651 1.0575-.3614 2.227-.4171 1.2655-.06 1.6447-.072 4.848-.079 3.2033-.007 3.5835.005 4.8495.0608 1.169.0508 1.8053.2445 2.228.408.5608.216.96.4754 1.3816.895.4217.4194.6816.8176.9005 1.3787.1653.4217.3617 1.056.4169 2.2263.0602 1.2655.0739 1.645.0796 4.848.0058 3.203-.0055 3.5834-.061 4.848-.051 1.17-.245 1.8055-.408 2.2294-.216.5604-.4763.96-.8954 1.3814-.419.4215-.8181.6811-1.3783.9-.4224.1649-1.0577.3617-2.2262.4174-1.2656.0595-1.6448.072-4.8493.079-3.2045.007-3.5825-.006-4.848-.0608M16.953 5.5864A1.44 1.44 0 1 0 18.39 4.144a1.44 1.44 0 0 0-1.437 1.4424M5.8385 12.012c.0067 3.4032 2.7706 6.1557 6.173 6.1493 3.4026-.0065 6.157-2.7701 6.1506-6.1733-.0065-3.4032-2.771-6.1565-6.174-6.1498-3.403.0067-6.156 2.771-6.1496 6.1738M8 12.0077a4 4 0 1 1 4.008 3.9921A3.9996 3.9996 0 0 1 8 12.0077"/>',
  x: '<path fill="#fff" d="M14.234 10.162 22.977 0h-2.072l-7.591 8.824L7.251 0H.258l9.168 13.343L.258 24H2.33l8.016-9.318L16.749 24h6.993zm-2.837 3.299-.929-1.329L3.076 1.56h3.182l5.965 8.532.929 1.329 7.754 11.09h-3.182z"/>',
  linkedin: '<rect x="5.5" y="9.5" width="2.6" height="9" fill="#fff"/><circle cx="6.8" cy="6.4" r="1.5" fill="#fff"/><path fill="#fff" d="M10.4 9.5h2.5v1.2c.5-.8 1.5-1.4 2.8-1.4 2.3 0 3.3 1.5 3.3 4v5.2h-2.6v-4.7c0-1.2-.4-1.9-1.4-1.9-1 0-1.5.7-1.5 1.9v4.7h-2.6z"/>',
  youtube: '<path fill="#fff" d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>',
  tiktok: '<path fill="#fff" d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>',
  whatsapp: '<path fill="#fff" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>',
  web: '<circle cx="12" cy="12" r="7.5" fill="none" stroke="#fff" stroke-width="1.6"/><path fill="none" stroke="#fff" stroke-width="1.6" d="M4.5 12h15M12 4.5c2.5 2.8 2.5 12.2 0 15M12 4.5c-2.5 2.8-2.5 12.2 0 15"/>',
}

/** SVG cuadrado con un glifo social centrado (para canvas y como data-URI en export). */
export function socialSvg(kind: SocialNetworkKind): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">${SOCIAL_GLYPHS[kind]}</svg>`
}

export const SOCIAL_BRANDS: Record<SocialNetworkKind, { color: string }> = {
  facebook: { color: '#0866ff' },
  instagram: { color: '#ff0069' },
  x: { color: '#000000' },
  linkedin: { color: '#0a66c2' },
  youtube: { color: '#ff0000' },
  tiktok: { color: '#000000' },
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
      const radius = block.borderRadius ? `border-radius:${block.borderRadius}px;` : ''
      const imgStyle =
        (block.widthAuto
          ? 'display:block;width:auto;max-width:100%;height:auto;border:0;'
          : 'display:block;width:100%;max-width:100%;height:auto;border:0;') + radius
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
