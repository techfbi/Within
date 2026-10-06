"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { brand } from "@/config/brand";
import PasswordInput from "@/components/ui/PasswordInput";

type Step = "email" | "otp" | "new-password" | "done";

export default function ResetPasswordPage() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
      },
    });

    if (otpError) {
      setError(otpError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep("otp");
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError("Enter the 6-digit code from your email");
      return;
    }

    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: otp.trim(),
      type: "magiclink",
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep("new-password");
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep("done");
  };

  if (step === "done") {
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
            Password updated
          </p>
          <p className="text-sm text-text-secondary mt-1">
            You can now sign in with your new password
          </p>
        </div>
        <Link
          href="/login"
          className="text-sm bg-accent text-white px-6 py-2.5 rounded-md hover:bg-accent-hover transition-colors font-medium"
        >
          Sign in
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
          {step === "email" && "Reset your password"}
          {step === "otp" && "Enter the code we sent you"}
          {step === "new-password" && "Choose a new password"}
        </p>
      </div>

      {step === "email" && (
        <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            autoFocus
          />
          {error && <p className="text-xs text-danger text-center">{error}</p>}
          <Button type="submit" loading={loading}>
            Send code
          </Button>
          <Link
            href="/login"
            className="text-center text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            Back to sign in
          </Link>
        </form>
      )}

      {step === "otp" && (
        <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
          <p className="text-xs text-text-secondary text-center">
            We sent a 6-digit code to{" "}
            <span className="text-text-primary">{email}</span>
          </p>
          <Input
            label="Verification code"
            type="text"
            inputMode="numeric"
            placeholder="000000"
            value={otp}
            onChange={(e) =>
              setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
            }
            required
            autoFocus
            className="tracking-widest text-center text-lg"
          />
          {error && <p className="text-xs text-danger text-center">{error}</p>}
          <Button type="submit" loading={loading}>
            Verify code
          </Button>
          <button
            type="button"
            onClick={() => setStep("email")}
            className="text-center text-xs text-text-secondary hover:text-text-primary transition-colors"
          >
            Use a different email
          </button>
        </form>
      )}

      {step === "new-password" && (
        <form onSubmit={handleUpdatePassword} className="flex flex-col gap-4">
          <PasswordInput
            label="New password"
            placeholder="Min 8 chars, one uppercase, one number"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            autoFocus
          />
          <PasswordInput
            label="Confirm new password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            error={
              confirmPassword && newPassword !== confirmPassword
                ? "Passwords do not match"
                : undefined
            }
          />
          {error && <p className="text-xs text-danger text-center">{error}</p>}
          <Button type="submit" loading={loading}>
            Update password
          </Button>
        </form>
      )}
    </div>
  );
}
