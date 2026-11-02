import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Document } from "@/types/document";

export const getDocumentsQueryKey = (workspaceId: string) =>
  ["documents", workspaceId] as const;

export const useDocuments = (workspaceId: string) => {
  return useQuery({
    queryKey: getDocumentsQueryKey(workspaceId),
    queryFn: async () => {
      if (!workspaceId) return [];
      const data = await api.documents.list(workspaceId);
      return data.documents;
    },
    enabled: Boolean(workspaceId),
  });
};

export const useUploadDocument = (workspaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      file,
      title,
    }: {
      file: File;
      title?: string;
    }): Promise<{ document: Document }> => {
      const formData = new FormData();
      formData.append("file", file);
      if (title?.trim()) {
        formData.append("title", title.trim());
      }
      return api.documents.upload(workspaceId, formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getDocumentsQueryKey(workspaceId),
      });
    },
    onError: (error: Error) => {
      console.error("Document upload failed:", error.message);
    },
  });
};

export const useDeleteDocument = (workspaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string): Promise<void> => {
      await api.documents.delete(workspaceId, documentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: getDocumentsQueryKey(workspaceId),
      });
    },
    onError: (error: Error) => {
      console.error("Document deletion failed:", error.message);
    },
  });
};

