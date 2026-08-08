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
  MenuBlock,
  Padding,
  Row,
  SocialBlock,
  SocialNetworkKind,
  TextBlock,
} from '../schema'

const LEGAL_NOTE = 'Algunas imágenes provienen del CDN de Unlayer y podrían dejar de estar disponibles; sustitúyelas por tus propias imágenes.'
const MOBILE_OVERRIDE_NOTE = 'Estilos móviles específicos de Unlayer no se importaron.'
const DISPLAY_CONDITION_NOTE = 'Condiciones de visualización no soportadas.'
const GOOGLE_FONT_NOTE = 'Fuentes de Google referenciadas; cárgalas en tu plataforma.'
const BORDER_SIDES_NOTE = 'Bordes de columna por-lado colapsados a uniforme.'

const UNLAYER_SOCIAL_MAP: Record<string, SocialNetworkKind> = {
  facebook: 'facebook',
  instagram: 'instagram',
  twitter: 'x',
  x: 'x',
  linkedin: 'linkedin',
  youtube: 'youtube',
  tiktok: 'tiktok',
  whatsapp: 'whatsapp',
}

function toSocialKind(name: unknown): SocialNetworkKind {
  if (typeof name === 'string') {
    const kind = UNLAYER_SOCIAL_MAP[name.trim().toLowerCase()]
    if (kind) return kind
  }
  return 'web'
}

function checkCommonWarnings(values: Record<string, unknown>, warnings: Set<string>): void {
  if (values._override) warnings.add(MOBILE_OVERRIDE_NOTE)
  if (values.displayCondition !== undefined && values.displayCondition !== null) warnings.add(DISPLAY_CONDITION_NOTE)
  const fontFamily = values.fontFamily as Record<string, unknown> | undefined
  if (fontFamily && typeof fontFamily === 'object' && typeof fontFamily.url === 'string' && fontFamily.url) {
    warnings.add(GOOGLE_FONT_NOTE)
  }
}

export function parseShorthandPadding(s: unknown): Padding {
  if (typeof s !== 'string' || !s.trim()) return { top: 0, right: 0, bottom: 0, left: 0 }
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

const HTML_ENTITY_MAP: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
}

