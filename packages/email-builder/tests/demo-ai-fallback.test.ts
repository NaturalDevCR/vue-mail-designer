import { describe, expect, it } from 'vitest'
import { rewriteDemoText } from '../../../apps/demo/src/demoAi'

describe('demo AI rewrite fallback', () => {
  it('returns rewritten copy without an explanatory preamble', () => {
    const result = rewriteDemoText(
      'Explore unforgettable destinations, thoughtful experiences, and everything you need to plan your next escape.',
      'more-casual',
    )

    expect(result).toBe('Find amazing destinations, great experiences, and everything you need to plan your next getaway.')
    expect(result).not.toMatch(/here is a smoother version|we refined this message|make it clearer/i)
  })
})
