import { describe, expect, test } from '@jest/globals'

import { CrawlableLink } from './crawlableLink'

describe('CrawlableLink', () => {
  describe('isCrawlable', () => {
    describe('when the link is an image', function () {
      test('is false for a jpg image', () => {
        const link =
          'https://2dpe2-6yaaa-aaaad-qaeia-cai.raw.ic0.app/img/gallery-img-01.jpg'

        expect(new CrawlableLink(link).isCrawlable).toBe(false)
      })

      test('is false for a jpg image with a query', () => {
        const link =
          'https://2dpe2-6yaaa-aaaad-qaeia-cai.raw.ic0.app/img/gallery-img-01.jpg?s=1'

        expect(new CrawlableLink(link).isCrawlable).toBe(false)
      })

      test('is false for a png image', () => {
        const link =
          'https://2dpe2-6yaaa-aaaad-qaeia-cai.raw.ic0.app/img/gallery-img-01.png'

        expect(new CrawlableLink(link).isCrawlable).toBe(false)
      })
    })

    describe('when the link is a telephone number link  ', () => {
      test('is false', () => {
        const link = 'tel:0100200340'

        expect(new CrawlableLink(link).isCrawlable).toBe(false)
      })
    })

    describe('when the link is a mailto', () => {
      test('is false', () => {
        const link = 'mailto:mail@company.com'

        expect(new CrawlableLink(link).isCrawlable).toBe(false)
      })
    })

    describe('when the link is http', () => {
      test('is true', () => {
        const link = 'http://www.hotmail.com'

        expect(new CrawlableLink(link).isCrawlable).toBe(true)
      })
    })

    describe('when the link is https', () => {
      test('is true', () => {
        const link = 'https://2dpe2-6yaaa-aaaad-qaeia-cai.raw.ic0.app/#infinite'

        expect(new CrawlableLink(link).isCrawlable).toBe(true)
      })
    })
  })
})
