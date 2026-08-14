-- Enable pgvector extension for storing and querying embeddings
create extension if not exists vector with schema extensions;

-- ============================================================
-- WORKSPACES
-- ============================================================
create table public.workspaces (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  name        text not null,
  description text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Index for fast lookup of all workspaces belonging to a user
create index workspaces_user_id_idx on public.workspaces(user_id);

-- ============================================================
-- DOCUMENTS
-- ============================================================
create table public.documents (
  id                uuid primary key default gen_random_uuid(),
  workspace_id      uuid not null references public.workspaces(id) on delete cascade,
  title             text not null,
  original_filename text not null,
  storage_path      text not null,
  mime_type         text not null,
  file_size         bigint not null,
  page_count        int,
  status            text not null default 'QUEUED',
  processing_error  text,
  version           int not null default 1,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  constraint documents_status_check check (
    status in (
      'QUEUED',
      'PROCESSING',
      'EXTRACTING',
      'CHUNKING',
      'EMBEDDING',
      'INDEXING',
      'READY',
      'FAILED'
    )
  )
);

-- Index for fetching all documents in a workspace
create index documents_workspace_id_idx on public.documents(workspace_id);

-- Index for querying documents by processing status (used by worker and UI)
create index documents_status_idx on public.documents(status);

-- ============================================================
-- DOCUMENT CHUNKS
-- ============================================================
create table public.document_chunks (
  id            uuid primary key default gen_random_uuid(),
  document_id   uuid not null references public.documents(id) on delete cascade,
  workspace_id  uuid not null references public.workspaces(id) on delete cascade,
  chunk_index   int not null,
  content       text not null,
  -- 1536 dimensions matches OpenAI text-embedding-3-small output
  embedding     vector(1536),
  page_number   int,
  section_title text,
  token_count   int,
  metadata      jsonb not null default '{}',
  -- Generated column for full text search, updated automatically when content changes
  content_tsv   tsvector generated always as (to_tsvector('english', content)) stored,
  created_at    timestamptz not null default now(),

  constraint document_chunks_chunk_index_unique unique (document_id, chunk_index)
);

-- HNSW index for fast approximate nearest neighbour vector search
-- cosine distance is correct for OpenAI embeddings (they are normalised)
create index document_chunks_embedding_idx
  on public.document_chunks
  using hnsw (embedding vector_cosine_ops);

-- GIN index for fast full text search on the generated tsvector column
create index document_chunks_content_tsv_idx
  on public.document_chunks
  using gin(content_tsv);

-- Composite index used by the retrieval query to filter by workspace then document
create index document_chunks_workspace_document_idx
  on public.document_chunks(workspace_id, document_id);

-- ============================================================
-- CONVERSATIONS
-- ============================================================
create table public.conversations (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  title        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index conversations_workspace_id_idx on public.conversations(workspace_id);

-- ============================================================
-- MESSAGES
-- ============================================================
create table public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role            text not null,
  content         text not null,
  -- citations is a JSON array of source references attached to this message
  citations       jsonb not null default '[]',
  -- query_metadata stores timing and model info for observability
  query_metadata  jsonb not null default '{}',
  created_at      timestamptz not null default now(),

  constraint messages_role_check check (role in ('user', 'assistant', 'system'))
);

create index messages_conversation_id_idx on public.messages(conversation_id);

-- ============================================================
-- UPDATED_AT TRIGGER
-- Automatically sets updated_at to now() on every row update
-- Applied to tables that have an updated_at column
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger workspaces_updated_at
  before update on public.workspaces
  for each row execute function public.handle_updated_at();

create trigger documents_updated_at
  before update on public.documents
  for each row execute function public.handle_updated_at();

create trigger conversations_updated_at
  before update on public.conversations
  for each row execute function public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- Enable RLS on every table then define policies.
-- A user can only ever see and touch their own data.
-- The service role key bypasses RLS entirely (used server-side only).
-- ============================================================

alter table public.workspaces       enable row level security;
alter table public.documents        enable row level security;
alter table public.document_chunks  enable row level security;
alter table public.conversations    enable row level security;
alter table public.messages         enable row level security;

-- WORKSPACES policies
create policy "users can select their own workspaces"
  on public.workspaces for select
  using (auth.uid() = user_id);

create policy "users can insert their own workspaces"
  on public.workspaces for insert
  with check (auth.uid() = user_id);

create policy "users can update their own workspaces"
  on public.workspaces for update
  using (auth.uid() = user_id);

create policy "users can delete their own workspaces"
  on public.workspaces for delete
  using (auth.uid() = user_id);

-- DOCUMENTS policies
-- A user can access a document only if they own the workspace it belongs to
create policy "users can select documents in their workspaces"
  on public.documents for select
  using (
    exists (
      select 1 from public.workspaces
      where workspaces.id = documents.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "users can insert documents into their workspaces"
  on public.documents for insert
  with check (
    exists (
      select 1 from public.workspaces
      where workspaces.id = documents.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "users can update documents in their workspaces"
  on public.documents for update
  using (
    exists (
      select 1 from public.workspaces
      where workspaces.id = documents.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "users can delete documents in their workspaces"
  on public.documents for delete
  using (
    exists (
      select 1 from public.workspaces
      where workspaces.id = documents.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

-- DOCUMENT CHUNKS policies
-- Same ownership chain: chunk belongs to workspace that belongs to user
create policy "users can select chunks in their workspaces"
  on public.document_chunks for select
  using (
    exists (
      select 1 from public.workspaces
      where workspaces.id = document_chunks.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "users can insert chunks into their workspaces"
  on public.document_chunks for insert
  with check (
    exists (
      select 1 from public.workspaces
      where workspaces.id = document_chunks.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "users can delete chunks in their workspaces"
  on public.document_chunks for delete
  using (
    exists (
      select 1 from public.workspaces
      where workspaces.id = document_chunks.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

-- CONVERSATIONS policies
create policy "users can select conversations in their workspaces"
  on public.conversations for select
  using (
    exists (
      select 1 from public.workspaces
      where workspaces.id = conversations.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "users can insert conversations into their workspaces"
  on public.conversations for insert
  with check (
    exists (
      select 1 from public.workspaces
      where workspaces.id = conversations.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "users can update conversations in their workspaces"
  on public.conversations for update
  using (
    exists (
      select 1 from public.workspaces
      where workspaces.id = conversations.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "users can delete conversations in their workspaces"
  on public.conversations for delete
  using (
    exists (
      select 1 from public.workspaces
      where workspaces.id = conversations.workspace_id
      and workspaces.user_id = auth.uid()
    )
  );

-- MESSAGES policies
-- Ownership chain: message belongs to conversation belongs to workspace belongs to user
create policy "users can select messages in their conversations"
  on public.messages for select
  using (
    exists (
      select 1
      from public.conversations
      join public.workspaces on workspaces.id = conversations.workspace_id
      where conversations.id = messages.conversation_id
      and workspaces.user_id = auth.uid()
    )
  );

create policy "users can insert messages into their conversations"
  on public.messages for insert
  with check (
    exists (
      select 1
      from public.conversations
      join public.workspaces on workspaces.id = conversations.workspace_id
      where conversations.id = messages.conversation_id
      and workspaces.user_id = auth.uid()
    )
  );

-- Messages are immutable once written, no update or delete policies

-- ============================================================
-- STORAGE BUCKET
-- Private bucket for uploaded documents.
-- Files are never publicly accessible.
-- Signed URLs are generated server-side for access.
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false);

-- Only authenticated users can upload to their own folder
-- Folder structure enforced: userId/workspaceId/documentId/filename
create policy "authenticated users can upload documents"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can only read their own files
create policy "users can read their own documents"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own files
create policy "users can delete their own documents"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'documents'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

