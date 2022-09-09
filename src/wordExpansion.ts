// WordExpansion expands a word into its additions, substitutions, transpositions,
// replacements, and deletions.
export class WordExpansion {
  public static readonly DefaultMinimumWordLength = 3

  private readonly minimumWordLength: number

  constructor(minimumWordLength = WordExpansion.DefaultMinimumWordLength) {
    this.minimumWordLength = minimumWordLength
  }

  /**
   * Expands the given word into its additions, substitutions, transpositions,
   * replacements, and deletions.
   * @param word - The word to expand.
   * @returns {unknown[]} An array of expanded words.
   */
  expand(word: string) {
    const pairify = (w: string, i: any) => [w.slice(0, i), w.slice(i)]
    const splitter = (word: string) =>
      Array(word.length + 1)
        .fill(word)
        .map(pairify)

    const _byLength =
      (len: number) =>
      // @ts-ignore
      ([a, b]) =>
        b.length > len

    let ALPHABETS = 'abcdefghijklmnopqrstuvwxyz0123456789'.split('')

    let flatten = (ary: string[][]) => Array.prototype.concat(...ary)

    let pairs = splitter(word)

    let deletes = pairs
      // @ts-ignore
      .filter(_byLength(0))
      .map(([a, b]) => a + b.slice(1))

    let transposes = pairs
      // @ts-ignore
      .filter(_byLength(1))
      .map(([a, b]) => a + b[1] + b[0] + b.slice(2))

    let replaces = flatten(
      pairs.map(([a, b]) => ALPHABETS.map((c) => a + c + b.slice(1)))
    )

    let inserts = flatten(
      pairs.map(([a, b]) => ALPHABETS.map((c) => a + c + b))
    )

    return Array.from(
      new Set(deletes.concat(transposes).concat(replaces).concat(inserts))
    ).filter((w) => w.length >= this.minimumWordLength)
  }
}
