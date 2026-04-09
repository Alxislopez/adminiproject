"use client";

import { useEffect, useState, useCallback } from "react";
import { FilePicker } from "@/components/file-path-input";
import { SubjectList } from "@/components/subject-list";
import { ShortcutList } from "@/components/shortcut-list";
import type { Subject, FileShortcut } from "@/types";

interface ClassifyResponse {
  results: Array<{
    shortcut: FileShortcut;
    extractedTextPreview: string;
  }>;
  errors: Array<{ filename: string; error: string }>;
  totalProcessed: number;
  totalErrors: number;
}

interface WatcherStatus {
  isRunning: boolean;
  watchPath: string;
  recentClassifications: Array<{
    filePath: string;
    subjectName: string;
    confidence: number;
    timestamp: string;
  }>;
}

export default function Home() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [shortcuts, setShortcuts] = useState<FileShortcut[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [lastResult, setLastResult] = useState<ClassifyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [watcherStatus, setWatcherStatus] = useState<WatcherStatus | null>(null);
  const [watcherLoading, setWatcherLoading] = useState(false);

  const fetchSubjects = useCallback(async () => {
    try {
      const res = await fetch("/api/subjects");
      const data = await res.json();
      if (data.success) {
        setSubjects(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch subjects:", err);
    }
  }, []);

  const fetchShortcuts = useCallback(async () => {
    try {
      const url = selectedSubject
        ? `/api/drive?subjectId=${selectedSubject.id}`
        : "/api/drive";
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setShortcuts(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch shortcuts:", err);
    }
  }, [selectedSubject]);

  const fetchWatcherStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/upload");
      const data = await res.json();
      if (data.success) {
        setWatcherStatus(data.data);
      }
    } catch (err) {
      console.error("Failed to fetch watcher status:", err);
    }
  }, []);

  useEffect(() => {
    Promise.all([fetchSubjects(), fetchShortcuts(), fetchWatcherStatus()]).finally(() => setLoading(false));
  }, [fetchSubjects, fetchShortcuts, fetchWatcherStatus]);

  useEffect(() => {
    fetchShortcuts();
  }, [fetchShortcuts]);

  // Poll for watcher updates when running
  useEffect(() => {
    if (!watcherStatus?.isRunning) return;
    
    const interval = setInterval(async () => {
      await fetchWatcherStatus();
      await fetchShortcuts();
    }, 3000);

    return () => clearInterval(interval);
  }, [watcherStatus?.isRunning, fetchWatcherStatus, fetchShortcuts]);

  const handleAddSubject = async (data: { name: string; description: string; keywords: string[] }) => {
    const res = await fetch("/api/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      await fetchSubjects();
    }
  };

  const handleUpdateSubject = async (id: string, data: { name: string; description: string; keywords: string[] }) => {
    const res = await fetch("/api/subjects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...data }),
    });
    if (res.ok) {
      await fetchSubjects();
    }
  };

  const handleDeleteSubject = async (id: string) => {
    const res = await fetch(`/api/subjects/${id}`, { method: "DELETE" });
    if (res.ok) {
      await fetchSubjects();
      if (selectedSubject?.id === id) {
        setSelectedSubject(null);
      }
    }
  };

  const handleClassify = async (files: File[]) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const res = await fetch("/api/classify", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error);
    }

    setLastResult(data.data);
    await fetchShortcuts();
  };

  const handleDeleteShortcut = async (id: string) => {
    const res = await fetch(`/api/drive?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      await fetchShortcuts();
    }
  };

  const toggleWatcher = async () => {
    setWatcherLoading(true);
    try {
      const action = watcherStatus?.isRunning ? "stop" : "start";
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchWatcherStatus();
      }
    } finally {
      setWatcherLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 dark:bg-zinc-950">
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            📁 DocClassifier
          </h1>
          <div className="flex items-center gap-3">
            {watcherStatus?.isRunning && (
              <span className="flex items-center gap-1.5 text-xs text-green-600 dark:text-green-400">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Watching Downloads
              </span>
            )}
            <button
              onClick={toggleWatcher}
              disabled={watcherLoading || subjects.length === 0}
              className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-colors disabled:opacity-50 ${
                watcherStatus?.isRunning
                  ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300"
                  : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-300"
              }`}
            >
              {watcherLoading ? "..." : watcherStatus?.isRunning ? "Stop Auto-Classify" : "Start Auto-Classify"}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sidebar - Subjects */}
          <div className="lg:col-span-1">
            <SubjectList
              subjects={subjects}
              onAdd={handleAddSubject}
              onUpdate={handleUpdateSubject}
              onDelete={handleDeleteSubject}
              onSelect={setSelectedSubject}
              selectedId={selectedSubject?.id}
            />
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Auto-Classify Banner */}
            {watcherStatus?.isRunning && (
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Auto-Classify Active
                  </span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300">
                  Watching: <code className="bg-green-100 dark:bg-green-900 px-1 rounded">{watcherStatus.watchPath}</code>
                </p>
                {watcherStatus.recentClassifications.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <p className="text-xs font-medium text-green-700 dark:text-green-300">Recent:</p>
                    {watcherStatus.recentClassifications.slice(0, 3).map((c, i) => (
                      <p key={i} className="text-xs text-green-600 dark:text-green-400">
                        • {c.filePath.split(/[/\\]/).pop()} → {c.subjectName}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Classify Section */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                Upload & Classify Files
              </h2>
              
              {subjects.length === 0 ? (
                <p className="text-center py-8 text-zinc-500 dark:text-zinc-400">
                  Create at least one subject to start classifying files
                </p>
              ) : (
                <FilePicker onClassify={handleClassify} />
              )}

              {lastResult && lastResult.totalProcessed > 0 && (
                <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800">
                  <p className="text-sm font-medium text-green-800 dark:text-green-200">
                    ✓ Classified {lastResult.totalProcessed} file{lastResult.totalProcessed > 1 ? "s" : ""}
                  </p>
                  <div className="mt-2 space-y-1">
                    {lastResult.results.slice(0, 5).map((r, i) => (
                      <p key={i} className="text-xs text-green-700 dark:text-green-300">
                        • {r.shortcut.filename} → <strong>{r.shortcut.subjectName}</strong> ({Math.round(r.shortcut.confidence * 100)}%)
                      </p>
                    ))}
                    {lastResult.results.length > 5 && (
                      <p className="text-xs text-green-600 dark:text-green-400">
                        ...and {lastResult.results.length - 5} more
                      </p>
                    )}
                  </div>
                </div>
              )}

              {lastResult && lastResult.totalErrors > 0 && (
                <div className="mt-4 p-4 rounded-lg bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800">
                  <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    ⚠ {lastResult.totalErrors} file{lastResult.totalErrors > 1 ? "s" : ""} failed
                  </p>
                  <div className="mt-2 space-y-1">
                    {lastResult.errors.map((e, i) => (
                      <p key={i} className="text-xs text-yellow-700 dark:text-yellow-300">
                        • {e.filename}: {e.error}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Files Section */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 border border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
                {selectedSubject ? `Files in ${selectedSubject.name}` : "All Classified Files"}
              </h2>
              
              <ShortcutList
                shortcuts={shortcuts}
                onDelete={handleDeleteShortcut}
                selectedSubjectId={selectedSubject?.id}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
