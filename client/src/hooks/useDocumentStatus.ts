import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabaseClient";
import { getDocumentsQueryKey } from "./useDocuments";
import type { Document, DocumentStatus } from "@/types/document";

const IN_PROGRESS_STATUSES: Set<DocumentStatus> = new Set([
  "QUEUED",
  "PROCESSING",
  "EXTRACTING",
  "CHUNKING",
  "EMBEDDING",
  "INDEXING",
]);

/*
  Manages live document status updates via Supabase Realtime
  with an automatic polling fallback for active processing jobs.
*/
export const useDocumentStatus = (
  workspaceId: string,
  documents: Document[] | undefined
) => {
  const queryClient = useQueryClient();

  /*
    Check whether any document is currently in the ingestion pipeline
  */
  const hasActiveJobs = documents?.some((doc) =>
    IN_PROGRESS_STATUSES.has(doc.status)
  );

  /*
    Supabase Realtime subscription for Postgres changes on the documents table
  */
  useEffect(() => {
    if (!workspaceId) return;

    const channelName = `workspace-docs-${workspaceId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "documents",
          filter: `workspace_id=eq.${workspaceId}`,
        },
        (payload) => {
          const queryKey = getDocumentsQueryKey(workspaceId);

          if (payload.eventType === "UPDATE") {
            const updated = payload.new as Document;
            queryClient.setQueryData<Document[]>(queryKey, (old) => {
              if (!old) return [updated];
              return old.map((d) => (d.id === updated.id ? updated : d));
            });
          } else if (payload.eventType === "INSERT") {
            const inserted = payload.new as Document;
            queryClient.setQueryData<Document[]>(queryKey, (old) => {
              if (!old) return [inserted];
              const exists = old.some((d) => d.id === inserted.id);
              if (exists) return old;
              return [inserted, ...old];
            });
          } else if (payload.eventType === "DELETE") {
            const deletedId = (payload.old as { id?: string }).id;
            queryClient.setQueryData<Document[]>(queryKey, (old) => {
              if (!old) return [];
              return old.filter((d) => d.id !== deletedId);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient]);

  /*
    Polling fallback that runs only while documents are actively processing
  */
  useEffect(() => {
    if (!workspaceId || !hasActiveJobs) return;

    const queryKey = getDocumentsQueryKey(workspaceId);
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey });
    }, 4000);

    return () => clearInterval(interval);
  }, [workspaceId, hasActiveJobs, queryClient]);
};

