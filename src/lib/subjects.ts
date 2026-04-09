import { type Subject } from "@/types";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const DATA_FILE = join(process.cwd(), "data", "subjects.json");

function ensureDataDir() {
  const dataDir = join(process.cwd(), "data");
  if (!existsSync(dataDir)) {
    const fs = require("fs");
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

export function getSubjects(): Subject[] {
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

export function saveSubjects(subjects: Subject[]): void {
  ensureDataDir();
  writeFileSync(DATA_FILE, JSON.stringify(subjects, null, 2));
}

export function getSubjectById(id: string): Subject | undefined {
  const subjects = getSubjects();
  return subjects.find((s) => s.id === id);
}

export function createSubject(data: Omit<Subject, "id" | "createdAt" | "updatedAt">): Subject {
  const subjects = getSubjects();
  const newSubject: Subject = {
    ...data,
    id: `subject_${Date.now()}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  subjects.push(newSubject);
  saveSubjects(subjects);
  return newSubject;
}

export function updateSubject(id: string, data: Partial<Subject>): Subject | null {
  const subjects = getSubjects();
  const index = subjects.findIndex((s) => s.id === id);
  if (index === -1) return null;
  
  subjects[index] = {
    ...subjects[index],
    ...data,
    updatedAt: new Date(),
  };
  saveSubjects(subjects);
  return subjects[index];
}

export function deleteSubject(id: string): boolean {
  const subjects = getSubjects();
  const filtered = subjects.filter((s) => s.id !== id);
  if (filtered.length === subjects.length) return false;
  saveSubjects(filtered);
  return true;
}
