"use client";

import type { FileShortcut } from "@/types";

interface ShortcutListProps {
  shortcuts: FileShortcut[];
  onDelete: (id: string) => Promise<void>;
  selectedSubjectId?: string;
}

const MIME_ICONS: Record<string, string> = {
  "application/pdf": "📄",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "📝",
  "application/msword": "📝",
  "image/png": "🖼️",
  "image/jpeg": "🖼️",
  "image/jpg": "🖼️",
  "image/gif": "🖼️",
  "image/webp": "🖼️",
  "text/plain": "📃",
  "text/markdown": "📃",
  "text/csv": "📊",
};

export function ShortcutList({ shortcuts, onDelete, selectedSubjectId }: ShortcutListProps) {
  const filteredShortcuts = selectedSubjectId
    ? shortcuts.filter((s) => s.subjectId === selectedSubjectId)
    : shortcuts;

  const openFile = (filePath: string) => {
    // Encode the file path and open in new tab
    const encodedPath = encodeURIComponent(filePath);
    window.open(`/api/auth/${encodedPath}`, "_blank");
  };

  if (filteredShortcuts.length === 0) {
    return (
      <p className="text-center py-8 text-zinc-500 dark:text-zinc-400">
        No files yet. Select files to classify and store them.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3">
      {filteredShortcuts.map((shortcut) => {
        const icon = MIME_ICONS[shortcut.mimeType] || "📁";
        const confidencePercent = Math.round(shortcut.confidence * 100);

        return (
          <div
            key={shortcut.id}
            className="flex items-start gap-3 p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-blue-300 dark:hover:border-blue-600 transition-colors bg-white dark:bg-zinc-900 group"
          >
            <span className="text-2xl mt-0.5">{icon}</span>
            <div className="flex-1 min-w-0">
              <button
                onClick={() => openFile(shortcut.filePath)}
                className="text-sm font-medium text-zinc-900 dark:text-zinc-100 hover:text-blue-600 dark:hover:text-blue-400 truncate block text-left w-full transition-colors"
                title="Click to open file"
              >
                {shortcut.filename}
                <svg className="w-3 h-3 inline-block ml-1 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                {shortcut.filePath}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                  {shortcut.subjectName}
                </span>
                <span className="text-xs text-zinc-400">
                  {confidencePercent}% confidence
                </span>
              </div>
              {shortcut.reasoning && (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 line-clamp-2">
                  {shortcut.reasoning}
                </p>
              )}
            </div>
            <button
              onClick={() => onDelete(shortcut.id)}
              className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors shrink-0"
              title="Delete shortcut"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
