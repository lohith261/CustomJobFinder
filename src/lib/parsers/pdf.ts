export interface ParseResult {
  text: string;
  pageCount: number;
  wordCount: number;
}

export async function parsePdf(buffer: Buffer): Promise<ParseResult> {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require("pdf-parse") as (
    input: Buffer
  ) => Promise<{ text: string; numpages: number }>;

  const data = await pdfParse(buffer);

  const text = data.text
    .replace(/\r\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const wordCount = text
    .split(/\s+/)
    .filter((w) => w.length > 0).length;

  return {
    text,
    pageCount: data.numpages,
    wordCount,
  };
}
