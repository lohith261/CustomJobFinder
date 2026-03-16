export interface ParseResult {
  text: string;
  wordCount: number;
}

export function parseTxt(buffer: Buffer): ParseResult {
  const text = buffer
    .toString("utf-8")
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const wordCount = text
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  return { text, wordCount };
}
