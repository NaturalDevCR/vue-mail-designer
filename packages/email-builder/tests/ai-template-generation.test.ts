import { describe, expect, it, vi } from 'vitest'
import {
  buildAiTemplateRequest,
  resolveAiTemplateContext,
  validateAiTemplateProposals,
} from '../src/ai/templateGeneration'
import { createColumn, createCustomBlock, createDocument, createRow } from '../src/schema'

describe('AI template generation contract', () => {
  it('resolves a plain context object', async () => {
    await expect(resolveAiTemplateContext({ language: 'es' })).resolves.toEqual({ language: 'es' })
  })

  it('resolves a context function at request time', async () => {
    const context = vi.fn().mockResolvedValue({ campaignId: 'current' })

    await expect(resolveAiTemplateContext(context)).resolves.toEqual({ campaignId: 'current' })
    expect(context).toHaveBeenCalledOnce()
  })

  it('builds create and edit requests with cloned designs', () => {
    const design = createDocument()
    const create = buildAiTemplateRequest({
      mode: 'create',
      prompt: 'Welcome',
      count: 1,
      context: {},
      design,
      mergeTags: [],
      customBlocks: [],
    })
    const edit = buildAiTemplateRequest({
      mode: 'edit',
      prompt: 'Make it elegant',
      count: 3,
      context: {},
      design,
      mergeTags: [],
      customBlocks: [],
    })

    expect(create.currentDesign).toBeUndefined()
    expect(edit.currentDesign).toEqual(design)
    expect(edit.currentDesign).not.toBe(design)
    expect(edit.count).toBe(3)
    expect(edit.designer.schemaVersion).toBe(1)
  })

  it('accepts valid proposals and rejects malformed or unknown custom blocks', () => {
    const valid = { title: 'Proposal', design: createDocument() }
    const validated = validateAiTemplateProposals([valid], [])

    expect(validated).toEqual([valid])
    expect(validated[0]).not.toBe(valid)
    expect(() => validateAiTemplateProposals([{ title: 'Broken', design: { rows: [] } }], [])).toThrow()

    const customDesign = createDocument()
    const row = createRow([100])
    const column = createColumn(100)
    column.blocks.push(createCustomBlock('missing', {}))
    row.columns = [column]
    customDesign.rows = [row]

    expect(() => validateAiTemplateProposals([{ title: 'Custom', design: customDesign }], [])).toThrow()
    expect(() => validateAiTemplateProposals([{ title: 'Custom', design: customDesign }], [{
      type: 'missing',
      label: 'Missing',
      defaultData: {},
      fields: [],
      render: () => '',
    }])).not.toThrow()
  })
})
