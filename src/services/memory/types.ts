export type MemoryRecord = {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  importance: number;
  createdAt: string;
  updatedAt: string;
};

export type CreateMemoryInput = {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
  importance?: number;
};