export function stripTags(html: string): string {
  const noTags = html.replace(/<[^>]*>/g, '')
  const decoded = noTags.replace(/&nbsp;|&amp;|&lt;|&gt;|&quot;|&#39;/gi, (m) => HTML_ENTITY_MAP[m.toLowerCase()] ?? m)
  return decoded.replace(/\s+/g, ' ').trim()
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

type BgImage = { url: string; repeat: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y'; size: 'auto' | 'cover' | 'contain'; position: string; fullWidth: boolean }

function parseBackgroundImage(raw: unknown): BgImage | null {
  if (!raw || typeof raw !== 'object') return null
  const bg = raw as Record<string, unknown>
  if (typeof bg.url !== 'string' || !bg.url) return null
  const repeat = bg.repeat as string | undefined
  const size = bg.size as string | undefined
  return {
    url: bg.url,
    repeat: (['no-repeat', 'repeat', 'repeat-x', 'repeat-y'] as const).includes(repeat as never)
      ? (repeat as BgImage['repeat'])
      : 'no-repeat',
    // Unlayer usa size 'custom'/'cover'/'contain'/'auto'; lo que no reconocemos → cover
    size: (['auto', 'cover', 'contain'] as const).includes(size as never) ? (size as BgImage['size']) : 'cover',
    position: typeof bg.position === 'string' ? bg.position : 'center',
    // Unlayer: backgroundImage.fullWidth → la imagen bleedea fuera del contenedor de contenido
    fullWidth: bg.fullWidth === true,
  }
}

type ParsedBorder = { width: number; style: 'solid' | 'dashed' | 'dotted'; color: string }

/** Colapsa el borde por-lado de Unlayer a uno uniforme (desde el lado superior); advierte si los lados difieren. */
function parseUnlayerBorder(raw: unknown, warnings: Set<string>): ParsedBorder | null {
  if (!raw || typeof raw !== 'object') return null
  const border = raw as Record<string, unknown>
  const width = parsePx(border.borderTopWidth as string | number | undefined, 0)
  if (width <= 0) return null
  const style = border.borderTopStyle as string | undefined
  const topColor = typeof border.borderTopColor === 'string' ? border.borderTopColor : undefined
  const widthsDiffer = (['borderRightWidth', 'borderBottomWidth', 'borderLeftWidth'] as const)
    .some((k) => k in border && parsePx(border[k] as string | number | undefined, 0) !== width)
  const colorsDiffer = (['borderRightColor', 'borderBottomColor', 'borderLeftColor'] as const)
    .some((k) => k in border && border[k] !== topColor)
  if (widthsDiffer || colorsDiffer) warnings.add(BORDER_SIDES_NOTE)
  return {
    width,
    style: (['solid', 'dashed', 'dotted'] as const).includes(style as never) ? (style as 'solid' | 'dashed' | 'dotted') : 'solid',
    color: topColor ?? '#000000',
  }
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
  if (typeof bodyValues.textColor === 'string') doc.settings.textColor = bodyValues.textColor
  const fontFamily = getFontFamily(bodyValues.fontFamily)
  if (fontFamily) doc.settings.fontFamily = fontFamily
  if (typeof bodyValues.preheaderText === 'string') doc.settings.preheader = bodyValues.preheaderText
  doc.settings.contentAlignment = bodyValues.contentAlign === 'left' ? 'left' : 'center'
  const bodyBg = parseBackgroundImage(bodyValues.backgroundImage)
  if (bodyBg) doc.settings.backgroundImage = bodyBg

  const linkStyle = bodyValues.linkStyle as Record<string, unknown> | undefined
  if (linkStyle) {
    if (typeof linkStyle.linkColor === 'string') doc.settings.linkColor = linkStyle.linkColor
    if (typeof linkStyle.linkUnderline === 'boolean') doc.settings.linkUnderline = linkStyle.linkUnderline
  }

  doc.rows = rawRows.map((raw) => toRow(raw as Record<string, unknown>, warnings))

  const haystack = `${JSON.stringify(rawRows)} ${JSON.stringify(bodyValues)}`
  if (haystack.includes('cdn.templates.unlayer.com')) {
    warnings.add(LEGAL_NOTE)
  }

  const document = zEmailDocument.parse(doc)
  return { document, warnings: Array.from(warnings) }
}

function toRow(raw: Record<string, unknown>, warnings: Set<string>): Row {
  const rawCells = Array.isArray(raw.cells) && raw.cells.length > 0 ? (raw.cells as unknown[]) : [1]
  const numericCells = rawCells.map((c) => (typeof c === 'number' && Number.isFinite(c) ? c : 0))
  const sum = numericCells.reduce((acc, c) => acc + c, 0)
  const n = numericCells.length
  const widths = sum > 0
    ? numericCells.map((c) => clamp((c / sum) * 100, 5, 100))
    : numericCells.map(() => clamp(100 / n, 5, 100))

  const row = createRow(widths)
  const values = (raw.values && typeof raw.values === 'object' ? raw.values : {}) as Record<string, unknown>
  checkCommonWarnings(values, warnings)

  if (typeof values.backgroundColor === 'string') row.style.backgroundColor = values.backgroundColor
  if (typeof values.columnsBackgroundColor === 'string') row.style.contentBackgroundColor = values.columnsBackgroundColor
  row.style.padding = parseShorthandPadding(values.padding as string | undefined)

  const borderRadius = parsePx(values.borderRadius as string | number | undefined, 0)
  if (borderRadius > 0) row.style.borderRadius = borderRadius

  if (typeof values.hideDesktop === 'boolean') row.hideDesktop = values.hideDesktop
  if (typeof values.hideMobile === 'boolean') row.hideMobile = values.hideMobile

  const rowBg = parseBackgroundImage(values.backgroundImage)
  if (rowBg) row.style.backgroundImage = rowBg

  const rawColumns = Array.isArray(raw.columns) ? (raw.columns as unknown[]) : []
  row.columns = row.columns.map((col, i) => {
    const rc = (rawColumns[i] && typeof rawColumns[i] === 'object' ? rawColumns[i] : {}) as Record<string, unknown>
    return toColumn(col, rc, warnings)
  })

  return row
}

function toColumn(col: Column, raw: Record<string, unknown>, warnings: Set<string>): Column {
  const values = (raw.values && typeof raw.values === 'object' ? raw.values : {}) as Record<string, unknown>
  checkCommonWarnings(values, warnings)

  if (typeof values.backgroundColor === 'string') col.style.backgroundColor = values.backgroundColor
  col.style.padding = parseShorthandPadding(values.padding as string | undefined)

  const borderRadius = parsePx(values.borderRadius as string | number | undefined, 0)
  col.style.borderRadius = borderRadius

  const colBorder = parseUnlayerBorder(values.border, warnings)
  if (colBorder) col.style.border = colBorder

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
  checkCommonWarnings(values, warnings)

  switch (type) {
    case 'heading': {
      const b = createBlock('heading') as HeadingBlock
      b.text = stripTags(typeof values.text === 'string' ? values.text : '')
      const headingType = typeof values.headingType === 'string' ? values.headingType : 'h1'
      const level = parseInt(headingType.replace(/[^0-9]/g, ''), 10)
      b.level = level === 1 || level === 2 || level === 3 || level === 4 ? level : 1
      const fontFamily = getFontFamily(values.fontFamily)
      if (fontFamily) b.fontFamily = fontFamily
      if (values.fontWeight === 'normal' || values.fontWeight === 'bold') b.fontWeight = values.fontWeight
      b.style = {
        color: typeof values.color === 'string' ? values.color : b.style.color,
        fontSize: parsePx(values.fontSize as string | number | undefined, b.style.fontSize),
        align: toAlign(values.textAlign, 'left'),
        lineHeight: parsePercent(values.lineHeight, b.style.lineHeight),
        letterSpacing: parsePx(values.letterSpacing as string | number | undefined, b.style.letterSpacing),
        padding: parseShorthandPadding(values.containerPadding as string | undefined),
      }
      return b
    }
    case 'text': {
      const b = createBlock('text') as TextBlock
      if (typeof values.text === 'string') b.html = values.text
      const fontFamily = getFontFamily(values.fontFamily)
      if (fontFamily) b.fontFamily = fontFamily
      const linkStyle = values.linkStyle as Record<string, unknown> | undefined
      if (typeof linkStyle?.linkColor === 'string') b.linkColor = linkStyle.linkColor
      if (typeof linkStyle?.linkUnderline === 'boolean') b.linkUnderline = linkStyle.linkUnderline
      b.style = {
        color: typeof values.color === 'string' ? values.color : b.style.color,
        fontSize: parsePx(values.fontSize as string | number | undefined, b.style.fontSize),
        lineHeight: parsePercent(values.lineHeight, b.style.lineHeight),
        letterSpacing: parsePx(values.letterSpacing as string | number | undefined, b.style.letterSpacing),
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
      if (hrefVals?.target === '_self' || hrefVals?.target === '_blank') b.target = hrefVals.target
      b.align = toAlign(values.textAlign, 'center')
      const colors = values.buttonColors as Record<string, unknown> | undefined
      const innerPad = parseShorthandPadding(values.padding as string | undefined)
      b.style = {
        backgroundColor: typeof colors?.backgroundColor === 'string' ? colors.backgroundColor : b.style.backgroundColor,
        color: typeof colors?.color === 'string' ? colors.color : b.style.color,
        fontSize: parsePx(values.fontSize as string | number | undefined, b.style.fontSize),
        lineHeight: parsePercent(values.lineHeight, b.style.lineHeight),
        letterSpacing: parsePx(values.letterSpacing as string | number | undefined, b.style.letterSpacing),
        borderRadius: parsePx(values.borderRadius as string | number | undefined, b.style.borderRadius),
        innerPaddingX: innerPad.left,
        innerPaddingY: innerPad.top,
        border: parseUnlayerBorder(values.border, warnings) ?? undefined,
        padding: parseShorthandPadding(values.containerPadding as string | undefined),
      }
      // ancho fijo del botón (size.width tipo "70%", autoWidth:false)
      const size = values.size as Record<string, unknown> | undefined
      if (size && size.autoWidth === false && typeof size.width === 'string') {
        const w = Math.round(parsePx(size.width, 0))
        if (w >= 10 && w <= 100) b.widthPct = w
      }
      return b
    }
    case 'divider': {
      const b = createBlock('divider') as DividerBlock
      const border = values.border as Record<string, unknown> | undefined
      const lineStyle = border?.borderTopStyle
      b.style = {
        color: typeof border?.borderTopColor === 'string' ? border.borderTopColor : b.style.color,
        lineStyle: lineStyle === 'dashed' || lineStyle === 'dotted' ? lineStyle : 'solid',
        thickness: parsePx(border?.borderTopWidth as string | number | undefined, b.style.thickness),
        widthPct: clamp(parsePx(values.width as string | number | undefined, b.style.widthPct), 10, 100),
        align: toAlign(values.align, 'center'),
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
      if (actionVals?.target === '_self' || actionVals?.target === '_blank') b.target = actionVals.target
      b.align = toAlign(values.textAlign, 'center')
      // El ancho vive dentro de `src` (`maxWidth` tipo "67%" + `autoWidth`), no en `values.width`
      // —que las plantillas stock traen en null—. Se mantiene `values.width` como respaldo por si
      // alguna exportación vieja lo usa. Mismo criterio que el `size.width` del botón.
      const widthSrc = (values.width as Record<string, unknown> | undefined) ?? undefined
      const autoWidth = src?.autoWidth ?? widthSrc?.autoWidth
      if (typeof autoWidth === 'boolean') b.widthAuto = autoWidth
      const maxWidth = src?.maxWidth ?? widthSrc?.width
      if (b.widthAuto === false && (typeof maxWidth === 'string' || typeof maxWidth === 'number')) {
        const w = Math.round(parsePx(maxWidth, 0))
        if (w >= 10 && w <= 100) b.widthPct = w
      }
      b.style = { padding: parseShorthandPadding(values.containerPadding as string | undefined) }
      return b
    }
    case 'html': {
      const b = createBlock('html') as HtmlBlock
      if (typeof values.html === 'string') b.code = values.html
      b.style = { padding: parseShorthandPadding(values.containerPadding as string | undefined) }
      return b
    }
    case 'social': {
      const icons = values.icons as Record<string, unknown> | undefined
      const iconList = icons?.icons
      if (!Array.isArray(iconList)) {
        warnings.add('Bloque social sin íconos reconocibles, omitido.')
        return null
      }
      const b = createBlock('social') as SocialBlock
      b.networks = iconList
        .map((icon) => {
          const rec = (icon && typeof icon === 'object' ? icon : {}) as Record<string, unknown>
          return { kind: toSocialKind(rec.name), url: typeof rec.url === 'string' ? rec.url : '' }
        })
      b.align = toAlign(values.align, 'center')
      const spacing = values.spacing
      if (typeof spacing === 'number' || typeof spacing === 'string') b.spacing = parsePx(spacing, b.spacing)
      const iconType = icons?.iconType
      if (iconType === 'square' || iconType === 'rounded') b.iconShape = iconType
      b.style = { padding: parseShorthandPadding(values.containerPadding as string | undefined) }
      return b
    }
    case 'menu': {
      const menu = values.menu as Record<string, unknown> | undefined
      const rawItems = Array.isArray(values.items) ? values.items : Array.isArray(menu?.items) ? menu?.items : undefined
      if (!Array.isArray(rawItems)) {
        warnings.add('Bloque menú sin ítems reconocibles, omitido.')
        return null
      }
      const b = createBlock('menu') as MenuBlock
      b.items = rawItems.map((item) => {
        const rec = (item && typeof item === 'object' ? item : {}) as Record<string, unknown>
        const rawLabel = typeof rec.text === 'string' ? rec.text : typeof rec.label === 'string' ? rec.label : ''
        const label = stripTags(rawLabel)
        const link = rec.link as Record<string, unknown> | undefined
        const linkValues = link?.values as Record<string, unknown> | undefined
        const href = typeof linkValues?.href === 'string'
          ? linkValues.href
          : typeof rec.href === 'string'
            ? rec.href
            : ''
        return { label, href }
      })
      b.align = toAlign(values.align, 'center')
      // Unlayer usa textColor/linkColor para el color de los ítems del menú
      const menuColor = [values.color, values.linkColor, values.textColor].find((c) => typeof c === 'string' && c)
      if (typeof menuColor === 'string') b.style.color = menuColor
      b.style.fontSize = parsePx(values.fontSize as string | number | undefined, b.style.fontSize)
      if (typeof values.separator === 'string' && values.separator) b.separator = values.separator
      if (values.layout === 'vertical' || values.layout === 'horizontal') b.layout = values.layout
      // En el menú, Unlayer separa el padding del bloque (`containerPadding`) del de CADA ítem
      // (`padding`): son esos px por lado los que separan los ítems entre sí. Si no viene, se
      // conserva el del bloque de fábrica en vez de dejarlo en cero.
      if (typeof values.padding === 'string' && values.padding.trim()) {
        b.style.itemPadding = parseShorthandPadding(values.padding)
      }
      b.style.padding = parseShorthandPadding(values.containerPadding as string | undefined)
      return b
    }
    default:
      warnings.add(`Bloque tipo "${type}" no soportado, omitido.`)
      return null
  }
}
