import { createBlock, createDocument, createRow, zEmailDocument } from '../schema'
import type {
  Align,
  Block,
  ButtonBlock,
  Column,
  DividerBlock,
  EmailDocument,
  HeadingBlock,
  HtmlBlock,
  ImageBlock,
  Padding,
  Row,
  TextBlock,
} from '../schema'

const LEGAL_NOTE = 'Algunas imágenes provienen del CDN de Unlayer y podrían dejar de estar disponibles; sustitúyelas por tus propias imágenes.'

export function parseShorthandPadding(s: string | undefined): Padding {
  if (!s || !s.trim()) return { top: 0, right: 0, bottom: 0, left: 0 }
  const parts = s.trim().split(/\s+/).map((p) => parsePx(p, 0))
  const [a, b, c, d] = parts
  switch (parts.length) {
    case 1:
      return { top: a, right: a, bottom: a, left: a }
    case 2:
      return { top: a, right: b, bottom: a, left: b }
    case 3:
      return { top: a, right: b, bottom: c, left: b }
    default:
      return { top: a, right: b, bottom: c, left: d }
  }
}

export function parsePx(s: string | number | undefined, fallback = 0): number {
  if (typeof s === 'number') return s
  if (typeof s === 'string') {
    const m = s.match(/-?\d+(\.\d+)?/)
    if (m) return parseFloat(m[0])
  }
  return fallback
}

export function stripTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

function parsePercent(v: unknown, fallback: number): number {
  if (typeof v === 'number') return v
  if (typeof v === 'string') {
    const m = v.match(/-?\d+(\.\d+)?/)
    if (m) {
      const num = parseFloat(m[0])
      return v.includes('%') ? num / 100 : num
    }
  }
  return fallback
}

function getFontFamily(v: unknown): string | undefined {
  if (v && typeof v === 'object' && typeof (v as Record<string, unknown>).value === 'string') {
    return (v as Record<string, unknown>).value as string
  }
  return undefined
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n))
}

export function extractUnlayerDesign(json: unknown): { rows: unknown[]; values: Record<string, unknown> } {
  if (json && typeof json === 'object') {
    const obj = json as Record<string, unknown>

    if (obj.design && typeof obj.design === 'object') {
      const design = obj.design as Record<string, unknown>
      if (design.body && typeof design.body === 'object') {
        const fromBody = extractFromBody(design.body as Record<string, unknown>)
        if (fromBody) return fromBody
      }
    }

    if (obj.body && typeof obj.body === 'object') {
      const fromBody = extractFromBody(obj.body as Record<string, unknown>)
      if (fromBody) return fromBody
    }

    if (Array.isArray(obj.rows)) {
      const values = obj.values && typeof obj.values === 'object' ? (obj.values as Record<string, unknown>) : {}
      return { rows: obj.rows, values }
    }
  }

  throw new Error('No se reconoce el formato de Unlayer.')
}

function extractFromBody(body: Record<string, unknown>): { rows: unknown[]; values: Record<string, unknown> } | null {
  if (!Array.isArray(body.rows)) return null
  const values = body.values && typeof body.values === 'object' ? (body.values as Record<string, unknown>) : {}
  return { rows: body.rows, values }
}

export function unlayerToDocument(json: unknown): { document: EmailDocument; warnings: string[] } {
  const { rows: rawRows, values: bodyValues } = extractUnlayerDesign(json)
  const warnings = new Set<string>()
  const doc = createDocument()

  doc.settings.contentWidth = clamp(parsePx(bodyValues.contentWidth as string | number | undefined, doc.settings.contentWidth), 320, 900)
  if (typeof bodyValues.backgroundColor === 'string') doc.settings.backgroundColor = bodyValues.backgroundColor
  const fontFamily = getFontFamily(bodyValues.fontFamily)
  if (fontFamily) doc.settings.fontFamily = fontFamily
  if (typeof bodyValues.preheaderText === 'string') doc.settings.preheader = bodyValues.preheaderText
  doc.settings.contentAlignment = bodyValues.contentAlign === 'left' ? 'left' : 'center'

  const linkStyle = bodyValues.linkStyle as Record<string, unknown> | undefined
  if (linkStyle) {
    if (typeof linkStyle.linkColor === 'string') doc.settings.linkColor = linkStyle.linkColor
    if (typeof linkStyle.linkUnderline === 'boolean') doc.settings.linkUnderline = linkStyle.linkUnderline
  }

  doc.rows = rawRows.map((raw) => toRow(raw as Record<string, unknown>, warnings))

  const haystack = `${JSON.stringify(rawRows)} ${JSON.stringify(bodyValues)}`
  if (haystack.includes('unlayer.com')) {
    warnings.add(LEGAL_NOTE)
  }

  const document = zEmailDocument.parse(doc)
  return { document, warnings: Array.from(warnings) }
}

