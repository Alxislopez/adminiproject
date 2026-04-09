import { parsePdf } from "./pdf";
import { parseWord } from "./word";
import { parseImage } from "./image";
import { parseText } from "./text";

export type SupportedMimeType =
  | "application/pdf"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/msword"
  | "image/png"
  | "image/jpeg"
  | "image/jpg"
  | "image/gif"
  | "image/webp"
  | "text/plain"
  | "text/markdown"
  | "text/csv";

const MIME_TYPE_HANDLERS: Record<string, (buffer: Buffer) => Promise<string> | string> = {
  "application/pdf": parsePdf,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": parseWord,
  "application/msword": parseWord,
  "image/png": parseImage,
  "image/jpeg": parseImage,
  "image/jpg": parseImage,
  "image/gif": parseImage,
  "image/webp": parseImage,
  "text/plain": parseText,
  "text/markdown": parseText,
  "text/csv": parseText,
};

export function isSupportedMimeType(mimeType: string): mimeType is SupportedMimeType {
  return mimeType in MIME_TYPE_HANDLERS;
}

export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  const handler = MIME_TYPE_HANDLERS[mimeType];
  
  if (!handler) {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  const result = handler(buffer);
  return result instanceof Promise ? await result : result;
}

export function getSupportedMimeTypes(): string[] {
  return Object.keys(MIME_TYPE_HANDLERS);
}
