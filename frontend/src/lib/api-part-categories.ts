import { api } from "@/lib/api";

export interface PartCategoryItem {
  id: string;
  name: string;
}

export async function getPartCategories(): Promise<PartCategoryItem[]> {
  return api.get<PartCategoryItem[]>("/api/part-categories");
}

export async function createPartCategory(name: string): Promise<PartCategoryItem> {
  return api.post<PartCategoryItem>("/api/part-categories", { name });
}
