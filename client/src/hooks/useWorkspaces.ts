import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import type { Workspace } from "@/types/workspace";

const WORKSPACES_KEY = ["workspaces"] as const;

export const useWorkspaces = () => {
  return useQuery({
    queryKey: WORKSPACES_KEY,
    queryFn: async () => {
      const data = await api.workspaces.list();
      return data.workspaces as Workspace[];
    },
  });
};

export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; description?: string }) =>
      api.workspaces.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
    },
    onError: (error: Error) => {
      console.error("Create workspace failed:", error.message);
    },
  });
};

export const useUpdateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...input
    }: {
      id: string;
      name?: string;
      description?: string | null;
    }) => api.workspaces.update(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
    },
  });
};

export const useDeleteWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.workspaces.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WORKSPACES_KEY });
    },
  });
};