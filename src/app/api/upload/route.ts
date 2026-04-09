import { NextRequest } from "next/server";
import { startWatcher, stopWatcher, getWatcherInstance } from "@/lib/watcher";
import { existsSync } from "fs";
import { homedir } from "os";
import { join } from "path";

// Default watch path - Downloads folder
const DEFAULT_WATCH_PATH = join(homedir(), "Downloads");

// Store classification events for the UI to poll
const recentClassifications: Array<{
  filePath: string;
  subjectName: string;
  confidence: number;
  timestamp: Date;
}> = [];

const MAX_RECENT = 50;

function addRecentClassification(data: { filePath: string; subjectName: string; confidence: number }) {
  recentClassifications.unshift({ ...data, timestamp: new Date() });
  if (recentClassifications.length > MAX_RECENT) {
    recentClassifications.pop();
  }
}

// GET - Get watcher status and recent classifications
export async function GET() {
  const watcher = getWatcherInstance();
  
  return Response.json({
    success: true,
    data: {
      isRunning: watcher !== null,
      watchPath: DEFAULT_WATCH_PATH,
      recentClassifications: recentClassifications.slice(0, 10),
    },
  });
}

// POST - Start or stop the watcher
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, watchPath } = body;

    if (action === "start") {
      const pathToWatch = watchPath || DEFAULT_WATCH_PATH;
      
      if (!existsSync(pathToWatch)) {
        return Response.json(
          { success: false, error: `Watch path does not exist: ${pathToWatch}` },
          { status: 400 }
        );
      }

      startWatcher({
        watchPath: pathToWatch,
        onFileClassified: (result) => {
          addRecentClassification(result);
        },
        onError: (error, filePath) => {
          console.error(`[API] Watcher error for ${filePath}:`, error.message);
        },
      });

      return Response.json({
        success: true,
        data: {
          message: `Watcher started for: ${pathToWatch}`,
          isRunning: true,
          watchPath: pathToWatch,
        },
      });
    }

    if (action === "stop") {
      stopWatcher();
      return Response.json({
        success: true,
        data: {
          message: "Watcher stopped",
          isRunning: false,
        },
      });
    }

    if (action === "clear") {
      recentClassifications.length = 0;
      return Response.json({
        success: true,
        data: { message: "Recent classifications cleared" },
      });
    }

    return Response.json(
      { success: false, error: "Invalid action. Use 'start', 'stop', or 'clear'" },
      { status: 400 }
    );
  } catch (error) {
    return Response.json(
      { success: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
