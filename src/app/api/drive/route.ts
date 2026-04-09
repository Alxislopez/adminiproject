import { NextRequest } from "next/server";
import { getShortcuts, getShortcutsBySubject, deleteShortcut } from "@/lib/shortcuts";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const subjectId = searchParams.get("subjectId");

  if (subjectId) {
    const shortcuts = getShortcutsBySubject(subjectId);
    return Response.json({ success: true, data: shortcuts });
  }

  const shortcuts = getShortcuts();
  return Response.json({ success: true, data: shortcuts });
}

export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get("id");

  if (!id) {
    return Response.json(
      { success: false, error: "Shortcut ID required" },
      { status: 400 }
    );
  }

  const deleted = deleteShortcut(id);
  if (!deleted) {
    return Response.json(
      { success: false, error: "Shortcut not found" },
      { status: 404 }
    );
  }

  return Response.json({ success: true });
}
