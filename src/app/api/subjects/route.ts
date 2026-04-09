import { NextRequest } from "next/server";
import { getSubjects, createSubject, updateSubject } from "@/lib/subjects";
import { generateKeywords } from "@/lib/grok";

export async function GET() {
  const subjects = getSubjects();
  return Response.json({ success: true, data: subjects });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Handle keyword generation request
    if (body.action === "generate-keywords") {
      const { syllabus } = body;
      if (!syllabus || typeof syllabus !== "string") {
        return Response.json(
          { success: false, error: "Syllabus text is required" },
          { status: 400 }
        );
      }
      
      const keywords = await generateKeywords(syllabus);
      return Response.json({ success: true, data: { keywords } });
    }
    
    // Handle subject creation
    if (!body.name || typeof body.name !== "string") {
      return Response.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    const subject = createSubject({
      name: body.name,
      description: body.description || "",
      keywords: body.keywords || [],
    });

    return Response.json({ success: true, data: subject }, { status: 201 });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.id || typeof body.id !== "string") {
      return Response.json(
        { success: false, error: "Subject ID is required" },
        { status: 400 }
      );
    }

    const updatedSubject = updateSubject(body.id, {
      name: body.name,
      description: body.description,
      keywords: body.keywords,
    });

    if (!updatedSubject) {
      return Response.json(
        { success: false, error: "Subject not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: updatedSubject });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