function toRow(raw: Record<string, unknown>, warnings: Set<string>): Row {
  const rawCells = Array.isArray(raw.cells) && raw.cells.length > 0 ? (raw.cells as number[]) : [1]
  const sum = rawCells.reduce((acc, c) => acc + (typeof c === 'number' ? c : 0), 0) || 1
  const widths = rawCells.map((c) => ((typeof c === 'number' ? c : 0) / sum) * 100)

  const row = createRow(widths)
  const values = (raw.values && typeof raw.values === 'object' ? raw.values : {}) as Record<string, unknown>

  if (typeof values.backgroundColor === 'string') row.style.backgroundColor = values.backgroundColor
  row.style.padding = parseShorthandPadding(values.padding as string | undefined)

  const borderRadius = parsePx(values.borderRadius as string | number | undefined, 0)
  if (borderRadius > 0) row.style.borderRadius = borderRadius

  if (typeof values.hideDesktop === 'boolean') row.hideDesktop = values.hideDesktop
  if (typeof values.hideMobile === 'boolean') row.hideMobile = values.hideMobile

  const bgImage = values.backgroundImage as Record<string, unknown> | undefined
  if (bgImage && typeof bgImage.url === 'string' && bgImage.url) {
    const repeat = bgImage.repeat as string | undefined
    const size = bgImage.size as string | undefined
    row.style.backgroundImage = {
      url: bgImage.url,
      repeat: (['no-repeat', 'repeat', 'repeat-x', 'repeat-y'] as const).includes(repeat as never)
        ? (repeat as 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y')
        : 'no-repeat',
      size: (['auto', 'cover', 'contain'] as const).includes(size as never) ? (size as 'auto' | 'cover' | 'contain') : 'cover',
      position: typeof bgImage.position === 'string' ? bgImage.position : 'center',
    }
  }

  const rawColumns = Array.isArray(raw.columns) ? (raw.columns as unknown[]) : []
  row.columns = row.columns.map((col, i) => {
    const rc = (rawColumns[i] && typeof rawColumns[i] === 'object' ? rawColumns[i] : {}) as Record<string, unknown>
    return toColumn(col, rc, warnings)
  })

  return row
}

function toColumn(col: Column, raw: Record<string, unknown>, warnings: Set<string>): Column {
  const values = (raw.values && typeof raw.values === 'object' ? raw.values : {}) as Record<string, unknown>

  if (typeof values.backgroundColor === 'string') col.style.backgroundColor = values.backgroundColor
  col.style.padding = parseShorthandPadding(values.padding as string | undefined)

  const borderRadius = parsePx(values.borderRadius as string | number | undefined, 0)
  col.style.borderRadius = borderRadius

  const border = values.border as Record<string, unknown> | undefined
  if (border) {
    const width = parsePx(border.borderTopWidth as string | number | undefined, 0)
    if (width > 0) {
      const style = border.borderTopStyle as string | undefined
      col.style.border = {
        width,
        style: (['solid', 'dashed', 'dotted'] as const).includes(style as never) ? (style as 'solid' | 'dashed' | 'dotted') : 'solid',
        color: typeof border.borderTopColor === 'string' ? border.borderTopColor : '#000000',
      }
    }
  }

  const contents = Array.isArray(raw.contents) ? (raw.contents as unknown[]) : []
  col.blocks = contents
    .map((c) => toBlock((c && typeof c === 'object' ? c : {}) as Record<string, unknown>, warnings))
    .filter((b): b is Block => b !== null)

  return col
}

function toAlign(v: unknown, fallback: Align): Align {
  return v === 'left' || v === 'center' || v === 'right' ? v : fallback
}

function toBlock(content: Record<string, unknown>, warnings: Set<string>): Block | null {
  const type = typeof content.type === 'string' ? content.type : ''
  const values = (content.values && typeof content.values === 'object' ? content.values : {}) as Record<string, unknown>

  switch (type) {
    case 'heading': {
      const b = createBlock('heading') as HeadingBlock
      b.text = stripTags(typeof values.text === 'string' ? values.text : '')
      const headingType = typeof values.headingType === 'string' ? values.headingType : 'h1'
      const level = parseInt(headingType.replace(/[^0-9]/g, ''), 10)
      b.level = level === 1 || level === 2 || level === 3 ? level : 1
      const fontFamily = getFontFamily(values.fontFamily)
      if (fontFamily) b.fontFamily = fontFamily
      b.style = {
        color: typeof values.color === 'string' ? values.color : b.style.color,
        fontSize: parsePx(values.fontSize as string | number | undefined, b.style.fontSize),
        align: toAlign(values.textAlign, 'left'),
        padding: parseShorthandPadding(values.containerPadding as string | undefined),
      }
      return b
    }
    case 'text': {
      const b = createBlock('text') as TextBlock
      if (typeof values.text === 'string') b.html = values.text
      const fontFamily = getFontFamily(values.fontFamily)
      if (fontFamily) b.fontFamily = fontFamily
      b.style = {
        color: typeof values.color === 'string' ? values.color : b.style.color,
        fontSize: parsePx(values.fontSize as string | number | undefined, b.style.fontSize),
        lineHeight: parsePercent(values.lineHeight, b.style.lineHeight),
        padding: parseShorthandPadding(values.containerPadding as string | undefined),
      }
      return b
    }
    case 'button': {
      const b = createBlock('button') as ButtonBlock
      b.label = stripTags(typeof values.text === 'string' ? values.text : '')
      const hrefObj = values.href as Record<string, unknown> | undefined
      const hrefVals = hrefObj?.values as Record<string, unknown> | undefined
      if (typeof hrefVals?.href === 'string') b.href = hrefVals.href
      b.align = toAlign(values.textAlign, 'center')
      const colors = values.buttonColors as Record<string, unknown> | undefined
      const innerPad = parseShorthandPadding(values.padding as string | undefined)
      b.style = {
        backgroundColor: typeof colors?.backgroundColor === 'string' ? colors.backgroundColor : b.style.backgroundColor,
        color: typeof colors?.color === 'string' ? colors.color : b.style.color,
        fontSize: parsePx(values.fontSize as string | number | undefined, b.style.fontSize),
        borderRadius: parsePx(values.borderRadius as string | number | undefined, b.style.borderRadius),
        innerPaddingX: innerPad.left,
        innerPaddingY: innerPad.top,
        padding: parseShorthandPadding(values.containerPadding as string | undefined),
      }
      return b
    }
    case 'divider': {
      const b = createBlock('divider') as DividerBlock
      const border = values.border as Record<string, unknown> | undefined
      b.style = {
        color: typeof border?.borderTopColor === 'string' ? border.borderTopColor : b.style.color,
        thickness: parsePx(border?.borderTopWidth as string | number | undefined, b.style.thickness),
        widthPct: parsePx(values.width as string | number | undefined, b.style.widthPct),
        padding: parseShorthandPadding(values.containerPadding as string | undefined),
      }
      return b
    }
    case 'image': {
      const b = createBlock('image') as ImageBlock
      const src = values.src as Record<string, unknown> | undefined
      if (typeof src?.url === 'string') b.src = src.url
      if (typeof values.altText === 'string') b.alt = values.altText
      const action = values.action as Record<string, unknown> | undefined
      const actionVals = action?.values as Record<string, unknown> | undefined
      if (typeof actionVals?.href === 'string' && actionVals.href) b.href = actionVals.href
      b.align = toAlign(values.textAlign, 'center')
      b.style = { padding: parseShorthandPadding(values.containerPadding as string | undefined) }
      return b
    }
    case 'html': {
      const b = createBlock('html') as HtmlBlock
      if (typeof values.html === 'string') b.code = values.html
      return b
    }
    default:
      warnings.add(`Bloque tipo "${type}" no soportado, omitido.`)
      return null
  }
}
