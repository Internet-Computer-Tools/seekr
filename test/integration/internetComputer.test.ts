import { describe, expect, test } from '@jest/globals'
import { InternetComputer } from '../../src/internetComputer'

describe('InternetComputer', () => {
  describe('getTotalPages', () => {
    test('returns the total number of pages', async () => {
      const internetComputer = new InternetComputer()
      const totalPages = await internetComputer.getTotalPages()

      expect(totalPages).toBeGreaterThan(100)
    })
  })

  describe('fetchCanisterMetadata', () => {
    test('returns canisters for a page', async () => {
      const internetComputer = new InternetComputer()
      const canisters = await internetComputer.fetchCanisterMetadata(0)

      expect(canisters.length).toEqual(InternetComputer.DefaultLimit)
    })
  })
})
