import axios from 'axios'
import axiosThrottle from 'axios-request-throttle'

// The InternetComputer is a wrapper around the Internet Computer's
// Index API. It provides methods for reading canister metadata from
// the index.
export class InternetComputer {
  public static readonly DefaultBaseUrl =
    'https://ic-api.internetcomputer.org/api/v3/canisters'

  public static readonly DefaultLimit = 100

  public static readonly DefaultSimultaneousRequestsPerSecond = 10

  public static readonly DefaultMaximumNumberOfPages = 1000000

  private readonly baseUrl: string
  private readonly limit: number
  private readonly simultaneousRequestsPerSecond: number

  /**
   * Initializes a new instance of the InternetComputer class.
   */
  constructor(
    baseUrl = InternetComputer.DefaultBaseUrl,
    limit = InternetComputer.DefaultLimit,
    simultaneousRequestsPerSecond = InternetComputer.DefaultSimultaneousRequestsPerSecond
  ) {
    this.baseUrl = baseUrl
    this.limit = limit
    this.simultaneousRequestsPerSecond = simultaneousRequestsPerSecond

    axiosThrottle.use(axios, {
      requestsPerSecond: this.simultaneousRequestsPerSecond
    })
  }

  /**
   * Fetches the canister ids from the given canister index page.
   * @returns {Promise<*>} A promise that resolves to an array of canister ids.
   * @param pageNumber - The page number to fetch.
   */
  async fetchCanisterMetadata(pageNumber: number) {
    const url = `${this.baseUrl}?offset=${pageNumber * this.limit}&limit=${
      this.limit
    }`

    const page = await axios.get(url)
    return page.data.data
  }

  async getTotalPages() {
    const startingPage = await axios.get(`${this.baseUrl}?limit=0`)
    return Math.ceil(startingPage.data.total_canisters / this.limit)
  }

  /**
   * Fetches the canister metadata from Internet Computer index.
   * @returns {Promise<void>} A promise that resolves when the metadata is fetched.
   */
  async fetchAll(
    callback: any,
    stopAfter: number = InternetComputer.DefaultMaximumNumberOfPages
  ) {
    const pages = await this.getTotalPages()

    let count = 0

    let continueFetching = true

    for (const pageNumber of Array.from(Array(pages).keys())) {
      const canisterMetadata = await this.fetchCanisterMetadata(pageNumber)

      if (!continueFetching) {
        break
      }

      canisterMetadata
        .map((canister: any) => canister.canister_id)
        .forEach((canisterId: any) => {
          if (!continueFetching) {
            return
          }

          callback(`https://${canisterId}.raw.ic0.app`)

          count++

          if (count >= stopAfter) {
            continueFetching = false
          }
        })
    }
  }
}
