import mammoth from "mammoth";

export async function parseWord(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value.trim();
  } catch (error) {
    throw new Error(`Failed to parse Word document: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
