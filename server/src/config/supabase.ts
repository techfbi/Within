import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";
import type { Database } from "../types/database.js";

// Service role client: bypasses RLS
// Use ONLY in server-side workers (ingestion, storage signed URLs), it's for background workers that need to write chunks across workspaces. Never exposed to the browser
export const supabaseAdmin = createClient<Database>(
  env.SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Creates a per-request client scoped to the user's JWT
// RLS policies automatically enforce workspace ownership with this client
export const createUserClient = (accessToken: string) => {
  return createClient<Database>(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};