import type { Request, Response, NextFunction } from "express";
import { createClient } from "@supabase/supabase-js";
import { env } from "../config/env.js";
import { AuthError } from "../utils/errors.js";
import type { Database } from "../types/database.js";

// Every protected route passes through this. It reads the Authorization: Bearer <token> header, calls Supabase to verify it (signature check + expiry), and attaches the verified user to req.user.
// We also store accessToken on the request so downstream services can create user-scoped Supabase clients that respect RLS.

export interface AuthenticatedUser {
  id: string;
  email: string;
}

// extend Express's Request type globally so TypeScript knows req.user exists on authenticated routes.
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      accessToken?: string;
    }
  }
}

export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new AuthError();
    }

    const token = authHeader.slice(7);

    const supabase = createClient<Database>(
      env.SUPABASE_URL,
      env.SUPABASE_ANON_KEY,
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      }
    );

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      throw new AuthError("Invalid or expired session");
    }

    req.user = {
      id: data.user.id,
      email: data.user.email ?? "",
    };
    req.accessToken = token;

    next();
  } catch (err) {
    next(err);
  }
};