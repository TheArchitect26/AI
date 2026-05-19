export type NexusFile = {
  id: string;
  originalName: string;
  storedName: string;
  path: string;
  mimeType: string;
  size: number;
  kind: "txt" | "md" | "json" | "csv";
  status: "uploaded" | "analyzed";
  summary: string | null;
  createdAt: string;
  updatedAt: string;
};
