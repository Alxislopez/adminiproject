"use client";

interface FileCardProps {
  id: string;
  name: string;
  mimeType: string;
  subjectName?: string;
  webViewLink?: string;
}

const MIME_ICONS: Record<string, string> = {
  "application/pdf": "📄",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "📝",
  "application/msword": "📝",
  "image/png": "🖼️",
  "image/jpeg": "🖼️",
  "image/jpg": "🖼️",
  "image/gif": "🖼️",
  "image/webp": "🖼️",
  "text/plain": "📃",
  "text/markdown": "📃",
  "text/csv": "📊",
};

export function FileCard({ name, mimeType, subjectName, webViewLink }: FileCardProps) {
  const icon = MIME_ICONS[mimeType] || "📁";

  return (
    <a
      href={webViewLink}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-3 p-3 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-colors group"
    >
      <span className="text-2xl">{icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate group-hover:text-blue-600">
          {name}
        </p>
        {subjectName && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            {subjectName}
          </p>
        )}
      </div>
      <svg className="w-4 h-4 text-zinc-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
      </svg>
    </a>
  );
}
