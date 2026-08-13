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
import { BLOCK_TYPES, type EmailDocument, zEmailDocument } from '../schema'

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
    },
  }
}

export function validateAiTemplateProposals(value: unknown, customBlocks: CustomBlockDef[]): AiTemplateProposal[] {
  if (!Array.isArray(value) || value.length === 0) throw new Error('AI returned no proposals.')
  const registered = new Set(customBlocks.map((block) => block.type))

  return value.map((proposal) => {
    const parsed = zAiTemplateProposal.parse(proposal)
    const design = zEmailDocument.parse(parsed.design)
    assertRegisteredCustomBlocks(design, registered)
    return clone({ ...parsed, design })
  })
}

export type { BuildAiTemplateRequestInput }
