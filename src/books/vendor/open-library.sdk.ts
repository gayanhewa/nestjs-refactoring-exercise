/**
 * Faked third-party SDK for ISBN metadata lookup.
 * Pretend this is `npm install open-library-sdk` — a vendor package
 * with its own constructor, config, and network calls.
 */

export interface OpenLibraryBook {
  title: string;
  authors: string[];
  publishYear: number;
  pageCount: number;
}

export class OpenLibrarySdk {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchByIsbn(isbn: string): Promise<OpenLibraryBook> {
    // Simulate a network round-trip to the OpenLibrary API.
    await new Promise((r) => setTimeout(r, 25));
    if (!this.apiKey) {
      throw new Error('OpenLibrary: missing API key');
    }
    // Deterministic fake payload derived from the isbn.
    const seed = isbn.slice(-3);
    return {
      title: `Fetched Title ${seed}`,
      authors: [`Author ${seed}`],
      publishYear: 1990 + (parseInt(seed, 10) % 35),
      pageCount: 150 + (parseInt(seed, 10) % 600),
    };
  }
}
