/*
  Login page ("/login").
  - Collects user credentials and signs in via Supabase Auth
  - Shows basic loading and error states
  - Redirects to home on success
*/
"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
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

    router.push("/");
  }

  return (
    <main className="min-h-dvh grid place-items-center">
      <div className="w-full max-w-sm rounded-2xl border bg-white/70 backdrop-blur-sm p-6">
        <h1 className="text-xl font-semibold">Log in</h1>
        {/* Credentials form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
              className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="mt-1 w-full rounded-md border px-3 py-2 outline-none focus:ring-2 focus:ring-black"
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
            className="w-full rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-60"
          >
            {isSubmitting ? "Signing in..." : "Continue"}
          </button>
        </form>
        {/* Cross-link to signup */}
        <p className="mt-4 text-sm text-gray-600">
          Don’t have an account?{" "}
          <Link href="/signup" className="underline">
            Sign up
          </Link>
        </p>
        {/* Back to home */}
        <p className="mt-6 text-center text-xs text-gray-500">
          <Link href="/" className="hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </main>
  );
}

