import { z } from 'zod'
import type {
  AiTemplateContext,
  AiTemplateCustomBlock,
  AiTemplateMode,
  AiTemplateProposal,
  AiTemplateRequest,
  CustomBlockDef,
  MergeTagItem,
} from '../options'
import { BLOCK_TYPES, createBlock, createColumn, createDocument, createRow, type BackgroundImage, type Block, type BlockType, type Column, type EmailDocument, type Padding, type Row, zEmailDocument } from '../schema'
import { AI_TEMPLATE_OUTPUT_SCHEMA } from './templateSchema'

type BuildAiTemplateRequestInput = {
  mode: AiTemplateMode
  prompt: string
  count: 1 | 2 | 3
  context: Record<string, unknown>
  design: EmailDocument
  mergeTags: MergeTagItem[]
  customBlocks: CustomBlockDef[]
}

const zAiTemplateProposal = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional(),
  design: z.unknown(),
})

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}

function record(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function normalizePadding(value: unknown, fallback: Padding): Padding {
  const source = record(value)
  return {
    top: typeof source.top === 'number' ? source.top : fallback.top,
    right: typeof source.right === 'number' ? source.right : fallback.right,
    bottom: typeof source.bottom === 'number' ? source.bottom : fallback.bottom,
    left: typeof source.left === 'number' ? source.left : fallback.left,
  }
}

function clampNumber(value: unknown, fallback: number, min: number, max: number): number {
  const numberValue = typeof value === 'number' && Number.isFinite(value) ? value : fallback
  return Math.min(max, Math.max(min, numberValue))
}

function normalizeBackgroundImage(value: unknown): BackgroundImage | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined
  const source = record(value)
  const repeat = ['no-repeat', 'repeat', 'repeat-x', 'repeat-y'].includes(source.repeat as string) ? source.repeat as BackgroundImage['repeat'] : 'no-repeat'
  const size = ['auto', 'cover', 'contain'].includes(source.size as string) ? source.size as BackgroundImage['size'] : 'cover'
  return {
    url: typeof source.url === 'string' ? source.url : '',
    repeat,
    size,
    position: typeof source.position === 'string' ? source.position : 'center',
    fullWidth: typeof source.fullWidth === 'boolean' ? source.fullWidth : false,
  }
}

function normalizeBlock(value: unknown, customBlocks: CustomBlockDef[]): Block | unknown {
  const source = record(value)
  const type = source.type
  const standardType = BLOCK_TYPES.includes(type as BlockType) ? type as BlockType : undefined
  const base: Record<string, unknown> | undefined = standardType
    ? createBlock(standardType) as unknown as Record<string, unknown>
    : type === 'custom'
      ? { id: '', type: 'custom', customType: '', data: {}, style: { padding: { top: 0, right: 0, bottom: 0, left: 0 } } }
      : undefined
  if (!base) return value

  const sourceStyle = record(source.style)
  const baseStyle = record(base.style)
  const normalizedStyle: Record<string, unknown> = { ...baseStyle, ...sourceStyle }
  if ('padding' in baseStyle) normalizedStyle.padding = normalizePadding(sourceStyle.padding, normalizePadding(baseStyle.padding, { top: 0, right: 0, bottom: 0, left: 0 }))
  if ('itemPadding' in baseStyle) normalizedStyle.itemPadding = normalizePadding(sourceStyle.itemPadding, normalizePadding(baseStyle.itemPadding, { top: 5, right: 15, bottom: 5, left: 15 }))
  if (sourceStyle.border && typeof sourceStyle.border === 'object' && !Array.isArray(sourceStyle.border)) normalizedStyle.border = { width: 1, style: 'solid', color: '#e5e7eb', ...record(sourceStyle.border) }

  const normalized: Record<string, unknown> = { ...base, ...source, id: typeof source.id === 'string' && source.id ? source.id : base.id, style: normalizedStyle }
  if (type === 'custom') {
    const customType = typeof source.customType === 'string' ? source.customType : customBlocks[0]?.type ?? ''
    const customDefinition = customBlocks.find((block) => block.type === customType)
    normalized.customType = customType
    normalized.data = source.data && typeof source.data === 'object' && !Array.isArray(source.data) ? source.data : customDefinition?.defaultData ?? {}
  }
  if (type === 'image' || type === 'button' || type === 'divider' || type === 'video' || type === 'timer') normalized.widthPct = clampNumber(source.widthPct, Number(base.widthPct), 10, 100)
  if (type === 'gallery' && Array.isArray(source.images)) normalized.images = source.images.map((image) => ({ src: '', alt: '', ...record(image) }))
  if (type === 'menu' && Array.isArray(source.items)) normalized.items = source.items.map((item) => ({ label: '', href: 'https://example.com', ...record(item) }))
  if (type === 'social' && Array.isArray(source.networks)) normalized.networks = source.networks.map((network) => ({ kind: 'web', url: 'https://example.com', ...record(network) }))
  return normalized as Block
}

