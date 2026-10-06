"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { signupSchema } from "@/lib/validations/auth";
import Input from "@/components/ui/Input";
import PasswordInput from "@/components/ui/PasswordInput";
import Button from "@/components/ui/Button";
import { brand } from "@/config/brand";

const FRIENDLY_ERRORS: Record<string, string> = {
  "User already registered":
    "An account with this email already exists. Sign in instead.",
  "Too many requests":
    "Too many attempts. Please wait a few minutes and try again.",
};

const getFriendlyError = (message: string): string =>
  FRIENDLY_ERRORS[message] ?? message;

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<
    Partial<
      Record<"name" | "email" | "password" | "confirmPassword" | "form", string>
    >
  >({});
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = signupSchema.safeParse({
      name,
      email,
      password,
      confirmPassword,
    });

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        name: fieldErrors.name?.[0],
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0],
      });
      return;
    }

    setLoading(true);

    const { error: signUpError } = await supabase.auth.signUp({
      email: result.data.email,
      password: result.data.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: result.data.name,
        },
      },
    });

    if (signUpError) {
      setErrors({ form: getFriendlyError(signUpError.message) });
      setLoading(false);
      return;
    }

    setDone(true);
  };

  const handleGoogle = async () => {
    setOauthLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (oauthError) {
      setErrors({ form: oauthError.message });
      setOauthLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 text-center py-8">
        <div className="w-10 h-10 rounded-full bg-accent-muted flex items-center justify-center">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent"
            aria-hidden="true"
          >
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-text-primary">
            Check your email
          </p>
          <p className="text-sm text-text-secondary mt-1">
            We sent a confirmation link to{" "}
            <span className="text-text-primary">{email}</span>
          </p>
        </div>
        <Link
          href="/login"
          className="text-xs text-text-secondary hover:text-text-primary transition-colors"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <Link
          href="/"
          className="font-display font-bold text-xl text-text-primary tracking-tight"
        >
          {brand.name}
        </Link>
        <p className="text-sm text-text-secondary mt-1">
          Create your workspace
        </p>
      </div>

      <Button
        variant="outline"
        onClick={handleGoogle}
        loading={oauthLoading}
        type="button"
      >
        <span className="flex items-center justify-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Continue with Google
        </span>
      </Button>

      <div className="flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-text-disabled">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <form onSubmit={handleSignup} className="flex flex-col gap-4">
        <Input
          label="Full name"
          type="text"
          placeholder="Ada Lovelace"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          autoComplete="name"
          autoFocus
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoComplete="email"
        />
        <PasswordInput
          label="Password"
          placeholder="Min 8 chars, one uppercase, one number"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoComplete="new-password"
        />
        <PasswordInput
          label="Confirm password"
          placeholder="••••••••"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={errors.confirmPassword}
          autoComplete="new-password"
        />

        {errors.form && (
          <p className="text-xs text-danger text-center">{errors.form}</p>
        )}

        <Button type="submit" loading={loading}>
          Create account
        </Button>
      </form>

      <p className="text-center text-xs text-text-secondary">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-text-primary hover:text-accent transition-colors font-medium"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
