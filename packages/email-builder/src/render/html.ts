import type { Block, EmailDocument, Padding, Row } from '../schema'

export type RenderCtx = { fontFamily: string }

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
        `<tr><td style="padding:${paddingCss(s.padding)};font-family:${ctx.fontFamily};font-size:${s.fontSize}px;line-height:${s.lineHeight};color:${s.color};">${convertMergeTags(block.html)}</td></tr>`,
      )
    }
    default:
      // Tasks 6 y 7 completan el resto de los tipos.
      return ''
  }
}

function renderColumnBlocks(blocks: Block[], ctx: RenderCtx): string {
  return blocks.map((b) => renderBlock(b, ctx)).join('')
}

function renderRow(row: Row, contentWidth: number, ctx: RenderCtx): string {
  const rs = row.style
  const bg = rs.backgroundColor === 'transparent' ? '' : `background-color:${rs.backgroundColor};`
  const radius = rs.borderRadius > 0 ? `border-radius:${rs.borderRadius}px;` : ''
  const innerWidth = contentWidth // el padding de fila vive dentro de la celda

  const cols = row.columns
    .map((col) => {
      const pxWidth = Math.round((innerWidth * col.widthPct) / 100)
      const colBg = col.style.backgroundColor === 'transparent' ? '' : `background-color:${col.style.backgroundColor};`
      return (
        `<!--[if mso]><td width="${pxWidth}" valign="top"><![endif]-->` +
        `<div class="vmd-col" style="display:inline-block;width:${col.widthPct}%;min-width:280px;max-width:${pxWidth}px;vertical-align:top;font-size:14px;">` +
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
  const ctx: RenderCtx = { fontFamily: settings.fontFamily }
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
<tr><td align="center" style="padding:16px 8px;">
<table role="presentation" width="${settings.contentWidth}" cellpadding="0" cellspacing="0" border="0" class="vmd-container" style="width:${settings.contentWidth}px;max-width:100%;">
<tr><td>
${rows}
</td></tr></table>
</td></tr></table>
</body>
</html>`
}
