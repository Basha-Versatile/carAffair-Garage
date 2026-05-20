import { api } from "@/lib/api";

export interface Tag {
  id: string;
  garageId?: string;
  name: string;
  type: string;
  color: string;
  createdAt?: string;
}

export async function getTags(type?: string): Promise<Tag[]> {
  const url = type ? `/api/tags?type=${type}` : "/api/tags";
  return api.get<Tag[]>(url);
}

export async function createTag(tag: { name: string; type: string; color: string }): Promise<Tag> {
  return api.post<Tag>("/api/tags", tag);
}

export async function updateTag(
  id: string,
  updates: { name?: string; type?: string; color?: string }
): Promise<Tag> {
  return api.put<Tag>(`/api/tags/${id}`, updates);
}

export async function deleteTag(id: string): Promise<void> {
  await api.delete<void>(`/api/tags/${id}`);
}
