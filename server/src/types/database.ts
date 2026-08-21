// This manually mirrors our Supabase schema so TypeScript knows the exact shape of every table, what columns exist, which are optional, what we can insert vs update. 
// When we "run npx supabase gen types typescript" later, we replace this file with the auto-generated one. Until then this is the contract. 
// Update: never on messages means messages are immutable once written, no accidental edits.

export type DocumentStatus =
  | "QUEUED"
  | "PROCESSING"
  | "EXTRACTING"
  | "CHUNKING"
  | "EMBEDDING"
  | "INDEXING"
  | "READY"
  | "FAILED";

export type MessageRole = "user" | "assistant" | "system";

export interface Citation {
  document_id: string;
  document_title: string;
  page_number: number | null;
  section_title: string | null;
  chunk_excerpt: string;
}

export interface QueryMetadata {
  retrieval_ms?: number;
  generation_ms?: number;
  chunks_used?: number;
  model?: string;
}

export type Database = {
  public: {
    Tables: {
      workspaces: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          description?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      documents: {
        Row: {
          id: string;
          workspace_id: string;
          title: string;
          original_filename: string;
          storage_path: string;
          mime_type: string;
          file_size: number;
          page_count: number | null;
          status: DocumentStatus;
          processing_error: string | null;
          version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          title: string;
          original_filename: string;
          storage_path: string;
          mime_type: string;
          file_size: number;
          page_count?: number | null;
          status?: DocumentStatus;
          processing_error?: string | null;
          version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          status?: DocumentStatus;
          processing_error?: string | null;
          page_count?: number | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      document_chunks: {
        Row: {
          id: string;
          document_id: string;
          workspace_id: string;
          chunk_index: number;
          content: string;
          embedding: number[] | null;
          page_number: number | null;
          section_title: string | null;
          token_count: number | null;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          document_id: string;
          workspace_id: string;
          chunk_index: number;
          content: string;
          embedding?: number[] | null;
          page_number?: number | null;
          section_title?: string | null;
          token_count?: number | null;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          embedding?: number[] | null;
        };
        Relationships: [];
      };
      conversations: {
        Row: {
          id: string;
          workspace_id: string;
          title: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          workspace_id: string;
          title?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          role: MessageRole;
          content: string;
          citations: Citation[];
          query_metadata: QueryMetadata;
          created_at: string;
        };
        Insert: {
          id?: string;
          conversation_id: string;
          role: MessageRole;
          content: string;
          citations?: Citation[];
          query_metadata?: QueryMetadata;
          created_at?: string;
        };
        Update: {
          citations?: Citation[];
          query_metadata?: QueryMetadata;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
        Functions: {
      match_chunks_vector: {
        Args: {
          query_embedding: number[];
          match_workspace_id: string;
          match_document_id: string | null;
          match_count: number;
        };
        Returns: {
          id: string;
          document_id: string;
          workspace_id: string;
          chunk_index: number;
          content: string;
          page_number: number | null;
          section_title: string | null;
          token_count: number | null;
          similarity: number;
        }[];
      };
      match_chunks_fts: {
        Args: {
          query_text: string;
          match_workspace_id: string;
          match_document_id: string | null;
          match_count: number;
        };
        Returns: {
          id: string;
          document_id: string;
          workspace_id: string;
          chunk_index: number;
          content: string;
          page_number: number | null;
          section_title: string | null;
          token_count: number | null;
          rank: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};