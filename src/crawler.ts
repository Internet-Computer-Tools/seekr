import puppeteer, { Browser } from 'puppeteer'
import { CrawlableLink } from './crawlableLink'
import * as fs from 'fs'
const async = require('async')

// The Crawler crawls for content using Puppeteer to load urls into
// a DOM, and then searches the DOM 's content to see if any of it
// matches what's in the dictionary. If it does, it outputs the
// url and the matching content.
export class Crawler {
  static readonly DefaultSimultaneousRequests = 20
  static readonly DefaultRequestTimeout = 10000
  static readonly DefaultMinimumWordLength = 3
  static readonly DefaultItemsToProcessBeforeLogging = 100
  static readonly DefaultTakeScreenshots = false
  static readonly DefaultScreenshotPath = './screenshots'

  private dictionary: Set<string>
  private counter: number
  private readonly startTime: number
  private readonly simultaneousRequests: number
  private readonly requestTimeout: number
  private readonly debug: boolean
  private browser: Browser | null
  private urlQueue: any
  private readonly output: any
  private finished: boolean
  private crawledUrls: Set<string>
  private interestingDomains: Set<string>
  private readonly minimumWordLength: number
  private numberAdded: number
  private readonly itemsToProcessBeforeLogging: number
  private readonly takeScreenshots: boolean
  private readonly screenshotPath: string

  /**
   * Initializes a new instance of the Crawler class.
   * @constructor
   * @param {Set<string>} dictionary - The dictionary of content to search for.
   * @param {boolean} debug - True to enable debug logging.
   * @param takeScreenshots - True to take screenshots of pages that contain content from the dictionary.
   * @param output - The output function to use. Defaults to console.log
   * @param simultaneousRequests - The number of simultaneous requests to make.
   * @param requestTimeout - The timeout for each request.
   * @param interestingDomains = The domains to crawl from links found in the pages
   * @param crawledUrls - The urls that have already been crawled.
   * @param minimumWordLength - The minimum length of words to search for.
   * @param itemsToProcessBeforeLogging - The number of items to process before logging, if logging is enabled
   * @param screenshotPath - The path to save screenshots to.
   */
  constructor(
    dictionary: Iterable<string>,
    debug = false,
    takeScreenshots = Crawler.DefaultTakeScreenshots,
    output: any = console.log,
    simultaneousRequests = Crawler.DefaultSimultaneousRequests,
    requestTimeout = Crawler.DefaultRequestTimeout,
    interestingDomains: Iterable<string> = [],
    crawledUrls: Iterable<string> = [],
    minimumWordLength = Crawler.DefaultMinimumWordLength,
    itemsToProcessBeforeLogging = Crawler.DefaultItemsToProcessBeforeLogging,
    screenshotPath = Crawler.DefaultScreenshotPath
  ) {
    this.output = output
    this.dictionary = new Set<string>(dictionary)
    this.counter = 0
    this.startTime = performance.now()
    this.simultaneousRequests = simultaneousRequests
    this.requestTimeout = requestTimeout
    this.debug = debug
    this.browser = null
    this.finished = false
    this.crawledUrls = new Set<string>(crawledUrls)
    this.interestingDomains = new Set<string>(interestingDomains)
    this.minimumWordLength = minimumWordLength
    this.numberAdded = 0
    this.itemsToProcessBeforeLogging = itemsToProcessBeforeLogging
    this.takeScreenshots = takeScreenshots
    this.screenshotPath = screenshotPath
  }

  get isFinished() {
    return this.finished
  }

  formatDate(date: Date) {
    const padTo2Digits = (num: number) => {
      return num.toString().padStart(2, '0')
    }
    return (
      [
        date.getFullYear(),
        padTo2Digits(date.getMonth() + 1),
        padTo2Digits(date.getDate())
      ].join('-') +
      '_' +
      [
        padTo2Digits(date.getHours()),
        padTo2Digits(date.getMinutes()),
        padTo2Digits(date.getSeconds())
      ].join('')
    )
  }

