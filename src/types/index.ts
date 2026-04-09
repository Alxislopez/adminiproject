// Subject/Category types
export interface Subject {
  id: string;
  name: string;
  description?: string;
  keywords: string[];
  createdAt: Date;
  updatedAt: Date;
}

// File shortcut - stores reference to a local file path
export interface FileShortcut {
  id: string;
  filePath: string;
  filename: string;
  mimeType: string;
  subjectId: string;
  subjectName: string;
  confidence: number;
  reasoning?: string;
  createdAt: Date;
}

// Document types (legacy - keeping for reference)
export interface DocumentMetadata {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  extractedText?: string;
  classifiedSubjectId?: string;
  confidence?: number;
  createdAt: Date;
}

export interface ClassificationResult {
  subjectId: string;
  subjectName: string;
  confidence: number;
  reasoning?: string;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface ClassifyResponse {
  shortcut: FileShortcut;
  extractedTextPreview: string;
}

// Grok API types
export interface GrokMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GrokResponse {
  id: string;
  choices: {
    message: {
      content: string;
    };
  }[];
}
