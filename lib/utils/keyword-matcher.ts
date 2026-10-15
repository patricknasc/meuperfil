/**
 * Keyword Matcher
 *
 * Matches comment text against a set of keywords with support for:
 * - Case- and accent-insensitive matching ("Promoção" = "promocao")
 * - Whole-word or partial matching
 * - Multi-keyword OR logic (any match = true)
 * - Emoji and special character stripping
 */

export interface KeywordMatchResult {
  matched: boolean;
  matchedKeyword: string | null;
}

/**
 * Strip emojis and special characters from text, keeping only
 * alphanumeric characters and whitespace.
 */
export function stripSpecialCharacters(text: string): string {
  // Remove emoji ranges and other special unicode chars
  return text
    .replace(
      /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}]/gu,
      ""
    )
    // Drop accents so "promoção" and "promocao" compare equal, then keep
    // only letters/digits (any script) and spaces.
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Check if a comment text matches any of the given keywords.
 *
 * @param commentText - The raw comment text to check
 * @param keywords - Array of keywords to match against
 * @param wholeWordMatch - If true, keyword must be a standalone word.
 *                         If false, partial matches are allowed (e.g. "linking" matches "link")
 * @param options.typoTolerance - Also accept one wrong, missing, extra or swapped
 *                         letter for keywords of TYPO_MIN_LENGTH+ letters ("qero" → QUERO)
 * @returns Match result with the first matched keyword (if any)
 */
export function matchKeywords(
  commentText: string,
  keywords: string[],
  wholeWordMatch: boolean = true,
  options: { typoTolerance?: boolean } = {}
): KeywordMatchResult {
  if (!commentText || keywords.length === 0) {
    return { matched: false, matchedKeyword: null };
  }

  const cleanedText = stripSpecialCharacters(commentText).toLowerCase();

  if (!cleanedText) {
    return { matched: false, matchedKeyword: null };
  }

  for (const keyword of keywords) {
    const cleanedKeyword = stripSpecialCharacters(keyword).toLowerCase();

    if (!cleanedKeyword) continue;

    if (wholeWordMatch) {
      // Build a regex for whole-word matching
      const escapedKeyword = cleanedKeyword.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
      );
      // Unicode-aware word boundaries (\b only understands ASCII letters).
      const regex = new RegExp(`(?<![\\p{L}\\p{N}])${escapedKeyword}(?![\\p{L}\\p{N}])`, "iu");
      if (regex.test(cleanedText)) {
        return { matched: true, matchedKeyword: keyword };
      }
    } else {
      // Partial match — keyword substring exists anywhere in the cleaned text
      if (cleanedText.includes(cleanedKeyword)) {
        return { matched: true, matchedKeyword: keyword };
      }
    }
  }

  if (options.typoTolerance) {
    const words = cleanedText.split(" ");
    for (const keyword of keywords) {
      const keywordWords = stripSpecialCharacters(keyword).toLowerCase().split(" ").filter(Boolean);
      const target = keywordWords.join(" ");
      if (target.replace(/ /g, "").length < TYPO_MIN_LENGTH) continue;
      // Compare against every run of comment words with the same word count.
      for (let i = 0; i + keywordWords.length <= words.length; i++) {
        const candidate = words.slice(i, i + keywordWords.length).join(" ");
        if (isOneEditAway(candidate, target)) {
          return { matched: true, matchedKeyword: keyword };
        }
      }
    }
  }

  return { matched: false, matchedKeyword: null };
}

/** Shortest keyword (letters only) eligible for typo tolerance. */
export const TYPO_MIN_LENGTH = 5;

/** True when a and b differ by at most one insertion, deletion, substitution or adjacent swap. */
export function isOneEditAway(a: string, b: string): boolean {
  if (a === b) return true;
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) {
    const diffs: number[] = [];
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) diffs.push(i);
      if (diffs.length > 2) return false;
    }
    if (diffs.length === 1) return true;
    const [x, y] = diffs;
    return diffs.length === 2 && y === x + 1 && a[x] === b[y] && a[y] === b[x];
  }
  const [shorter, longer] = a.length < b.length ? [a, b] : [b, a];
  let i = 0;
  while (i < shorter.length && shorter[i] === longer[i]) i++;
  return shorter.slice(i) === longer.slice(i + 1);
}
