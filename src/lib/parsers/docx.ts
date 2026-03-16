export interface ParseResult {
  text: string;
  wordCount: number;
}

export async function parseDocx(buffer: Buffer): Promise<ParseResult> {
  const mammoth = await import("mammoth");
  const result = await mammoth.extractRawText({ buffer });

  const text = result.value
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const wordCount = text
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  return { text, wordCount };
}
