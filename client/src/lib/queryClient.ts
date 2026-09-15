import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: (failureCount, error) => {
        /*
          Do not retry on auth errors or not found errors.
          Retry up to 2 times on everything else.
        */
        const message =
          error instanceof Error ? error.message.toLowerCase() : "";
        if (
          message.includes("authentication") ||
          message.includes("not found") ||
          message.includes("forbidden")
        ) {
          return false;
        }
        return failureCount < 2;
      },
    },
    mutations: {
      retry: false,
    },
  },
});