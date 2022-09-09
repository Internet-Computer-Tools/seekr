export class CrawlableLink {
  private readonly url: string

  constructor(url: string) {
    this.url = url
  }

  private isImage() {
    const regex =
      '^(?:(?<scheme>[^:\\/?#]+):)?(?:\\/\\/(?<authority>[^\\/?#]*))?(?<path>[^?#]*\\/)?(?<file>[^?#]*\\.(?<extension>[Jj][Pp][Ee]?[Gg]|[Pp][Nn][Gg]|[Gg][Ii][Ff]))(?:\\?(?<query>[^#]*))?(?:#(?<fragment>.*))?$'

    const match = this.url.match(regex)

    return match?.groups?.extension !== undefined
  }

  private isMailto() {
    return this.url.startsWith('mailto:')
  }

  private isTel() {
    return this.url.startsWith('tel:')
  }

  private isInternal() {
    return this.url.startsWith('/')
  }

  private isHttp() {
    return this.url.startsWith('http://') || this.url.startsWith('https://')
  }

  get isCrawlable() {
    if (this.isImage()) {
      return false
    }

    if (this.isMailto()) {
      return false
    }

    if (this.isTel()) {
      return false
    }

    if (this.isInternal()) {
      return false
    }

    return this.isHttp()
  }

  get hostname() {
    return new URL(this.url).hostname
  }

  get crawlableUrl() {
    return new URL(this.url).toString()
  }
}
