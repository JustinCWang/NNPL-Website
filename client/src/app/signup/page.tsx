/*
  Signup page ("/signup").
  - Creates a new user via Supabase Auth
  - Captures name for user profile metadata
  - Shows loading and error states and redirects on success
*/
"use client";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

/**
 * Signup route component.
 * Renders a registration form and creates an account in Supabase.
 */
export default function SignupPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handles registration by creating a user in Supabase
   * and attaching the provided name as profile metadata.
   */
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") || "");
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    const supabase = getSupabaseClient();
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/`,
      },
    });

    setIsSubmitting(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    router.push("/");
  }

  return (
    <main className="min-h-dvh grid place-items-center">
      <div className="w-full max-w-md rounded-2xl border border-white/30 bg-white/40 backdrop-blur-md p-8 shadow-lg">
        <h1 className="text-2xl font-semibold text-center">Create your account</h1>
        <p className="mt-2 text-sm text-gray-700 text-center">Join NNPL and start tracking events, stores, and more.</p>
        {/* Signup form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              name="name"
              type="text"
              required
              placeholder="Your name"
              className="mt-1 w-full rounded-md border border-white/50 bg-white/80 px-3 py-2 outline-none focus:ring-2 focus:ring-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              name="email"
              type="email"
              required
              placeholder="you@example.com"
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
            {isSubmitting ? "Creating..." : "Create account"}
          </button>
        </form>
        {/* Cross-link to login */}
        <p className="mt-4 text-sm text-gray-700 text-center">
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Log in
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
  );
}

