import puppeteer, { Browser } from 'puppeteer'
import { CrawlableLink } from './crawlableLink'
const async = require('async')

// The Crawler crawls for content using Puppeteer to load urls into
// a DOM, and then searches the DOM's content to see if any of it
// matches what's in the dictionary. If it does, it outputs the
// url and the matching content.
export class Crawler {
  static readonly DefaultSimultaneousRequests = 10
  static readonly DefaultRequestTimeout = 10000

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

  /**
   * Initializes a new instance of the Crawler class.
   * @constructor
   * @param {Set<string>} dictionary - The dictionary of content to search for.
   * @param {boolean} debug - True to enable debug logging.
   * @param output - The output function to use. Defaults to console.log
   * @param simultaneousRequests
   * @param requestTimeout
   * @param interestingDomains
   * @param crawledUrls
   */
  constructor(
    dictionary: Iterable<string>,
    debug = false,
    output: any = console.log,
    simultaneousRequests = Crawler.DefaultSimultaneousRequests,
    requestTimeout = Crawler.DefaultRequestTimeout,
    interestingDomains: Iterable<string> = [],
    crawledUrls: Iterable<string> = []
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
  }

  get isFinished() {
    return this.finished
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
  }

  private isValidLink(link: CrawlableLink) {
    return link.isCrawlable &&
      this.interestingDomains.has(link.hostname)
  }

  private analyzeLinks(links: string[]) {
    links.map((link: string) => new CrawlableLink(link))
    .filter(this.isValidLink)
    .map((link: CrawlableLink) => link.crawlableUrl)
    .forEach(this.enqueueCrawl)
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

    if (this.debug && this.counter % 1000 === 0) {
      this.output(
        `Processed ${this.counter} pages in ${(
          (performance.now() - this.startTime) /
          1000
        ).toFixed(2)} s.`
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

      const words = content.split(' ').map((word: string) => word.toLowerCase())

      const hrefs = await page.$$eval('a', (as: any) =>
        as.map((a: any) => a.href)
      )

      let found = new Set<string>()

      this.analyzeLinks(hrefs)

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
          links: hrefs
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
   * Adds a url to the queue to be crawled.
   * @param url - The url to crawl.
   */
  enqueueCrawl(url: string) {
    this.urlQueue.push(url)
  }
}
