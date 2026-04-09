import { NextRequest } from "next/server";
import { getSubjectById, updateSubject, deleteSubject } from "@/lib/subjects";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const subject = getSubjectById(id);
  
  if (!subject) {
    return Response.json(
      { success: false, error: "Subject not found" },
      { status: 404 }
    );
  }

  return Response.json({ success: true, data: subject });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updated = updateSubject(id, {
      name: body.name,
      description: body.description,
      keywords: body.keywords,
    });

    if (!updated) {
      return Response.json(
        { success: false, error: "Subject not found" },
        { status: 404 }
      );
    }

    return Response.json({ success: true, data: updated });
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const deleted = deleteSubject(id);
  
  if (!deleted) {
    return Response.json(
      { success: false, error: "Subject not found" },
      { status: 404 }
    );
  }

  return Response.json({ success: true });
}
