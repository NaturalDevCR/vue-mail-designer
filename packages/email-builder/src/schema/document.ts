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

export const zHeadingBlock = z.object({
  id: z.string(),
  type: z.literal('heading'),
  text: z.string(),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  style: z.object({
    color: z.string(),
    fontSize: z.number(),
    align: zAlign,
    padding: zPadding,
  }),
})

export const zTextBlock = z.object({
  id: z.string(),
  type: z.literal('text'),
  html: z.string(),
  style: z.object({
    color: z.string(),
    fontSize: z.number(),
    lineHeight: z.number(),
    padding: zPadding,
  }),
})

export const zImageBlock = z.object({
  id: z.string(),
  type: z.literal('image'),
  src: z.string(),
  alt: z.string(),
  href: z.string().optional(),
  widthPct: z.number().min(10).max(100),
  align: zAlign,
  style: z.object({ padding: zPadding }),
})

export const zButtonBlock = z.object({
  id: z.string(),
  type: z.literal('button'),
  label: z.string(),
  href: z.string(),
  align: zAlign,
  style: z.object({
    backgroundColor: z.string(),
    color: z.string(),
    fontSize: z.number(),
    borderRadius: z.number(),
    innerPaddingX: z.number(),
    innerPaddingY: z.number(),
    padding: zPadding,
  }),
})

export const zDividerBlock = z.object({
  id: z.string(),
  type: z.literal('divider'),
  style: z.object({
    color: z.string(),
    thickness: z.number(),
    widthPct: z.number().min(10).max(100),
    padding: zPadding,
  }),
})

export const zSpacerBlock = z.object({
  id: z.string(),
  type: z.literal('spacer'),
  height: z.number().min(4).max(200),
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
  iconSize: z.number(),
  spacing: z.number(),
  align: zAlign,
  style: z.object({ padding: zPadding }),
})

export const zMenuBlock = z.object({
  id: z.string(),
  type: z.literal('menu'),
  items: z.array(z.object({ label: z.string(), href: z.string() })),
  separator: z.string(),
  align: zAlign,
  style: z.object({
    color: z.string(),
    fontSize: z.number(),
    padding: zPadding,
  }),
})

export const zHtmlBlock = z.object({
  id: z.string(),
  type: z.literal('html'),
  code: z.string(),
})

export const zVideoBlock = z.object({
  id: z.string(),
  type: z.literal('video'),
  thumbnailUrl: z.string(),
  videoUrl: z.string(),
  alt: z.string(),
  widthPct: z.number().min(10).max(100),
  style: z.object({ padding: zPadding }),
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
])

export const zColumn = z.object({
  id: z.string(),
  widthPct: z.number().min(5).max(100),
  style: z.object({
    backgroundColor: z.string(),
    padding: zPadding,
  }),
  blocks: z.array(zBlock),
})

export const zRow = z.object({
  id: z.string(),
  style: z.object({
    backgroundColor: z.string(),
    padding: zPadding,
    borderRadius: z.number(),
  }),
  columns: z.array(zColumn),
})

export const zEmailSettings = z.object({
  contentWidth: z.number().min(320).max(900),
  backgroundColor: z.string(),
  fontFamily: z.string(),
  preheader: z.string(),
  contentAlignment: z.enum(['left', 'center']).default('center'),
  linkColor: z.string().default('#3b82f6'),
  linkUnderline: z.boolean().default(true),
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
export type Block = z.infer<typeof zBlock>
export type BlockType = Block['type']
export type Column = z.infer<typeof zColumn>
export type Row = z.infer<typeof zRow>
export type EmailSettings = z.infer<typeof zEmailSettings>
export type EmailDocument = z.infer<typeof zEmailDocument>
