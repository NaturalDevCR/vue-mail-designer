import type { Block, EmailDocument, Padding, Row, SocialNetworkKind } from '../schema'

export type RenderCtx = { fontFamily: string; linkColor: string; linkUnderline: boolean }

export const SOCIAL_BRANDS: Record<SocialNetworkKind, { label: string; color: string }> = {
  facebook: { label: 'f', color: '#1877f2' },
  instagram: { label: 'ig', color: '#e4405f' },
  x: { label: 'x', color: '#000000' },
  linkedin: { label: 'in', color: '#0a66c2' },
  youtube: { label: '▶', color: '#ff0000' },
  tiktok: { label: 'tt', color: '#010101' },
  whatsapp: { label: 'wa', color: '#25d366' },
  web: { label: '@', color: '#6b7280' },
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

function styleLinks(html: string, ctx: RenderCtx): string {
  return html.replace(
    /<a\s/g,
    `<a style="color:${ctx.linkColor};text-decoration:${ctx.linkUnderline ? 'underline' : 'none'};" `,
  )
}

/** Tabla 100% de una celda — wrapper estándar para el contenido de un bloque. */
function cellTable(innerTd: string): string {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">${innerTd}</table>`
}

export function renderBlock(block: Block, ctx: RenderCtx): string {
  switch (block.type) {
    case 'heading': {
      const s = block.style
      return cellTable(
        `<tr><td style="padding:${paddingCss(s.padding)};font-family:${ctx.fontFamily};font-size:${s.fontSize}px;line-height:1.3;font-weight:bold;color:${s.color};text-align:${s.align};">${escapeHtml(block.text)}</td></tr>`,
      )
    }
    case 'text': {
      const s = block.style
      return cellTable(
        `<tr><td style="padding:${paddingCss(s.padding)};font-family:${ctx.fontFamily};font-size:${s.fontSize}px;line-height:${s.lineHeight};color:${s.color};">${styleLinks(convertMergeTags(block.html), ctx)}</td></tr>`,
      )
    }
    case 'image': {
      const s = block.style
      if (!block.src) {
        return cellTable(`<tr><td style="padding:${paddingCss(s.padding)};"></td></tr>`)
      }
      const img = `<img src="${escapeHtml(block.src)}" alt="${escapeHtml(block.alt)}" width="100%" style="display:block;width:100%;max-width:100%;height:auto;border:0;">`
      const content = block.href ? `<a href="${escapeHtml(block.href)}" target="_blank">${img}</a>` : img
      return cellTable(
        `<tr><td align="${block.align}" style="padding:${paddingCss(s.padding)};">` +
        `<table role="presentation" width="${block.widthPct}%" cellpadding="0" cellspacing="0" border="0"><tr><td>${content}</td></tr></table>` +
        `</td></tr>`,
      )
    }
    case 'button': {
      const s = block.style
      return cellTable(
        `<tr><td align="${block.align}" style="padding:${paddingCss(s.padding)};">` +
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>` +
        `<td style="border-radius:${s.borderRadius}px;background-color:${s.backgroundColor};">` +
        `<a href="${escapeHtml(block.href)}" target="_blank" style="display:inline-block;padding:${s.innerPaddingY}px ${s.innerPaddingX}px;font-family:${ctx.fontFamily};font-size:${s.fontSize}px;font-weight:bold;color:${s.color};text-decoration:none;border-radius:${s.borderRadius}px;">${escapeHtml(block.label)}</a>` +
        `</td></tr></table></td></tr>`,
      )
    }
    case 'divider': {
      const s = block.style
      return cellTable(
        `<tr><td align="center" style="padding:${paddingCss(s.padding)};">` +
        `<table role="presentation" width="${s.widthPct}%" cellpadding="0" cellspacing="0" border="0"><tr>` +
        `<td style="border-top:${s.thickness}px solid ${s.color};font-size:0;line-height:0;">&nbsp;</td>` +
        `</tr></table></td></tr>`,
      )
    }
    case 'spacer':
      return cellTable(
        `<tr><td style="height:${block.height}px;font-size:0;line-height:0;">&nbsp;</td></tr>`,
      )
    case 'social': {
      const s = block.style
      const icons = block.networks
        .map(({ kind, url }) => {
          const brand = SOCIAL_BRANDS[kind]
          return (
            `<td style="padding:0 ${block.spacing / 2}px;">` +
            `<a href="${escapeHtml(url)}" target="_blank" style="display:inline-block;width:${block.iconSize}px;height:${block.iconSize}px;line-height:${block.iconSize}px;border-radius:50%;background-color:${brand.color};color:#ffffff;text-align:center;text-decoration:none;font-family:${ctx.fontFamily};font-size:${Math.round(block.iconSize * 0.45)}px;font-weight:bold;">${brand.label}</a>` +
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
      const sep = `<span style="padding:0 8px;color:${s.color};">${escapeHtml(block.separator)}</span>`
      const items = block.items
        .map((it) => `<a href="${escapeHtml(it.href)}" target="_blank" style="color:${s.color};font-family:${ctx.fontFamily};font-size:${s.fontSize}px;text-decoration:none;">${escapeHtml(it.label)}</a>`)
        .join(sep)
      return cellTable(
        `<tr><td align="${block.align}" style="padding:${paddingCss(s.padding)};font-family:${ctx.fontFamily};font-size:${s.fontSize}px;">${items}</td></tr>`,
      )
    }
    case 'html':
      return cellTable(`<tr><td>${block.code}</td></tr>`)
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
  }
}

function renderColumnBlocks(blocks: Block[], ctx: RenderCtx): string {
  return blocks.map((b) => renderBlock(b, ctx)).join('')
}

function renderRow(row: Row, contentWidth: number, ctx: RenderCtx): string {
  const rs = row.style
  const bg = rs.backgroundColor === 'transparent' ? '' : `background-color:${rs.backgroundColor};`
  const radius = rs.borderRadius > 0 ? `border-radius:${rs.borderRadius}px;` : ''
  const innerWidth = contentWidth - rs.padding.left - rs.padding.right // el padding de fila resta ancho disponible para las columnas

  const cols = row.columns
    .map((col) => {
      const pxWidth = Math.round((innerWidth * col.widthPct) / 100)
      const colBg = col.style.backgroundColor === 'transparent' ? '' : `background-color:${col.style.backgroundColor};`
      return (
        `<!--[if mso]><td width="${pxWidth}" valign="top"><![endif]-->` +
        `<div class="vmd-col" style="display:inline-block;width:100%;max-width:${pxWidth}px;vertical-align:top;font-size:14px;">` +
        `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="padding:${paddingCss(col.style.padding)};${colBg}">` +
        renderColumnBlocks(col.blocks, ctx) +
        `</td></tr></table></div>` +
        `<!--[if mso]></td><![endif]-->`
      )
    })
    .join('')

  return (
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>` +
    `<td style="${bg}${radius}padding:${paddingCss(rs.padding)};font-size:0;">` +
    `<!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><![endif]-->` +
    cols +
    `<!--[if mso]></tr></table><![endif]-->` +
    `</td></tr></table>`
  )
}

export function renderHtml(doc: EmailDocument): string {
  const { settings } = doc
  const ctx: RenderCtx = { fontFamily: settings.fontFamily, linkColor: settings.linkColor, linkUnderline: settings.linkUnderline }
  const preheader = settings.preheader
    ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(settings.preheader)}</div>`
    : ''

  const rows = doc.rows.map((r) => renderRow(r, settings.contentWidth, ctx)).join('')

  return `<!doctype html>
<html lang="es" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
  body { margin: 0; padding: 0; }
  img { border: 0; }
  @media (max-width: 480px) {
    .vmd-col { width: 100% !important; max-width: 100% !important; display: block !important; }
    .vmd-container { width: 100% !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${settings.backgroundColor};">
${preheader}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${settings.backgroundColor};">
<tr><td align="${settings.contentAlignment}" style="padding:16px 8px;">
<table role="presentation" width="${settings.contentWidth}" cellpadding="0" cellspacing="0" border="0" class="vmd-container" style="width:${settings.contentWidth}px;max-width:100%;">
<tr><td>
${rows}
</td></tr></table>
</td></tr></table>
</body>
</html>`
}
