/*
  Login page ("/login").
  - Collects user credentials and signs in via Supabase Auth
  - Shows basic loading and error states
  - Redirects to home on success
*/
"use client";
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
      <footer className="mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-12 text-sm text-gray-700 text-center">
        © {new Date().getFullYear()} NNPL. All rights reserved.
      </footer>
    </div>
  );
}