function normalizeColumn(value: unknown, customBlocks: CustomBlockDef[]): Column {
  const source = record(value)
  const base = createColumn(clampNumber(source.widthPct, 100, 5, 100))
  const sourceStyle = record(source.style)
  return {
    ...base,
    ...source,
    id: typeof source.id === 'string' && source.id ? source.id : base.id,
    widthPct: clampNumber(source.widthPct, base.widthPct, 5, 100),
    style: { ...base.style, ...sourceStyle, padding: normalizePadding(sourceStyle.padding, base.style.padding) },
    blocks: Array.isArray(source.blocks) ? source.blocks.map((block) => normalizeBlock(block, customBlocks) as Block) : [],
  }
}

function normalizeRow(value: unknown, customBlocks: CustomBlockDef[]): Row {
  const source = record(value)
  const base = createRow([100])
  const sourceStyle = record(source.style)
  return {
    ...base,
    ...source,
    id: typeof source.id === 'string' && source.id ? source.id : base.id,
    style: {
      ...base.style,
      ...sourceStyle,
      padding: normalizePadding(sourceStyle.padding, base.style.padding),
      ...(sourceStyle.backgroundImage ? { backgroundImage: normalizeBackgroundImage(sourceStyle.backgroundImage) } : {}),
    },
    columns: Array.isArray(source.columns) ? source.columns.map((column) => normalizeColumn(column, customBlocks)) : [],
  }
}

export function normalizeAiTemplateDesign(value: unknown, customBlocks: CustomBlockDef[]): EmailDocument {
  const source = record(value)
  if (source.version !== 1 || !Array.isArray(source.rows)) return value as EmailDocument
  const base = createDocument()
  const sourceSettings = record(source.settings)
  return {
    ...base,
    ...source,
    version: 1,
    settings: { ...base.settings, ...sourceSettings, ...(sourceSettings.backgroundImage ? { backgroundImage: normalizeBackgroundImage(sourceSettings.backgroundImage) } : {}) },
    rows: source.rows.map((row) => normalizeRow(row, customBlocks)),
  } as EmailDocument
}

function customBlockDescriptors(customBlocks: CustomBlockDef[]): AiTemplateCustomBlock[] {
  return customBlocks.map(({ render: _render, ...descriptor }) => clone(descriptor))
}

function assertRegisteredCustomBlocks(document: EmailDocument, registered: Set<string>): void {
  for (const row of document.rows) {
    for (const column of row.columns) {
      for (const block of column.blocks) {
        if (block.type === 'custom' && !registered.has(block.customType)) {
          throw new Error(`Unknown custom block type: ${block.customType}`)
        }
      }
    }
  }
}

export async function resolveAiTemplateContext(context?: AiTemplateContext): Promise<Record<string, unknown>> {
  if (!context) return {}
  const value = typeof context === 'function' ? await context() : context
  return { ...value }
}

export function buildAiTemplateRequest(input: BuildAiTemplateRequestInput): AiTemplateRequest {
  if (input.mode === 'edit' && !input.design) {
    throw new Error('An edit request requires a current design.')
  }

  return {
    mode: input.mode,
    prompt: input.prompt,
    count: input.count,
    ...(input.mode === 'edit' ? { currentDesign: clone(input.design) } : {}),
    context: clone(input.context),
    designer: {
      schemaVersion: 1,
      supportedBlocks: [...BLOCK_TYPES],
      customBlocks: customBlockDescriptors(input.customBlocks),
      mergeTags: clone(input.mergeTags),
      outputSchema: clone(AI_TEMPLATE_OUTPUT_SCHEMA),
    },
  }
}

export function validateAiTemplateProposals(value: unknown, customBlocks: CustomBlockDef[]): AiTemplateProposal[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error('AI returned no proposals.')
  const registered = new Set(customBlocks.map((block) => block.type))

  return value.map((proposal) => {
    const parsed = zAiTemplateProposal.parse(proposal)
    const design = zEmailDocument.parse(normalizeAiTemplateDesign(parsed.design, customBlocks))
    assertRegisteredCustomBlocks(design, registered)
    return clone({ ...parsed, design })
  })
}

export type { BuildAiTemplateRequestInput }
