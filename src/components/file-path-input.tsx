"use client";

import { useRef, useState } from "react";

interface FilePickerProps {
  onClassify: (files: File[]) => Promise<void>;
  disabled?: boolean;
}

export function FilePicker({ onClassify, disabled }: FilePickerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isClassifying, setIsClassifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setSelectedFiles(files);
    setError(null);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleClassify = async () => {
    if (selectedFiles.length === 0) return;

    setIsClassifying(true);
    setError(null);
    setProgress({ current: 0, total: selectedFiles.length });

    try {
      await onClassify(selectedFiles);
      setSelectedFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Classification failed");
    } finally {
      setIsClassifying(false);
      setProgress(null);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        accept=".pdf,.doc,.docx,.txt,.md,.csv,.png,.jpg,.jpeg,.gif,.webp"
        className="hidden"
      />

      {/* Drop zone / Click to select */}
      <div
        onClick={handleClick}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
          disabled || isClassifying
            ? "opacity-50 cursor-not-allowed border-zinc-300 dark:border-zinc-700"
            : "border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500"
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <svg className="w-10 h-10 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Click to select files
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            PDF, Word, Images, Text files • Multiple files supported
          </p>
        </div>
      </div>

      {/* Selected files list */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Selected files ({selectedFiles.length}):
          </p>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800"
              >
                <span className="text-sm text-zinc-700 dark:text-zinc-300 truncate flex-1">
                  {file.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button
            onClick={handleClassify}
            disabled={disabled || isClassifying}
            className="w-full py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isClassifying ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                {progress ? `Classifying ${progress.current + 1}/${progress.total}...` : "Classifying..."}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Classify & Store {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""}
              </>
            )}
          </button>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
