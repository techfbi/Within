export interface Workspace {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  workspace_id: string;
  title: string;
  original_filename: string;
  mime_type: string;
  file_size: number;
  page_count: number | null;
  status:
    | "QUEUED"
    | "PROCESSING"
    | "EXTRACTING"
    | "CHUNKING"
    | "EMBEDDING"
    | "INDEXING"
    | "READY"
    | "FAILED";
  processing_error: string | null;
  created_at: string;
  updated_at: string;
}

export interface Citation {
  document_id: string;
  document_title: string;
  page_number: number | null;
  section_title: string | null;
  chunk_excerpt: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  citations: Citation[];
  query_metadata: {
    retrieval_ms?: number;
    generation_ms?: number;
    chunks_used?: number;
    model?: string;
  };
  created_at: string;
}

export interface Conversation {
  id: string;
  workspace_id: string;
  title: string | null;
  created_at: string;
  updated_at: string;
}