import type { FileMetadata, HttpClient, UploadOptions } from "./types.ts";

export class StorageModule {
  private readonly http: HttpClient;

  constructor(http: HttpClient) {
    this.http = http;
  }

  async upload(
    file: Blob | File | ArrayBuffer,
    options: UploadOptions = {},
  ): Promise<FileMetadata> {
    const formData = new FormData();
    const visibility = options.visibility ?? "protected";

    if (file instanceof ArrayBuffer) {
      const name = options.filename ?? "file";
      formData.append("file", new Blob([file]), name);
    } else if (file instanceof Blob) {
      const name = options.filename ?? (file instanceof File ? file.name : "file");
      formData.append("file", file, name);
    } else {
      formData.append("file", file);
    }

    formData.append("visibility", visibility);

    return this.http.request<FileMetadata>("/api/storage/upload", {
      method: "POST",
      body: formData,
    });
  }

  async download(id: string): Promise<Blob> {
    return this.http.request<Blob>(`/api/storage/${id}`);
  }

  getDownloadUrl(id: string): string {
    return `${this.http.getBaseUrl()}/api/storage/${id}`;
  }

  async delete(id: string): Promise<void> {
    await this.http.request<void>(`/api/storage/${id}`, {
      method: "DELETE",
    });
  }
}
