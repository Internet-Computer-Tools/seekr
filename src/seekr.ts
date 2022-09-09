import packageInfo from '../package.json'
import { Command } from 'commander'
import { SeekOperation } from './seekOperation'

// The Seekr main class. This is the entry point for the application.
export class Seekr {
  private packageInfo: any
  constructor() {
    this.packageInfo = packageInfo
  }

  /**
   * Runs the Seekr application.
   * @returns {Promise<void>} A promise that resolves when the application is complete.
   */
  async run() {
    const program = new Command()

    program
      .name(this.packageInfo.name)
      .description(this.packageInfo.description)
      .version(this.packageInfo.version)

    program
      .command('seek')
      .description('Seek canisters that contain words from the dictionary')
      .option(
        '-i, --interesting-domains-file',
        'The file with a list of interesting domains that should be crawled',
        'interesting_domains.txt'
      )
      .option(
        '-w, --word-file',
        'The file with all of the words to seek',
        'dictionary.txt'
      )
      .option(
        '-s, --source',
        'The source of pages to seek',
        'internet-computer'
      )
      .option('-d, --debug', 'Whether to debug', false)
      .option(
        '-X, --stifle-expansion',
        'Whether to not expand the dictionary',
        false
      )
      .action(async (options) => {
        await new SeekOperation(options).perform()
      })

    await program.parse()
  }
}
