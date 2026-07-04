import { api } from "@/shared/api/client";

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface KnowledgeDocumentListResponse {
  items: KnowledgeDocument[];
  total: number;
  page: number;
  page_size: number;
}

export interface KnowledgeSearchResult {
  id: string;
  title: string;
  snippet: string;
  category?: string;
  score?: number;
}

export interface KnowledgeDocumentCreate {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
}

export const knowledgeApi = {
  list: (params: { page?: number; page_size?: number; category?: string } = {}) =>
    api.get<KnowledgeDocumentListResponse>("/knowledge", { params }).then((r) => r.data),

  get: (id: string) => api.get<KnowledgeDocument>(`/knowledge/${id}`).then((r) => r.data),

  create: (data: KnowledgeDocumentCreate) =>
    api.post<KnowledgeDocument>("/knowledge", data).then((r) => r.data),

  update: (id: string, data: Partial<KnowledgeDocumentCreate>) =>
    api.patch<KnowledgeDocument>(`/knowledge/${id}`, data).then((r) => r.data),

  delete: (id: string) => api.delete(`/knowledge/${id}`),

  search: (q: string, limit = 20) =>
    api.get<KnowledgeSearchResult[]>("/knowledge/search", { params: { q, limit } }).then((r) => r.data),

  searchHybrid: (q: string, limit = 20) =>
    api
      .get<KnowledgeSearchResult[]>("/knowledge/search/hybrid", { params: { q, limit } })
      .then((r) => r.data),
};
