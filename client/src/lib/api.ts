/*
  Typed API client for the Within Node backend.
  All requests to the backend go through these functions. we never call the backend directly from components.
*/

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

/*
  Retrieves the current session token from Supabase.
  Imported lazily to avoid circular dependency with supabaseClient.
*/
const getAuthHeader = async (): Promise<Record<string, string>> => {
  const { supabase } = await import("./supabaseClient.js");
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;

  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
};

/*
  Base fetch wrapper. Adds auth header, handles JSON parsing,
  and throws a typed error on non-2xx responses.
*/
const request = async <T>(
  path: string,
  options: RequestInit = {}
): Promise<T> => {
  const authHeader = await getAuthHeader();

  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeader,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      (body as { error?: { message?: string } }).error?.message ??
      "Request failed";
    throw new Error(message);
  }

  return res.json() as Promise<T>;
};

/*
  Multipart upload — does not set Content-Type so the browser
  sets it automatically with the correct boundary for FormData.
*/
const upload = async <T>(path: string, formData: FormData): Promise<T> => {
  const authHeader = await getAuthHeader();

  const res = await fetch(`${getBaseUrl()}${path}`, {
    method: "POST",
    headers: authHeader,
    body: formData,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const message =
      (body as { error?: { message?: string } }).error?.message ??
      "Upload failed";
    throw new Error(message);
  }

  return res.json() as Promise<T>;
};

/*
  SSE streaming for AI query responses.
  Returns an EventSource-style async iterator that the
  useStreamingQuery hook consumes token by token.
*/
export const streamQuery = async (
  workspaceId: string,
  body: {
    question: string;
    conversationId?: string;
    documentId?: string;
  },
  onToken: (token: string) => void,
  onDone: (conversationId: string, citations: unknown[]) => void,
  onError: (message: string) => void
): Promise<void> => {
  const authHeader = await getAuthHeader();

  const res = await fetch(
    `${getBaseUrl()}/api/workspaces/${workspaceId}/query`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeader,
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    onError(
      (err as { error?: { message?: string } }).error?.message ?? "Query failed"
    );
    return;
  }

  /*
    Read the SSE stream line by line.
    Each line starting with "data: " is a JSON event from the server.
  */
  const reader = res.body?.getReader();
  if (!reader) {
    onError("Stream unavailable");
    return;
  }

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");

    /*
      Keep the last incomplete line in the buffer.
      SSE lines end with \n\n but we may receive partial chunks.
    */
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;

      try {
        const event = JSON.parse(line.slice(6)) as {
          type: string;
          token?: string;
          conversationId?: string;
          citations?: unknown[];
          message?: string;
        };

        if (event.type === "token" && event.token) {
          onToken(event.token);
        } else if (event.type === "done") {
          onDone(event.conversationId ?? "", event.citations ?? []);
        } else if (event.type === "error") {
          onError(event.message ?? "Stream error");
        }
      } catch {
        /*
          Malformed JSON in an SSE line should not crash the stream.
          Skip and continue reading.
        */
      }
    }
  }
};

/*
  Typed API methods — one function per backend endpoint.
  Return types are inlined for now and can be moved to
  src/types/ as they grow.
*/
export const api = {
  workspaces: {
    list: () => request<{ workspaces: unknown[] }>("/api/workspaces"),
    get: (id: string) =>
      request<{ workspace: unknown }>(`/api/workspaces/${id}`),
    create: (body: { name: string; description?: string }) =>
      request<{ workspace: unknown }>("/api/workspaces", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    update: (id: string, body: { name?: string; description?: string | null }) =>
      request<{ workspace: unknown }>(`/api/workspaces/${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      }),
    delete: (id: string) =>
      request<void>(`/api/workspaces/${id}`, { method: "DELETE" }),
  },

  documents: {
    list: (workspaceId: string) =>
      request<{ documents: unknown[] }>(
        `/api/workspaces/${workspaceId}/documents`
      ),
    get: (workspaceId: string, documentId: string) =>
      request<{ document: unknown }>(
        `/api/workspaces/${workspaceId}/documents/${documentId}`
      ),
    upload: (workspaceId: string, formData: FormData) =>
      upload<{ document: unknown }>(
        `/api/workspaces/${workspaceId}/documents`,
        formData
      ),
    delete: (workspaceId: string, documentId: string) =>
      request<void>(
        `/api/workspaces/${workspaceId}/documents/${documentId}`,
        { method: "DELETE" }
      ),
  },

  conversations: {
    list: (workspaceId: string) =>
      request<{ conversations: unknown[] }>(
        `/api/workspaces/${workspaceId}/conversations`
      ),
    get: (conversationId: string) =>
      request<{ conversation: unknown }>(`/api/conversations/${conversationId}`),
    getMessages: (conversationId: string) =>
      request<{ messages: unknown[] }>(
        `/api/conversations/${conversationId}/messages`
      ),
    delete: (conversationId: string) =>
      request<void>(`/api/conversations/${conversationId}`, {
        method: "DELETE",
      }),
  },
};