import { describe, expect, it } from 'vitest'
import { DEFAULT_SPECIAL_LINKS, flattenMergeTags, isMergeTagGroup } from '../src/options'

describe('merge tags agrupados + special links', () => {
  it('flattenMergeTags aplana grupos y tags sueltos', () => {
    const flat = flattenMergeTags([
      { name: 'Email', value: 'email' },
      { name: 'Cliente', tags: [{ name: 'Nombre', value: 'first_name' }, { name: 'Apellido', value: 'last_name' }] },
    ])
    expect(flat.map((t) => t.value)).toEqual(['email', 'first_name', 'last_name'])
  })

  it('isMergeTagGroup distingue grupo de tag', () => {
    expect(isMergeTagGroup({ name: 'g', tags: [] })).toBe(true)
    expect(isMergeTagGroup({ name: 'x', value: 'y' })).toBe(false)
  })

  it('DEFAULT_SPECIAL_LINKS incluye cancelar suscripción', () => {
    expect(DEFAULT_SPECIAL_LINKS.some((l) => l.href.includes('unsubscribe'))).toBe(true)
  })
})
