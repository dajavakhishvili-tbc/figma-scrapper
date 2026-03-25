const SMART_QUOTES: Record<string, string> = {
  '\u2018': "'", '\u2019': "'", '\u201C': '"', '\u201D': '"',
  '\u2013': '-', '\u2014': '-', '\u2026': '...', '\u00A0': ' ',
};

const SMART_QUOTE_REGEX = new RegExp(Object.keys(SMART_QUOTES).join('|'), 'g');
const ZERO_WIDTH_REGEX = /[\u200B\u200C\u200D\uFEFF]/g;
const MULTI_SPACE_REGEX = /\s+/g;

export function normalizeText(text: string): string {
  return text
    .normalize('NFC')
    .replace(ZERO_WIDTH_REGEX, '')
    .replace(SMART_QUOTE_REGEX, (ch) => SMART_QUOTES[ch] ?? ch)
    .replace(MULTI_SPACE_REGEX, ' ')
    .trim()
    .toLowerCase();
}

export function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export function generateId(): string {
  return crypto.randomUUID();
}
