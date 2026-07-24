import { z } from 'zod'

export const zAlign = z.enum(['left', 'center', 'right'])
export type Align = z.infer<typeof zAlign>

const zPadding = z.object({
  top: z.number(),
  right: z.number(),
  bottom: z.number(),
  left: z.number(),
})
export type Padding = z.infer<typeof zPadding>

export const zBackgroundImage = z.object({
  url: z.string(),
  repeat: z.enum(['no-repeat', 'repeat', 'repeat-x', 'repeat-y']),
  size: z.enum(['auto', 'cover', 'contain']),
  position: z.string(),
  // solo aplica a nivel de fila: si es true, la imagen cubre el ancho completo (fuera del
  // contenedor de contenido); si es false/ausente, queda confinada al ancho de contenido.
  fullWidth: z.boolean().default(false),
})
export type BackgroundImage = z.infer<typeof zBackgroundImage>

export const zBorder = z.object({
  width: z.number(),
  style: z.enum(['solid', 'dashed', 'dotted']),
  color: z.string(),
})
export type Border = z.infer<typeof zBorder>

export const zHeadingBlock = z.object({
  id: z.string(),
  type: z.literal('heading'),
  text: z.string(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  fontFamily: z.string().optional(),
  fontWeight: z.enum(['normal', 'bold']).default('bold'),
  style: z.object({
    color: z.string(),
    fontSize: z.number(),
    align: zAlign,
    lineHeight: z.number().default(1.3),
    letterSpacing: z.number().default(0),
    padding: zPadding,
  }),
  hideDesktop: z.boolean().optional(),
  hideMobile: z.boolean().optional(),
})

export const zTextBlock = z.object({
  id: z.string(),
  type: z.literal('text'),
  html: z.string(),
  fontFamily: z.string().optional(),
  // si son undefined, los links dentro del bloque heredan linkColor/linkUnderline del body
  linkColor: z.string().optional(),
  linkUnderline: z.boolean().optional(),
  style: z.object({
    color: z.string(),
    fontSize: z.number(),
    lineHeight: z.number(),
    letterSpacing: z.number().default(0),
    padding: zPadding,
  }),
  hideDesktop: z.boolean().optional(),
  hideMobile: z.boolean().optional(),
})

export const zImageBlock = z.object({
  id: z.string(),
  type: z.literal('image'),
  src: z.string(),
  alt: z.string(),
  href: z.string().optional(),
  target: z.enum(['_blank', '_self']).default('_blank'),
  widthPct: z.number().min(10).max(100),
  widthAuto: z.boolean().default(false),
  align: zAlign,
  style: z.object({ padding: zPadding }),
  hideDesktop: z.boolean().optional(),
  hideMobile: z.boolean().optional(),
})

export const zButtonBlock = z.object({
  id: z.string(),
  type: z.literal('button'),
  label: z.string(),
  href: z.string(),
  target: z.enum(['_blank', '_self']).default('_blank'),
  align: zAlign,
  widthPct: z.number().min(10).max(100).optional(),
  style: z.object({
    backgroundColor: z.string(),
    color: z.string(),
    fontSize: z.number(),
    lineHeight: z.number().default(1.2),
    letterSpacing: z.number().default(0),
    borderRadius: z.number(),
    innerPaddingX: z.number(),
    innerPaddingY: z.number(),
    border: zBorder.optional(),
    padding: zPadding,
  }),
  hideDesktop: z.boolean().optional(),
  hideMobile: z.boolean().optional(),
})

export const zDividerBlock = z.object({
  id: z.string(),
  type: z.literal('divider'),
  style: z.object({
    color: z.string(),
    lineStyle: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
    thickness: z.number(),
    widthPct: z.number().min(10).max(100),
    align: zAlign.default('center'),
    padding: zPadding,
  }),
  hideDesktop: z.boolean().optional(),
  hideMobile: z.boolean().optional(),
})

export const zSpacerBlock = z.object({
  id: z.string(),
  type: z.literal('spacer'),
  height: z.number().min(4).max(200),
  hideDesktop: z.boolean().optional(),
  hideMobile: z.boolean().optional(),
})

export const zSocialNetworkKind = z.enum([
  'facebook',
  'instagram',
  'x',
  'linkedin',
  'youtube',
  'tiktok',
  'whatsapp',
  'web',
])
export type SocialNetworkKind = z.infer<typeof zSocialNetworkKind>

export const zSocialBlock = z.object({
  id: z.string(),
  type: z.literal('social'),
  networks: z.array(z.object({ kind: zSocialNetworkKind, url: z.string() })),
  iconShape: z.enum(['circle', 'square', 'rounded']).default('circle'),
  iconSize: z.number(),
  spacing: z.number(),
  align: zAlign,
  style: z.object({ padding: zPadding }),
  hideDesktop: z.boolean().optional(),
  hideMobile: z.boolean().optional(),
})

export const zMenuBlock = z.object({
  id: z.string(),
  type: z.literal('menu'),
  items: z.array(z.object({ label: z.string(), href: z.string() })),
  separator: z.string(),
  align: zAlign,
  layout: z.enum(['horizontal', 'vertical']).default('horizontal'),
  fontFamily: z.string().optional(),
  fontWeight: z.enum(['normal', 'bold']).default('normal'),
  linkColor: z.string().optional(),
  style: z.object({
    color: z.string(),
    fontSize: z.number(),
    letterSpacing: z.number().default(0),
    itemPadding: zPadding.default({ top: 5, right: 15, bottom: 5, left: 15 }),
    padding: zPadding,
  }),
  hideDesktop: z.boolean().optional(),
  hideMobile: z.boolean().optional(),
})

export const zHtmlBlock = z.object({
  id: z.string(),
  type: z.literal('html'),
  code: z.string(),
  style: z.object({ padding: zPadding }).default({ padding: { top: 0, right: 0, bottom: 0, left: 0 } }),
  hideDesktop: z.boolean().optional(),
  hideMobile: z.boolean().optional(),
})

export const zVideoBlock = z.object({
  id: z.string(),
  type: z.literal('video'),
  thumbnailUrl: z.string(),
  videoUrl: z.string(),
  alt: z.string(),
  widthPct: z.number().min(10).max(100),
  style: z.object({ padding: zPadding }),
  hideDesktop: z.boolean().optional(),
  hideMobile: z.boolean().optional(),
})

export const zTableBlock = z.object({
  id: z.string(),
  type: z.literal('table'),
  rows: z.array(z.array(z.string())),
  headerRow: z.boolean(),
  stripedRows: z.boolean().default(false),
  style: z.object({
    borderColor: z.string(),
    borderWidth: z.number(),
    cellPadding: z.number(),
    headerBackground: z.string(),
    headerColor: z.string().optional(),
    fontSize: z.number(),
    color: z.string(),
    padding: zPadding,
  }),
  hideDesktop: z.boolean().optional(),
  hideMobile: z.boolean().optional(),
})

export const zGalleryBlock = z.object({
  id: z.string(),
  type: z.literal('gallery'),
  images: z.array(z.object({ src: z.string(), alt: z.string(), href: z.string().optional() })),
  columns: z.union([z.literal(2), z.literal(3), z.literal(4)]),
  gap: z.number(),
  style: z.object({ padding: zPadding }),
  hideDesktop: z.boolean().optional(),
  hideMobile: z.boolean().optional(),
})

export const zTimerBlock = z.object({
  id: z.string(),
  type: z.literal('timer'),
  endDate: z.string(),
  imageUrl: z.string(),
  alt: z.string(),
  widthPct: z.number().min(10).max(100),
  style: z.object({ padding: zPadding }),
  hideDesktop: z.boolean().optional(),
  hideMobile: z.boolean().optional(),
})

export const zCustomBlock = z.object({
  id: z.string(),
  type: z.literal('custom'),
  customType: z.string(),
  data: z.record(z.unknown()),
  hideDesktop: z.boolean().optional(),
  hideMobile: z.boolean().optional(),
})

export const zBlock = z.discriminatedUnion('type', [
  zHeadingBlock,
  zTextBlock,
  zImageBlock,
  zButtonBlock,
  zDividerBlock,
  zSpacerBlock,
  zSocialBlock,
  zMenuBlock,
  zHtmlBlock,
  zVideoBlock,
  zTableBlock,
  zGalleryBlock,
  zTimerBlock,
  zCustomBlock,
])

export const zColumn = z.object({
  id: z.string(),
  widthPct: z.number().min(5).max(100),
  style: z.object({
    backgroundColor: z.string(),
    padding: zPadding,
    border: zBorder.optional(),
    borderRadius: z.number().optional(),
  }),
  blocks: z.array(zBlock),
})

export const zRow = z.object({
  id: z.string(),
  style: z.object({
    backgroundColor: z.string(),
    // fondo del área de contenido (ancho de contenido), distinto del backgroundColor
    // que ahora bleedea a todo el ancho del cliente de correo.
    contentBackgroundColor: z.string().default('transparent'),
    padding: zPadding,
    borderRadius: z.number(),
    backgroundImage: zBackgroundImage.optional(),
  }),
  columns: z.array(zColumn),
  hideDesktop: z.boolean().optional(),
  hideMobile: z.boolean().optional(),
})

export const zEmailSettings = z.object({
  contentWidth: z.number().min(320).max(900),
  backgroundColor: z.string(),
  textColor: z.string().default('#000000'),
  fontFamily: z.string(),
  fontWeight: z.enum(['normal', 'bold']).default('normal'),
  preheader: z.string(),
  htmlTitle: z.string().default(''),
  contentAlignment: z.enum(['left', 'center']).default('center'),
  linkColor: z.string().default('#3b82f6'),
  linkUnderline: z.boolean().default(true),
  backgroundImage: zBackgroundImage.optional(),
})

export const zEmailDocument = z.object({
  version: z.literal(1),
  settings: zEmailSettings,
  rows: z.array(zRow),
})

export type HeadingBlock = z.infer<typeof zHeadingBlock>
export type TextBlock = z.infer<typeof zTextBlock>
export type ImageBlock = z.infer<typeof zImageBlock>
export type ButtonBlock = z.infer<typeof zButtonBlock>
export type DividerBlock = z.infer<typeof zDividerBlock>
export type SpacerBlock = z.infer<typeof zSpacerBlock>
export type SocialBlock = z.infer<typeof zSocialBlock>
export type MenuBlock = z.infer<typeof zMenuBlock>
export type HtmlBlock = z.infer<typeof zHtmlBlock>
export type VideoBlock = z.infer<typeof zVideoBlock>
export type TableBlock = z.infer<typeof zTableBlock>
export type GalleryBlock = z.infer<typeof zGalleryBlock>
export type TimerBlock = z.infer<typeof zTimerBlock>
export type CustomBlock = z.infer<typeof zCustomBlock>
export type Block = z.infer<typeof zBlock>
export type BlockType = Block['type']
export type Column = z.infer<typeof zColumn>
export type Row = z.infer<typeof zRow>
export type EmailSettings = z.infer<typeof zEmailSettings>
export type EmailDocument = z.infer<typeof zEmailDocument>
