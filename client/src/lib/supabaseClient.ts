import { createBrowserClient } from "@supabase/ssr";

/*
  Browser Supabase client using @supabase/ssr.
  Sessions are stored in httpOnly cookies set by the server, not in localStorage. JavaScript never directly reads the JWT.
  Used for auth state and Realtime subscriptions only. All data fetching goes through the Node API.
*/
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);