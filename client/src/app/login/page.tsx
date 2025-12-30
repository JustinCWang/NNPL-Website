"use client";
/*
  Login page ("/login").
  - Collects user credentials and signs in via Supabase Auth
  - Shows basic loading and error states
  - Redirects to home on success
*/

import Link from "next/link";
import { FormEvent, useState, useEffect } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

/**
 * Login route component.
 * Renders a credential form and authenticates via Supabase.
 */
export default function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewUserMessage, setShowNewUserMessage] = useState(false);
  const [prefillEmail, setPrefillEmail] = useState("");
  
  // Forgot password states
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [isResetting, setIsResetting] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Check for new user parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('new_user') === 'true') {
      setShowNewUserMessage(true);
      const email = urlParams.get('email');
      if (email) {
        setPrefillEmail(email);
      }
    }
  }, []);

  /**
   * Handles form submission by validating fields and
   * calling Supabase password sign-in.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    const supabase = getSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setIsSubmitting(false);

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push("/home");
  }

  /**
   * Handles forgot password form submission
   */
  async function handleForgotPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResetError(null);
    setIsResetting(true);

    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setIsResetting(false);

    if (error) {
      setResetError(error.message);
      return;
    }

    setResetSuccess(true);
  }

  /**
   * Resets the forgot password modal state
   */
  function resetForgotPasswordModal() {
    setShowForgotPassword(false);
    setResetEmail("");
    setResetSuccess(false);
    setResetError(null);
  }

  return (
    <div className="min-h-dvh text-gray-900 flex flex-col">
      <main className="flex-1 grid place-items-center">
        <div className="w-full max-w-md rounded-2xl border border-white/30 bg-white/40 backdrop-blur-md p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-center">Log in</h1>
        <p className="mt-2 text-sm text-gray-700 text-center">
          {showNewUserMessage 
            ? "Welcome! Please check your email and verify your account before logging in." 
            : "Access your account to manage events and your profile."
          }
        </p>
        {showNewUserMessage && (
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              📧 Account created successfully! Please check your email and click the verification link before logging in.
            </p>
          </div>
        )}
        {/* Credentials form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              defaultValue={prefillEmail}
              className="mt-1 w-full rounded-md border border-white/50 bg-white/80 px-3 py-2 outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="mt-1 w-full rounded-md border border-white/50 bg-white/80 px-3 py-2 outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          
          {/* Forgot Password Link */}
          <div className="text-right">
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-gray-600 hover:text-gray-800 hover:underline"
            >
              Forgot password?
            </button>
          </div>
          
          {/* Error message */}
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          {/* Submit button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? "Signing in..." : "Continue"}
          </button>
        </form>
        {/* Cross-link to signup */}
        <p className="mt-4 text-sm text-gray-700 text-center">
          Don’t have an account?{" "}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </p>
        {/* Back to home */}
        <p className="mt-6 text-center text-xs text-gray-600">
          <Link href="/" className="hover:underline">
            Back to home
          </Link>
        </p>
        </div>
      </main>
      
      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Reset Password</h2>
              <button
                onClick={resetForgotPasswordModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {resetSuccess ? (
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-2">Check Your Email</h3>
                <p className="text-gray-600 mb-6">
                  We&apos;ve sent a password reset link to <strong>{resetEmail}</strong>. 
                  Click the link in the email to reset your password.
                </p>
                <button
                  onClick={resetForgotPasswordModal}
                  className="bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword}>
                <p className="text-gray-600 mb-4">
                  Enter your email address and we&apos;ll send you a link to reset your password.
                </p>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                
                {resetError && (
                  <p className="text-sm text-red-600 mb-4" role="alert">
                    {resetError}
                  </p>
                )}
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={resetForgotPasswordModal}
                    className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResetting}
                    className="flex-1 bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-60"
                  >
                    {isResetting ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
      
      <footer className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-12 text-sm text-gray-700 text-center">
        © {new Date().getFullYear()} NNPL. All rights reserved.
      </footer>
    </div>
  );
}

