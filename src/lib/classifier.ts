import { readFileSync, existsSync, statSync } from "fs";
import { basename, extname } from "path";
import { extractText } from "@/lib/parsers";
import { classifyDocument } from "@/lib/grok";
import { getSubjects } from "@/lib/subjects";
import { createShortcut, getShortcuts } from "@/lib/shortcuts";
import type { FileShortcut } from "@/types";

// Mime type mapping based on file extension
const EXT_TO_MIME: Record<string, string> = {
  ".pdf": "application/pdf",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".doc": "application/msword",
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".csv": "text/csv",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
};

export function getMimeType(filePath: string): string | null {
  const ext = extname(filePath).toLowerCase();
  return EXT_TO_MIME[ext] || null;
}

export function getSupportedExtensions(): string[] {
  return Object.keys(EXT_TO_MIME);
}

export function isSupportedFile(filePath: string): boolean {
  return getMimeType(filePath) !== null;
}

export function isAlreadyClassified(filePath: string): boolean {
  const shortcuts = getShortcuts();
  return shortcuts.some((s) => s.filePath === filePath);
}

export interface ClassifyResult {
  shortcut: FileShortcut;
  extractedTextPreview: string;
}

export async function classifyFile(inputPath: string): Promise<ClassifyResult> {
  // Clean up the path - remove surrounding quotes and trim whitespace
  const filePath = inputPath.replace(/^["']|["']$/g, "").trim();

  // Check if file exists
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  // Check if it's a file (not directory)
  const stats = statSync(filePath);
  if (!stats.isFile()) {
    throw new Error("Path must point to a file, not a directory");
  }

  // Get mime type from extension
  const mimeType = getMimeType(filePath);
  if (!mimeType) {
    const ext = extname(filePath);
    throw new Error(`Unsupported file type: ${ext || "unknown"}`);
  }

  // Get subjects
  const subjects = getSubjects();
  if (subjects.length === 0) {
    throw new Error("Please create at least one subject before classifying files");
  }

  // Read file and extract text
  const buffer = readFileSync(filePath);
  const extractedText = await extractText(buffer, mimeType);

  if (!extractedText || extractedText.length < 10) {
    throw new Error("Could not extract meaningful text from document");
  }

  // Classify using AI
  const classification = await classifyDocument(extractedText, subjects);

  // Create shortcut
  const filename = basename(filePath);
  const shortcut = createShortcut({
    filePath,
    filename,
    mimeType,
    subjectId: classification.subjectId,
    subjectName: classification.subjectName,
    confidence: classification.confidence,
    reasoning: classification.reasoning,
  });

  return {
    shortcut,
    extractedTextPreview: extractedText.substring(0, 300) + "...",
  };
}
