import chokidar from "chokidar";
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
