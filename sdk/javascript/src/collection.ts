import type { HttpClient, ListResult, RecordData } from "./types.ts";

export class Collection<T extends RecordData = RecordData> {
  private readonly http: HttpClient;
  private readonly name: string;

  constructor(http: HttpClient, name: string) {
    this.http = http;
    this.name = name;
  }

  async list(): Promise<T[]> {
    const body = await this.http.request<ListResult<T>>(`/api/${this.name}`);
    return body.items;
  }

  async get(id: string): Promise<T> {
    return this.http.request<T>(`/api/${this.name}/${id}`);
  }

  async create(data: Partial<T>): Promise<T> {
    return this.http.request<T>(`/api/${this.name}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async update(id: string, data: Partial<T>): Promise<T> {
    return this.http.request<T>(`/api/${this.name}/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async delete(id: string): Promise<void> {
    await this.http.request<void>(`/api/${this.name}/${id}`, {
      method: "DELETE",
    });
  }
}
