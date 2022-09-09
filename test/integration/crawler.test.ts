import { describe, expect, test } from '@jest/globals'
import { Crawler } from '../../src/crawler'

describe('Crawler', () => {
  describe('enqueueCrawl', () => {
    test('expands a word', async () => {
      let results = new Array<string>()

      let resultCallback = (result: any) => {
        results.push(result)
      }

      const crawler = new Crawler(['dfinity'], false, resultCallback)
      await crawler.init()
      crawler.enqueueCrawl('https://dfinity.org/')

      while (!crawler.isFinished) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }

      expect(results.length).toEqual(1)
    })
  })
})
