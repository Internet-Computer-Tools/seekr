import { describe, expect, test } from '@jest/globals'
import { SeekOperation } from '../../src/seekOperation'

describe('InternetComputer', () => {
  describe('perform', () => {
    test('returns canisters for a page', async () => {
      let results = new Array<string>()

      let resultCallback = (result: any) => {
        results.push(result)
      }

      const seekOperation = new SeekOperation({
        debug: true,
        stifleExpansion: true,
        wordFile: 'test/integration/words.txt'
      })

      await seekOperation.perform(resultCallback, 1)

      if (!seekOperation.isFinished) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
      expect(results).toEqual(['Initializing crawler'])
    })
  })
})
