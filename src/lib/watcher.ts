import chokidar from "chokidar";
import { basename } from "path";
import { classifyFile, isSupportedFile, isAlreadyClassified } from "./classifier";
import { getSubjects } from "./subjects";

export interface WatcherConfig {
  watchPath: string;
  onFileClassified?: (result: { filePath: string; subjectName: string; confidence: number }) => void;
  onError?: (error: Error, filePath: string) => void;
  onReady?: () => void;
}

// Track files being processed to avoid duplicates
const processingFiles = new Set<string>();

// Delay to wait for file to finish downloading (ms)
const PROCESSING_DELAY = 2000;

const GENERAL_FILENAME_KEYWORDS = [
  "unit",
  "chapter",
  "module",
  "lecture",
  "notes",
  "assignment",
  "tutorial",
  "worksheet",
  "question",
  "quiz",
  "exam",
  "midterm",
  "final",
  "syllabus",
  "lab",
  "practical",
  "topic",
  "week",
  "sem",
  "semester",
];

const UNIT_PATTERN = /\bunit[\s._-]*(?:[1-9]|10|i|ii|iii|iv|v|vi|vii|viii|ix|x)\b/i;

function normalizeForMatch(input: string): string {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function getFilenameMatchTerms(): string[] {
  const subjects = getSubjects();
  const subjectTerms = subjects.flatMap((subject) => [
    subject.name,
    ...subject.keywords,
  ]);

  return [...GENERAL_FILENAME_KEYWORDS, ...subjectTerms]
    .map((term) => normalizeForMatch(term))
    .filter((term) => term.length >= 3);
}

function shouldScanFileByName(filePath: string): boolean {
  const filename = basename(filePath);
  const normalizedFilename = normalizeForMatch(filename);

  if (!normalizedFilename) {
    return false;
  }

  if (UNIT_PATTERN.test(filename)) {
    return true;
  }

  const terms = getFilenameMatchTerms();
  return terms.some((term) => normalizedFilename.includes(term));
}

export function createFileWatcher(config: WatcherConfig) {
  const { watchPath, onFileClassified, onError, onReady } = config;

  const watcher = chokidar.watch(watchPath, {
    ignored: /(^|[\/\\])\../, // Ignore hidden files
    persistent: true,
    ignoreInitial: true, // Don't process existing files on start
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100,
    },
  });

  const processFile = async (filePath: string) => {
    // Skip if not a supported file type
    if (!isSupportedFile(filePath)) {
      return;
    }

    // Skip if already processing
    if (processingFiles.has(filePath)) {
      return;
    }

    // Skip if already classified
    if (isAlreadyClassified(filePath)) {
      return;
    }

    // Check if subjects exist
    const subjects = getSubjects();
    if (subjects.length === 0) {
      console.log("[Watcher] No subjects configured, skipping:", filePath);
      return;
    }

    // Security wall: only scan content for likely academic files by filename
    if (!shouldScanFileByName(filePath)) {
      console.log("[Watcher] Filename gate skipped:", filePath);
      return;
    }

    processingFiles.add(filePath);

    try {
      // Wait a bit for file to finish downloading
      await new Promise((resolve) => setTimeout(resolve, PROCESSING_DELAY));

      console.log("[Watcher] Processing file:", filePath);
      const result = await classifyFile(filePath);

      console.log(
        `[Watcher] Classified "${result.shortcut.filename}" as "${result.shortcut.subjectName}" (${Math.round(result.shortcut.confidence * 100)}%)`
      );

      onFileClassified?.({
        filePath,
        subjectName: result.shortcut.subjectName,
        confidence: result.shortcut.confidence,
      });
    } catch (error) {
      console.error("[Watcher] Error processing file:", filePath, error);
      onError?.(error instanceof Error ? error : new Error(String(error)), filePath);
    } finally {
      processingFiles.delete(filePath);
    }
  };

  watcher
    .on("add", processFile)
    .on("ready", () => {
      console.log(`[Watcher] Watching for new files in: ${watchPath}`);
      onReady?.();
    })
    .on("error", (error) => {
      console.error("[Watcher] Error:", error);
    });

  return {
    close: () => watcher.close(),
    getWatchedPaths: () => watcher.getWatched(),
  };
}

// Singleton watcher instance
let watcherInstance: ReturnType<typeof createFileWatcher> | null = null;

export function getWatcherInstance() {
  return watcherInstance;
}

export function startWatcher(config: WatcherConfig) {
  if (watcherInstance) {
    console.log("[Watcher] Already running");
    return watcherInstance;
  }
  watcherInstance = createFileWatcher(config);
  return watcherInstance;
}

export function stopWatcher() {
  if (watcherInstance) {
    watcherInstance.close();
    watcherInstance = null;
    console.log("[Watcher] Stopped");
  }
}
