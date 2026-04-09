import Tesseract from "tesseract.js";

export async function parseImage(buffer: Buffer): Promise<string> {
  try {
    const result = await Tesseract.recognize(buffer, "eng", {
      logger: () => {}, // Suppress logs
    });
    return result.data.text.trim();
  } catch (error) {
    throw new Error(`Failed to parse image: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}
