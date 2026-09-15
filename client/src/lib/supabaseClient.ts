import { createClient } from "@supabase/supabase-js";

/*
  Browser Supabase client, uses ANON key only.
  Used for:
  - Auth (signIn, signUp, signOut, getSession)
  - Realtime subscriptions (document processing status)
  Never used for direct database queries in the client. All data fetching goes through the Node API. The service role key never comes near this file.
*/
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    storageKey: "within-auth",
  },
});