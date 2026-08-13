export type AiJsonSchema = Record<string, unknown>

const paddingSchema: AiJsonSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['top', 'right', 'bottom', 'left'],
  properties: {
    top: { type: 'number' }, right: { type: 'number' }, bottom: { type: 'number' }, left: { type: 'number' },
  },
}

const styleSchema = (properties: AiJsonSchema, required: string[] = []): AiJsonSchema => ({
  type: 'object', additionalProperties: false, required: [...required, 'padding'], properties: { ...properties, padding: paddingSchema },
})

const blockSchema = (type: string, properties: AiJsonSchema, required: string[]): AiJsonSchema => ({
  type: 'object', additionalProperties: false, required: ['id', 'type', ...required],
  properties: { id: { type: 'string' }, type: { const: type }, ...properties },
})

const align = { type: 'string', enum: ['left', 'center', 'right'] }
const target = { type: 'string', enum: ['_blank', '_self'] }
const number = { type: 'number' }
const string = { type: 'string' }
const boolean = { type: 'boolean' }

const blockSchemas: AiJsonSchema[] = [
  blockSchema('heading', { text: string, level: { type: 'integer', enum: [1, 2, 3, 4] }, fontFamily: string, fontWeight: { type: 'string', enum: ['normal', 'bold'] }, style: styleSchema({ color: string, fontSize: number, align, lineHeight: number, letterSpacing: number }, ['color', 'fontSize', 'align', 'lineHeight', 'letterSpacing']) }, ['text', 'level', 'fontWeight', 'style']),
  blockSchema('text', { html: string, fontFamily: string, linkColor: string, linkUnderline: boolean, style: styleSchema({ color: string, fontSize: number, align, lineHeight: number, letterSpacing: number }, ['color', 'fontSize', 'align', 'lineHeight', 'letterSpacing']) }, ['html', 'style']),
  blockSchema('image', { src: string, alt: string, href: string, target, widthPct: { type: 'number', minimum: 10, maximum: 100 }, widthAuto: boolean, align, style: styleSchema({}, []), borderRadius: number }, ['src', 'alt', 'target', 'widthPct', 'widthAuto', 'align', 'style']),
  blockSchema('button', { label: string, href: string, target, align, widthPct: { type: 'number', minimum: 10, maximum: 100 }, style: styleSchema({ backgroundColor: string, color: string, fontSize: number, lineHeight: number, letterSpacing: number, borderRadius: number, innerPaddingX: number, innerPaddingY: number, border: { type: 'object' } }, ['backgroundColor', 'color', 'fontSize', 'lineHeight', 'letterSpacing', 'borderRadius', 'innerPaddingX', 'innerPaddingY']) }, ['label', 'href', 'target', 'align', 'style']),
  blockSchema('divider', { style: styleSchema({ color: string, lineStyle: { type: 'string', enum: ['solid', 'dashed', 'dotted'] }, thickness: number, widthPct: { type: 'number', minimum: 10, maximum: 100 }, align }, ['color', 'lineStyle', 'thickness', 'widthPct', 'align']) }, ['style']),
  blockSchema('spacer', { height: { type: 'number', minimum: 4, maximum: 200 }, style: styleSchema({}, []) }, ['height', 'style']),
  blockSchema('social', { networks: { type: 'array', items: { type: 'object', required: ['kind', 'url'], properties: { kind: string, url: string } } }, iconShape: { type: 'string', enum: ['circle', 'square', 'rounded'] }, iconSize: number, spacing: number, align, style: styleSchema({}, []) }, ['networks', 'iconShape', 'iconSize', 'spacing', 'align', 'style']),
  blockSchema('menu', { items: { type: 'array', items: { type: 'object', required: ['label', 'href'], properties: { label: string, href: string } } }, separator: string, align, layout: { type: 'string', enum: ['horizontal', 'vertical'] }, fontFamily: string, fontWeight: { type: 'string', enum: ['normal', 'bold'] }, linkColor: string, style: styleSchema({ color: string, fontSize: number, letterSpacing: number, itemPadding: paddingSchema }, ['color', 'fontSize', 'letterSpacing', 'itemPadding']) }, ['items', 'separator', 'align', 'layout', 'style']),
  blockSchema('html', { code: string, style: styleSchema({}, []) }, ['code', 'style']),
  blockSchema('video', { thumbnailUrl: string, videoUrl: string, alt: string, widthPct: { type: 'number', minimum: 10, maximum: 100 }, style: styleSchema({}, []) }, ['thumbnailUrl', 'videoUrl', 'alt', 'widthPct', 'style']),
  blockSchema('table', { rows: { type: 'array', items: { type: 'array', items: string } }, headerRow: boolean, stripedRows: boolean, style: styleSchema({ borderColor: string, borderWidth: number, cellPadding: number, headerBackground: string, headerColor: string, fontSize: number, color: string }, ['borderColor', 'borderWidth', 'cellPadding', 'headerBackground', 'fontSize', 'color']) }, ['rows', 'headerRow', 'stripedRows', 'style']),
  blockSchema('gallery', { images: { type: 'array', items: { type: 'object', required: ['src', 'alt'], properties: { src: string, alt: string, href: string } } }, columns: { type: 'integer', enum: [2, 3, 4] }, gap: number, style: styleSchema({}, []) }, ['images', 'columns', 'gap', 'style']),
  blockSchema('timer', { endDate: string, imageUrl: string, alt: string, widthPct: { type: 'number', minimum: 10, maximum: 100 }, labels: { type: 'object', properties: { days: string, hours: string, minutes: string, seconds: string } }, style: styleSchema({ backgroundColor: string, borderColor: string, borderWidth: number, borderRadius: number, numberColor: string, labelColor: string, fontFamily: string }, ['backgroundColor', 'borderColor', 'borderWidth', 'borderRadius', 'numberColor', 'labelColor']) }, ['endDate', 'imageUrl', 'alt', 'widthPct', 'style']),
  blockSchema('custom', { customType: string, data: { type: 'object' }, style: styleSchema({}, []) }, ['customType', 'data', 'style']),
]

