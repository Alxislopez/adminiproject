"use client";

import { useCallback, useState } from "react";

interface UploadDropzoneProps {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

export function UploadDropzone({ onUpload, disabled }: UploadDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setError(null);

      if (disabled || isUploading) return;

      const files = Array.from(e.dataTransfer.files);
      if (files.length === 0) return;

      const file = files[0];
      setIsUploading(true);
      try {
        await onUpload(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload, disabled, isUploading]
  );

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const files = e.target.files;
      if (!files || files.length === 0 || disabled || isUploading) return;

      const file = files[0];
      setIsUploading(true);
      try {
        await onUpload(file);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setIsUploading(false);
        e.target.value = "";
      }
    },
    [onUpload, disabled, isUploading]
  );

  return (
    <div
      className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
        isDragging
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
          : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600"
      } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        onChange={handleFileSelect}
        disabled={disabled || isUploading}
        accept=".pdf,.doc,.docx,.txt,.md,.csv,.png,.jpg,.jpeg,.gif,.webp"
      />
      
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
          {isUploading ? (
            <svg className="w-6 h-6 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          ) : (
            <svg className="w-6 h-6 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )}
        </div>
        
        <div>
          <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {isUploading ? "Uploading..." : "Drop a file here or click to browse"}
          </p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            PDF, Word, Images, Text files supported
          </p>
        </div>
      </div>

      {error && (
        <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
