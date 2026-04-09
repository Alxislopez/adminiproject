"use client";

import { useState } from "react";
import type { Subject } from "@/types";

interface SubjectListProps {
  subjects: Subject[];
  onAdd: (data: { name: string; description: string; keywords: string[] }) => Promise<void>;
  onUpdate: (id: string, data: { name: string; description: string; keywords: string[] }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onSelect?: (subject: Subject) => void;
  selectedId?: string;
}

export function SubjectList({ subjects, onAdd, onUpdate, onDelete, onSelect, selectedId }: SubjectListProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generateKeywords = async () => {
    if (!newDescription.trim() || newDescription.length < 20) {
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "generate-keywords",
          syllabus: newDescription,
        }),
      });
      const data = await res.json();
      if (data.success && data.data.keywords) {
        setKeywords(data.data.keywords);
      }
    } catch (err) {
      console.error("Failed to generate keywords:", err);
    } finally {
      setGenerating(false);
    }
  };

  const addKeyword = () => {
    const kw = newKeyword.trim().toLowerCase();
    if (kw && !keywords.includes(kw)) {
      setKeywords([...keywords, kw]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (index: number) => {
    setKeywords(keywords.filter((_, i) => i !== index));
  };

  const handleAdd = async () => {
    if (!newName.trim()) return;
    
    setLoading(true);
    try {
      await onAdd({
        name: newName.trim(),
        description: newDescription.trim(),
        keywords,
      });
      setNewName("");
      setNewDescription("");
      setKeywords([]);
      setNewKeyword("");
      setIsAdding(false);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (subject: Subject) => {
    setEditingId(subject.id);
    setNewName(subject.name);
    setNewDescription(subject.description);
    setKeywords(subject.keywords);
    setNewKeyword("");
  };

  const handleUpdate = async () => {
    if (!editingId || !newName.trim()) return;
    
    setLoading(true);
    try {
      await onUpdate(editingId, {
        name: newName.trim(),
        description: newDescription.trim(),
        keywords,
      });
      setEditingId(null);
      setNewName("");
      setNewDescription("");
      setKeywords([]);
      setNewKeyword("");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewName("");
    setNewDescription("");
    setKeywords([]);
    setNewKeyword("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Subjects</h2>
        <button
          onClick={() => isAdding ? handleCancel() : setIsAdding(true)}
          className="text-sm px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
        >
          {isAdding ? "Cancel" : "+ Add"}
        </button>
      </div>

      {isAdding && (
        <div className="p-4 rounded-lg border border-zinc-200 dark:border-zinc-700 space-y-4 bg-zinc-50 dark:bg-zinc-800/50">
          {/* Subject Name */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Subject Name *
            </label>
            <input
              type="text"
              placeholder="e.g., Machine Learning"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm"
            />
          </div>

          {/* Syllabus / Description */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Syllabus / Description
            </label>
            <textarea
              placeholder="Paste the course syllabus or describe the subject topics..."
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm resize-none"
            />
            <button
              onClick={generateKeywords}
              disabled={generating || newDescription.length < 20}
              className="mt-2 px-3 py-1.5 text-xs rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
            >
              {generating ? (
                <>
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Auto-Generate Keywords
                </>
              )}
            </button>
          </div>

          {/* Keywords */}
          <div>
            <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
              Keywords ({keywords.length})
            </label>
            
            {/* Keyword tags */}
            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2 p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                {keywords.map((kw, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                  >
                    {kw}
                    <button
                      onClick={() => removeKeyword(i)}
                      className="hover:text-red-500 transition-colors"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Add keyword input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add a keyword..."
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addKeyword();
                  }
                }}
                className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm"
              />
              <button
                onClick={addKeyword}
                disabled={!newKeyword.trim()}
                className="px-3 py-1.5 text-sm rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50 transition-colors"
              >
                Add
              </button>
            </div>
          </div>

          {/* Create button */}
          <button
            onClick={handleAdd}
            disabled={loading || !newName.trim()}
            className="w-full py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition-colors"
          >
            {loading ? "Creating..." : "Create Subject"}
          </button>
        </div>
      )}

      {subjects.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-8">
          No subjects yet. Add one to start classifying documents.
        </p>
      ) : (
        <div className="space-y-2">
          {subjects.map((subject) => (
            editingId === subject.id ? (
              // Edit form
              <div key={subject.id} className="p-4 rounded-lg border border-blue-500 bg-blue-50 dark:bg-blue-950 space-y-4">
                {/* Subject Name */}
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Subject Name *
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm"
                  />
                </div>

                {/* Syllabus / Description */}
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Syllabus / Description
                  </label>
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    rows={4}
                    className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm resize-none"
                  />
                  <button
                    onClick={generateKeywords}
                    disabled={generating || newDescription.length < 20}
                    className="mt-2 px-3 py-1.5 text-xs rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                  >
                    {generating ? (
                      <>
                        <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Generating...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Re-Generate Keywords
                      </>
                    )}
                  </button>
                </div>

                {/* Keywords */}
                <div>
                  <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                    Keywords ({keywords.length})
                  </label>
                  
                  {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-2 p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                      {keywords.map((kw, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300"
                        >
                          {kw}
                          <button
                            onClick={() => removeKeyword(i)}
                            className="hover:text-red-500 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add a keyword..."
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addKeyword();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-900 text-sm"
                    />
                    <button
                      onClick={addKeyword}
                      disabled={!newKeyword.trim()}
                      className="px-3 py-1.5 text-sm rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 disabled:opacity-50 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={handleUpdate}
                    disabled={loading || !newName.trim()}
                    className="flex-1 py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 text-sm font-medium transition-colors"
                  >
                    {loading ? "Saving..." : "Save Changes"}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="px-4 py-2.5 rounded-lg bg-zinc-200 dark:bg-zinc-700 hover:bg-zinc-300 dark:hover:bg-zinc-600 text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              // Display card
              <div
                key={subject.id}
                onClick={() => onSelect?.(subject)}
                className={`p-3 rounded-lg border transition-colors cursor-pointer ${
                  selectedId === subject.id
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                    : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-zinc-900 dark:text-zinc-100">{subject.name}</h3>
                    {subject.description && (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">{subject.description}</p>
                    )}
                    {subject.keywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {subject.keywords.slice(0, 5).map((kw, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 text-xs rounded-full bg-zinc-100 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300"
                          >
                            {kw}
                          </span>
                        ))}
                        {subject.keywords.length > 5 && (
                          <span className="px-2 py-0.5 text-xs text-zinc-400">
                            +{subject.keywords.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(subject);
                      }}
                      className="p-1 text-zinc-400 hover:text-blue-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete(subject.id);
                      }}
                      className="p-1 text-zinc-400 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          ))}
        </div>
      )}
    </div>
  );
}
