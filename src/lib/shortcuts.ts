import { type FileShortcut } from "@/types";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const DATA_FILE = join(process.cwd(), "data", "shortcuts.json");

function ensureDataDir() {
  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) {
    const fs = require("fs");
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function getShortcuts(): FileShortcut[] {
  try {
    if (!existsSync(DATA_FILE)) {
      return [];
    }
    const data = readFileSync(DATA_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveShortcuts(shortcuts: FileShortcut[]): void {
  ensureDataDir();
  writeFileSync(DATA_FILE, JSON.stringify(shortcuts, null, 2));
}

export function getShortcutsBySubject(subjectId: string): FileShortcut[] {
  const shortcuts = getShortcuts();
  return shortcuts.filter((s) => s.subjectId === subjectId);
}

export function getShortcutById(id: string): FileShortcut | undefined {
  const shortcuts = getShortcuts();
  return shortcuts.find((s) => s.id === id);
}

export function createShortcut(
  data: Omit<FileShortcut, "id" | "createdAt">
): FileShortcut {
  const shortcuts = getShortcuts();
  
  // Check if shortcut for this path already exists
  const existing = shortcuts.find((s) => s.filePath === data.filePath);
  if (existing) {
    // Update existing shortcut with new classification
    const updated: FileShortcut = {
      ...existing,
      ...data,
      id: existing.id,
      createdAt: existing.createdAt,
    };
    const index = shortcuts.findIndex((s) => s.id === existing.id);
    shortcuts[index] = updated;
    saveShortcuts(shortcuts);
    return updated;
  }

  const newShortcut: FileShortcut = {
    ...data,
    id: `shortcut_${Date.now()}`,
    createdAt: new Date(),
  };
  shortcuts.push(newShortcut);
  saveShortcuts(shortcuts);
  return newShortcut;
}

export function deleteShortcut(id: string): boolean {
  const shortcuts = getShortcuts();
  const filtered = shortcuts.filter((s) => s.id !== id);
  if (filtered.length === shortcuts.length) return false;
  saveShortcuts(filtered);
  return true;
}

export function deleteShortcutsBySubject(subjectId: string): number {
  const shortcuts = getShortcuts();
  const filtered = shortcuts.filter((s) => s.subjectId !== subjectId);
  const deletedCount = shortcuts.length - filtered.length;
  if (deletedCount > 0) {
    saveShortcuts(filtered);
  }
  return deletedCount;
}
