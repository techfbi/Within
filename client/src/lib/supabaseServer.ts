import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/*
  Server side Supabase client for use in Server Components, Route Handlers, and Server Actions.
  Reads the session from cookies automatically. Never used in Client Components.
*/
export const createSupabaseServerClient = async () => {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch {
            /*
              setAll is called from Server Components where cookies
              cannot be set. Safe to ignore here since proxy
              handles session refresh.
            */
          }
        },
      },
    }
  );
};