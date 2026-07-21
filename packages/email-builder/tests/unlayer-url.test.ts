import { describe, expect, it } from 'vitest'
import { unlayerSlugFromUrl } from '../src/import/unlayerUrl'

describe('unlayerSlugFromUrl', () => {
  it('extrae slug de la URL del studio', () => {
    expect(unlayerSlugFromUrl('https://studio.unlayer.com/create/valentines-day-flowers')).toBe('valentines-day-flowers')
  })
  it('acepta un slug pelado', () => {
    expect(unlayerSlugFromUrl('summer-sale')).toBe('summer-sale')
  })
  it('rechaza basura', () => {
    expect(unlayerSlugFromUrl('no es una url')).toBeNull()
    expect(unlayerSlugFromUrl('https://otro.com/x')).toBeNull()
  })
  it('tolera input no-string y vacío', () => {
    expect(unlayerSlugFromUrl(null as any)).toBeNull()
    expect(unlayerSlugFromUrl(123 as any)).toBeNull()
    expect(unlayerSlugFromUrl('')).toBeNull()
  })
})
