export type DocumentStatus =
  | "QUEUED"
  | "PROCESSING"
  | "EXTRACTING"
  | "CHUNKING"
  | "EMBEDDING"
  | "INDEXING"
  | "READY"
  | "FAILED";

export interface Document {
  id: string;
  workspace_id: string;
  title: string;
  original_filename: string;
  storage_path?: string;
  mime_type: string;
  file_size: number;
  page_count: number | null;
  status: DocumentStatus;
  processing_error: string | null;
  version?: number;
  created_at: string;
  updated_at: string;
}

