"use client";
/*
  Password Reset page ("/reset-password").
  - Handles password reset from email link
  - Updates user password via Supabase Auth
*/

import Link from "next/link";
import { FormEvent, useState, useEffect, Suspense } from "react";
import { getSupabaseClient } from "@/lib/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Set client flag to prevent hydration mismatch
    setIsClient(true);
    
    const supabase = getSupabaseClient();
    
    // Supabase sends reset tokens in the URL hash, not query params
    // We need to check both hash and query params for different scenarios
    let access_token: string | null = null;
    let refresh_token: string | null = null;
    let type: string | null = null;
    
    // First, check URL hash (most common for Supabase)
    if (window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      access_token = hashParams.get('access_token');
      refresh_token = hashParams.get('refresh_token');
      type = hashParams.get('type');
    }
    
    // Fallback to query params
    if (!access_token) {
      access_token = searchParams.get('access_token');
      refresh_token = searchParams.get('refresh_token');
      type = searchParams.get('type');
    }
    
    // Check if this is a password recovery type and we have the required tokens
    if (type === 'recovery' && access_token && refresh_token) {
      setValidToken(true);
      // Set the session with the tokens from the URL
      supabase.auth.setSession({
        access_token,
        refresh_token,
      });
    } else if (access_token && refresh_token) {
      // Fallback for cases where type isn't specified but we have tokens
      setValidToken(true);
      supabase.auth.setSession({
        access_token,
        refresh_token,
      });
    }
  }, [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    
    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") || "");
    const confirmPassword = String(formData.get("confirmPassword") || "");

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsSubmitting(false);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters long");
      setIsSubmitting(false);
      return;
    }

    const supabase = getSupabaseClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: password
    });

    setIsSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setSuccess(true);
    
    // Redirect to login after 3 seconds
    setTimeout(() => {
      router.push("/login");
    }, 3000);
  }

  // Show loading state during hydration
  if (!isClient) {
    return (
      <div className="min-h-dvh text-gray-900 flex flex-col">
        <main className="flex-1 grid place-items-center">
          <div className="w-full max-w-md rounded-2xl border border-white/30 bg-white/40 backdrop-blur-md p-8 shadow-lg text-center">
            <div className="text-sm text-gray-600">Loading...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!validToken) {
    // Debug information (remove in production)
    const debugInfo = {
      hash: window.location.hash,
      search: window.location.search,
      href: window.location.href
    };

    return (
      <div className="min-h-dvh text-gray-900 flex flex-col">
        <main className="flex-1 grid place-items-center">
          <div className="w-full max-w-md rounded-2xl border border-white/30 bg-white/40 backdrop-blur-md p-8 shadow-lg text-center">
            <h1 className="text-2xl font-semibold mb-4">Invalid Reset Link</h1>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired. Please request a new one.
            </p>
            
            {/* Debug info - remove in production */}
            {process.env.NODE_ENV === 'development' && debugInfo && (
              <div className="text-xs text-left bg-gray-100 p-3 rounded mb-4 overflow-auto">
                <strong>Debug Info:</strong><br/>
                Hash: {debugInfo.hash}<br/>
                Search: {debugInfo.search}<br/>
                URL: {debugInfo.href}
              </div>
            )}
            
            <Link 
              href="/login"
              className="inline-block bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
            >
              Back to Login
            </Link>
          </div>
        </main>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-dvh text-gray-900 flex flex-col">
        <main className="flex-1 grid place-items-center">
          <div className="w-full max-w-md rounded-2xl border border-white/30 bg-white/40 backdrop-blur-md p-8 shadow-lg text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold mb-4">Password Updated</h1>
            <p className="text-gray-600 mb-6">
              Your password has been successfully updated. You will be redirected to the login page shortly.
            </p>
            <Link 
              href="/login"
              className="inline-block bg-black text-white px-4 py-2 rounded-md hover:bg-gray-800"
            >
              Continue to Login
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-dvh text-gray-900 flex flex-col">
      <main className="flex-1 grid place-items-center">
        <div className="w-full max-w-md rounded-2xl border border-white/30 bg-white/40 backdrop-blur-md p-8 shadow-lg">
          <h1 className="text-2xl font-semibold text-center">Reset Password</h1>
          <p className="mt-2 text-sm text-gray-700 text-center">
            Enter your new password below.
          </p>
          
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium">New Password</label>
              <input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="mt-1 w-full rounded-md border border-white/50 bg-white/80 px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium">Confirm New Password</label>
              <input
                name="confirmPassword"
                type="password"
                required
                placeholder="••••••••"
                className="mt-1 w-full rounded-md border border-white/50 bg-white/80 px-3 py-2 outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            
            {error && (
              <p className="text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md bg-black px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-60"
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </form>
          
          <p className="mt-6 text-center text-xs text-gray-600">
            <Link href="/login" className="hover:underline">
              Back to login
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh text-gray-900 flex flex-col">
        <main className="flex-1 grid place-items-center">
          <div className="w-full max-w-md rounded-2xl border border-white/30 bg-white/40 backdrop-blur-md p-8 shadow-lg text-center">
            <div className="text-sm text-gray-600">Loading...</div>
          </div>
        </main>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
