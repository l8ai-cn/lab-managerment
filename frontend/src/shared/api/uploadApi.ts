import { api } from "@/shared/api/client";

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  content_type?: string;
}

export const uploadApi = {
  upload: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api
      .post<UploadResponse>("/upload", form, {
        headers: { "Content-Type": "multipart/form-data" },
      })
      .then((r) => r.data);
  },
};
