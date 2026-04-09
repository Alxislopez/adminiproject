import type { Subject } from "@/types";

const DRIVE_API_URL = "https://www.googleapis.com/drive/v3";
const UPLOAD_API_URL = "https://www.googleapis.com/upload/drive/v3";

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

interface DriveFolder {
  id: string;
  name: string;
}

export class GoogleDriveClient {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Google Drive API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async findOrCreateAppFolder(): Promise<string> {
    const query = encodeURIComponent(
      "name='DocClassifier' and mimeType='application/vnd.google-apps.folder' and trashed=false"
    );
    
    const searchResult = await this.request<{ files: DriveFolder[] }>(
      `${DRIVE_API_URL}/files?q=${query}&fields=files(id,name)`
    );

    if (searchResult.files.length > 0) {
      return searchResult.files[0].id;
    }

    const folder = await this.request<DriveFolder>(
      `${DRIVE_API_URL}/files`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "DocClassifier",
          mimeType: "application/vnd.google-apps.folder",
        }),
      }
    );

    return folder.id;
  }

  async findOrCreateSubjectFolder(
    subject: Subject,
    parentFolderId: string
  ): Promise<string> {
    if (subject.driveFolderId) {
      try {
        await this.request<DriveFolder>(
          `${DRIVE_API_URL}/files/${subject.driveFolderId}?fields=id,name`
        );
        return subject.driveFolderId;
      } catch {
        // Folder doesn't exist, create new one
      }
    }

    const query = encodeURIComponent(
      `name='${subject.name}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    );
    
    const searchResult = await this.request<{ files: DriveFolder[] }>(
      `${DRIVE_API_URL}/files?q=${query}&fields=files(id,name)`
    );

    if (searchResult.files.length > 0) {
      return searchResult.files[0].id;
    }

    const folder = await this.request<DriveFolder>(
      `${DRIVE_API_URL}/files`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: subject.name,
          mimeType: "application/vnd.google-apps.folder",
          parents: [parentFolderId],
        }),
      }
    );

    return folder.id;
  }

  async uploadFile(
    file: Buffer,
    filename: string,
    mimeType: string,
    folderId: string
  ): Promise<DriveFile> {
    const metadata = {
      name: filename,
      parents: [folderId],
    };

    const boundary = "doc_classifier_boundary";
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadataPart =
      delimiter +
      "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
      JSON.stringify(metadata);

    const mediaPart =
      delimiter +
      `Content-Type: ${mimeType}\r\n` +
      "Content-Transfer-Encoding: base64\r\n\r\n" +
      file.toString("base64");

    const body = metadataPart + mediaPart + closeDelimiter;

    const result = await this.request<DriveFile>(
      `${UPLOAD_API_URL}/files?uploadType=multipart&fields=id,name,mimeType,webViewLink`,
      {
        method: "POST",
        headers: {
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );

    return result;
  }

  async listFilesInFolder(folderId: string): Promise<DriveFile[]> {
    const query = encodeURIComponent(
      `'${folderId}' in parents and trashed=false`
    );
    
    const result = await this.request<{ files: DriveFile[] }>(
      `${DRIVE_API_URL}/files?q=${query}&fields=files(id,name,mimeType,webViewLink)`
    );

    return result.files;
  }

  async deleteFile(fileId: string): Promise<void> {
    await fetch(`${DRIVE_API_URL}/files/${fileId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });
  }
}
