import { describe, expect, test } from '@jest/globals'

import { WordExpansion } from './wordExpansion'

describe('WordExpansion', () => {
  describe('expand', () => {
    test('expands a word', () => {
      const word = 'at'
      const expanded = new WordExpansion().expand(word)
      expect(expanded.length).toEqual(180)

      expect(expanded).toContain('a')
      expect(expanded).toContain('at')
      expect(expanded).toContain('1t')
      expect(expanded).toContain('ate')
    })
  })
})
