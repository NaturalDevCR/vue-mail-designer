import { describe, expect, it } from 'vitest'
import { BUILTIN_TEMPLATES } from '../src/templates'
import { zEmailDocument } from '../src/schema'

describe('plantillas', () => {
  it('incluye al menos vacío + 4 diseños', () => {
    expect(BUILTIN_TEMPLATES.length).toBeGreaterThanOrEqual(5)
    expect(BUILTIN_TEMPLATES.some((t) => t.id === 'blank')).toBe(true)
  })

  it('cada plantilla construye un documento válido', () => {
    for (const tpl of BUILTIN_TEMPLATES) {
      const doc = tpl.build()
      const result = zEmailDocument.safeParse(doc)
      expect(result.success, `plantilla ${tpl.id} inválida`).toBe(true)
    }
  })

  it('las plantillas con contenido generan ids únicos en cada build', () => {
    const nl = BUILTIN_TEMPLATES.find((t) => t.id === 'newsletter')!
    const a = nl.build()
    const b = nl.build()
    const idsA = a.rows.flatMap((r) => [r.id, ...r.columns.map((c) => c.id)])
    const idsB = b.rows.flatMap((r) => [r.id, ...r.columns.map((c) => c.id)])
    expect(idsA[0]).not.toBe(idsB[0])
  })
})
