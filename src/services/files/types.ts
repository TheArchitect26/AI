export type StoredFile = {
  id: string;
  originalName: string;
  storedName: string;
  path: string;
  mimeType: string;
  size: number;
  kind: string;
  status: string;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
};
