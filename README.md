# seekr
A tool for finding and pages that contain words or phrases in the DOM.

## Overview

seekr is a tool for finding and pages that contain words or phrases in the DOM.
It is a command line tool that takes a list of words or phrases in a file, and
traverses pages in search of those terms in the DOM. There is a feature that
will expand each word in the list to its additions, subtractions, substitutions,
and transpositions, and search for those as well. The tool will output a list of
pages that contain the terms.

seekr is currently wired to the Internet Computer as its source of pages to
search. It can be easily modified to search other sources.

## Requirements

seekr requires:
- [node.js](https://nodejs.org/)
- [npm](https://www.npmjs.com/)
- [typescript](https://www.typescriptlang.org/)

## Installation

```bash
npm install seekr
```

## Usage

Create a file with a list of words or phrases to search for. For example, `dictionary.txt`:

```text
cabbage
lettuce
```

Create a file with a list of domains that are crawlable. For example, `interesting_dmains.txt`:

```text
google.com
wikipedia.org
```

Links in the `interesting_domains.txt` file should be in the format `domain.com` or `subdomain.domain.com`.
Any links found in the crawl that are in the `interesting_domains.txt` file will be searched as well.

```bash
npm run cli seek
```
