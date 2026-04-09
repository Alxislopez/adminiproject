import { NextRequest } from "next/server";
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";
import { extractText, getSupportedMimeTypes } from "@/lib/parsers";
import { classifyDocument } from "@/lib/grok";
import { getSubjects } from "@/lib/subjects";
import { createShortcut } from "@/lib/shortcuts";
import { getSupportedExtensions } from "@/lib/classifier";

// Get the storage directory for classified files
function getStorageDir(): string {
  const dir = join(process.cwd(), "data", "files");
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// Get or create subject folder
function getSubjectFolder(subjectId: string, subjectName: string): string {
  const storageDir = getStorageDir();
  // Use subject name for folder (sanitize it)
  const safeName = subjectName.replace(/[<>:"/\\|?*]/g, "_");
  const subjectDir = join(storageDir, safeName);
  if (!existsSync(subjectDir)) {
    mkdirSync(subjectDir, { recursive: true });
  }
  return subjectDir;
}

// Generate unique filename if file already exists
function getUniqueFilename(dir: string, filename: string): string {
  let finalPath = join(dir, filename);
  if (!existsSync(finalPath)) {
    return finalPath;
  }
  
  const ext = filename.includes(".") ? filename.substring(filename.lastIndexOf(".")) : "";
  const base = filename.includes(".") ? filename.substring(0, filename.lastIndexOf(".")) : filename;
  
  let counter = 1;
  while (existsSync(finalPath)) {
    finalPath = join(dir, `${base} (${counter})${ext}`);
    counter++;
  }
  return finalPath;
}

// POST - Classify uploaded file(s) and store in subject folder
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return Response.json(
        { success: false, error: "No files provided" },
        { status: 400 }
      );
    }

    const subjects = getSubjects();
    if (subjects.length === 0) {
      return Response.json(
        { success: false, error: "Please create at least one subject before classifying files" },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (const file of files) {
      try {
        // Read file content
        const buffer = Buffer.from(await file.arrayBuffer());
        
        // Extract text
        const extractedText = await extractText(buffer, file.type);
        
        if (!extractedText || extractedText.length < 10) {
          errors.push({ filename: file.name, error: "Could not extract text" });
          continue;
        }

        // Classify using AI
        const classification = await classifyDocument(extractedText, subjects);

        // Get subject folder and save file
        const subjectFolder = getSubjectFolder(classification.subjectId, classification.subjectName);
        const filePath = getUniqueFilename(subjectFolder, file.name);
        writeFileSync(filePath, buffer);

        // Create shortcut record
        const shortcut = createShortcut({
          filePath,
          filename: file.name,
          mimeType: file.type,
          subjectId: classification.subjectId,
          subjectName: classification.subjectName,
          confidence: classification.confidence,
          reasoning: classification.reasoning,
        });

        results.push({
          shortcut,
          extractedTextPreview: extractedText.substring(0, 200) + "...",
        });
      } catch (err) {
        errors.push({ 
          filename: file.name, 
          error: err instanceof Error ? err.message : "Processing failed" 
        });
      }
    }

    return Response.json({
      success: true,
      data: {
        results,
        errors,
        totalProcessed: results.length,
        totalErrors: errors.length,
      },
    });
  } catch (error) {
    console.error("Classification error:", error);
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Classification failed" },
      { status: 500 }
    );
  }
}

// GET - Retrieve supported types and subjects info
export async function GET() {
  const subjects = getSubjects();
  return Response.json({
    success: true,
    data: {
      subjects: subjects.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
      })),
      supportedTypes: getSupportedMimeTypes(),
      supportedExtensions: getSupportedExtensions(),
    },
  });
}