export const AI_EMAIL_DOCUMENT_SCHEMA: AiJsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'object', additionalProperties: false,
  required: ['version', 'settings', 'rows'],
  properties: {
    version: { const: 1 },
    settings: { type: 'object', additionalProperties: false, required: ['contentWidth', 'backgroundColor', 'textColor', 'fontFamily', 'fontWeight', 'preheader', 'htmlTitle', 'contentAlignment', 'linkColor', 'linkUnderline'], properties: { contentWidth: { type: 'number', minimum: 320, maximum: 900 }, backgroundColor: string, textColor: string, fontFamily: string, fontWeight: { type: 'string', enum: ['normal', 'bold'] }, preheader: string, htmlTitle: string, contentAlignment: { type: 'string', enum: ['left', 'center'] }, linkColor: string, linkUnderline: boolean, backgroundImage: { type: 'object' } } },
    rows: {
      type: 'array',
      items: {
        type: 'object', additionalProperties: false, required: ['id', 'style', 'columns'],
        properties: {
          id: string,
          style: { type: 'object', additionalProperties: false, required: ['backgroundColor', 'contentBackgroundColor', 'padding', 'borderRadius'], properties: { backgroundColor: string, contentBackgroundColor: string, padding: paddingSchema, borderRadius: number, backgroundImage: { type: 'object' } } },
          columns: {
            type: 'array',
            items: {
              type: 'object', additionalProperties: false, required: ['id', 'widthPct', 'style', 'blocks'],
              properties: {
                id: string,
                widthPct: { type: 'number', minimum: 5, maximum: 100 },
                style: { type: 'object', additionalProperties: false, required: ['backgroundColor', 'padding'], properties: { backgroundColor: string, padding: paddingSchema, border: { type: 'object' }, borderRadius: number } },
                blocks: { type: 'array', items: { oneOf: blockSchemas } },
              },
            },
          },
        },
      },
    },
  },
}

export const AI_TEMPLATE_OUTPUT_SCHEMA: AiJsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema', type: 'object', additionalProperties: false, required: ['proposals'],
  properties: { proposals: { type: 'array', minItems: 1, maxItems: 3, items: { type: 'object', additionalProperties: false, required: ['title', 'design'], properties: { title: { type: 'string', minLength: 1 }, description: string, design: AI_EMAIL_DOCUMENT_SCHEMA } } } },
}
