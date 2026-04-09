import { NextRequest } from "next/server";
import { readFileSync, existsSync } from "fs";
import { basename } from "path";

// GET - Serve a file for download/viewing
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ nextauth: string[] }> }
) {
  try {
    const { nextauth } = await params;
    // Decode the file path from URL segments
    const filePath = decodeURIComponent(nextauth.join("/"));
    
    if (!existsSync(filePath)) {
      return Response.json(
        { success: false, error: "File not found" },
        { status: 404 }
      );
    }

    const buffer = readFileSync(filePath);
    const filename = basename(filePath);
    
    // Determine content type
    const ext = filename.split(".").pop()?.toLowerCase() || "";
    const contentTypes: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
      md: "text/markdown",
      csv: "text/csv",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
    };
    
    const contentType = contentTypes[ext] || "application/octet-stream";

    return new Response(buffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Failed to read file" },
      { status: 500 }
    );
  }
}