  /**
   * Initializes the crawler by creating a new browser instance.
   * @returns {Promise<void>} A promise that resolves when the browser is ready.
   */
  async init() {
    if (this.debug) {
      this.output('Initializing crawler')
    }

    this.browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })

    this.urlQueue = async.queue(async (task: string, callback: any) => {
      const self = this
      await self.performCrawl(task, callback)
    }, this.simultaneousRequests)

    this.urlQueue.drain(async () => {
      this.finished = true

      if (this.debug) {
        this.output('Queue drained')
      }
      await this.close()
    })

    if (this.takeScreenshots) {
      if (!fs.existsSync(this.screenshotPath)) {
        fs.mkdirSync(this.screenshotPath, 0o744)
      }
    }
  }
  /**
   * Performs a crawl for the given url.
   * @param url
   * @param callback
   * @returns {Promise<void>} A promise that resolves when the crawl is complete.
   */
  private async performCrawl(url: string, callback: any) {
    if (this.crawledUrls.has(url)) {
      if (callback) {
        callback({ found: false, url: url, status: 'already crawled' })
        return
      }
    }

    this.crawledUrls.add(url)

    this.counter++

    // TODO: this should be its own logging class
    if (this.debug && this.counter % this.itemsToProcessBeforeLogging === 0) {
      this.output(
        `Processed ${this.counter} pages in ${(
          (performance.now() - this.startTime) /
          1000
        ).toFixed(2)} s. Percent complete: ${(
          this.counter / this.numberAdded
        ).toFixed(
          2
        )}. Total urls in queue: ${this.urlQueue.length()}, total added: ${
          this.numberAdded
        }`
      )
    }

    let result = null

    if (this.browser == null) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
    }

    let page = await this.browser.newPage()

    try {
      await page.goto(url, {
        timeout: this.requestTimeout,
        waitUntil: 'domcontentloaded'
      })

      const content = await page.content()

      const words = content
        .split(' ')
        .map((word: string) => word.toLowerCase())
        .filter((word: string) => word.length > this.minimumWordLength)

      // TODO: All of this href stuff definitely needs a class.
      // REFACTOR start
      const hrefsFromPage = await page.$$eval('a', (as: any) =>
        as.map((a: any) => a.href)
      )

      const hrefs = Array.from(new Set<string>(hrefsFromPage))

      let found = new Set<string>()

      const validLinks: Array<string> = hrefs
        .map((link: string) => new CrawlableLink(link))
        .filter((link: CrawlableLink) => {
          link.isCrawlable
        })
        .map((link: CrawlableLink) => link.crawlableUrl)

      validLinks
        .filter((link: string) => {
          this.interestingDomains.has(new CrawlableLink(link).hostname)
        })
        .forEach(this.enqueueCrawl)

      // REFACTOR end

      words.forEach((word: string) => {
        if (this.dictionary.has(word)) {
          found.add(word)
        }
      })

      if (found.size > 0) {
        result = {
          found: true,
          url: url,
          matches: Array.from(found),
          links: validLinks
        }

        if (this.takeScreenshots) {
          await page.screenshot({
            path: `${this.screenshotPath}/${new URL(url).href
              .replaceAll(':', '_')
              .replaceAll('/', '_')
              .replaceAll('.', '_')}_${this.formatDate(new Date())}.png`
          })
        }

        this.output(result)
      } else {
        result = { found: false, url: url, words: '' }
      }
    } catch (err) {
      result = { found: false, url: url, error: err }
      if (this.debug) {
        this.output(`Error crawling ${url}: ${err}`)
      }
    } finally {
      await page.close()
    }

    if (callback) {
      callback(result)
    }
  }

  /**
   * Closes the crawler by closing the browser instance.
   * @returns {Promise<void>} A promise that resolves when the browser is closed.
   */
  async close() {
    if (this.debug) {
      this.output(`Closing browser. Queue length: ${this.urlQueue.length()}`)
    }

    if (this.browser != null) {
      await this.browser.close()
    }
  }

  /**
   * Adds an url to the queue to be crawled.
   * @param url - The url to crawl.
   */
  enqueueCrawl(url: string) {
    this.urlQueue.push(url)
    this.numberAdded++
  }
}
